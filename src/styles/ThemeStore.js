// ThemeStore.js - 主题管理逻辑
// 负责主题的加载、切换、持久化

import { themes, defaultThemeKey } from './themes.js'

const THEME_STORAGE_KEY = 'app-theme'

/**
 * 应用主题到页面
 * 通过设置 CSS 变量的方式实现主题切换
 * @param {string} themeKey - 主题 key
 */
export function applyTheme(themeKey) {
  const theme = themes[themeKey]
  
  if (!theme) {
    console.warn(`Theme "${themeKey}" not found, using default theme`)
    applyTheme(defaultThemeKey)
    return
  }

  // 批量设置 CSS 变量
  Object.entries(theme.variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
}

/**
 * 初始化主题
 * 从 localStorage 读取用户上次选择的主题，如果没有则使用默认主题
 * @returns {string} 当前主题 key
 */
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  
  if (savedTheme && themes[savedTheme]) {
    applyTheme(savedTheme)
    return savedTheme
  }
  
  applyTheme(defaultThemeKey)
  return defaultThemeKey
}

/**
 * 获取当前主题 key
 * @returns {string} 当前主题 key
 */
export function getCurrentTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || defaultThemeKey
}

/**
 * 设置主题并持久化
 * @param {string} themeKey - 主题 key
 */
export function setTheme(themeKey) {
  if (!themes[themeKey]) {
    console.warn(`Theme "${themeKey}" does not exist`)
    return
  }
  
  localStorage.setItem(THEME_STORAGE_KEY, themeKey)
  applyTheme(themeKey)
}

/**
 * 获取所有可用的主题元信息
 * @returns {Object} 主题元信息对象
 */
export function getAvailableThemes() {
  return Object.fromEntries(
    Object.entries(themes).map(([key, theme]) => [
      key,
      { name: theme.name, icon: theme.icon }
    ])
  )
}

/**
 * 获取主题元信息
 * @param {string} themeKey - 主题 key
 * @returns {{name: string, icon: string}} 主题元信息
 */
export function getThemeMeta(themeKey) {
  const theme = themes[themeKey]
  if (!theme) {
    return { name: '未知主题', icon: '❓' }
  }
  return { name: theme.name, icon: theme.icon }
}
