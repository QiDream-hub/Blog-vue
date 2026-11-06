/**
 * lmjweb API 服务封装
 *
 * 对应 LMJCore-Web 1.3.x 契约（docs/lmjcore-web/API_REFERENCE.md）：
 * - 写类型：raw / ref / null（不自动推断，必须显式声明）
 * - 读类型：raw / object / set / null
 * - 链式查询：GET /obj/query?path=<ptr>.<member>...
 * - 批量操作全有或全无
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
 * 对单段路径做 URL 编码；成员名中的字面 `.` 需要写成 `%2E`
 * @param {string|number} segment
 * @returns {string}
 */
function encodePathSegment(segment) {
  return encodeURIComponent(String(segment)).replace(/\./g, '%2E')
}

/**
 * 构造链式查询路径（各段分别编码后以 `.` 连接）
 * @param {string} ptr - 根对象指针
 * @param {...string} members - 成员名列表
 * @returns {string}
 */
export function buildQueryPath(ptr, ...members) {
  return [ptr, ...members].map(encodePathSegment).join('.')
}

/**
 * 解析错误响应（保留 error / at / segment / found / limit 等定位字段）
 * @param {Response} response
 * @param {string} fallback
 * @returns {Promise<Error>}
 */
async function buildApiError(response, fallback) {
  const error = new Error(fallback)
  error.status = response.status
  try {
    const body = await response.json()
    if (body) {
      error.message = body.error || fallback
      error.details = body
    }
  } catch {
    // 响应体不是 JSON 时保留状态码与默认消息
  }
  return error
}

/**
 * 读取成功响应 JSON，失败时抛出带详情字段的错误
 */
async function readJson(response, fallback) {
  if (!response.ok) {
    throw await buildApiError(response, fallback)
  }
  return response.json()
}

/**
 * 将值规范化为 API 要求字符串（null 类型的 value 会被服务端忽略，但仍须为字符串）
 * @param {*} value
 * @returns {string}
 */
function toValueString(value) {
  return value == null ? '' : String(value)
}

/**
 * 检查指针是否已实化（exist: false 表示空态，不代表指针无效）
 * @param {string} ptr - 要检查的指针
 * @returns {Promise<{exist: boolean, type?: 'object' | 'set'}>}
 */
export async function checkPtrExist(ptr) {
  const response = await fetch(`${getApiUrl()}/ptr/${ptr}/exist`)
  return readJson(response, 'Failed to check pointer')
}

/**
 * 健康检查
 * @returns {Promise<{status: string, uptime: number}>}
 */
export async function healthCheck() {
  const response = await fetch(`${getApiUrl()}/health`)
  return readJson(response, 'Health check failed')
}

// ==================== 对象操作 ====================

/**
 * 分配对象指针（空态，不写入存储）
 * @returns {Promise<{ptr: string}>}
 */
export async function createObject() {
  const response = await fetch(`${getApiUrl()}/obj`, { method: 'POST' })
  return readJson(response, 'Failed to create object')
}

/**
 * 分配对象指针并填充成员（原子操作，支持嵌套）
 * @param {object} members - 直接的对象映射，如 { name: 'Alice', profile: { city: '北京' } }
 * @returns {Promise<{ptr: string, member_count: number}>}
 */
export async function initObject(members = {}) {
  const response = await fetch(`${getApiUrl()}/obj/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(members)
  })
  return readJson(response, 'Failed to init object')
}

/**
 * 获取完整对象
 * @param {string} ptr - 对象指针
 * @returns {Promise<{ptr: string, members: Array<{name: string, value: string, type: 'raw' | 'object' | 'set' | 'null'}>, count: number}>}
 */
export async function getObject(ptr) {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}`)
  return readJson(response, 'Object not found')
}

/**
 * 获取对象成员值
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 * @returns {Promise<{member: string, value: string, type: 'raw' | 'object' | 'set' | 'null'}>}
 */
export async function getObjectMember(ptr, member) {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}/${encodePathSegment(member)}`)
  return readJson(response, 'Member not found')
}

/**
 * 设置对象成员值
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 * @param {string} value - 成员值（ref 时必须为 34 位十六进制指针）
 * @param {'raw' | 'ref' | 'null'} type - 值类型，不自动推断
 */
export async function setObjectMember(ptr, member, value, type = 'raw') {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}/${encodePathSegment(member)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: toValueString(value), type })
  })
  return readJson(response, 'Failed to set member')
}

/**
 * 删除对象成员
 * 注意：删除最后一个成员后指针回到空态（仍然有效），可再次写入实化
 * @param {string} ptr - 对象指针
 * @param {string} member - 成员名
 */
export async function deleteObjectMember(ptr, member) {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}/${encodePathSegment(member)}`, {
    method: 'DELETE'
  })
  return readJson(response, 'Failed to delete member')
}

