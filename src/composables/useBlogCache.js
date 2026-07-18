/**
 * 博客数据缓存组合式函数
 * 
 * 提供智能缓存策略：
 * - localStorage 持久化缓存
 * - 后台静默刷新
 * - 定时自动刷新
 * - 手动强制刷新
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { getBlogInfo, getAllPostPtrs, batchGetPosts, batchGetTagsWithCount } from '@/api/lmjweb'
import { getImageUrl } from '@/config/blog'

const CACHE_KEY_POSTS = 'blog_cache_posts'
const CACHE_KEY_TAGS = 'blog_cache_tags'
const CACHE_KEY_METADATA = 'blog_cache_metadata'
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 分钟

/**
 * 从 localStorage 读取缓存
 */
function getCache(key) {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    return { data, timestamp }
  } catch (e) {
    console.warn(`Failed to parse cache ${key}:`, e)
    return null
  }
}

/**
 * 将数据写入 localStorage
 */
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn(`Failed to set cache ${key}:`, e)
    // localStorage 可能已满，静默失败
  }
}

/**
 * 清除所有缓存
 */
function clearAllCache() {
  localStorage.removeItem(CACHE_KEY_POSTS)
  localStorage.removeItem(CACHE_KEY_TAGS)
  localStorage.removeItem(CACHE_KEY_METADATA)
}

/**
 * 博客数据缓存管理
 *
 * @param {number} refreshInterval - 自动刷新间隔（毫秒），默认 5 分钟
 * @returns {Object} - 响应式数据和方法
 */
export function useBlogCache(refreshInterval = DEFAULT_REFRESH_INTERVAL) {
  // 响应式数据
  const posts = ref([])
  const tags = ref([])
  const loading = ref(true)
  const tagsLoading = ref(true)
  const refreshing = ref(false) // 后台刷新状态
  const lastUpdated = ref(null) // 最后更新时间
  const error = ref(null) // 错误信息

  // 定时器引用
  let refreshTimer = null
  let hasLoadedOnce = false // 标记是否成功加载过至少一次

  /**
   * 从 API 加载完整数据
   * @param {boolean} forceRefresh - 是否强制刷新（跳过缓存）
   */
  async function loadData(forceRefresh = false) {
    try {
      // 1. 获取博客信息
      const blogInfo = await getBlogInfo(forceRefresh)

      // 验证博客信息
      if (!blogInfo.postsPtr || blogInfo.postsPtr.length !== 34) {
        throw new Error(`Invalid postsPtr: ${blogInfo.postsPtr}`)
      }
      if (!blogInfo.tagsPtr || blogInfo.tagsPtr.length !== 34) {
        throw new Error(`Invalid tagsPtr: ${blogInfo.tagsPtr}`)
      }

      // 2. 获取所有文章指针
      const postPtrs = await getAllPostPtrs(blogInfo.postsPtr)

      // 3. 批量获取所有文章详情
      const postDetails = await batchGetPosts(postPtrs)

      // 4. 过滤并格式化文章数据
      const formattedPosts = postDetails
        .filter(post => post !== null)
        .map(post => ({
          ...post,
          id: post.ptr,
          cover: getImageUrl(post.cover),
          to: `/blogs/${post.ptr}`
        }))

      // 5. 批量获取标签列表及文章数量
      const tagsWithCount = await batchGetTagsWithCount(blogInfo.tagsPtr)

      // 更新响应式数据
      posts.value = formattedPosts
      tags.value = tagsWithCount
      lastUpdated.value = new Date()
      error.value = null
      hasLoadedOnce = true

      // 写入缓存
      setCache(CACHE_KEY_POSTS, formattedPosts)
      setCache(CACHE_KEY_TAGS, tagsWithCount)
      setCache(CACHE_KEY_METADATA, {
        lastUpdated: lastUpdated.value.toISOString(),
        postsPtr: blogInfo.postsPtr,
        tagsPtr: blogInfo.tagsPtr
      })

      return true
    } catch (err) {
      console.error('Failed to load blog data:', err)
      error.value = err.message

      // 尝试从缓存恢复（如果有缓存则不显示错误）
      const cachedPosts = getCache(CACHE_KEY_POSTS)
      const cachedTags = getCache(CACHE_KEY_TAGS)

      if (cachedPosts?.data && cachedTags?.data) {
        // 有缓存：使用缓存数据，不显示错误（后台刷新失败已静默处理）
        posts.value = cachedPosts.data
        tags.value = cachedTags.data
        console.warn('[BlogCache] Load failed, using cached data')
      }
      // 无缓存：保持错误状态，让组件显示错误提示

      return false
    } finally {
      loading.value = false
      tagsLoading.value = false
    }
  }

  /**
   * 后台静默刷新（不显示加载状态）
   */
  async function refreshInBackground() {
    refreshing.value = true
    try {
      await loadData(true)
      console.log('[BlogCache] Background refresh successful at', lastUpdated.value)
    } catch (err) {
      console.warn('[BlogCache] Background refresh failed:', err)
      // 后台刷新失败时不显示错误，保持静默
    } finally {
      refreshing.value = false
    }
  }

  /**
   * 手动强制刷新（显示加载状态）
   */
  async function forceRefresh() {
    loading.value = true
    await loadData(true)
  }

  /**
   * 启动定时刷新
   */
  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer)

    refreshTimer = setInterval(() => {
      refreshInBackground()
    }, refreshInterval)

    console.log(`[BlogCache] Auto refresh started (interval: ${refreshInterval}ms)`)
  }

  /**
   * 停止定时刷新
   */
  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
      console.log('[BlogCache] Auto refresh stopped')
    }
  }

  /**
   * 初始化数据加载
   * - 有缓存：立即使用缓存数据，后台静默刷新
   * - 无缓存：后台异步加载数据，失败时路由到错误页面
   */
  async function init() {
    // 尝试从缓存加载
    const cachedPosts = getCache(CACHE_KEY_POSTS)
    const cachedTags = getCache(CACHE_KEY_TAGS)
    const cachedMetadata = getCache(CACHE_KEY_METADATA)

    if (cachedPosts?.data && cachedTags?.data) {
      // 有缓存：立即使用缓存数据
      posts.value = cachedPosts.data
      tags.value = cachedTags.data
      if (cachedMetadata?.data?.lastUpdated) {
        lastUpdated.value = new Date(cachedMetadata.data.lastUpdated)
      }
      loading.value = false
      tagsLoading.value = false
      console.log('[BlogCache] Loaded from cache at', lastUpdated.value)

      // 后台静默刷新
      refreshInBackground()
    } else {
      // 无缓存：后台异步加载，失败时路由到错误页面
      setTimeout(async () => {
        const success = await loadData()
        if (!success && !cachedPosts?.data) {
          // 无缓存且加载失败，错误信息已设置
          console.error('[BlogCache] Initial load failed, error:', error.value)
        }
      }, 0)
    }

    // 启动定时刷新
    startAutoRefresh()
  }

  // 生命周期管理
  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // 响应式数据
    posts,
    tags,
    loading,
    tagsLoading,
    refreshing,
    lastUpdated,
    error,

    // 方法
    refresh: forceRefresh,        // 手动刷新
    refreshNow: refreshInBackground, // 后台刷新
    clearCache: clearAllCache,    // 清除缓存
    getCache,                     // 读取缓存（供外部使用）
    setCache                      // 写入缓存（供外部使用）
  }
}
