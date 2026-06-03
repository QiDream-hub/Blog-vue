---
name: CSS 变量使用规范
description: 在 Vue 组件中使用全局 CSS 变量的最佳实践，包括变量分类、使用场景和样式优化技巧
source: auto-skill
extracted_at: '2026-06-04T00:00:00.000Z'
---

## CSS 变量使用规范

当在 Vue 组件中编写样式时，遵循以下规范以确保主题系统的完整性和可维护性。

### 变量分类与使用场景

#### 1. 核心配色变量（必须使用）

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `--primary-color` | 主色调，用于强调元素、按钮、链接 | 按钮背景、链接颜色 |
| `--secondary-color` | 辅助色，用于次要强调 | 标题、图标 |
| `--bg-color` | 主背景色 | 卡片、页面背景 |
| `--bg-secondary-color` | 次要背景色 | 代码块、输入框背景 |
| `--text-color` | 主文字颜色 | 标题、正文 |
| `--text-secondary-color` | 次要文字颜色 | 描述文字、提示 |

#### 2. 状态色变量（交互反馈）

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `--selected-color` | 选中状态强调色 | 选中边框、激活状态 |
| `--selected-bg-color` | 选中背景色 | 选中项背景、高亮区域 |
| `--hover-bg-color` | 悬停背景色 | 按钮/列表项 hover 背景 |

#### 3. 功能色变量（特定组件）

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `--meta-color` | 元信息颜色 | 时间戳、标签、辅助文字 |
| `--description-color` | 描述文字颜色 | 段落说明、副标题 |
| `--border-color` | 主边框颜色 | 输入框、卡片边框 |
| `--border-light-color` | 浅边框颜色 | 分割线、次要边框 |
| `--tag-bg-color` | 标签背景色 | Tag、徽章背景 |
| `--tag-text-color` | 标签文字色 | Tag、徽章文字 |

#### 4. 阴影变量（层次表现）

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `--shadow-sm` | 小阴影 | 轻微悬浮、输入框 focus |
| `--shadow-md` | 中阴影 | 卡片、下拉菜单 |
| `--shadow-lg` | 大阴影 | 模态框、大型弹出层 |
| `--shadow-primary` | 主色阴影 | 主按钮 focus、强调元素 |

#### 5. 动画变量（统一动效）

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `--anim-duration` | 动画时长 | transition、animation |
| `--anim-easing` | 缓动函数 | 统一动画曲线 |
| `--anim-translate-y` | 位移距离 | 滑入/滑出动画 |
| `--transition-base` | 基础过渡 | 通用 transition |
| `--transition-bg-color` | 背景过渡 | 背景色变化 |

#### 6. 错误状态变量（全局统一）

| 变量名 | 用途 |
|--------|------|
| `--error-*` | 错误状态配色（bg/border/text） |
| `--warning-*` | 警告状态配色 |
| `--success-*` | 成功状态配色 |

### 样式编写规范

#### ✅ 推荐做法

```scss
// 1. 使用变量而非硬编码颜色
.card {
    background: var(--bg-color);
    border: 1px solid var(--border-light-color);
    color: var(--text-color);
    box-shadow: var(--shadow-md);
}

// 2. 使用过渡变量确保主题切换平滑
.button {
    background: var(--primary-color);
    transition: var(--transition-base);
    
    &:hover {
        background: var(--selected-color);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
}

// 3. 使用动画变量保持一致性
.message {
    animation: slideIn var(--anim-duration) var(--anim-easing);
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(var(--anim-translate-y));
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// 4. 标签/徽章使用专用变量
.tag {
    background: var(--tag-bg-color);
    color: var(--tag-text-color);
    border: 1px solid var(--border-color);
}

// 5. 描述文字使用描述色
.description {
    color: var(--description-color);
    line-height: 1.6;
}
```

#### ❌ 避免做法

```scss
// ❌ 硬编码颜色值
.card {
    background: #ffffff;  // 应使用 var(--bg-color)
    border: 1px solid #ddd;  // 应使用 var(--border-color)
}

// ❌ 硬编码动画值
.button {
    transition: all 0.3s ease;  // 应使用 var(--transition-base)
}

// ❌ 混用不同层级的变量
.message {
    color: var(--text-color);
    background: #f5f5f5;  // 应使用 var(--bg-secondary-color)
}
```

### 主题切换适配检查清单

在组件样式完成后，检查以下项目：

