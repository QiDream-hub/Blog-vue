/**
 * Blog Publisher API (浏览器版本)
 *
 * 博客发布核心 API - 负责在 lmjweb 中注册元数据
 * 文件操作由用户手动完成，此 API 仅提供文件路径建议
 */

import {
  checkPtrExist,
  createObject,
  createSet,
  getObject,
  getSet,
  setObjectMember,
  addSetElement,
  removeSetElement,
  deleteObject,
  deleteSet,
  deleteObjectMember,
  batchOperations,
  buildQueryPath
} from './lmjweb.js'
import { getConfig } from '../config/blog.js'

function memberValue(obj, name) {
  return obj.members.find(m => m.name === name)?.value ?? ''
}

/**
 * 读取集合；空态（404）按空集合处理
 */
async function getSetOrEmpty(ptr) {
  if (!ptr) return { elements: [] }
  try {
    return await getSet(ptr)
  } catch (err) {
    if (err.status === 404) return { elements: [] }
    throw err
  }
}

/**
 * 读取对象；空态（404）返回 null
 */
async function getObjectOrNull(ptr) {
  if (!ptr) return null
  try {
    return await getObject(ptr)
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

/**
 * 清空/删除时忽略空态 404（内容已为空视为成功）
 */
async function ignoreNotFound(operation) {
  try {
    return await operation()
  } catch (err) {
    if (err.status !== 404) throw err
  }
}

async function runBatch(operations, action) {
  const result = await batchOperations(operations)
  if (!result.success) {
    const error = new Error(`${action}失败：${result.details?.error || '未知错误'}`)
    error.batch = result
    throw error
  }
  return result.results
}

/**
 * Publisher 类 - 博客发布核心 API
 */
export class Publisher {
  /**
   * 创建 Publisher 实例
   */
  constructor() {
    const config = getConfig()
    this.blogInfoPtr = config.BLOG_INFO_PTR
  }

  /**
   * 检查指针是否已实化（false 表示空态，不代表指针无效）
   */
  async exists(ptr) {
    const { exist } = await checkPtrExist(ptr)
    return exist
  }

  /**
   * 获取博客信息
   */
  async getBlogInfo() {
    return await getObject(this.blogInfoPtr)
  }

  /**
   * 获取对象（透传方法）
   */
  getObject(ptr) {
    return getObject(ptr)
  }

  // ==================== 注册操作 ====================

  /**
   * 注册图片（仅元数据）
   *
   * @param {string} filename - 原始文件名
   * @returns {Promise<{ ptr: string, suggestedPath: string, filename: string }>}
   */
  async registerImage(filename) {
    const operations = [
      { method: 'POST', path: '/obj/init', body: { filename } },
      { method: 'GET', path: `/obj/query?path=${buildQueryPath(this.blogInfoPtr, 'images')}` },
      {
        method: 'POST',
        path: '/set/__IMAGES__/elements',
        body: { value: '__IMAGE__', type: 'ref' },
        vars: { __IMAGES__: '{1:value}', __IMAGE__: '{0:ptr}' }
      }
    ]

    try {
      const results = await runBatch(operations, '注册图片')
      const imagePtr = results[0].body.ptr
      return { ptr: imagePtr, suggestedPath: imagePtr, filename }
    } catch (err) {
      // 旧博客可能没有 images 成员，退回逐请求流程（自动初始化集合）
      if (err.batch?.failed_at !== 1) throw err

      const { ptr: imagePtr } = await createObject()
      await setObjectMember(imagePtr, 'filename', filename, 'raw')
      await this.linkToImages(imagePtr)

      return { ptr: imagePtr, suggestedPath: imagePtr, filename }
    }
  }

  /**
   * 注册文章（仅元数据）
   *
   * @param {{ title: string }} options - 注册选项
   * @returns {Promise<{ ptr: string, suggestedPath: string, title: string }>}
   */
  async registerArticle({ title }) {
    const operations = [
      { method: 'POST', path: '/obj/init', body: { title, tags: [] } },
      { method: 'GET', path: `/obj/query?path=${buildQueryPath(this.blogInfoPtr, 'posts')}` },
      {
        method: 'POST',
        path: '/set/__POSTS__/elements',
        body: { value: '__ARTICLE__', type: 'ref' },
        vars: { __POSTS__: '{1:value}', __ARTICLE__: '{0:ptr}' }
      }
    ]

    const results = await runBatch(operations, '注册文章')
    const articlePtr = results[0].body.ptr

    return { ptr: articlePtr, suggestedPath: articlePtr, title }
  }

  // ==================== 关联操作 ====================

  /**
   * 关联封面图片到文章
   */
  async linkCover(articlePtr, imagePtr) {
    await setObjectMember(articlePtr, 'cover', imagePtr, 'ref')
  }

  /**
   * 创建标签
   *
   * @param {string} name - 标签名称
   * @returns {Promise<{ ptr: string, postsPtr: string }>}
   */
  async createTag(name) {
    const operations = [
      { method: 'POST', path: '/obj/init', body: { name, posts: [] } },
      { method: 'GET', path: `/obj/query?path=${buildQueryPath(this.blogInfoPtr, 'tags')}` },
      {
        method: 'POST',
        path: '/set/__TAGS__/elements',
        body: { value: '__TAG__', type: 'ref' },
        vars: { __TAGS__: '{1:value}', __TAG__: '{0:ptr}' }
      },
      {
        method: 'GET',
        path: '/obj/query?path=__TAG__.posts',
        vars: { __TAG__: '{0:ptr}' }
      }
    ]

    try {
      const results = await runBatch(operations, '创建标签')
      return { ptr: results[0].body.ptr, postsPtr: results[3].body.value }
    } catch (err) {
      if (err.batch?.failed_at === 1) throw new Error('博客标签集合不存在')
      throw err
    }
  }

  /**
   * 查找或创建标签
   * @private
   */
  async #findOrCreateTag(name) {
    const { tags } = await this.#loadTagIndex()
    const existing = tags.get(name)
    if (existing) {
      return { ptr: existing.ptr, postsPtr: existing.postsPtr, created: false }
    }

    const { ptr, postsPtr } = await this.createTag(name)
    return { ptr, postsPtr, created: true }
  }

  /**
   * 关联标签到文章
   */
  async linkTag(articlePtr, tagName) {
    const [result] = await this.linkTags(articlePtr, [tagName])
    return { ptr: result.ptr, created: result.created }
  }

  /**
   * 关联多个标签到文章
   * 读取一次标签索引，所有写入合并到一个批次
   */
  async linkTags(articlePtr, tagNames) {
    const names = [...new Set(tagNames.filter(Boolean))]
    if (names.length === 0) return []

    const { blogTagsPtr, articleTagsPtr, tags } = await this.#loadTagIndex(articlePtr)

    const operations = []
    const planned = names.map(name => {
      const existing = tags.get(name)

      if (existing) {
        operations.push(
          {
            method: 'POST',
            path: `/set/${articleTagsPtr}/elements`,
            body: { value: name, type: 'raw' }
          },
          {
            method: 'POST',
            path: `/set/${existing.postsPtr}/elements`,
            body: { value: articlePtr, type: 'ref' }
          }
        )
        return { name, existing }
      }

      const tagIndex = operations.length
      operations.push(
        { method: 'POST', path: '/obj/init', body: { name, posts: [] } },
        {
          method: 'GET',
          path: '/obj/query?path=__TAG__.posts',
          vars: { __TAG__: `{${tagIndex}:ptr}` }
        },
        {
          method: 'POST',
          path: `/set/${blogTagsPtr}/elements`,
          body: { value: '__TAG__', type: 'ref' },
          vars: { __TAG__: `{${tagIndex}:ptr}` }
        },
        {
          method: 'POST',
          path: '/set/__POSTS__/elements',
          body: { value: articlePtr, type: 'ref' },
          vars: { __POSTS__: `{${tagIndex + 1}:value}` }
        },
        {
          method: 'POST',
          path: `/set/${articleTagsPtr}/elements`,
          body: { value: name, type: 'raw' }
        }
      )
      return { name, tagIndex }
    })

    const results = await runBatch(operations, '关联标签')

    return planned.map(plan => ({
      ptr: plan.existing ? plan.existing.ptr : results[plan.tagIndex].body.ptr,
      name: plan.name,
      created: !plan.existing
    }))
  }

  /**
   * 将文章注册到博客
   */
  async linkToBlog(articlePtr) {
    const blogInfo = await getObject(this.blogInfoPtr)
    const postsPtr = blogInfo.members.find(m => m.name === 'posts')?.value
    if (!postsPtr) {
      throw new Error('博客文章集合不存在')
    }
    await addSetElement(postsPtr, articlePtr, 'ref')
  }

  /**
   * 将图片注册到全局图片集合
   * @private
   */
  async linkToImages(imagePtr) {
    const blogInfo = await getObject(this.blogInfoPtr)
    let imagesPtr = blogInfo.members.find(m => m.name === 'images')?.value

    // 如果 images 集合不存在，自动初始化
    if (!imagesPtr) {
      console.warn('博客图片集合不存在，正在初始化...')
      const { ptr: newImagesPtr } = await createSet()
      await setObjectMember(this.blogInfoPtr, 'images', newImagesPtr, 'ref')
      imagesPtr = newImagesPtr
    }

    await addSetElement(imagesPtr, imagePtr, 'ref')
  }

  // ==================== 查询操作 ====================

  /**
   * 获取所有文章指针列表
   */
  async getAllArticles() {
    const blogInfo = await getObject(this.blogInfoPtr)
    let postsPtr = blogInfo.members.find(m => m.name === 'posts')?.value

    // 如果 posts 集合不存在，自动初始化
    if (!postsPtr) {
      console.warn('博客文章集合不存在，正在初始化...')
      const { ptr: newPostsPtr } = await createSet()
      await setObjectMember(this.blogInfoPtr, 'posts', newPostsPtr, 'ref')
      postsPtr = newPostsPtr
    }

    const postsSet = await getSetOrEmpty(postsPtr)
    return (postsSet.elements || []).map(e => e.value).filter(Boolean)
  }

  /**
   * 获取所有图片指针列表
   */
  async getAllImages() {
    const blogInfo = await getObject(this.blogInfoPtr)
    let imagesPtr = blogInfo.members.find(m => m.name === 'images')?.value

    // 如果 images 集合不存在，自动初始化
    if (!imagesPtr) {
      console.warn('博客图片集合不存在，正在初始化...')
      const { ptr: newImagesPtr } = await createSet()
      await setObjectMember(this.blogInfoPtr, 'images', newImagesPtr, 'ref')
      imagesPtr = newImagesPtr
    }

    const imagesSet = await getSetOrEmpty(imagesPtr)
    return (imagesSet.elements || []).map(e => e.value).filter(Boolean)
  }

  /**
   * 获取所有标签指针列表
   */
  async getAllTags() {
    const blogInfo = await getObject(this.blogInfoPtr)
    let tagsPtr = blogInfo.members.find(m => m.name === 'tags')?.value

    // 如果 tags 集合不存在，自动初始化
    if (!tagsPtr) {
      console.warn('博客标签集合不存在，正在初始化...')
      const { ptr: newTagsPtr } = await createSet()
      await setObjectMember(this.blogInfoPtr, 'tags', newTagsPtr, 'ref')
      tagsPtr = newTagsPtr
    }

    const tagsSet = await getSetOrEmpty(tagsPtr)
    return (tagsSet.elements || []).map(e => e.value).filter(Boolean)
  }

  /**
   * 获取文章详细信息
   */
  async getArticleDetail(articlePtr) {
    const article = await getObject(articlePtr)

    // 获取封面信息；封面对象为空态时视为无封面
    const coverPtr = article.members.find(m => m.name === 'cover')?.value
    const cover = await getObjectOrNull(coverPtr)

    // 获取标签列表
    const tagsPtr = article.members.find(m => m.name === 'tags')?.value
    const tagsSet = await getSetOrEmpty(tagsPtr)
    const tags = (tagsSet.elements || []).map(e => e.value).filter(Boolean)

    return {
      ptr: articlePtr,
      title: article.members.find(m => m.name === 'title')?.value,
      cover: cover ? {
        ptr: coverPtr,
        filename: cover.members.find(m => m.name === 'filename')?.value
      } : null,
      tags
    }
  }

  /**
   * 获取图片详细信息
   */
  async getImageDetail(imagePtr) {
    const image = await getObject(imagePtr)
    return {
      ptr: imagePtr,
      filename: image.members.find(m => m.name === 'filename')?.value
    }
  }

  /**
   * 获取标签详细信息
   */
  async getTagDetail(tagPtr) {
    const tag = await getObject(tagPtr)
    const postsPtr = tag.members.find(m => m.name === 'posts')?.value
    const postsSet = await getSetOrEmpty(postsPtr)
    const articleCount = (postsSet.elements || []).filter(e => e.value).length
    return {
      ptr: tagPtr,
      name: tag.members.find(m => m.name === 'name')?.value,
      articleCount
    }
  }

  // ==================== 删除操作 ====================

  /**
   * 删除文章（仅元数据）
   */
  async deleteArticle(articlePtr) {
    // 空态文章没有可读内容，只做引用清理与幂等清空
    const article = await getObjectOrNull(articlePtr)
    const tagsPtr = article?.members.find(m => m.name === 'tags')?.value

    // 1. 从博客文章集合中移除
    try {
      const blogInfo = await getObject(this.blogInfoPtr)
      const postsPtr = blogInfo.members.find(m => m.name === 'posts')?.value
      if (postsPtr) {
        const postsSet = await getSetOrEmpty(postsPtr)
        if ((postsSet.elements || []).some(e => e.value === articlePtr)) {
          await removeSetElement(postsPtr, articlePtr, 'ref')
        }
      }
    } catch (e) {
      // 博客集合不存在，跳过
    }

    // 2. 从所有标签的文章集合中移除
    if (tagsPtr) {
      const tagsSet = await getSetOrEmpty(tagsPtr)
      const tagNames = (tagsSet.elements || []).map(e => e.value).filter(Boolean)

      for (const tagName of tagNames) {
        const tagResult = await this.#findTagByName(tagName)
        if (tagResult) {
          const tagPostsSet = await getSetOrEmpty(tagResult.postsPtr)
          if ((tagPostsSet.elements || []).some(e => e.value === articlePtr)) {
            await removeSetElement(tagResult.postsPtr, articlePtr, 'ref')
          }
        }
      }
    }

    // 3. 清空文章标签集合
    if (tagsPtr) {
      await ignoreNotFound(() => deleteSet(tagsPtr))
    }

    // 4. 清空文章对象（空态时视为已删除）
    await ignoreNotFound(() => deleteObject(articlePtr))

    return { success: true }
  }

  /**
   * 删除图片（仅元数据）
   */
  async deleteImage(imagePtr) {
    // 1. 从全局图片集合中移除
    try {
      const blogInfo = await getObject(this.blogInfoPtr)
      const imagesPtr = blogInfo.members.find(m => m.name === 'images')?.value
      if (imagesPtr) {
        const imagesSet = await getSetOrEmpty(imagesPtr)
        if ((imagesSet.elements || []).some(e => e.value === imagePtr)) {
          await removeSetElement(imagesPtr, imagePtr, 'ref')
        }
      }
    } catch (e) {
      // 图片集合不存在，跳过
    }

    // 2. 查找并解除所有使用该图片作为封面的文章
    const allArticles = await this.getAllArticles()
    for (const articlePtr of allArticles) {
      const article = await getObjectOrNull(articlePtr)
      if (!article) continue
      const coverPtr = article.members.find(m => m.name === 'cover')?.value
      if (coverPtr === imagePtr) {
        await ignoreNotFound(() => deleteObjectMember(articlePtr, 'cover'))
      }
    }

    // 3. 清空图片对象（空态时视为已删除）
    await ignoreNotFound(() => deleteObject(imagePtr))

    return { success: true }
  }

  /**
   * 删除标签
   */
  async deleteTag(tagName) {
    const tagResult = await this.#findTagByName(tagName)
    if (!tagResult) {
      throw new Error(`标签不存在：${tagName}`)
    }

    const { ptr: tagPtr, postsPtr } = tagResult

    // 1. 从博客标签集合中移除
    try {
      const blogInfo = await getObject(this.blogInfoPtr)
      const tagsPtr = blogInfo.members.find(m => m.name === 'tags')?.value
      if (tagsPtr) {
        const tagsSet = await getSetOrEmpty(tagsPtr)
        if ((tagsSet.elements || []).some(e => e.value === tagPtr)) {
          await removeSetElement(tagsPtr, tagPtr, 'ref')
        }
      }
    } catch (e) {
      // 博客集合不存在，跳过
    }

    // 2. 从所有使用该标签的文章中移除
    const tagPostsSet = await getSetOrEmpty(postsPtr)
    const articlePtrs = (tagPostsSet.elements || []).map(e => e.value).filter(Boolean)

    for (const articlePtr of articlePtrs) {
      const article = await getObjectOrNull(articlePtr)
      if (!article) continue
      const articleTagsPtr = article.members.find(m => m.name === 'tags')?.value
      if (articleTagsPtr) {
        const articleTagsSet = await getSetOrEmpty(articleTagsPtr)
        if ((articleTagsSet.elements || []).some(e => e.value === tagName)) {
          await removeSetElement(articleTagsPtr, tagName, 'raw')
        }
      }
    }

    // 3. 清空标签文章集合
    await ignoreNotFound(() => deleteSet(postsPtr))

    // 4. 清空标签对象（空态时视为已删除）
    await ignoreNotFound(() => deleteObject(tagPtr))

    return { success: true }
  }

  // ==================== 更新操作 ====================

  /**
   * 更新文章标题
   */
  async updateArticleTitle(articlePtr, newTitle) {
    const article = await getObject(articlePtr)
    const oldTitle = article.members.find(m => m.name === 'title')?.value

    if (!oldTitle) {
      throw new Error('文章不存在或无标题')
    }

    await setObjectMember(articlePtr, 'title', newTitle, 'raw')

    return { success: true, oldTitle, newTitle }
  }

  /**
   * 更新文章封面
   */
  async updateArticleCover(articlePtr, newImagePtr) {
    const article = await getObject(articlePtr)
    const oldCover = article.members.find(m => m.name === 'cover')?.value || null

    await setObjectMember(articlePtr, 'cover', newImagePtr, 'ref')

    return { success: true, oldCover, newCover: newImagePtr }
  }

  /**
   * 移除文章封面
   */
  async removeArticleCover(articlePtr) {
    const article = await getObject(articlePtr)
    const oldCover = article.members.find(m => m.name === 'cover')?.value || null

    if (oldCover) {
      await deleteObjectMember(articlePtr, 'cover')
    }

    return { success: true, removedCover: oldCover }
  }

  /**
   * 更新文章标签（替换所有标签）
   */
  async updateArticleTags(articlePtr, newTagNames) {
    const article = await getObject(articlePtr)
    const articleTagsPtr = article.members.find(m => m.name === 'tags')?.value

    if (!articleTagsPtr) {
      throw new Error('文章标签集合不存在')
    }

    // 获取当前标签；空态集合视为无标签
    const currentTagsSet = await getSetOrEmpty(articleTagsPtr)
    const currentTags = (currentTagsSet.elements || []).map(e => e.value).filter(Boolean)

    // 计算差异
    const removedTags = currentTags.filter(t => !newTagNames.includes(t))
    const addedTags = newTagNames.filter(t => !currentTags.includes(t))

    // 移除旧标签
    for (const tagName of removedTags) {
      await removeSetElement(articleTagsPtr, tagName, 'raw')

      // 从标签的文章集合中移除
      const tagResult = await this.#findTagByName(tagName)
      if (tagResult) {
        const tagPostsSet = await getSetOrEmpty(tagResult.postsPtr)
        if ((tagPostsSet.elements || []).some(e => e.value === articlePtr)) {
          await removeSetElement(tagResult.postsPtr, articlePtr, 'ref')
        }
      }
    }

    // 添加新标签
    for (const tagName of addedTags) {
      await addSetElement(articleTagsPtr, tagName, 'raw')

      // 添加到标签的文章集合
      const { ptr: tagPtr, postsPtr } = await this.#findOrCreateTag(tagName)
      await addSetElement(postsPtr, articlePtr, 'ref')
    }

    return { success: true, removedTags, addedTags }
  }

  /**
   * 添加单个标签到文章
   */
  async addTagToArticle(articlePtr, tagName) {
    return await this.linkTag(articlePtr, tagName)
  }

  /**
   * 从文章移除单个标签
   */
  async removeTagFromArticle(articlePtr, tagName) {
    const article = await getObject(articlePtr)
    const articleTagsPtr = article.members.find(m => m.name === 'tags')?.value

    if (!articleTagsPtr) {
      throw new Error('文章标签集合不存在')
    }

    const articleTagsSet = await getSetOrEmpty(articleTagsPtr)
    const hasTag = (articleTagsSet.elements || []).some(e => e.value === tagName)

    if (!hasTag) {
      throw new Error(`文章没有此标签：${tagName}`)
    }

    // 从文章标签集合移除
    await removeSetElement(articleTagsPtr, tagName, 'raw')

    // 从标签的文章集合移除
    const tagResult = await this.#findTagByName(tagName)
    if (tagResult) {
      const tagPostsSet = await getSetOrEmpty(tagResult.postsPtr)
      if ((tagPostsSet.elements || []).some(e => e.value === articlePtr)) {
        await removeSetElement(tagResult.postsPtr, articlePtr, 'ref')
      }
    }

    return { success: true, tagName }
  }

  /**
   * 更新图片文件名元数据
   */
  async updateImageFilename(imagePtr, newFilename) {
    const image = await getObject(imagePtr)
    const oldFilename = image.members.find(m => m.name === 'filename')?.value

    if (!oldFilename) {
      throw new Error('图片不存在或无文件名')
    }

    await setObjectMember(imagePtr, 'filename', newFilename, 'raw')

    return { success: true, oldFilename, newFilename }
  }

  // ==================== 辅助方法 ====================

  /**
   * 批量读取对象，失败时退回逐个读取
   * @private
   */
  async #getObjects(ptrs) {
    if (ptrs.length === 0) return []

    const result = await batchOperations(
      ptrs.map(ptr => ({ method: 'GET', path: `/obj/${ptr}` }))
    )
    if (result.success) {
      return result.results.map(r => (r.status === 200 ? r.body : null))
    }

    return Promise.all(
      ptrs.map(ptr => getObject(ptr).catch(() => null))
    )
  }

  /**
   * 读取博客标签索引
   * @param {string} [articlePtr] 文章指针，提供时同时返回文章标签集合指针
   * @private
   */
  async #loadTagIndex(articlePtr = null) {
    const readOps = [
      { method: 'GET', path: `/obj/query?path=${buildQueryPath(this.blogInfoPtr, 'tags')}` }
    ]
    if (articlePtr) {
      readOps.push({
        method: 'GET',
        path: `/obj/query?path=${buildQueryPath(articlePtr, 'tags')}`
      })
    }

    let results
    try {
      results = await runBatch(readOps, '读取标签信息')
    } catch (err) {
      if (err.batch?.failed_at === 0) throw new Error('博客标签集合不存在')
      if (err.batch?.failed_at === 1) throw new Error('文章标签集合不存在')
      throw err
    }

    const blogTagsPtr = results[0].body.value
    const articleTagsPtr = articlePtr ? results[1].body.value : ''

    const tagsSet = await getSetOrEmpty(blogTagsPtr)
    const tagPtrs = tagsSet.elements
      .filter(el => el.type === 'object')
      .map(el => el.value)
    const tagObjects = await this.#getObjects(tagPtrs)

    const tags = new Map()
    tagObjects.forEach(tag => {
      if (!tag) return
      const name = memberValue(tag, 'name')
      if (name) {
        tags.set(name, { ptr: tag.ptr, postsPtr: memberValue(tag, 'posts') })
      }
    })

    return { blogTagsPtr, articleTagsPtr, tags }
  }

  /**
   * 查找标签
   * @private
   */
  async #findTagByName(name) {
    const { tags } = await this.#loadTagIndex()
    return tags.get(name) || null
  }

  /**
   * 初始化博客
   * 创建博客信息对象、文章集合、标签集合、图片集合
   *
   * @param {string} title 博客名称
   * @returns {Promise<{ blogPtr: string, postsPtr: string, tagsPtr: string, imagesPtr: string }>}
   */
  async initBlog(title) {
    // 检查是否已存在
    if (await this.exists(this.blogInfoPtr)) {
      const blogInfo = await getObject(this.blogInfoPtr)
      throw new Error(`博客已存在：${memberValue(blogInfo, 'title')}`)
    }

    const operations = [
      {
        method: 'POST',
        path: '/obj/init',
        body: { title, posts: [], tags: [], images: [] }
      },
      {
        method: 'GET',
        path: '/obj/query?path=__BLOG__.posts',
        vars: { __BLOG__: '{0:ptr}' }
      },
      {
        method: 'GET',
        path: '/obj/query?path=__BLOG__.tags',
        vars: { __BLOG__: '{0:ptr}' }
      },
      {
        method: 'GET',
        path: '/obj/query?path=__BLOG__.images',
        vars: { __BLOG__: '{0:ptr}' }
      }
    ]

    const results = await runBatch(operations, '初始化博客')

    return {
      blogPtr: results[0].body.ptr,
      postsPtr: results[1].body.value,
      tagsPtr: results[2].body.value,
      imagesPtr: results[3].body.value
    }
  }
}

// 导出单例
export const publisher = new Publisher()
