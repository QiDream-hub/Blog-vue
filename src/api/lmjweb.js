/**
 * lmjweb API 服务封装
 *
 * 提供对 lmjweb 元数据服务的通用操作（只读）
 */

import { getConfig } from '@/config/blog'

/**
 * 获取 API 基础 URL
 */
export function getApiUrl() {
  const config = getConfig()
  return config.LMJWEB_API
}

/**
 * 获取博客信息对象指针
 */
export function getBlogInfoPtr() {
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
  const response = await fetch(`${getApiUrl()}/obj/query/${encodeURIComponent(path)}`)
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
 * 使用只读事务，仅允许 GET 操作，保证读取一致性。为了兼容性使用 POST 方法提交操作列表，在 nginx 中配置将 POST /batch 转发到 GET /batch
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
