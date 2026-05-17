/**
 * lmjweb API 服务封装
 * 
 * 提供对 lmjweb 元数据服务的所有操作
 */

import { BLOG_CONFIG } from '@/config/blog'

/**
 * 检查指针是否存在
 * @param {string} ptr - 要检查的指针
 * @returns {Promise<{exist: boolean, type?: string}>}
 */
export async function checkPtrExist(ptr) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/ptr/${ptr}/exist`)
  return response.json()
}

/**
 * 健康检查
 * @returns {Promise<{status: string, uptime: number}>}
 */
export async function healthCheck() {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/health`)
  return response.json()
}

// ==================== 对象操作 ====================

/**
 * 创建对象
 * @returns {Promise<{ptr: string}>}
 */
export async function createObject() {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/obj`, {
    method: 'POST'
  })
  return response.json()
}

/**
 * 获取完整对象
 * @param {string} ptr - 对象指针
 * @returns {Promise<{ptr: string, members: Array<{name: string, value: string, type: string}>, count: number}>}
 */
export async function getObject(ptr) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/obj/${ptr}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Object not found')
    }
    throw new Error(`Failed to get object: ${response.statusText}`)
  }
  return response.json()
}

/**
 * 获取对象成员值
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 * @returns {Promise<{member: string, value: string, type: string}>}
 */
export async function getObjectMember(ptr, member) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/obj/${ptr}/${member}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Member not found')
    }
    throw new Error(`Failed to get member: ${response.statusText}`)
  }
  return response.json()
}

/**
 * 设置对象成员值
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 * @param {string} value - 值（原始数据或指针）
 * @returns {Promise<{success: boolean}>}
 */
export async function setObjectMember(ptr, member, value) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/obj/${ptr}/${member}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  })
  return response.json()
}

/**
 * 删除对象成员
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteObjectMember(ptr, member) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/obj/${ptr}/${member}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * 删除完整对象
 * @param {string} ptr - 对象指针
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteObject(ptr) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/obj/${ptr}`, {
    method: 'DELETE'
  })
  return response.json()
}

/**
 * 链式查询对象成员
 * @param {string} path - 查询路径（格式：ptr.member1.member2）
 * @returns {Promise<{path: string, value: string, type: string}>}
 */
export async function queryObjectPath(path) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/obj/query?path=${encodeURIComponent(path)}`)
  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`)
  }
  return response.json()
}

// ==================== 集合操作 ====================

/**
 * 创建集合
 * @returns {Promise<{ptr: string}>}
 */
export async function createSet() {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/set`, {
    method: 'POST'
  })
  return response.json()
}

/**
 * 获取完整集合
 * @param {string} ptr - 集合指针
 * @returns {Promise<{ptr: string, elements: Array<{value: string, type: string}>, count: number}>}
 */
export async function getSet(ptr) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/set/${ptr}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Set not found')
    }
    throw new Error(`Failed to get set: ${response.statusText}`)
  }
  return response.json()
}

/**
 * 添加元素到集合
 * @param {string} ptr - 集合指针
 * @param {string} value - 元素值
 * @returns {Promise<{success: boolean}>}
 */
export async function addSetElement(ptr, value) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/set/${ptr}/elements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  })
  return response.json()
}

/**
 * 从集合删除元素
 * @param {string} ptr - 集合指针
 * @param {string} value - 元素值
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteSetElement(ptr, value) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/set/${ptr}/elements`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  })
  return response.json()
}

/**
 * 删除完整集合
 * @param {string} ptr - 集合指针
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteSet(ptr) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/set/${ptr}`, {
    method: 'DELETE'
  })
  return response.json()
}

// ==================== 批量操作 ====================

/**
 * 批量执行操作
 * @param {Array<{method: string, path: string, body?: object}>} operations - 操作列表
 * @param {boolean} readonly - 是否只读事务
 * @returns {Promise<{success: boolean, results: Array<{status: number, body: any}>}>}
 */
