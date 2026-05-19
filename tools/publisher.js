/**
 * Blog Publisher API
 * 
 * 博客发布核心 API - 负责在 lmjweb 中注册元数据并管理文件
 * 
 * 核心职责:
 * 1. 注册文件 - 在 lmjweb 创建对象，同时将文件移动到 Nginx 目录（使用指针命名）
 * 2. 创建关联 - 通过指针建立对象间的关系
 * 
 * @example
 * ```javascript
 * import { Publisher } from './publisher.js'
 * 
 * const publisher = new Publisher({
 *   lmjwebApi: 'http://localhost:8080',
 *   blogInfoPtr: '01abc123...',
 *   imagesDir: '/var/www/images',
 *   articlesDir: '/var/www/articles'
 * })
 * 
 * // 注册文章（自动移动文件到 articlesDir/{articlePtr}）
 * const article = await publisher.registerArticle({
 *   filePath: './drafts/my-article.md',
 *   title: '文章标题',
 *   slug: 'my-article'
 * })
 * 
 * // 注册封面图片（自动移动到 imagesDir/{imagePtr}）
 * const cover = await publisher.registerImage('./covers/cover.jpg')
 * 
 * // 创建关联
 * await publisher.linkCover(article.ptr, cover.ptr)
 * await publisher.linkTag(article.ptr, '技术')
 * await publisher.linkToBlog(article.ptr)
 * ```
 */

import fs from 'fs'
import path from 'path'

/**
 * Publisher 类 - 博客发布核心 API
 */
export class Publisher {
  /**
   * 创建 Publisher 实例
   * @param {{ lmjwebApi: string, blogInfoPtr: string, imagesDir: string, articlesDir: string }} config 配置
   */
  constructor(config) {
    this.config = config
    this.apiBase = config.lmjwebApi.replace(/\/$/, '')
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>}
   */
  async health() {
    const res = await fetch(`${this.apiBase}/health`)
    return res.ok
  }

  /**
   * 检查指针是否存在
   * @param {string} ptr 指针
   * @returns {Promise<boolean>}
   */
  async exists(ptr) {
    const res = await fetch(`${this.apiBase}/ptr/${ptr}/exist`)
    const data = await res.json()
    return data.exists
  }

