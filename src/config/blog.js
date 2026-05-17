/**
 * 博客配置文件
 * 
 * 使用前需要将 lmjweb 中的博客信息对象指针填入 BLOG_INFO_PTR
 */

export const BLOG_CONFIG = {
  /**
   * lmjweb API 地址
   */
  LMJWEB_API: 'http://localhost:8080',
  
  /**
   * 博客信息对象指针
   * 需要在 lmjweb 中创建博客信息对象后，将指针填入此处
   * 格式：01 开头的 34 位十六进制字符串
   */
  BLOG_INFO_PTR: '0100000000000000000000000000000001',
  
  /**
   * 图片访问基础路径 (Nginx 代理)
   */
  IMAGE_BASE: '/img/',
  
  /**
   * 文章内容访问基础路径 (Nginx 代理)
   */
  ARTICLE_BASE: '/article/'
}

/**
 * 生成图片 URL
 * @param {string} ptr - 图片对象指针
 * @returns {string} 图片 URL
 */
export function getImageUrl(ptr) {
  if (!ptr) return ''
  return `${BLOG_CONFIG.IMAGE_BASE}${ptr}`
}

/**
 * 生成文章内容 URL
 * @param {string} ptr - 文章对象指针
 * @returns {string} 文章内容 URL
 */
export function getArticleUrl(ptr) {
  if (!ptr) return ''
  return `${BLOG_CONFIG.ARTICLE_BASE}${ptr}`
}