export async function batchOperations(operations, readonly = false) {
  const response = await fetch(`${BLOG_CONFIG.LMJWEB_API}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ readonly, operations })
  })
  return response.json()
}

// ==================== 博客专用方法 ====================

/**
 * 获取博客信息
 * @returns {Promise<{ptr: string, title: string, postsPtr: string, tagsPtr: string}>}
 */
export async function getBlogInfo() {
  const obj = await getObject(BLOG_CONFIG.BLOG_INFO_PTR)
  const result = { ptr: obj.ptr }
  
  for (const member of obj.members) {
    if (member.name === 'title') {
      result.title = member.value
    } else if (member.name === 'posts') {
      result.postsPtr = member.value
    } else if (member.name === 'tags') {
      result.tagsPtr = member.value
    }
  }
  
  return result
}

/**
 * 获取所有文章指针
 * @param {string} postsPtr - 文章集合指针
 * @returns {Promise<string[]>} 文章指针数组
 */
export async function getAllPostPtrs(postsPtr) {
  const set = await getSet(postsPtr)
  return set.elements
    .filter(el => el.type === 'ref')
    .map(el => el.value)
}

/**
 * 获取文章详情
 * @param {string} ptr - 文章指针
 * @returns {Promise<{ptr: string, title: string, slug: string, cover: string, tags: string[]}>}
 */
export async function getPostDetail(ptr) {
  const obj = await getObject(ptr)
  const result = { ptr }
  const tagsPtr = []
  
  for (const member of obj.members) {
    if (member.name === 'title') {
      result.title = member.value
    } else if (member.name === 'slug') {
      result.slug = member.value
    } else if (member.name === 'cover') {
      result.cover = member.value
    } else if (member.name === 'tags') {
      tagsPtr.push(member.value)
    }
  }
  
  // 获取标签集合
  if (tagsPtr.length > 0) {
    const tagsSet = await getSet(tagsPtr[0])
    result.tags = tagsSet.elements
      .filter(el => el.type === 'raw')
      .map(el => el.value)
  } else {
    result.tags = []
  }
  
  return result
}

/**
 * 根据 slug 查找文章指针
 * @param {string} postsPtr - 文章集合指针
 * @param {string} slug - 文章 slug
 * @returns {Promise<string|null>} 文章指针，未找到返回 null
 */
export async function findPostBySlug(postsPtr, slug) {
  const postPtrs = await getAllPostPtrs(postsPtr)
  
  // 使用批量查询提高效率
  const operations = postPtrs.map(ptr => ({
    method: 'GET',
    path: `/obj/${ptr}/slug`
  }))
  
  const results = await batchOperations(operations, true)
  
  if (!results.success) {
    throw new Error('Failed to query posts')
  }
  
  for (let i = 0; i < results.results.length; i++) {
    const result = results.results[i]
    if (result.status === 200 && result.body.value === slug) {
      return postPtrs[i]
    }
  }
  
  return null
}

/**
 * 获取标签列表
 * @param {string} tagsPtr - 标签集合指针
 * @returns {Promise<Array<{ptr: string, name: string, postsPtr: string}>>}
 */
export async function getTagList(tagsPtr) {
  const set = await getSet(tagsPtr)
  const tagPtrs = set.elements
    .filter(el => el.type === 'ref')
    .map(el => el.value)
  
  // 批量获取标签信息
  const operations = tagPtrs.flatMap(ptr => [
    { method: 'GET', path: `/obj/${ptr}/name` },
    { method: 'GET', path: `/obj/${ptr}/posts` }
  ])
  
  const results = await batchOperations(operations, true)
  
  if (!results.success) {
    throw new Error('Failed to query tags')
  }
  
  const tags = []
  for (let i = 0; i < tagPtrs.length; i++) {
    const nameResult = results.results[i * 2]
    const postsResult = results.results[i * 2 + 1]
    
    tags.push({
      ptr: tagPtrs[i],
      name: nameResult.status === 200 ? nameResult.body.value : '',
      postsPtr: postsResult.status === 200 ? postsResult.body.value : ''
    })
  }
  
  return tags
}

/**
 * 获取标签下的所有文章指针
 * @param {string} tagPostsPtr - 标签文章集合指针
 * @returns {Promise<string[]>} 文章指针数组
 */
export async function getPostsByTag(tagPostsPtr) {
  const set = await getSet(tagPostsPtr)
  return set.elements
    .filter(el => el.type === 'ref')
    .map(el => el.value)
}
