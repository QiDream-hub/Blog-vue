/**
 * 博客卡片数据缓存管理
 *
 * 基于 localStorage 的卡片数据读写：
 * - 从 lmjweb API 请求新数据并写入 localStorage
 * - 从 localStorage 读取卡片数据
 */

import { loadBlogData } from '@/api/blog'

// ==================== localStorage 键 ====================

const STORAGE_KEY_POSTS = 'blog_cards_posts'
const STORAGE_KEY_TAGS = 'blog_cards_tags'

// ==================== localStorage 读写工具 ====================

/**
 * 从 localStorage 读取数据
 * @param {string} key - 存储键
 * @returns {any|null}
 */
function readFromStorage(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage:`, e)
    return null
  }
}

/**
 * 向 localStorage 写入数据
 * @param {string} key - 存储键
 * @param {any} value - 要存储的值
 */
function writeToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`Failed to write ${key} to localStorage:`, e)
  }
}

// ==================== 公开 API ====================

/**
 * 从 localStorage 读取卡片数据
 * @returns {{ posts: Array, tags: Array }}
 */
export function getCards() {
  const posts = readFromStorage(STORAGE_KEY_POSTS) || []
  const tags = readFromStorage(STORAGE_KEY_TAGS) || []

  return { posts, tags }
}

/**
 * 从 lmjweb API 请求新数据并更新 localStorage
 * @returns {Promise<{ posts: Array, tags: Array}>}
 */
export async function refreshCards() {
  const { posts, tags } = await loadBlogData()

  // 写入 localStorage
  writeToStorage(STORAGE_KEY_POSTS, posts)
  writeToStorage(STORAGE_KEY_TAGS, tags)

  return { posts, tags }
}

/**
 * 清除 localStorage 中的卡片数据
 */
export function clearCards() {
  localStorage.removeItem(STORAGE_KEY_POSTS)
  localStorage.removeItem(STORAGE_KEY_TAGS)
}
