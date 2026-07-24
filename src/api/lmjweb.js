/**
 * lmjweb API 服务封装
 *
 * 提供对 lmjweb 元数据服务的通用操作（支持读写）
 */

import { getConfig } from '../config/blog.js'

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

// ==================== 对象操作 ====================

/**
 * 创建空对象
 * @returns {Promise<{ptr: string}>}
 */
export async function createObject() {
  const response = await fetch(`${getApiUrl()}/obj`, { method: 'POST' })
  return response.json()
}

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
 * 设置对象成员值
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 * @param {string} value - 成员值
 * @param {'raw' | 'ref'} type - 值类型
 */
export async function setObjectMember(ptr, member, value, type = 'raw') {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}/${member}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value, type })
  })
  if (!response.ok) {
    throw new Error(`设置成员失败：${response.statusText}`)
  }
  return response.json()
}

/**
 * 删除对象成员
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 */
export async function deleteObjectMember(ptr, member) {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}/${member}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error(`删除成员失败：${response.statusText}`)
  }
  return response.json()
}

/**
 * 删除完整对象
 * @param {string} ptr - 对象指针
 */
export async function deleteObject(ptr) {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error(`删除对象失败：${response.statusText}`)
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

// ==================== 集合操作 ====================

/**
 * 创建空集合
 * @returns {Promise<{ptr: string}>}
 */
export async function createSet() {
  const response = await fetch(`${getApiUrl()}/set`, { method: 'POST' })
  return response.json()
}

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

/**
 * 添加集合元素
 * @param {string} ptr - 集合指针
 * @param {string} value - 元素值
 */
export async function addSetElement(ptr, value) {
  const response = await fetch(`${getApiUrl()}/set/${ptr}/elements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  })
  if (!response.ok) {
    throw new Error(`添加元素失败：${response.statusText}`)
  }
  return response.json()
}

/**
 * 删除集合元素
 * @param {string} ptr - 集合指针
 * @param {string} value - 元素值
 */
export async function removeSetElement(ptr, value) {
  const response = await fetch(`${getApiUrl()}/set/${ptr}/elements`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  })
  if (!response.ok) {
    throw new Error(`删除元素失败：${response.statusText}`)
  }
  return response.json()
}

/**
 * 删除完整集合
 * @param {string} ptr - 集合指针
 */
export async function deleteSet(ptr) {
  const response = await fetch(`${getApiUrl()}/set/${ptr}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error(`删除集合失败：${response.statusText}`)
  }
  return response.json()
}

// ==================== 批量操作 ====================

/**
 * 批量执行操作（支持读写）
 * @param {Array<{method: string, path: string, body?: object}>} operations - 操作列表
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

/**
 * 批量 GET 操作（只读查询）
 * @param {Array<{method: string, path: string}>} operations - 操作列表（仅 GET）
 * @returns {Promise<{success: boolean, results: Array<{status: number, body: any}>}>}
 */
export async function batchGet(operations) {
  const response = await fetch(`${getApiUrl()}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operations })
  })
  return response.json()
}
