// ThemeManager.js - 统一主题管理器
// 所有主题都存储到 localStorage 的数组中
// 提供主题的加载、切换、持久化、删除功能

// 主题变更事件名
export const THEME_CHANGE_EVENT = 'theme-change'

// 创建全局事件目标，用于在应用内广播主题变更
const themeEventTarget = new EventTarget()

/**
 * 监听主题变更
 * @param {Function} callback - 回调函数，接收 { themeKey, themes } 参数
 * @returns {Function} 取消监听函数
 */
export function onThemeChange(callback) {
  const handler = (e) => callback(e.detail)
  themeEventTarget.addEventListener(THEME_CHANGE_EVENT, handler)
  return () => {
    themeEventTarget.removeEventListener(THEME_CHANGE_EVENT, handler)
  }
}

/**
 * 触发主题变更事件
 * @param {string} themeKey - 当前主题 key
 */
function dispatchThemeChange(themeKey) {
  const themes = getThemes()
  themeEventTarget.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, {
    detail: { themeKey, themes }
  }))
  // 同时触发 storage 事件，支持跨标签页同步
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'currentTheme',
    newValue: themeKey
  }))
}

// 默认主题定义（首次使用时写入 localStorage）
const DEFAULT_THEMES = [
  {
    key: 'sakura',
    name: '樱花粉',
    icon: '🌸',
    variables: {
      // --- 核心配色 ---
      '--primary-color': '#ff7aae',
      '--secondary-color': '#5d8aa8',
      '--bg-color': '#ffffff',
      '--bg-secondary-color': '#fafafa',
      '--text-color': '#333333',
      '--text-secondary-color': '#555555',

      // --- 状态色 ---
      '--selected-color': '#ff5c9d',
      '--selected-bg-color': 'rgba(255, 158, 181, 0.1)',
      '--hover-bg-color': 'rgba(255, 158, 181, 0.08)',

      // --- 功能色 ---
      '--meta-color': '#999999',
      '--description-color': '#6a8ba8',
      '--border-color': 'rgba(93, 138, 168, 0.15)',
      '--border-light-color': 'rgba(93, 138, 168, 0.1)',
      '--tag-bg-color': 'rgba(255, 158, 181, 0.15)',
      '--tag-text-color': '#ff7aae',

      // --- 阴影 ---
      '--shadow-sm': '0 1px 3px rgba(93, 138, 168, 0.08)',
      '--shadow-md': '0 4px 12px rgba(93, 138, 168, 0.12)',
      '--shadow-lg': '0 6px 20px rgba(93, 138, 168, 0.18)',
      '--shadow-primary': '0 4px 16px rgba(255, 122, 174, 0.3)',

      // --- 动画变量 ---
      '--anim-duration': '0.3s',
      '--anim-easing': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      '--anim-translate-y': '20px',
      '--transition-bg-color': 'background-color 0.3s ease',
      '--transition-base': 'all 0.3s ease',
      '--transition-shadow': 'box-shadow 0.3s ease',
      '--transition-transform': 'transform 0.3s ease'
    }
  },

  {
    key: 'midnight',
    name: '午夜蓝',
    icon: '🌙',
    variables: {
      // --- 核心配色 ---
      '--primary-color': '#ff8fb8',
      '--secondary-color': '#7ab8e8',
      '--bg-color': '#1a1a2e',
      '--bg-secondary-color': '#16213e',
      '--text-color': '#e8e8e8',
      '--text-secondary-color': '#c0c0c0',

      // --- 状态色 ---
      '--selected-color': '#ff6b9d',
      '--selected-bg-color': 'rgba(255, 143, 184, 0.15)',
      '--hover-bg-color': 'rgba(255, 143, 184, 0.1)',

      // --- 功能色 ---
      '--meta-color': '#888888',
      '--description-color': '#7ab8e8',
      '--border-color': 'rgba(122, 184, 232, 0.2)',
      '--border-light-color': 'rgba(122, 184, 232, 0.1)',
      '--tag-bg-color': 'rgba(255, 143, 184, 0.2)',
      '--tag-text-color': '#ff8fb8',

      // --- 阴影 ---
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.2)',
      '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.3)',
      '--shadow-lg': '0 6px 20px rgba(0, 0, 0, 0.4)',
      '--shadow-primary': '0 4px 16px rgba(255, 143, 184, 0.25)',

      // --- 动画变量 ---
      '--anim-duration': '0.3s',
      '--anim-easing': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      '--anim-translate-y': '20px',
      '--transition-bg-color': 'background-color 0.3s ease',
      '--transition-base': 'all 0.3s ease',
      '--transition-shadow': 'box-shadow 0.3s ease',
      '--transition-transform': 'transform 0.3s ease'
    }
  },

  {
    key: 'forest',
    name: '森林绿',
    icon: '🌲',
    variables: {
      // --- 核心配色 ---
      "--primary-color": "#6fbf4c",
      "--secondary-color": "#8bc6a5",
      "--bg-color": "#1e2a24",
      "--bg-secondary-color": "#2a3a32",
      "--text-color": "#e2f0e6",
      "--text-secondary-color": "#bdd6c4",

      // --- 状态色 ---
      "--selected-color": "#7ed56f",
      "--selected-bg-color": "rgba(111, 191, 76, 0.18)",
      "--hover-bg-color": "rgba(111, 191, 76, 0.1)",

      // --- 功能色 ---
      "--meta-color": "#8aa89a",
      "--description-color": "#9bc4ab",
      "--border-color": "rgba(139, 198, 165, 0.25)",
      "--border-light-color": "rgba(139, 198, 165, 0.12)",
      "--tag-bg-color": "rgba(111, 191, 76, 0.2)",
      "--tag-text-color": "#8fda6b",

      // --- 阴影 ---
      "--shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.25)",
      "--shadow-md": "0 4px 12px rgba(0, 0, 0, 0.35)",
      "--shadow-lg": "0 6px 20px rgba(0, 0, 0, 0.45)",
      "--shadow-primary": "0 4px 16px rgba(111, 191, 76, 0.3)",

      // --- 动画变量 ---
      "--anim-duration": "0.3s",
      "--anim-easing": "cubic-bezier(0.25, 0.8, 0.25, 1)",
      "--anim-translate-y": "20px",
      "--transition-bg-color": "background-color 0.3s ease",
      "--transition-base": "all 0.3s ease",
      "--transition-shadow": "box-shadow 0.3s ease",
      "--transition-transform": "transform 0.3s ease"
    }
  },

  {
    key: 'sunset',
    name: '落日橙',
    icon: '🌅',
    variables: {
      // --- 核心配色 ---
      '--primary-color': '#ff8a5c',
      '--secondary-color': '#e8b87a',
      '--bg-color': '#fffbf7',
      '--bg-secondary-color': '#fff9f2',
      '--text-color': '#3d2a1f',
      '--text-secondary-color': '#5a4a3f',

      // --- 状态色 ---
      '--selected-color': '#ff6b3d',
      '--selected-bg-color': 'rgba(255, 138, 92, 0.12)',
      '--hover-bg-color': 'rgba(255, 138, 92, 0.08)',

      // --- 功能色 ---
      '--meta-color': '#998877',
      '--description-color': '#c9985a',
      '--border-color': 'rgba(232, 184, 122, 0.2)',
      '--border-light-color': 'rgba(232, 184, 122, 0.1)',
      '--tag-bg-color': 'rgba(255, 138, 92, 0.15)',
      '--tag-text-color': '#ff8a5c',

      // --- 阴影 ---
      '--shadow-sm': '0 1px 3px rgba(232, 184, 122, 0.08)',
      '--shadow-md': '0 4px 12px rgba(232, 184, 122, 0.12)',
      '--shadow-lg': '0 6px 20px rgba(232, 184, 122, 0.18)',
      '--shadow-primary': '0 4px 16px rgba(255, 138, 92, 0.25)',

      // --- 动画变量 ---
      '--anim-duration': '0.3s',
      '--anim-easing': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      '--anim-translate-y': '20px',
      '--transition-bg-color': 'background-color 0.3s ease',
      '--transition-base': 'all 0.3s ease',
      '--transition-shadow': 'box-shadow 0.3s ease',
      '--transition-transform': 'transform 0.3s ease'
    }
  }
]

