---
name: Vue 页面布局优化
description: 使用可折叠面板、SVG 图标和统一按钮样式优化 Vue 页面布局，节省空间并提升视觉一致性
source: auto-skill
extracted_at: '2026-06-04T00:00:00.000Z'
---

## Vue 页面布局优化模式

当页面内容较多、头部信息占用过多空间时，采用以下优化模式：

### 核心设计原则

1. **默认折叠** - 将次要信息（如列表、历史数据）默认折叠，优先展示核心操作区域
2. **信息摘要** - 折叠状态下显示关键摘要（如数量、当前选中项），用户无需展开即可获取必要信息
3. **平滑动画** - 使用 `transition` 实现折叠/展开的平滑过渡效果
4. **图标一致性** - 操作按钮统一使用 SVG 图标，保持视觉风格一致
5. **交互反馈** - 悬停状态有明确的视觉反馈（颜色、阴影、位移）

### 实现步骤

#### 1. 可折叠面板

**模板结构**：
```vue
<template>
    <div class="section">
        <!-- 折叠头部（始终可见） -->
        <div class="section-header" @click="toggleCollapse">
            <h2>标题</h2>
            <div class="section-summary">
                <span class="count">{{ items.length }} 个</span>
                <span class="current" v-if="current">
                    · 当前：<strong>{{ currentName }}</strong>
                </span>
                <span class="collapse-icon" :class="{ collapsed: isCollapsed }">
                    {{ isCollapsed ? '▼' : '▲' }}
                </span>
            </div>
        </div>
        
        <!-- 折叠内容（条件渲染） -->
        <transition name="collapse">
            <div v-show="!isCollapsed" class="section-wrapper">
                <!-- 具体内容 -->
            </div>
        </transition>
    </div>
</template>
```

**状态管理**：
```javascript
const isCollapsed = ref(true) // 默认折叠

function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
}
```

**样式实现**：
```scss
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: var(--transition-base);

    &:hover {
        border-color: var(--primary-color);
        box-shadow: var(--shadow-sm);
    }

    h2 {
        margin: 0;
    }
}

.section-summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: var(--text-secondary-color);

    .collapse-icon {
        font-size: 0.8rem;
        transition: transform 0.2s ease;

        &.collapsed {
            transform: rotate(-90deg);
        }
    }
}

// 折叠动画
.collapse-enter-active,
.collapse-leave-active {
    overflow: hidden;
    transition:
        max-height 0.3s ease,
        opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
    max-height: 0;
    opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
    max-height: 1000px;
    opacity: 1;
}
```

#### 2. SVG 图标按钮

**按钮模板**：
```vue
<!-- 编辑按钮 -->
<button class="btn-edit" title="编辑">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
         viewBox="0 0 24 24" fill="none" stroke="currentColor" 
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
</button>

<!-- 删除按钮 -->
<button class="btn-delete" title="删除">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
         viewBox="0 0 24 24" fill="none" stroke="currentColor" 
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
</button>
```

**统一按钮样式**：
```scss
.btn-edit,
.btn-delete {
    padding: 0.4rem 0.7rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: var(--transition-base);
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        width: 16px;
        height: 16px;
    }

    &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
    }
}

.btn-edit {
    &:hover {
        background: var(--hover-bg-color);
        border-color: var(--primary-color);
        color: var(--primary-color);
    }
}

.btn-delete {
    &:hover {
        background: var(--error-bg-color);
        border-color: var(--error-border-color);
        color: var(--error-color);
    }
}
```

#### 3. 编辑交互增强

编辑按钮点击后：
1. 加载数据到表单
2. 自动展开折叠列表（如果当前是折叠状态）
3. 平滑滚动到表单区域

```javascript
function editTheme(key) {
    const themeData = getThemeData(key)
    if (!themeData) return

    isEditing.value = true
    themeKeyInput.value = key
    theme.name = themeData.name
    theme.icon = themeData.icon
    theme.variables = { ...themeData.variables }

    // 展开列表并滚动到表单
    isCollapsed.value = false
    document.querySelector('.theme-form')?.scrollIntoView({ behavior: 'smooth' })
}
```

### 常用 SVG 图标参考

```
编辑（铅笔）:
<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>

删除（垃圾桶）:
<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>

应用/确认（对勾）:
<polyline points="20 6 9 17 4 12"/>

设置/更多（齿轮）:
<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
```

### 适用场景

- 设置/配置页面（列表 + 表单）
- 数据管理页面（表格 + 编辑器）
- 侧边栏/面板切换
- 需要节省垂直空间的任何布局

### 注意事项

1. **动画性能** - 使用 `max-height` 而非 `height` 实现高度动画，值设得足够大以容纳内容
2. **可访问性** - 折叠头部应添加 `role="button"` 和 `aria-expanded` 属性
3. **响应式** - 在小屏幕上考虑调整摘要信息的显示方式
4. **图标尺寸** - 操作按钮中的 SVG 通常使用 16x16 或 20x20，保持统一
5. **颜色语义** - 编辑用主色/中性色，删除用错误色，确认用成功色
