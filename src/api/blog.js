/**
 * 博客 API 服务封装
 *
 * 基于 lmjweb API 的博客数据获取工具方法
 */

import { getImageUrl } from '@/config/blog'
import {
  getBlogInfoPtr,
  batchOperations,
  getSet
} from '@/api/lmjweb'

// ==================== 获取博客信息 ====================

/**
 * 获取博客信息
 */
export async function getBlogInfo() {
  const blogInfoPtr = getBlogInfoPtr()

  const operations = [
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${blogInfoPtr}.title`)}` },
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${blogInfoPtr}.posts`)}` },
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${blogInfoPtr}.tags`)}` }
  ]

  const results = await batchOperations(operations)

  return {
    ptr: blogInfoPtr,
    title: results.results[0].status === 200 ? results.results[0].body.value : '',
    postsPtr: results.results[1].status === 200 ? results.results[1].body.value : '',
    tagsPtr: results.results[2].status === 200 ? results.results[2].body.value : ''
  }
}

/**
 * 获取所有文章指针
 */
export async function getAllPostPtrs(postsPtr) {
  if (!postsPtr || postsPtr.length !== 34) {
    console.error('Invalid postsPtr:', postsPtr)
    return []
  }

  const set = await getSet(postsPtr)
  return set.elements
    .filter(el => el.type === 'ref')
    .map(el => el.value)
}

/**
 * 获取文章详情
 * @param {string} ptr - 文章指针
 * @returns {Promise<{ptr: string, title: string, cover: string, tags: string[]}>}
 */
export async function getPostDetail(ptr) {
  const operations = [
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${ptr}.title`)}` },
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${ptr}.cover`)}` },
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${ptr}.tags`)}` }
  ]

  const results = await batchOperations(operations)

  const tagsPtr = results.results[2].status === 200 ? results.results[2].body.value : null

  const result = {
    ptr,
    title: results.results[0].status === 200 ? results.results[0].body.value : '',
    cover: results.results[1].status === 200 ? results.results[1].body.value : '',
    tags: []
  }

  if (tagsPtr) {
    const tagsSet = await getSet(tagsPtr)
    result.tags = tagsSet.elements
      .filter(el => el.type === 'raw')
      .map(el => el.value)
  }

  return result
}

/**
 * 批量获取所有文章详情
 */
export async function batchGetPosts(postPtrs) {
  if (postPtrs.length === 0) return []

  const metaOperations = postPtrs.flatMap(ptr => [
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${ptr}.title`)}` },
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${ptr}.cover`)}` },
    { method: 'GET', path: `/obj/query/${encodeURIComponent(`${ptr}.tags`)}` }
  ])

  const metaResults = await batchOperations(metaOperations)
  if (!metaResults.success) {
    throw new Error('Failed to batch get posts')
  }

  const postDetails = []
  const tagSetPtrs = []

  for (let i = 0; i < postPtrs.length; i++) {
    const baseIdx = i * 3
    const titleResult = metaResults.results[baseIdx]
    const coverResult = metaResults.results[baseIdx + 1]
    const tagsResult = metaResults.results[baseIdx + 2]

    if (titleResult.status !== 200) {
      postDetails.push(null)
      continue
    }

    const detail = {
      ptr: postPtrs[i],
      title: titleResult.body.value,
      cover: coverResult.status === 200 ? coverResult.body.value : '',
      tags: []
    }

    if (tagsResult.status === 200 && tagsResult.body.value) {
      tagSetPtrs.push({ idx: i, tagsPtr: tagsResult.body.value })
    }

    postDetails.push(detail)
  }

  if (tagSetPtrs.length > 0) {
    const tagOperations = tagSetPtrs.map(t => ({
      method: 'GET',
      path: `/set/${t.tagsPtr}`
    }))
    const tagResults = await batchOperations(tagOperations)

    if (tagResults.success) {
      postDetails.forEach((detail, detailIdx) => {
        if (!detail) return
        const tagSetInfo = tagSetPtrs.find(t => t.idx === detailIdx)
        if (tagSetInfo) {
          const tagResult = tagResults.results[tagSetPtrs.indexOf(tagSetInfo)]
          if (tagResult.status === 200) {
            detail.tags = tagResult.body.elements
              .filter(el => el.type === 'raw')
              .map(el => el.value)
          }
        }
      })
    }
  }

  return postDetails
}

/**
 * 批量获取所有标签及其文章数量
 */
export async function batchGetTagsWithCount(tagsPtr) {
  const set = await getSet(tagsPtr)
  const tagPtrs = set.elements
    .filter(el => el.type === 'ref')
    .map(el => el.value)

  if (tagPtrs.length === 0) return []

  const operations = tagPtrs.flatMap(ptr => [
    { method: 'GET', path: `/obj/${ptr}/name` },
    { method: 'GET', path: `/obj/${ptr}/posts` }
  ])

  const results = await batchOperations(operations)
  if (!results.success) {
    throw new Error('Failed to batch get tags')
  }

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