- [ ] 所有颜色值是否使用 CSS 变量
- [ ] 背景色是否使用 `--bg-color` 或 `--bg-secondary-color`
- [ ] 文字颜色是否使用 `--text-color` 或 `--text-secondary-color`
- [ ] 边框是否使用 `--border-color` 或 `--border-light-color`
- [ ] 阴影是否使用 `--shadow-*` 系列变量
- [ ] 过渡/动画是否使用 `--transition-*` 和 `--anim-*` 变量
- [ ] 标签/徽章是否使用 `--tag-bg-color` 和 `--tag-text-color`
- [ ] 错误/警告/成功状态是否使用对应变量
- [ ] hover/active 状态是否有明确的视觉反馈

### 特殊场景处理

#### 1. Mermaid 图表配色

Mermaid 配色不放入全局 CSS 变量，而是在组件内直接读取基础变量：

```javascript
function getMermaidThemeVariables() {
    const styles = getComputedStyle(document.documentElement)
    const getVar = (name) => styles.getPropertyValue(name).trim()
    
    return {
        primaryColor: getVar('--primary-color'),
        textColor: getVar('--text-color'),
        background: 'transparent', // 图表背景透明，融入页面
        // ...
    }
}
```

**设计原因**：
- Mermaid 配置是组件内部实现细节
- 避免污染全局命名空间（24+ 个 `--mermaid-*` 变量）
- 保持主题配置的简洁性

#### 2. 输入框 Focus 状态

```scss
.input-field {
    border: 1px solid var(--border-color);
    
    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: var(--shadow-primary); // 使用主色阴影强调
    }
}
```

#### 3. 代码块样式

```scss
code {
    background-color: var(--selected-bg-color);
    color: var(--secondary-color);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: monospace;
    transition: color var(--anim-duration) var(--anim-easing);
}
```

### 变量选择指南

当不确定使用哪个变量时，参考以下决策流程：

1. **背景色选择**：
   - 主容器 → `--bg-color`
   - 次要区域/代码块 → `--bg-secondary-color`
   - 选中/高亮 → `--selected-bg-color`
   - 悬停效果 → `--hover-bg-color`

2. **文字颜色选择**：
   - 标题/主要文字 → `--text-color`
   - 描述/次要文字 → `--text-secondary-color` 或 `--description-color`
   - 元信息/时间戳 → `--meta-color`
   - 标签文字 → `--tag-text-color`

3. **边框选择**：
   - 主边框（输入框、卡片）→ `--border-color`
   - 次要边框（分割线、装饰）→ `--border-light-color`
   - 选中状态 → `--selected-color`
   - 错误状态 → `--error-border-color`

4. **阴影选择**：
   - 轻微悬浮 → `--shadow-sm`
   - 卡片/面板 → `--shadow-md`
   - 弹出层/模态框 → `--shadow-lg`
   - 主按钮/强调元素 → `--shadow-primary`

### 示例：完整组件样式

```vue
<style lang="scss" scoped>
.component {
    // 容器
    background: var(--bg-color);
    border: 1px solid var(--border-light-color);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--shadow-md);
    transition: var(--transition-base);

    // 标题
    h2 {
        color: var(--primary-color);
        margin-bottom: 1.5rem;
    }

    // 正文
    p {
        color: var(--description-color);
        line-height: 1.6;
    }

    // 按钮
    .btn {
        background: var(--primary-color);
        color: var(--text-color);
        border: none;
        padding: 0.7rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        transition: var(--transition-base);
        font-weight: 600;

        &:hover {
            background: var(--selected-color);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        &.secondary {
            background: var(--secondary-color);
        }

        &.text {
            background: transparent;
            color: var(--error-color);
            border: 1px solid var(--error-border-color);

            &:hover {
                background: var(--error-bg-color);
            }
        }
    }

    // 消息提示
    .message {
        padding: 1rem;
        border-radius: 8px;
        animation: slideIn var(--anim-duration) var(--anim-easing);

        &.success {
            background: var(--success-bg-color);
            color: var(--success-text-color);
            border: 1px solid var(--success-border-color);
        }

        &.error {
            background: var(--error-bg-color);
            color: var(--error-text-color);
            border: 1px solid var(--error-border-color);
        }
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(var(--anim-translate-y));
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
```

### 主题开发工作流

1. **开发阶段**：始终使用 CSS 变量编写样式
2. **审查阶段**：检查是否有硬编码颜色值
3. **测试阶段**：切换不同主题验证样式适配
4. **维护阶段**：新增变量时更新 `variables.css` 声明

通过遵循这些规范，确保所有组件都能无缝适配主题切换，提供一致的用户体验。
