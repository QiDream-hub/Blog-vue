/**
 * 博客配置文件
 *
 * 配置从 /blog.config.json 动态加载
 * 打包时该文件会独立输出到 dist/blog.config.json，可独立修改
 */

let config = null
let configPromise = null

/**
 * 初始化配置（在应用启动时调用）
 * @returns {Promise<void>}
 */
export async function initConfig() {
  if (config) return
  if (!configPromise) {
    configPromise = fetch('/blog.config.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('配置文件加载失败')
        }
        return res.json()
      })
      .then(data => {
        config = data
        return data
      })
  }
  await configPromise
}

/**
 * 获取配置对象
 * @returns {object} 配置对象
 */
export function getConfig() {
  if (!config) {
    throw new Error('配置未初始化，请先调用 initConfig()')
  }
  return config
}

/**
 * 生成图片 URL
 * @param {string} ptr - 图片对象指针
 * @returns {string} 图片 URL
 */
export function getImageUrl(ptr) {
  if (!ptr) return ''
  if (!config) {
    throw new Error('配置未初始化')
  }
  return `${config.IMAGE_BASE}${ptr}`
}

/**
 * 生成文章内容 URL
 * @param {string} ptr - 文章对象指针
 * @returns {string} 文章内容 URL
 */
export function getArticleUrl(ptr) {
  if (!ptr) return ''
  if (!config) {
    throw new Error('配置未初始化')
  }
  return `${config.ARTICLE_BASE}${ptr}`
}

// 同步导出，供 initConfig 之前使用
export const LMJWEB_API = 'http://localhost:8080'
export const BLOG_INFO_PTR = '0100000000000000000000000000000001'
export const IMAGE_BASE = '/img/'
export const ARTICLE_BASE = '/article/'
