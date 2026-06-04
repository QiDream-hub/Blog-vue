---
name: 主题变更事件系统
description: 使用 EventTarget 实现应用内主题变更的自动通知和跨组件同步
source: auto-skill
extracted_at: '2026-06-04T15:19:54.358Z'
---

## 主题变更事件系统

当应用中的某个状态变更（如主题切换、语言切换、配置更新等）需要通知多个组件时，使用 **EventTarget + CustomEvent** 模式实现解耦的事件通知系统。

### 核心设计原则

1. **单一事件源**：状态管理器内部统一触发事件
2. **订阅/取消订阅**：提供 `onEventChange(callback)` 返回取消函数
3. **自动清理**：组件卸载时自动取消订阅，防止内存泄漏
4. **跨组件同步**：任何地方调用状态变更函数，所有订阅者自动更新
5. **跨标签页支持**：同时触发 `StorageEvent` 支持多标签页同步

### 实现步骤

#### 1. 在状态管理器中添加事件系统

```javascript
// ThemeManager.js

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
```

#### 2. 在状态变更函数中触发事件

```javascript
// setTheme - 切换主题时触发
export function setTheme(themeKey) {
  const themes = getThemes()
  if (!themes.some(t => t.key === themeKey)) {
    console.warn(`Theme "${themeKey}" does not exist`)
    return
  }

  localStorage.setItem(CURRENT_THEME_KEY, themeKey)
  applyTheme(themeKey)
  dispatchThemeChange(themeKey)  // ← 触发事件
}

// saveTheme - 保存主题时触发
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
  dispatchThemeChange(getCurrentTheme())  // ← 触发事件
}

// deleteTheme - 删除主题时触发
export function deleteTheme(themeKey) {
  const themes = getThemes()
  const existingIndex = themes.findIndex(t => t.key === themeKey)

  if (existingIndex < 0) {
    return false
  }

  themes.splice(existingIndex, 1)
  saveThemes(themes)

  if (localStorage.getItem(CURRENT_THEME_KEY) === themeKey) {
    setTheme(DEFAULT_THEME_KEY)  // setTheme 会触发事件
  } else {
    dispatchThemeChange(getCurrentTheme())  // ← 手动触发
  }

  return true
}

// resetAllThemes - 重置所有主题时触发
export function resetAllThemes() {
  const themes = [...DEFAULT_THEMES]
  saveThemes(themes)
  dispatchThemeChange(getCurrentTheme())  // ← 触发事件
  return themes
}
```

#### 3. 在组件中订阅事件

```vue
<!-- DiyTheme.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onThemeChange } from '../styles/ThemeManager'

const allThemes = ref([])
const currentThemeKey = ref('')

onMounted(() => {
  // 初始加载
  loadThemes()

  // 订阅主题变更事件
  const unsubscribe = onThemeChange(({ themeKey, themes }) => {
    allThemes.value = themes
    currentThemeKey.value = themeKey
  })

  // 组件卸载时取消订阅
  onUnmounted(unsubscribe)
})

function loadThemes() {
  allThemes.value = getAllThemes()
  currentThemeKey.value = getCurrentTheme()
}
</script>
```

### 事件数据结构

```javascript
// CustomEvent.detail 格式
{
  themeKey: 'sakura',      // 当前主题 key
  themes: [...]            // 完整主题列表
}
```

### 跨标签页同步

通过同时触发 `StorageEvent`，其他标签页可以监听 `storage` 事件实现同步：

```javascript
// 其他页面监听
window.addEventListener('storage', (e) => {
  if (e.key === 'currentTheme') {
    // 重新加载主题
    loadThemes()
  }
})
```

### 为什么不用 watch 监听 getCurrentTheme()

`getCurrentTheme()` 是**普通函数**，返回 `localStorage` 的值，不是 Vue 响应式数据：

```javascript
// ❌ 无效：watch 无法监听非响应式数据
watch(getCurrentTheme(), () => {
  loadThemes()
})

// ✅ 正确：使用事件系统
onMounted(() => {
  const unsubscribe = onThemeChange(() => {
    loadThemes()
  })
  onUnmounted(unsubscribe)
})
```

### 代码简化效果

**使用事件系统前**（每个操作后手动调用 `loadThemes()`）：

```javascript
function selectTheme(key) {
  setTheme(key)
  currentThemeKey.value = key  // 手动更新
  loadThemes()                 // 手动刷新列表
  message.value = '已切换'
}

function saveThemeAction() {
  saveTheme(themeKey, themeData)
  loadThemes()                 // 手动刷新列表
  message.value = '已保存'
}

function confirmDelete(key) {
  deleteTheme(key)
  loadThemes()                 // 手动刷新列表
  message.value = '已删除'
}
```

**使用事件系统后**（自动更新，代码更简洁）：

```javascript
function selectTheme(key) {
  setTheme(key)
  // 事件监听器自动更新 currentThemeKey 和 allThemes
  message.value = '已切换'
}

function saveThemeAction() {
  saveTheme(themeKey, themeData)
  // 事件监听器自动更新主题列表
  message.value = '已保存'
}

function confirmDelete(key) {
  deleteTheme(key)
  // 事件监听器自动更新主题列表
  message.value = '已删除'
}
```

### 优势

| 对比项 | 手动调用 loadThemes() | 事件系统 |
|--------|----------------------|----------|
| 代码量 | 每个操作后都要调用 | 一次订阅，自动更新 |
| 遗漏风险 | 容易忘记调用 | 无遗漏 |
| 跨组件同步 | 需要手动通知 | 自动通知 |
| 跨标签页 | 不支持 | 支持（StorageEvent） |
| 可维护性 | 分散 | 集中 |

### 适用场景

- **主题/皮肤切换**：多个组件需要根据主题变化更新 UI
- **语言切换**：国际化应用中多个地方需要响应语言变化
- **用户状态变更**：登录/登出后通知多个组件
- **配置同步**：设置变更后多个页面需要刷新
- **全局状态通知**：任何需要"一处变更，多处响应"的场景

### 注意事项

1. **取消订阅**：必须在组件卸载时调用 `unsubscribe()`，否则会导致内存泄漏
2. **事件命名**：使用常量定义事件名（如 `THEME_CHANGE_EVENT`），避免硬编码字符串
3. **数据传递**：通过 `CustomEvent.detail` 传递必要数据，避免回调中重新查询
4. **错误处理**：事件回调中抛出错误不会影响其他订阅者
5. **触发时机**：在状态变更完成后触发事件，确保订阅者获取最新数据

### 扩展模式

如果需要区分不同类型的事件，可以使用多个事件名：

```javascript
const THEME_CHANGE_EVENT = 'theme-change'
const THEME_SAVED_EVENT = 'theme-saved'
const THEME_DELETED_EVENT = 'theme-deleted'

// 分别监听
onThemeChange(({ type, ...data }) => { ... })
```

或者使用更通用的事件总线模式：

```javascript
const eventBus = new EventTarget()

export function emit(event, detail) {
  eventBus.dispatchEvent(new CustomEvent(event, { detail }))
}

export function on(event, callback) {
  const handler = (e) => callback(e.detail)
  eventBus.addEventListener(event, handler)
  return () => eventBus.removeEventListener(event, handler)
}
```
