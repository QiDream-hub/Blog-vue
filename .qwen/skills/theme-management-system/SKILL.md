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
| `exportThemes()` | 导出所有主题为 JSON 字符串（含当前主题） |
| `importThemes(jsonStr)` | 从 JSON 字符串导入主题（合并策略） |

### 存储结构

```javascript
// localStorage['app-themes']
[
  {
    "key": "sakura",
    "name": "樱花粉",
    "icon": "🌸",
    "variables": {
      "--primary-color": "#ff7aae",
      "--bg-color": "#ffffff",
      // ...
    }
  },
  {
    "key": "custom_my_theme",
    "name": "我的主题",
    "icon": "✨",
    "variables": { ... }
  }
]

// localStorage['app-theme']
"sakura"  // 当前选中的主题 key
```

### 导入导出功能

#### 导出格式

导出的 JSON 包含版本信息、导出时间、当前主题和所有主题数据：

```javascript
// exportThemes() 返回的 JSON 格式
{
  "version": "1.0",
  "exportTime": 1717500000000,
  "currentTheme": "sakura",
  "themes": [
    {
      "key": "sakura",
      "name": "樱花粉",
      "icon": "🌸",
      "variables": { ... }
    },
    // ... 其他主题
  ]
}
```

#### 导入策略

导入时采用**合并策略**：
- 保留现有主题
- 导入的主题覆盖同 key 的主题
- 自动切换到导入数据中指定的当前主题（如果存在）

```javascript
// importThemes(jsonStr) 实现
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
    const themeMap = new Map(currentThemes.map(t => [t.key, t]))
    let importedCount = 0

    // 合并主题（导入的覆盖现有）
    for (const theme of importData.themes) {
      if (!theme.key || !theme.name || !theme.variables) continue
      themeMap.set(theme.key, theme)
      importedCount++
    }

    saveThemes(Array.from(themeMap.values()))

    // 切换当前主题
    if (importData.currentTheme && 
        mergedThemes.some(t => t.key === importData.currentTheme)) {
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
```

#### UI 实现模式

**导出按钮**：

```vue
<button @click="exportThemesAction" class="btn-export">
  <svg>...</svg>
  导出主题
</button>

<script setup>
function exportThemesAction() {
  const jsonData = exportThemes()
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `themes-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
```

**导入弹窗**：

```vue
<!-- 导入弹窗 -->
<transition name="fade">
  <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
    <div class="import-modal">
      <div class="modal-header">
        <h3>导入主题</h3>
        <button @click="closeImportModal" class="btn-modal-close">✕</button>
      </div>
      <div class="modal-body">
        <p>粘贴从导出功能获得的 JSON 数据：</p>
        <textarea v-model="importJsonInput" 
                  placeholder='{"version": "1.0", "themes": [...]}'></textarea>
        <div v-if="importError" class="import-error">{{ importError }}</div>
      </div>
      <div class="modal-footer">
        <button @click="closeImportModal">取消</button>
        <button @click="confirmImport">确认导入</button>
      </div>
    </div>
  </div>
</transition>

<script setup>
function confirmImport() {
  if (!importJsonInput.value.trim()) {
    importError.value = '请输入 JSON 数据'
    return
  }

  const result = importThemes(importJsonInput.value)
  if (result.success) {
    loadThemes()
    message.value = result.message
    closeImportModal()
  } else {
    importError.value = result.message
  }
}
</script>
```

### 导入导出适用场景

- **备份恢复**：用户可备份主题配置，防止丢失
- **跨设备同步**：导出文件可在不同设备间导入
- **主题分享**：用户可分享自定义主题给他人
- **批量迁移**：一次性导入多个主题

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
