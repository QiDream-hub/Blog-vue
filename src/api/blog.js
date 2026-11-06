/**
 * 博客 API 服务封装
 *
 * 基于 lmjweb API 的博客数据获取工具方法
 */

import { getImageUrl } from '@/config/blog'
import {
  getBlogInfoPtr,
  batchGet,
  getObject,
  getSet,
  buildQueryPath
} from '@/api/lmjweb'

/**
 * 读取集合；空态（无内容，404）按空集合处理
 * @param {string} ptr
 * @returns {Promise<{elements: Array<{value: string, type: string}>} | null>}
 */
async function getSetOrNull(ptr) {
  if (!ptr) return null
  try {
    return await getSet(ptr)
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

/**
 * 从对象成员列表中取值
 * @param {{members: Array<{name: string, value: string}>}} obj
 * @param {string} name
 * @returns {string}
 */
function memberValue(obj, name) {
  return obj.members.find(m => m.name === name)?.value ?? ''
}

/**
 * 批量失败时构造错误
 * @param {{details?: {error?: string}}} result
 * @param {string} fallback
 * @returns {Error}
 */
function batchError(result, fallback) {
  return new Error(result.details?.error || fallback)
}

/**
 * 批量读取对象；批量接口全有或全无，失败时退化为逐个读取
 * @param {string[]} ptrs
 * @returns {Promise<Array<{status: number, body: any}>>}
 */
async function getObjectsSettled(ptrs) {
  if (ptrs.length === 0) return []

  const result = await batchGet(
    ptrs.map(ptr => ({ method: 'GET', path: `/obj/${ptr}` }))
  )
  if (result.success) return result.results

  return Promise.all(
    ptrs.map(async ptr => {
      try {
        return { status: 200, body: await getObject(ptr) }
      } catch (err) {
        return { status: err.status ?? 0, body: null }
      }
    })
  )
}

// ==================== 获取博客信息 ====================

/**
 * 获取博客信息
 */
export async function getBlogInfo() {
  const blogInfoPtr = getBlogInfoPtr()

  const operations = ['title', 'posts', 'tags'].map(member => ({
    method: 'GET',
    path: `/obj/query?path=${buildQueryPath(blogInfoPtr, member)}`
  }))

  const results = await batchGet(operations)
  if (!results.success) {
    throw batchError(results, 'Failed to get blog info')
  }

  const valueOf = index =>
    results.results[index].status === 200 ? results.results[index].body.value : ''

  return {
    ptr: blogInfoPtr,
    title: valueOf(0),
    postsPtr: valueOf(1),
    tagsPtr: valueOf(2)
  }
}

/**
 * 获取所有文章指针
 * 集合元素引用对象的读类型为 `object`
 */
export async function getAllPostPtrs(postsPtr) {
  if (!postsPtr || postsPtr.length !== 34) {
    console.error('Invalid postsPtr:', postsPtr)
    return []
  }

  const set = await getSetOrNull(postsPtr)
  if (!set) return []

  return set.elements
    .filter(el => el.type === 'object')
    .map(el => el.value)
}

/**
 * 获取文章详情
 * @param {string} ptr - 文章指针
 * @returns {Promise<{ptr: string, title: string, cover: string, tags: string[]}>}
 */
export async function getPostDetail(ptr) {
  const post = await getObject(ptr)

  const tagsPtr = memberValue(post, 'tags')
  const tags = []
  const tagsSet = await getSetOrNull(tagsPtr)
  if (tagsSet) {
    tags.push(...tagsSet.elements.filter(el => el.type === 'raw').map(el => el.value))
  }

  return {
    ptr,
    title: memberValue(post, 'title'),
    cover: memberValue(post, 'cover'),
    tags
  }
}

/**
 * 批量获取所有文章详情
 *
 * 批量接口全有或全无，因此只批量读取文章对象；
 * 可选的标签集合再逐个读取，空态集合按无标签处理。
 */
export async function batchGetPosts(postPtrs) {
  if (postPtrs.length === 0) return []

  const metaResults = await getObjectsSettled(postPtrs)

  const postDetails = []
  const tagSetReads = []

  metaResults.forEach((result, index) => {
    if (result.status !== 200 || !result.body?.members) {
      postDetails.push(null)
      return
    }

    const post = result.body
    const detail = {
      ptr: postPtrs[index],
      title: memberValue(post, 'title'),
      cover: memberValue(post, 'cover'),
      tags: []
    }

    const tagsPtr = memberValue(post, 'tags')
    if (tagsPtr) {
      tagSetReads.push({ detail, tagsPtr })
    }

    postDetails.push(detail)
  })

  await Promise.all(
    tagSetReads.map(async ({ detail, tagsPtr }) => {
      const tagsSet = await getSetOrNull(tagsPtr)
      if (tagsSet) {
        detail.tags = tagsSet.elements
          .filter(el => el.type === 'raw')
          .map(el => el.value)
      }
    })
  )

  return postDetails
}

/**
 * 批量获取所有标签及其文章数量
 */
export async function batchGetTagsWithCount(tagsPtr) {
  const set = await getSetOrNull(tagsPtr)
  if (!set) return []

  const tagPtrs = set.elements
    .filter(el => el.type === 'object')
    .map(el => el.value)

  if (tagPtrs.length === 0) return []

  const results = await getObjectsSettled(tagPtrs)

  const tagInfos = []

  results.forEach((result, index) => {
    if (result.status !== 200 || !result.body?.members) return

    tagInfos.push({
      ptr: tagPtrs[index],
      name: memberValue(result.body, 'name'),
      postsPtr: memberValue(result.body, 'posts'),
      count: 0
    })
  })

  await Promise.all(
    tagInfos.map(async tagInfo => {
      const postsSet = await getSetOrNull(tagInfo.postsPtr)
      if (postsSet) {
        tagInfo.count = postsSet.elements.length
      }
    })
  )

  return tagInfos
}

/**
 * 加载完整博客数据
 */
export async function loadBlogData() {
  const blogInfo = await getBlogInfo()
  const postPtrs = await getAllPostPtrs(blogInfo.postsPtr)
  const postDetails = await batchGetPosts(postPtrs)

  const formattedPosts = postDetails
    .filter(post => post !== null)
    .map(post => ({
      ...post,
      id: post.ptr,
      cover: getImageUrl(post.cover),
      to: `/blogs/${post.ptr}`
    }))

  const tagsWithCount = await batchGetTagsWithCount(blogInfo.tagsPtr)

  return { posts: formattedPosts, tags: tagsWithCount }
}