  /**
   * 创建空对象
   * @returns {Promise<string>} 对象指针
   * @private
   */
  async #createObject() {
    const res = await fetch(`${this.apiBase}/obj`, { method: 'POST' })
    const data = await res.json()
    return data.ptr
  }

  /**
   * 创建空集合
   * @returns {Promise<string>} 集合指针
   * @private
   */
  async #createSet() {
    const res = await fetch(`${this.apiBase}/set`, { method: 'POST' })
    const data = await res.json()
    return data.ptr
  }

  /**
   * 获取完整对象
   * @param {string} ptr 对象指针
   * @returns {Promise<object>}
   * @private
   */
  async #getObject(ptr) {
    const res = await fetch(`${this.apiBase}/obj/${ptr}`)
    return res.json()
  }

  /**
   * 获取完整集合
   * @param {string} ptr 集合指针
   * @returns {Promise<object>}
   * @private
   */
  async #getSet(ptr) {
    const res = await fetch(`${this.apiBase}/set/${ptr}`)
    return res.json()
  }

  /**
   * 设置对象成员
   * @param {string} ptr 对象指针
   * @param {string} member 成员名
   * @param {string} value 成员值
   * @param {'raw' | 'ref'} type 值类型
   * @returns {Promise<object>}
   * @private
   */
  async #setMember(ptr, member, value, type = 'raw') {
    const res = await fetch(`${this.apiBase}/obj/${ptr}/${member}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, type })
    })
    return res.json()
  }

  /**
   * 添加集合元素
   * @param {string} ptr 集合指针
   * @param {string} value 元素值
   * @returns {Promise<object>}
   * @private
   */
  async #addElement(ptr, value) {
    const res = await fetch(`${this.apiBase}/set/${ptr}/elements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    return res.json()
  }

  /**
   * 获取图片文件路径
   * @param {string} ptr 图片指针
   * @returns {string}
   * @private
   */
  #getImagePath(ptr) {
    return path.join(this.config.imagesDir, ptr)
  }

  /**
   * 获取文章文件路径
   * @param {string} ptr 文章指针
   * @returns {string}
   * @private
   */
  #getArticlePath(ptr) {
    return path.join(this.config.articlesDir, ptr)
  }

  /**
   * 确保目录存在
   * @param {string} dirPath 目录路径
   * @private
   */
  #ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  /**
   * 移动/复制文件到目标位置（使用指针命名）
   * @param {string} srcPath 源文件路径
   * @param {string} destDir 目标目录
   * @param {string} ptr 指针（用作文件名）
   * @returns {string} 目标文件路径
   * @private
   */
  #moveFileToDest(srcPath, destDir, ptr) {
    this.#ensureDir(destDir)
    const destPath = path.join(destDir, ptr)
    fs.copyFileSync(srcPath, destPath)
    return destPath
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath 文件路径
   * @returns {boolean}
   * @private
   */
  #fileExists(filePath) {
    return fs.existsSync(filePath)
  }

  // ==================== 注册操作 ====================

  /**
   * 注册图片
   * 在 lmjweb 中创建图片对象，并将文件移动到 imagesDir/{imagePtr}
   * 
   * @param {string} filePath 图片文件路径
   * @param {string} [filename] 可选的原始文件名（用于元数据记录）
   * @returns {Promise<{ ptr: string, path: string, filename: string }>}
   */
  async registerImage(filePath, filename) {
    if (!this.#fileExists(filePath)) {
      throw new Error(`文件不存在：${filePath}`)
    }

    // 创建图片对象
    const imagePtr = await this.#createObject()

    // 设置文件名元数据（使用原始文件名或传入的 filename）
    const originalFilename = filename || path.basename(filePath)
    await this.#setMember(imagePtr, 'filename', originalFilename, 'raw')

    // 移动文件到 imagesDir/{imagePtr}
    const destPath = this.#moveFileToDest(filePath, this.config.imagesDir, imagePtr)

    return {
      ptr: imagePtr,
      path: destPath,
      filename: originalFilename
    }
  }

  /**
   * 注册文章
   * 在 lmjweb 中创建文章对象，并将文件移动到 articlesDir/{articlePtr}
   * 
   * @param {{
   *   filePath: string,
   *   title: string,
   *   slug: string,
   *   filename?: string
   * }} options 注册选项
   * @returns {Promise<{
   *   ptr: string,
   *   path: string,
   *   title: string,
   *   slug: string
   * }>}
   */
  async registerArticle({ filePath, title, slug, filename }) {
    if (!this.#fileExists(filePath)) {
      throw new Error(`文件不存在：${filePath}`)
    }

    // 创建文章对象
    const articlePtr = await this.#createObject()

    // 创建文章标签集合
    const articleTagsPtr = await this.#createSet()

    // 设置文章元数据
    await this.#setMember(articlePtr, 'title', title, 'raw')
    await this.#setMember(articlePtr, 'slug', slug, 'raw')
    await this.#setMember(articlePtr, 'tags', articleTagsPtr, 'ref')

    // 移动文件到 articlesDir/{articlePtr}
    const destPath = this.#moveFileToDest(filePath, this.config.articlesDir, articlePtr)

    return {
      ptr: articlePtr,
      path: destPath,
      title,
      slug
    }
  }

  // ==================== 关联操作 ====================

  /**
   * 关联封面图片到文章
   * 
   * @param {string} articlePtr 文章指针
   * @param {string} imagePtr 图片指针
   */
  async linkCover(articlePtr, imagePtr) {
    await this.#setMember(articlePtr, 'cover', imagePtr, 'ref')
  }

  /**
   * 创建标签
   * 
   * @param {string} name 标签名称
   * @returns {Promise<{ ptr: string, postsPtr: string }>}
   */
  async createTag(name) {
    // 创建标签对象
    const tagPtr = await this.#createObject()

    // 创建标签文章集合
    const tagPostsPtr = await this.#createSet()

    // 设置标签信息
    await this.#setMember(tagPtr, 'name', name, 'raw')
    await this.#setMember(tagPtr, 'posts', tagPostsPtr, 'ref')

    // 添加到博客标签集合
    const blogInfo = await this.#getObject(this.config.blogInfoPtr)
    const tagsPtr = blogInfo.members.find(m => m.name === 'tags')?.value
    if (!tagsPtr) {
      throw new Error('博客标签集合不存在')
    }
    await this.#addElement(tagsPtr, tagPtr)

    return { ptr: tagPtr, postsPtr: tagPostsPtr }
  }

  /**
   * 查找或创建标签
   * @param {string} name 标签名称
   * @returns {Promise<{ ptr: string, postsPtr: string, created: boolean }>}
   * @private
   */
  async #findOrCreateTag(name) {
    const blogInfo = await this.#getObject(this.config.blogInfoPtr)
    const tagsPtr = blogInfo.members.find(m => m.name === 'tags')?.value
    const tagsSet = await this.#getSet(tagsPtr)

    // 查找现有标签（过滤空元素）
    const elements = (tagsSet.elements || []).filter(e => e.value && e.value.trim())
    for (const elem of elements) {
      const tagObj = await this.#getObject(elem.value)
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
   * 同时处理：文章→标签集合、标签→文章集合
   * 
   * @param {string} articlePtr 文章指针
   * @param {string} tagName 标签名称（自动查找或创建）
   * @returns {Promise<{ ptr: string, created: boolean }>}
   */
  async linkTag(articlePtr, tagName) {
    const { ptr: tagPtr, postsPtr: tagPostsPtr, created } = await this.#findOrCreateTag(tagName)

    // 获取文章标签集合
    const article = await this.#getObject(articlePtr)
    const articleTagsPtr = article.members.find(m => m.name === 'tags')?.value
    if (!articleTagsPtr) {
      throw new Error('文章标签集合不存在')
    }

    // 添加标签名到文章标签集合
    await this.#addElement(articleTagsPtr, tagName)

    // 将文章添加到标签文章集合
    await this.#addElement(tagPostsPtr, articlePtr)

    return { ptr: tagPtr, created }
  }

  /**
   * 关联多个标签到文章
   * 
   * @param {string} articlePtr 文章指针
   * @param {string[]} tagNames 标签名称列表
   * @returns {Promise<Array<{ ptr: string, name: string, created: boolean }>>}
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
   * 
   * @param {string} articlePtr 文章指针
   */
  async linkToBlog(articlePtr) {
    const blogInfo = await this.#getObject(this.config.blogInfoPtr)
    const postsPtr = blogInfo.members.find(m => m.name === 'posts')?.value
    if (!postsPtr) {
      throw new Error('博客文章集合不存在')
    }
    await this.#addElement(postsPtr, articlePtr)
  }

  // ==================== 查询操作 ====================

  /**
   * 获取文章信息
   * 
   * @param {string} articlePtr 文章指针
   * @returns {Promise<object>}
   */
  async getArticle(articlePtr) {
    return await this.#getObject(articlePtr)
  }

  /**
   * 获取图片信息
   * 
   * @param {string} imagePtr 图片指针
   * @returns {Promise<object>}
   */
  async getImage(imagePtr) {
    return await this.#getObject(imagePtr)
  }

  /**
   * 获取博客信息
   * 
   * @returns {Promise<object>}
   */
  async getBlogInfo() {
    return await this.#getObject(this.config.blogInfoPtr)
  }

  // ==================== 文件操作 ====================

  /**
   * 复制已注册的文件到其他目录
   * 
   * @param {string} ptr 文件指针
   * @param {string} destDir 目标目录
   * @param {'image' | 'article'} type 文件类型
   * @returns {string} 目标文件路径
   */
  copyFile(ptr, destDir, type) {
    const srcPath = type === 'image' 
      ? this.#getImagePath(ptr) 
      : this.#getArticlePath(ptr)
    
    if (!this.#fileExists(srcPath)) {
      throw new Error(`文件不存在：${srcPath}`)
    }

    this.#ensureDir(destDir)
    const destPath = path.join(destDir, ptr)
    fs.copyFileSync(srcPath, destPath)
    return destPath
  }

  /**
   * 删除已注册的文件
   * 
   * @param {string} ptr 文件指针
   * @param {'image' | 'article'} type 文件类型
   */
  deleteFile(ptr, type) {
    const filePath = type === 'image' 
      ? this.#getImagePath(ptr) 
      : this.#getArticlePath(ptr)
    
    if (this.#fileExists(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  /**
   * 初始化博客
   * 创建博客信息对象、文章集合、标签集合
   * 
   * @param {string} title 博客名称
   * @returns {Promise<{ blogPtr: string, postsPtr: string, tagsPtr: string }>}
   */
  async initBlog(title) {
    // 检查是否已存在
    if (await this.exists(this.config.blogInfoPtr)) {
      const blogInfo = await this.#getObject(this.config.blogInfoPtr)
      throw new Error(`博客已存在：${blogInfo.members.find(m => m.name === 'title')?.value}`)
    }

    // 创建博客信息对象
    const blogPtr = await this.#createObject()

    // 创建文章集合
    const postsPtr = await this.#createSet()

    // 创建标签集合
    const tagsPtr = await this.#createSet()

    // 设置博客信息
    await this.#setMember(blogPtr, 'title', title, 'raw')
    await this.#setMember(blogPtr, 'posts', postsPtr, 'ref')
    await this.#setMember(blogPtr, 'tags', tagsPtr, 'ref')

    return { blogPtr, postsPtr, tagsPtr }
  }
}

export default Publisher
