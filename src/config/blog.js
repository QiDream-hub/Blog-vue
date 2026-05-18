/**
 * 博客配置模块
 *
 * 配置从 index.html 中的 <script id="blog-config"> 标签读取
 * 打包后修改 dist/index.html 中的配置内容即可，无需重新构建
 */
let config = null

/**
 * 从 index.html 读取配置（同步）
 */
function loadConfigFromHTML() {
  const script = document.getElementById('blog-config')
  if (!script) {
    throw new Error('未找到配置标签 <script id="blog-config">')
  }
  try {
    return JSON.parse(script.textContent.trim())
  } catch (e) {
    throw new Error('配置文件解析失败：' + e.message)
  }
}

/**
 * 初始化配置（应用启动时调用）
 * @returns {object} 配置对象
 */
export function initConfig() {
  if (!config) {
    config = loadConfigFromHTML()
  }
  return config
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
 * @param {string} ptr - 图片指针
 * @returns {string} 图片 URL
 */
export function getImageUrl(ptr) {
  if (!ptr) return ''
  if (!config) throw new Error('配置未初始化')
  return `${config.IMAGE_BASE}${ptr}`
}

/**
 * 生成文章内容 URL
 * @param {string} ptr - 文章指针
 * @returns {string} 文章 URL
 */
export function getArticleUrl(ptr) {
  if (!ptr) return ''
  if (!config) throw new Error('配置未初始化')
  return `${config.ARTICLE_BASE}${ptr}`
}
