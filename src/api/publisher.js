/**
 * Blog Publisher API (浏览器版本)
 *
 * 博客发布核心 API - 负责在 lmjweb 中注册元数据
 * 文件操作由用户手动完成，此 API 仅提供文件路径建议
 */

import {
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
  getObjectMember
} from './lmjweb.js'
import { getConfig } from '../config/blog.js'

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
   * 检查指针是否存在
   */
  async exists(ptr) {
    const res = await fetch(`${getConfig().LMJWEB_API}/ptr/${ptr}/exist`)
    const data = await res.json()
    return data.exists
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
    // 创建图片对象
    const { ptr: imagePtr } = await createObject()

    // 设置文件名元数据
    await setObjectMember(imagePtr, 'filename', filename, 'raw')

    // 自动注册到全局图片集合
    await this.linkToImages(imagePtr)

    return {
      ptr: imagePtr,
      suggestedPath: imagePtr, // 建议的文件路径（指针名）
      filename
    }
  }

  /**
   * 注册文章（仅元数据）
   *
   * @param {{ title: string }} options - 注册选项
   * @returns {Promise<{ ptr: string, suggestedPath: string, title: string }>}
   */
  async registerArticle({ title }) {
    // 创建文章对象
    const { ptr: articlePtr } = await createObject()

    // 创建文章标签集合
    const { ptr: articleTagsPtr } = await createSet()

    // 设置文章元数据
    await setObjectMember(articlePtr, 'title', title, 'raw')
    await setObjectMember(articlePtr, 'tags', articleTagsPtr, 'ref')

    // 将文章添加到博客 posts 集合
    await this.linkToBlog(articlePtr)

    return {
      ptr: articlePtr,
      suggestedPath: articlePtr, // 建议的文件路径（指针名）
      title
    }
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
    // 创建标签对象
    const { ptr: tagPtr } = await createObject()

    // 创建标签文章集合
    const { ptr: tagPostsPtr } = await createSet()

    // 设置标签信息
    await setObjectMember(tagPtr, 'name', name, 'raw')
    await setObjectMember(tagPtr, 'posts', tagPostsPtr, 'ref')

    // 添加到博客标签集合
    const blogInfo = await getObject(this.blogInfoPtr)
    const tagsPtr = blogInfo.members.find(m => m.name === 'tags')?.value
    if (!tagsPtr) {
      throw new Error('博客标签集合不存在')
    }
    await addSetElement(tagsPtr, tagPtr)

    return { ptr: tagPtr, postsPtr: tagPostsPtr }
  }

  /**
   * 查找或创建标签
   * @private
   */
  async #findOrCreateTag(name) {
    const blogInfo = await getObject(this.blogInfoPtr)
    const tagsPtr = blogInfo.members.find(m => m.name === 'tags')?.value
    const tagsSet = await getSet(tagsPtr)

    // 查找现有标签
    const elements = (tagsSet.elements || []).filter(e => e.value && e.value.trim())
    for (const elem of elements) {
      const tagObj = await getObject(elem.value)
      const nameMember = tagObj.members.find(m => m.name === 'name')
      if (nameMember?.value === name) {
        const tagPostsPtr = tagObj.members.find(m => m.name === 'posts')?.value
        return { ptr: elem.value, postsPtr: tagPostsPtr, created: false }
      }
    }

    // 创建新标签
    const { ptr, postsPtr } = await this.createTag(name)
    return { ptr, postsPtr, created: true }
  }

  /**
   * 关联标签到文章
   */
  async linkTag(articlePtr, tagName) {
    const { ptr: tagPtr, postsPtr: tagPostsPtr, created } = await this.#findOrCreateTag(tagName)

    // 获取文章标签集合
    const article = await getObject(articlePtr)
    const articleTagsPtr = article.members.find(m => m.name === 'tags')?.value
    if (!articleTagsPtr) {
      throw new Error('文章标签集合不存在')
    }

    // 添加标签名到文章标签集合
    await addSetElement(articleTagsPtr, tagName)

    // 将文章添加到标签文章集合
    await addSetElement(tagPostsPtr, articlePtr)

    return { ptr: tagPtr, created }
  }

  /**
   * 关联多个标签到文章
   */
  async linkTags(articlePtr, tagNames) {
    const results = []
    for (const tagName of tagNames) {
      const result = await this.linkTag(articlePtr, tagName)
      results.push({ ptr: result.ptr, name: tagName, created: result.created })
    }
    return results
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
    await addSetElement(postsPtr, articlePtr)
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

    await addSetElement(imagesPtr, imagePtr)
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

    const postsSet = await getSet(postsPtr)
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

    const imagesSet = await getSet(imagesPtr)
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

    const tagsSet = await getSet(tagsPtr)
    return (tagsSet.elements || []).map(e => e.value).filter(Boolean)
  }

  /**
   * 获取文章详细信息
   */
  async getArticleDetail(articlePtr) {
    const article = await getObject(articlePtr)

    // 获取封面信息
    const coverPtr = article.members.find(m => m.name === 'cover')?.value
    let cover = null
    if (coverPtr) {
      cover = await getObject(coverPtr)
    }

    // 获取标签列表
    const tagsPtr = article.members.find(m => m.name === 'tags')?.value
    let tags = []
    if (tagsPtr) {
      const tagsSet = await getSet(tagsPtr)
      tags = (tagsSet.elements || []).map(e => e.value).filter(Boolean)
    }

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
    let articleCount = 0
    if (postsPtr) {
      const postsSet = await getSet(postsPtr)
      articleCount = (postsSet.elements || []).filter(e => e.value).length
    }
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
    const article = await getObject(articlePtr)

    // 1. 从博客文章集合中移除
    try {
      const blogInfo = await getObject(this.blogInfoPtr)
      const postsPtr = blogInfo.members.find(m => m.name === 'posts')?.value
      if (postsPtr) {
        const postsSet = await getSet(postsPtr)
        if ((postsSet.elements || []).some(e => e.value === articlePtr)) {
          await removeSetElement(postsPtr, articlePtr)
        }
      }
    } catch (e) {
      // 博客集合不存在，跳过
    }

    // 2. 从所有标签的文章集合中移除
    const tagsPtr = article.members.find(m => m.name === 'tags')?.value
    if (tagsPtr) {
      const tagsSet = await getSet(tagsPtr)
      const tagNames = (tagsSet.elements || []).map(e => e.value).filter(Boolean)

      for (const tagName of tagNames) {
        const tagResult = await this.#findTagByName(tagName)
        if (tagResult) {
          const tagPostsSet = await getSet(tagResult.postsPtr)
          if ((tagPostsSet.elements || []).some(e => e.value === articlePtr)) {
            await removeSetElement(tagResult.postsPtr, articlePtr)
          }
        }
      }
    }

    // 3. 删除文章标签集合
    if (tagsPtr) {
      await deleteSet(tagsPtr)
    }

    // 4. 删除文章对象
    await deleteObject(articlePtr)

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
        const imagesSet = await getSet(imagesPtr)
        if ((imagesSet.elements || []).some(e => e.value === imagePtr)) {
          await removeSetElement(imagesPtr, imagePtr)
        }
      }
    } catch (e) {
      // 图片集合不存在，跳过
    }

    // 2. 查找并解除所有使用该图片作为封面的文章
    const allArticles = await this.getAllArticles()
    for (const articlePtr of allArticles) {
      const article = await getObject(articlePtr)
      const coverPtr = article.members.find(m => m.name === 'cover')?.value
      if (coverPtr === imagePtr) {
        await deleteObjectMember(articlePtr, 'cover')
      }
    }

    // 3. 删除图片对象
    await deleteObject(imagePtr)

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
        const tagsSet = await getSet(tagsPtr)
        if ((tagsSet.elements || []).some(e => e.value === tagPtr)) {
          await removeSetElement(tagsPtr, tagPtr)
        }
      }
    } catch (e) {
      // 博客集合不存在，跳过
    }

    // 2. 从所有使用该标签的文章中移除
    const tagPostsSet = await getSet(postsPtr)
    const articlePtrs = (tagPostsSet.elements || []).map(e => e.value).filter(Boolean)

    for (const articlePtr of articlePtrs) {
      const article = await getObject(articlePtr)
      const articleTagsPtr = article.members.find(m => m.name === 'tags')?.value
      if (articleTagsPtr) {
        const articleTagsSet = await getSet(articleTagsPtr)
        if ((articleTagsSet.elements || []).some(e => e.value === tagName)) {
          await removeSetElement(articleTagsPtr, tagName)
        }
      }
    }

    // 3. 删除标签文章集合
    await deleteSet(postsPtr)

    // 4. 删除标签对象
    await deleteObject(tagPtr)

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

    // 获取当前标签
    const currentTagsSet = await getSet(articleTagsPtr)
    const currentTags = (currentTagsSet.elements || []).map(e => e.value).filter(Boolean)

    // 计算差异
    const removedTags = currentTags.filter(t => !newTagNames.includes(t))
    const addedTags = newTagNames.filter(t => !currentTags.includes(t))

    // 移除旧标签
    for (const tagName of removedTags) {
      await removeSetElement(articleTagsPtr, tagName)

      // 从标签的文章集合中移除
      const tagResult = await this.#findTagByName(tagName)
      if (tagResult) {
        const tagPostsSet = await getSet(tagResult.postsPtr)
        if ((tagPostsSet.elements || []).some(e => e.value === articlePtr)) {
          await removeSetElement(tagResult.postsPtr, articlePtr)
        }
      }
    }

    // 添加新标签
    for (const tagName of addedTags) {
      await addSetElement(articleTagsPtr, tagName)

      // 添加到标签的文章集合
      const { ptr: tagPtr, postsPtr } = await this.#findOrCreateTag(tagName)
      await addSetElement(postsPtr, articlePtr)
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

    const articleTagsSet = await getSet(articleTagsPtr)
    const hasTag = (articleTagsSet.elements || []).some(e => e.value === tagName)

    if (!hasTag) {
      throw new Error(`文章没有此标签：${tagName}`)
    }

    // 从文章标签集合移除
    await removeSetElement(articleTagsPtr, tagName)

    // 从标签的文章集合移除
    const tagResult = await this.#findTagByName(tagName)
    if (tagResult) {
      const tagPostsSet = await getSet(tagResult.postsPtr)
      if ((tagPostsSet.elements || []).some(e => e.value === articlePtr)) {
        await removeSetElement(tagResult.postsPtr, articlePtr)
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
   * 查找标签
   * @private
   */
  async #findTagByName(name) {
    const blogInfo = await getObject(this.blogInfoPtr)
    const tagsPtr = blogInfo.members.find(m => m.name === 'tags')?.value
    if (!tagsPtr) return null

    const tagsSet = await getSet(tagsPtr)
    const elements = (tagsSet.elements || []).filter(e => e.value && e.value.trim())

    for (const elem of elements) {
      const tagObj = await getObject(elem.value)
      const nameMember = tagObj.members.find(m => m.name === 'name')
      if (nameMember?.value === name) {
        const tagPostsPtr = tagObj.members.find(m => m.name === 'posts')?.value
        return { ptr: elem.value, postsPtr: tagPostsPtr }
      }
    }

    return null
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
      throw new Error(`博客已存在：${blogInfo.members.find(m => m.name === 'title')?.value}`)
    }

    // 创建博客信息对象
    const { ptr: blogPtr } = await createObject()

    // 创建文章集合
    const { ptr: postsPtr } = await createSet()

    // 创建标签集合
    const { ptr: tagsPtr } = await createSet()

    // 创建图片集合
    const { ptr: imagesPtr } = await createSet()

    // 设置博客信息
    await setObjectMember(blogPtr, 'title', title, 'raw')
    await setObjectMember(blogPtr, 'posts', postsPtr, 'ref')
    await setObjectMember(blogPtr, 'tags', tagsPtr, 'ref')
    await setObjectMember(blogPtr, 'images', imagesPtr, 'ref')

    return { blogPtr, postsPtr, tagsPtr, imagesPtr }
  }
}

// 导出单例
export const publisher = new Publisher()