/**
 * 清空对象内容（指针回到空态，仍然有效）
 * @param {string} ptr - 对象指针
 */
export async function deleteObject(ptr) {
  const response = await fetch(`${getApiUrl()}/obj/${ptr}`, { method: 'DELETE' })
  return readJson(response, 'Failed to delete object')
}

/**
 * 链式查询对象成员（深度访问，返回单个叶子值）
 * @param {string} ptr - 根对象指针
 * @param {...string} members - 成员名列表
 * @returns {Promise<{path: string, value: string, type: 'raw' | 'object' | 'set' | 'null'}>}
 */
export async function queryObjectPath(ptr, ...members) {
  const path = buildQueryPath(ptr, ...members)
  const response = await fetch(`${getApiUrl()}/obj/query?path=${path}`)
  return readJson(response, 'Query failed')
}

// ==================== 集合操作 ====================

/**
 * 分配集合指针（空态，不写入存储）
 * @returns {Promise<{ptr: string}>}
 */
export async function createSet() {
  const response = await fetch(`${getApiUrl()}/set`, { method: 'POST' })
  return readJson(response, 'Failed to create set')
}

/**
 * 分配集合指针并填充元素（原子操作，支持嵌套）
 * @param {Array<*>} elements - 直接的元素数组
 * @returns {Promise<{ptr: string, element_count: number}>}
 */
export async function initSet(elements = []) {
  const response = await fetch(`${getApiUrl()}/set/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(elements)
  })
  return readJson(response, 'Failed to init set')
}

/**
 * 获取完整集合
 * @param {string} ptr - 集合指针
 * @returns {Promise<{ptr: string, elements: Array<{value: string, type: 'raw' | 'object' | 'set' | 'null'}>, count: number}>}
 */
export async function getSet(ptr) {
  const response = await fetch(`${getApiUrl()}/set/${ptr}`)
  return readJson(response, 'Set not found')
}

/**
 * 添加集合元素
 * @param {string} ptr - 集合指针
 * @param {string} value - 元素值（ref 时必须为 34 位十六进制指针）
 * @param {'raw' | 'ref' | 'null'} type - 元素类型，不自动推断
 */
export async function addSetElement(ptr, value, type = 'raw') {
  const response = await fetch(`${getApiUrl()}/set/${ptr}/elements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: toValueString(value), type })
  })
  return readJson(response, 'Failed to add element')
}

/**
 * 删除集合元素
 * 注意：删除最后一个元素后指针回到空态（仍然有效），可再次写入实化
 * @param {string} ptr - 集合指针
 * @param {string} value - 元素值（ref 时必须为 34 位十六进制指针）
 * @param {'raw' | 'ref' | 'null'} type - 元素类型，不自动推断
 */
export async function removeSetElement(ptr, value, type = 'raw') {
  const response = await fetch(`${getApiUrl()}/set/${ptr}/elements`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: toValueString(value), type })
  })
  return readJson(response, 'Failed to remove element')
}

/**
 * 清空集合内容（指针回到空态，仍然有效）
 * @param {string} ptr - 集合指针
 */
export async function deleteSet(ptr) {
  const response = await fetch(`${getApiUrl()}/set/${ptr}`, { method: 'DELETE' })
  return readJson(response, 'Failed to delete set')
}

// ==================== 批量操作 ====================

/**
 * 批量执行操作（POST /batch，写事务）
 * 所有操作在同一事务内执行，任一操作失败则整批回滚。
 *
 * @param {Array<{
 *   method: 'GET' | 'PUT' | 'POST' | 'DELETE',
 *   path: string,
 *   body?: any,
 *   vars?: Record<string, string>
 * }>} operations - 操作列表（最多 1000 个）
 * @returns {Promise<{success: boolean, results?: Array<{status: number, body: any}>, failed_at?: number, details?: object}>}
 */
export async function batchOperations(operations) {
  const response = await fetch(`${getApiUrl()}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operations })
  })

  // 批量失败统一返回 400 信封；超时为 408，均需要把 body 交给调用方判断
  try {
    return await response.json()
  } catch {
    return {
      success: false,
      details: { error: response.statusText || 'Batch request failed' }
    }
  }
}

/**
 * 批量只读查询
 *
 * 浏览器 fetch/XHR 无法为 GET 请求附加 body，因此这里使用 POST /batch；
 * 服务端同样允许在写事务批次中执行纯 GET 操作，读取语义不变。
 *
 * @param {Array<{method: 'GET', path: string, vars?: Record<string, string>}>} operations
 * @returns {Promise<{success: boolean, results?: Array<{status: number, body: any}>, failed_at?: number, details?: object}>}
 */
export async function batchGet(operations) {
  return batchOperations(operations)
}
