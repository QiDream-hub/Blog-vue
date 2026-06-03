---
name: 主题管理系统重构
description: 将硬编码主题重构为 localStorage 统一存储，支持自定义主题的 CRUD 操作和默认主题恢复
source: auto-skill
extracted_at: '2026-06-04T00:00:00.000Z'
---

## 主题管理系统重构模式

当需要将硬编码的配置（如主题、样式预设等）重构为用户可自定义且持久化的系统时，采用以下模式：

### 核心设计原则

1. **单一数据源**：所有配置（包括默认值和用户自定义）统一存储到 `localStorage`
2. **默认值保护**：默认配置在代码中保留一份只读副本，用于恢复和比对
3. **首次初始化**：首次访问时自动将默认配置写入存储，后续从存储读取
4. **CRUD 完整性**：提供完整的创建、读取、更新、删除操作，默认项不可删除
5. **恢复机制**：提供恢复单个默认项或重置所有配置的按钮

### 实现步骤

#### 1. 创建统一管理器（ThemeManager.js）

```javascript
// 在代码中保留默认配置副本（只读）
const DEFAULT_THEMES = {
  sakura: { name: '樱花粉', icon: '🌸', variables: {...} },
  midnight: { name: '午夜蓝', icon: '🌙', variables: {...} },
  // ...
}

const STORAGE_KEY = 'app-themes'
const CURRENT_KEY = 'app-theme'

// 获取所有主题（首次使用时写入默认值）
function getAllThemes() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  // 首次使用：将默认主题写入 localStorage
  const initialThemes = { ...DEFAULT_THEMES }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialThemes))
  return initialThemes
}

// 删除时保护默认主题
function deleteCustomTheme(themeKey) {
  if (DEFAULT_THEMES[themeKey]) {
    console.warn(`Cannot delete default theme: ${themeKey}`)
    return false
  }
  // 执行删除...
}

// 恢复默认主题
function restoreDefaultTheme(themeKey) {
  const themes = getAllThemes()
  if (themeKey) {
    themes[themeKey] = { ...DEFAULT_THEMES[themeKey] }
  } else {
    // 恢复所有
    Object.keys(DEFAULT_THEMES).forEach(key => {
      themes[key] = { ...DEFAULT_THEMES[key] }
    })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
}
```

#### 2. 更新 UI 组件

**主题列表页（DiyTheme.vue）**：
- 显示所有主题（默认 + 自定义）
- 标记默认主题（不可删除）
- 提供"应用"、"删除"、"编辑"操作
- 提供"恢复所有默认主题"按钮

**主题切换器（ThemeToggle.vue）**：
- 从统一管理器动态加载主题列表
- 支持显示用户自定义主题

#### 3. 更新入口文件

```javascript
// main.js
import { initTheme } from './styles/ThemeManager'

// 初始化时自动确保默认主题已写入存储
initTheme()
```

### 关键 API 设计

| 函数 | 说明 |
|------|------|
| `getAllThemes()` | 获取所有主题（含默认和自定义） |
| `getThemeData(key)` | 获取完整主题数据（含变量） |
| `saveCustomTheme(key, data)` | 保存/更新自定义主题 |
| `deleteCustomTheme(key)` | 删除主题（默认主题返回 false） |
| `restoreDefaultTheme(key?)` | 恢复默认主题（不传 key 则恢复全部） |
| `resetAllThemes()` | 重置所有主题为默认值 |
| `isDefaultTheme(key)` | 检查是否为默认主题 |

### 存储结构

```javascript
// localStorage['app-themes']
{
  "sakura": {
    "name": "樱花粉",
    "icon": "🌸",
    "variables": {
      "--primary-color": "#ff7aae",
      "--bg-color": "#ffffff",
      // ...
    }
  },
  "custom_my_theme": {
    "name": "我的主题",
    "icon": "✨",
    "variables": { ... }
  }
}

// localStorage['app-theme']
"sakura"  // 当前选中的主题 key
```

### 注意事项

1. **默认主题标识**：通过检查 key 是否存在于 `DEFAULT_THEMES` 来判断，而非存储标记
2. **删除当前主题**：如果删除的是当前正在使用的主题，自动切换到默认主题
3. **编辑模式**：编辑现有主题时，主题 key 字段应禁用（不可修改）
4. **实时预览**：提供"预览"按钮，应用主题但不保存
5. **数据迁移**：如果之前有旧存储格式，需要在 `getAllThemes()` 中做兼容处理

### 适用场景

- 主题/皮肤系统
- 用户偏好设置
- 可自定义的模板/预设
- 需要持久化且支持恢复默认值的配置项
