/**
 * lmjweb API 服务封装
 *
 * 提供对 lmjweb 元数据服务的所有操作
 */

import { getConfig } from '@/config/blog'

/**
 * 获取 API 基础 URL
 */
function getApiUrl() {
  const config = getConfig()
  return config.LMJWEB_API
}

/**
 * 获取博客信息对象指针
 */
function getBlogInfoPtr() {
  const config = getConfig()
  return config.BLOG_INFO_PTR
}

/**
 * 检查指针是否存在
 * @param {string} ptr - 要检查的指针
 * @returns {Promise<{exist: boolean, type?: string}>}
 */
export async function checkPtrExist(ptr) {
  const response = await fetch(`${getApiUrl()}/ptr/${ptr}/exist`)
  return response.json()
}

/**
 * 健康检查
 * @returns {Promise<{status: string, uptime: number}>}
 */
export async function healthCheck() {
  const response = await fetch(`${getApiUrl()}/health`)
  return response.json()
}

// ==================== 对象操作（只读） ====================

/**
 * 获取完整对象
 * @param {string} ptr - 对象指针
 * @returns {Promise<{ptr: string, members: Array<{name: string, value: string, type: string}>, count: number}>}
 */
export async function getObject(ptr) {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}`)
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
  const response = await fetch(`${getApiUrl()}/obj/${ptr}/${member}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Member not found')
    }
    throw new Error(`Failed to get member: ${response.statusText}`)
  }
  return response.json()
}

/**
 * 链式查询对象成员
 * @param {string} path - 查询路径（格式：ptr.member1.member2）
 * @returns {Promise<{path: string, value: string, type: string}>}
 */
export async function queryObjectPath(path) {
  const response = await fetch(`${getApiUrl()}/obj/query?path=${encodeURIComponent(path)}`)
  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`)
  }
  return response.json()
}

// ==================== 集合操作（只读） ====================

/**
 * 获取完整集合
 * @param {string} ptr - 集合指针
 * @returns {Promise<{ptr: string, elements: Array<{value: string, type: string}>, count: number}>}
 */
export async function getSet(ptr) {
  const response = await fetch(`${getApiUrl()}/set/${ptr}`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Set not found')
    }
    throw new Error(`Failed to get set: ${response.statusText}`)
  }
  return response.json()
}

// ==================== 批量操作 ====================

/**
 * 批量执行只读操作（GET /batch）
 * 
 * 使用只读事务，仅允许 GET 操作，保证读取一致性
 * 为了兼容性使用psot方法提交操作列表，在nginx中配置将 POST /batch 转发到 GET /batch
 * @param {Array<{method: 'GET', path: string}>} operations - 操作列表，仅允许 GET 操作
 * @returns {Promise<{success: boolean, results: Array<{status: number, body: any}>}>}
 */
export async function batchOperations(operations) {
  const response = await fetch(`${getApiUrl()}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operations })
  })
  return response.json()
}

// ==================== 博客专用方法 ====================

// 博客信息缓存（避免重复请求）
let blogInfoCache = null

/**
 * 获取博客信息（带缓存）
 * @param {boolean} forceRefresh - 是否强制刷新缓存
 * @returns {Promise<{ptr: string, title: string, postsPtr: string, tagsPtr: string}>}
 */
export async function getBlogInfo(forceRefresh = false) {
  if (!forceRefresh && blogInfoCache) {
    return blogInfoCache
  }

  const obj = await getObject(getBlogInfoPtr())
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

  blogInfoCache = result
  return result
}

/**
 * 清除博客信息缓存
 */