const DEFAULT_THEME_KEY = 'sakura'
const THEMES_STORAGE_KEY = 'app-themes'
const CURRENT_THEME_KEY = 'app-theme'

// 内部工具函数
const getThemes = () => {
  const stored = localStorage.getItem(THEMES_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('主题数据损坏，恢复为默认主题', e)
      const themes = [...DEFAULT_THEMES]
      localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes))
      return themes
    }
  }
  const themes = [...DEFAULT_THEMES]
  localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes))
  return themes
}

const saveThemes = (themes) => {
  localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes))
}

/**
 *  获取主题元信息（不包含变量）
 * @param {string} themeKey - 主题 key
 * @returns {Object|null} 主题元信息 {name, icon}
 */
export function getThemeMeta(themeKey) {
  const theme = getThemes().find(t => t.key === themeKey)
  if (!theme) {
    console.warn(`Theme "${themeKey}" not found`)
    return null
  }
  return { name: theme.name, icon: theme.icon }
}

/**
 * 应用主题到页面
 * @param {string} themeKey - 主题 key
 */
export function applyTheme(themeKey) {
  const themes = getThemes()
  const theme = themes.find(t => t.key === themeKey)

  if (!theme) {
    console.warn(`Theme "${themeKey}" not found`)
    return
  }

  Object.entries(theme.variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
}

/**
 * 初始化主题
 * @returns {string} 当前主题 key
 */
export function initTheme() {
  const allThemes = getThemes()
  const savedTheme = localStorage.getItem(CURRENT_THEME_KEY)

  if (savedTheme && allThemes.some(t => t.key === savedTheme)) {
    applyTheme(savedTheme)
    return savedTheme
  }

  if (allThemes.some(t => t.key === DEFAULT_THEME_KEY)) {
    applyTheme(DEFAULT_THEME_KEY)
    return DEFAULT_THEME_KEY
  }

  if (allThemes.length > 0) {
    applyTheme(allThemes[0].key)
    return allThemes[0].key
  }

  console.error('没有任何可用主题')
  return ''
}

/**
 * 获取当前主题 key
 * @returns {string} 当前主题 key
 */
export function getCurrentTheme() {
  return localStorage.getItem(CURRENT_THEME_KEY) || DEFAULT_THEME_KEY
}

/**
 * 设置主题并持久化
 * @param {string} themeKey - 主题 key
 */
export function setTheme(themeKey) {
  const themes = getThemes()
  if (!themes.some(t => t.key === themeKey)) {
    console.warn(`Theme "${themeKey}" does not exist`)
    return
  }

  localStorage.setItem(CURRENT_THEME_KEY, themeKey)
  applyTheme(themeKey)
  dispatchThemeChange(themeKey)
}

/**
 * 获取所有可用的主题元信息
 * @returns {Object} 主题元信息对象
 */
export function getAvailableThemes() {
  const themes = getThemes()
  return Object.fromEntries(
    themes.map(theme => [theme.key, { name: theme.name, icon: theme.icon }])
  )
}

/**
 * 获取完整主题数据（包含变量）
 * @param {string} themeKey - 主题 key
 * @returns {Object|null} 主题完整数据
 */
export function getThemeData(themeKey) {
  return getThemes().find(t => t.key === themeKey) || null
}

/**
 * 保存主题（新增或更新）
 * @param {string} themeKey - 主题 key
 * @param {Object} themeData - 主题数据 {name, icon, variables}
 */
export function saveTheme(themeKey, themeData) {
  const themes = getThemes()
  const existingIndex = themes.findIndex(t => t.key === themeKey)

  const newTheme = {
    key: themeKey,
    name: themeData.name,
    icon: themeData.icon,
    variables: { ...themeData.variables }
  }

  if (existingIndex >= 0) {
    themes[existingIndex] = newTheme
  } else {
    themes.push(newTheme)
  }

  saveThemes(themes)
  dispatchThemeChange(getCurrentTheme())
}

/**
 * 删除主题
 * @param {string} themeKey - 主题 key
 * @returns {boolean} 是否删除成功
 */
export function deleteTheme(themeKey) {
  const themes = getThemes()
  const existingIndex = themes.findIndex(t => t.key === themeKey)

  if (existingIndex < 0) {
    return false
  }

  themes.splice(existingIndex, 1)
  saveThemes(themes)

  if (localStorage.getItem(CURRENT_THEME_KEY) === themeKey) {
    setTheme(DEFAULT_THEME_KEY)
  } else {
    dispatchThemeChange(getCurrentTheme())
  }

  return true
}

/**
 * 获取所有主题数组
 * @returns {Array} 主题数组
 */
export function getAllThemes() {
  return getThemes()
}

/**
 * 重置所有主题为默认值
 * @returns {Array} 恢复后的主题数组
 */
export function resetAllThemes() {
  const themes = [...DEFAULT_THEMES]
  saveThemes(themes)
  dispatchThemeChange(getCurrentTheme())
  return themes
}

/**
 * 导出所有主题为 JSON 字符串
 * @returns {string} JSON 格式的主题数据
 */
export function exportThemes() {
  const themes = getThemes()
  const currentTheme = getCurrentTheme()
  const exportData = {
    version: '1.0',
    exportTime: Date.now(),
    currentTheme,
    themes
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * 从 JSON 字符串导入主题
 * @param {string} jsonStr - JSON 格式的主题数据
 * @returns {Object} 导入结果 {success: boolean, message: string, importedCount: number}
 */
export function importThemes(jsonStr) {
  try {
    const importData = JSON.parse(jsonStr)

    // 验证数据格式
    if (!importData.version || !Array.isArray(importData.themes)) {
      return {
        success: false,
        message: '无效的导入数据格式：缺少 version 或 themes 字段'
      }
    }

    const currentThemes = getThemes()
    const importedThemes = importData.themes

    // 合并主题（导入的主题覆盖现有主题）
    const themeMap = new Map(currentThemes.map(t => [t.key, t]))
    let importedCount = 0

    for (const theme of importedThemes) {
      if (!theme.key || !theme.name || !theme.variables) {
        continue
      }
      themeMap.set(theme.key, theme)
      importedCount++
    }

    const mergedThemes = Array.from(themeMap.values())
    saveThemes(mergedThemes)

    // 如果导入数据中指定了当前主题，且该主题存在，则切换过去
    if (importData.currentTheme && mergedThemes.some(t => t.key === importData.currentTheme)) {
      setTheme(importData.currentTheme)
    }

    return {
      success: true,
      message: `成功导入 ${importedCount} 个主题`,
      importedCount
    }
  } catch (e) {
    return {
      success: false,
      message: `导入失败：${e.message}`
    }
  }
}