export function clearBlogInfoCache() {
  blogInfoCache = null
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

  // 如果没有文章，直接返回 null
  if (postPtrs.length === 0) {
    return null
  }

  // 使用批量查询提高效率
  const operations = postPtrs.map(ptr => ({
    method: 'GET',
    path: `/obj/${ptr}/slug`
  }))

  const results = await batchOperations(operations)

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

  // 如果没有标签，直接返回空数组
  if (tagPtrs.length === 0) {
    return []
  }

  // 批量获取标签信息
  const operations = tagPtrs.flatMap(ptr => [
    { method: 'GET', path: `/obj/${ptr}/name` },
    { method: 'GET', path: `/obj/${ptr}/posts` }
  ])

  const results = await batchOperations(operations)

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

// ==================== 批量优化方法 ====================

/**
 * 批量获取所有文章详情（单次批量请求）
 * @param {string[]} postPtrs - 文章指针数组
 * @returns {Promise<Array<{ptr: string, title: string, slug: string, cover: string, tags: string[]}|null>>}
 */
export async function batchGetPosts(postPtrs) {
  if (postPtrs.length === 0) return []

  // 构建批量查询：获取每篇文章的所有成员
  const operations = postPtrs.flatMap(ptr => [
    { method: 'GET', path: `/obj/${ptr}` }
  ])

  const results = await batchOperations(operations)
  if (!results.success) {
    throw new Error('Failed to batch get posts')
  }

  // 提取标签集合指针
  const tagSetPtrs = []
  const postDetails = results.results.map((result, idx) => {
    if (result.status !== 200) return null

    const obj = result.body
    const detail = { ptr: obj.ptr }
    let tagsPtr = null

    for (const member of obj.members) {
      if (member.name === 'title') detail.title = member.value
      else if (member.name === 'slug') detail.slug = member.value
      else if (member.name === 'cover') detail.cover = member.value
      else if (member.name === 'tags') tagsPtr = member.value
    }

    if (tagsPtr) tagSetPtrs.push({ ptr: obj.ptr, tagsPtr })
    return detail
  })

  // 批量获取所有标签集合
  if (tagSetPtrs.length > 0) {
    const tagOperations = tagSetPtrs.map(t => ({
      method: 'GET',
      path: `/set/${t.tagsPtr}`
    }))
    const tagResults = await batchOperations(tagOperations)

    // 将标签映射回文章
    if (tagResults.success) {
      let tagIdx = 0
      postDetails.forEach((detail) => {
        if (!detail) return
        const tagResult = tagResults.results[tagIdx++]
        if (tagResult.status === 200) {
          detail.tags = tagResult.body.elements
            .filter(el => el.type === 'raw')
            .map(el => el.value)
        } else {
          detail.tags = []
        }
      })
    }
  }

  return postDetails
}

/**
 * 批量获取所有标签及其文章数量
 * @param {string} tagsPtr - 标签集合指针
 * @returns {Promise<Array<{ptr: string, name: string, postsPtr: string, count: number}>>}
 */
export async function batchGetTagsWithCount(tagsPtr) {
  const set = await getSet(tagsPtr)
  const tagPtrs = set.elements
    .filter(el => el.type === 'ref')
    .map(el => el.value)

  if (tagPtrs.length === 0) return []

  // 批量获取标签信息和文章集合
  const operations = tagPtrs.flatMap(ptr => [
    { method: 'GET', path: `/obj/${ptr}/name` },
    { method: 'GET', path: `/obj/${ptr}/posts` }
  ])

  const results = await batchOperations(operations)
  if (!results.success) {
    throw new Error('Failed to batch get tags')
  }

  // 获取每个标签的文章集合
  const tagInfos = []
  const postsSetPtrs = []

  for (let i = 0; i < tagPtrs.length; i++) {
    const nameResult = results.results[i * 2]
    const postsResult = results.results[i * 2 + 1]

    const tagInfo = {
      ptr: tagPtrs[i],
      name: nameResult.status === 200 ? nameResult.body.value : '',
      postsPtr: postsResult.status === 200 ? postsResult.body.value : ''
    }
    tagInfos.push(tagInfo)
    if (tagInfo.postsPtr) postsSetPtrs.push(tagInfo.postsPtr)
  }

  // 批量获取所有标签的文章数量
  if (postsSetPtrs.length > 0) {
    const countOperations = postsSetPtrs.map(ptr => ({
      method: 'GET',
      path: `/set/${ptr}`
    }))
    const countResults = await batchOperations(countOperations)

    if (countResults.success) {
      let countIdx = 0
      tagInfos.forEach(tagInfo => {
        const countResult = countResults.results[countIdx++]
        tagInfo.count = countResult.status === 200
          ? countResult.body.elements.length
          : 0
      })
    }
  }

  return tagInfos
}
