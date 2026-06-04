<template>
    <div class="diy-theme">
        <h1>DIY 主题</h1>
        <p>通过这个页面，你可以创建、编辑或删除自定义主题。</p>
        <p>所有主题存储在 <code>localStorage</code> 中，刷新页面后依然生效。</p>

        <!-- 主题列表（可折叠） -->
        <div class="theme-list-section">
            <div class="theme-list-header" @click="toggleCollapse">
                <h2>主题列表</h2>
                <div class="theme-list-summary">
                    <span class="theme-count">{{ allThemes.length }} 个主题</span>
                    <span class="current-theme" v-if="currentThemeKey">
                        · 当前：<strong>{{ allThemesObj[currentThemeKey]?.name || currentThemeKey }}</strong>
                    </span>
                    <span class="collapse-icon" :class="{ collapsed: isCollapsed }">
                        {{ isCollapsed ? '▼' : '▲' }}
                    </span>
                </div>
            </div>
            <transition name="collapse">
                <div v-show="!isCollapsed" class="theme-list-wrapper">
                    <div class="theme-list">
                        <div v-for="themeItem in allThemes" :key="themeItem.key"
                            :class="['theme-item', { active: currentThemeKey === themeItem.key }]"
                            @click="setTheme(themeItem.key)">
                            <div class="theme-info">
                                <span class="theme-icon">{{ themeItem.icon }}</span>
                                <div class="theme-meta">
                                    <span class="theme-name">{{ themeItem.name }}</span>
                                    <span class="theme-key">{{ themeItem.key }}</span>
                                </div>
                            </div>
                            <div class="theme-actions">
                                <button @click="editTheme(themeItem.key)" class="btn-edit" title="编辑此主题">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button @click="confirmDelete(themeItem.key)" class="btn-delete" title="删除此主题">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path
                                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                        </path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="theme-list-actions">
                        <button @click="resetAllThemesAction" class="btn-restore">
                            重置所有主题为默认
                        </button>
                        <button @click="exportThemesAction" class="btn-export">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            导出主题
                        </button>
                        <button @click="triggerImport" class="btn-import">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            导入主题
                        </button>
                        <button @click="createNewTheme" class="btn-create">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            创建新主题
                        </button>
                    </div>
                </div>
            </transition>
        </div>

        <!-- 导入弹窗 -->
        <transition name="fade">
            <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
                <div class="import-modal">
                    <div class="modal-header">
                        <h3>导入主题</h3>
                        <button @click="closeImportModal" class="btn-modal-close">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p class="import-hint">粘贴从导出功能获得的 JSON 数据：</p>
                        <textarea v-model="importJsonInput" class="import-textarea"
                            placeholder='{"version": "1.0", "themes": [...]}'></textarea>
                        <div v-if="importError" class="import-error">{{ importError }}</div>
                    </div>
                    <div class="modal-footer">
                        <button @click="closeImportModal" class="btn-modal-cancel">取消</button>
                        <button @click="confirmImport" class="btn-modal-confirm">确认导入</button>
                    </div>
                </div>
            </div>
        </transition>

        <hr class="divider">

        <!-- 创建/编辑主题表单 -->
        <transition name="form-fade">
            <div v-if="showForm" class="theme-form">
                <div class="theme-form-header">
                    <h2>{{ isEditing ? '编辑主题' : '创建新主题' }}</h2>
                    <button @click="closeForm" class="btn-close" title="关闭表单">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

            <div class="form-section">
                <h3>基本信息</h3>
                <div class="form-group">
                    <label>主题 Key</label>
                    <input v-model="themeKeyInput" placeholder="例如：custom_pink" class="input-field"
                        :disabled="isEditing">
                    <span class="field-hint">主题的唯一标识符，创建后不可修改</span>
                </div>
                <div class="form-group">
                    <label>主题名</label>
                    <input v-model="theme.name" placeholder="例如：樱花粉" class="input-field">
                </div>
                <div class="form-group">
                    <label>主题图标</label>
                    <input v-model="theme.icon" placeholder="例如：🌸" class="input-field emoji-input">
                </div>
            </div>

            <div class="form-section">
                <h3>核心配色</h3>
                <div class="color-grid">
                    <div v-for="(value, key) in coreColors" :key="key" class="color-picker-group">
                        <label :title="key">{{ getLabel(key) }}</label>
                        <div class="color-input-wrapper">
                            <input type="color" v-model="theme.variables[key]" @input="onColorChange">
                            <span class="color-value">{{ theme.variables[key] }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>状态色</h3>
                <div class="color-grid">
                    <div v-for="(value, key) in stateColors" :key="key" class="color-picker-group">
                        <label :title="key">{{ getLabel(key) }}</label>
                        <div class="color-input-wrapper">
                            <input type="color" v-model="theme.variables[key]" @input="onColorChange">
                            <span class="color-value">{{ theme.variables[key] }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>功能色</h3>
                <div class="color-grid">
                    <div v-for="(value, key) in functionalColors" :key="key" class="color-picker-group">
                        <label :title="key">{{ getLabel(key) }}</label>
                        <div class="color-input-wrapper">
                            <input type="color" v-model="theme.variables[key]" @input="onColorChange">
                            <span class="color-value">{{ theme.variables[key] }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>阴影</h3>
                <div class="shadow-list">
                    <div v-for="(value, key) in shadowColors" :key="key" class="shadow-picker-group">
                        <label>{{ getLabel(key) }}</label>
                        <div class="shadow-input-wrapper">
                            <input type="text" v-model="theme.variables[key]"
                                placeholder="例如：0 4px 16px rgba(255, 122, 174, 0.3)">
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button @click="saveThemeAction" class="btn-save">保存主题</button>
                <button @click="previewTheme" class="btn-preview">预览</button>
                <button @click="resetForm" class="btn-reset">重置表单</button>
                <button v-if="isEditing" @click="deleteCurrentTheme" class="btn-delete-text">删除此主题</button>
            </div>

            <div v-if="message" :class="['message', messageType]">
                {{ message }}
            </div>
        </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import {
    getAllThemes,
    getCurrentTheme,
    setTheme,
    getThemeData,
    saveTheme,
    deleteTheme,
    resetAllThemes,
    exportThemes,
    importThemes,
    onThemeChange
} from '../styles/ThemeManager'

// CSS 变量分类
const coreColorKeys = [
    '--primary-color',
    '--secondary-color',
    '--bg-color',
    '--bg-secondary-color',
    '--text-color',
    '--text-secondary-color'
]

const stateColorKeys = [
    '--selected-color',
    '--selected-bg-color',
    '--hover-bg-color'
]

const functionalColorKeys = [
    '--meta-color',
    '--description-color',
    '--border-color',
    '--border-light-color',
    '--tag-bg-color',
    '--tag-text-color'
]

const shadowKeys = [
    '--shadow-sm',
    '--shadow-md',
    '--shadow-lg',
    '--shadow-primary'
]

// 标签映射
const labelMap = {
    '--primary-color': '主色',
    '--secondary-color': '辅助色',
    '--bg-color': '背景色',
    '--bg-secondary-color': '次要背景色',
    '--text-color': '文字色',
    '--text-secondary-color': '次要文字色',
    '--selected-color': '选中色',
    '--selected-bg-color': '选中背景色',
    '--hover-bg-color': '悬停背景色',
    '--meta-color': '元信息色',
    '--description-color': '描述色',
    '--border-color': '边框色',
    '--border-light-color': '浅边框色',
    '--tag-bg-color': '标签背景色',
    '--tag-text-color': '标签文字色',
    '--shadow-sm': '小阴影',
    '--shadow-md': '中阴影',
    '--shadow-lg': '大阴影',
    '--shadow-primary': '主色阴影'
}

// 状态
const allThemes = ref([])
const allThemesObj = ref({})
const currentThemeKey = ref('')
const themeKeyInput = ref('')
const isEditing = ref(false)
const isCollapsed = ref(false) // 默认展开主题列表
const showForm = ref(false) // 默认隐藏表单

const theme = reactive({
    name: '',
    icon: '',
    variables: {}
})

const message = ref('')
const messageType = ref('success')

// 导入相关状态
const showImportModal = ref(false)
const importJsonInput = ref('')
const importError = ref('')

// 计算属性
const coreColors = computed(() => {
    const result = {}
    coreColorKeys.forEach(key => {
        result[key] = theme.variables[key] || '#000000'
    })
    return result
})

const stateColors = computed(() => {
    const result = {}
    stateColorKeys.forEach(key => {
        result[key] = theme.variables[key] || '#000000'
    })
    return result
})

const functionalColors = computed(() => {
    const result = {}
    functionalColorKeys.forEach(key => {
        result[key] = theme.variables[key] || '#000000'
    })
    return result
})

const shadowColors = computed(() => {
    const result = {}
    shadowKeys.forEach(key => {
        result[key] = theme.variables[key] || ''
    })
    return result
})

// 加载主题列表
function loadThemes() {
    allThemes.value = getAllThemes()
    allThemesObj.value = Object.fromEntries(allThemes.value.map(t => [t.key, { name: t.name, icon: t.icon }]))
    currentThemeKey.value = getCurrentTheme()
}

// 获取中文标签
function getLabel(key) {
    return labelMap[key] || key
}

// 颜色变化处理
function onColorChange() {
    // 可添加实时预览逻辑
}

// 应用主题
function selectTheme(key) {
    setTheme(key)
    // 事件监听器会自动更新 currentThemeKey
    const themeMeta = allThemes.value.find(t => t.key === key)
    message.value = `已切换到主题 "${themeMeta?.name || key}"`
    messageType.value = 'success'
}

// 确认删除
function confirmDelete(key) {
    const themeMeta = allThemes.value.find(t => t.key === key)
    if (confirm(`确定要删除主题 "${themeMeta?.name}" 吗？此操作不可恢复。`)) {
        deleteTheme(key)
        // 事件监听器会自动更新主题列表
        message.value = `主题 "${themeMeta?.name}" 已删除`
        messageType.value = 'success'

        // 如果删除的是正在编辑的主题，重置表单
        if (isEditing.value && themeKeyInput.value === key) {
            resetForm()
        }
    }
}

// 删除当前编辑的主题
function deleteCurrentTheme() {
    if (themeKeyInput.value) {
        confirmDelete(themeKeyInput.value)
    }
}

// 重置所有主题
function resetAllThemesAction() {
    if (confirm('确定要重置所有主题为默认值吗？这将删除所有自定义主题。')) {
        resetAllThemes()
        resetForm()
        message.value = '所有主题已重置为默认值'
        messageType.value = 'success'
    }
}

// 生成主题 key
function generateThemeKey(name) {
    return 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

// 保存主题
function saveThemeAction() {
    if (!theme.name.trim()) {
        message.value = '请输入主题名'
        messageType.value = 'error'
        return
    }

    const themeKey = themeKeyInput.value || generateThemeKey(theme.name)

    if (!themeKey.trim()) {
        message.value = '请输入主题 Key'
        messageType.value = 'error'
        return
    }

    const themeData = {
        name: theme.name,
        icon: theme.icon,
        variables: { ...theme.variables }
    }

    saveTheme(themeKey, themeData)
    // 事件监听器会自动更新主题列表

    message.value = `主题 "${theme.name}" 已保存！`
    messageType.value = 'success'

    // 如果是新建，切换到编辑模式
    if (!isEditing.value) {
        isEditing.value = true
        themeKeyInput.value = themeKey
    }

    // 保存后收起表单
    showForm.value = false
}

// 预览主题
function previewTheme() {
    applyThemeVariables(theme.variables)
    message.value = '已应用预览（未保存）'
    messageType.value = 'success'
}

// 重置表单
function resetForm() {
    themeKeyInput.value = ''
    theme.name = '我的主题'
    theme.icon = '✨'
    theme.variables = theme.variables
    isEditing.value = false
    message.value = ''
}

// 应用主题变量
function applyThemeVariables(variables) {
    Object.entries(variables).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value)
    })
}

// 编辑主题
function editTheme(key) {
    const themeData = getThemeData(key)
    if (!themeData) return

    isEditing.value = true
    themeKeyInput.value = key
    theme.name = themeData.name
    theme.icon = themeData.icon
    theme.variables = { ...themeData.variables }

    // 展开列表并显示表单
    isCollapsed.value = false
    showForm.value = true
    nextTick(() => {
        document.querySelector('.theme-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}

// 切换折叠状态
function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
}

// 创建新主题
function createNewTheme() {
    resetForm()
    isCollapsed.value = false
    showForm.value = true
    nextTick(() => {
        document.querySelector('.theme-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}

// 关闭表单
function closeForm() {
    showForm.value = false
    resetForm()
}

// 导出主题
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

    message.value = '主题已导出'
    messageType.value = 'success'
}

// 触发导入
function triggerImport() {
    showImportModal.value = true
    importJsonInput.value = ''
    importError.value = ''
}

// 关闭导入弹窗
function closeImportModal() {
    showImportModal.value = false
    importJsonInput.value = ''
    importError.value = ''
}

// 确认导入
function confirmImport() {
    if (!importJsonInput.value.trim()) {
        importError.value = '请输入 JSON 数据'
        return
    }

    const result = importThemes(importJsonInput.value)
    if (result.success) {
        // 事件监听器会自动更新主题列表
        message.value = result.message
        messageType.value = 'success'
        closeImportModal()
    } else {
        importError.value = result.message
    }
}

// 监听当前主题变化，自动加载编辑
watch(getCurrentTheme(), () => {
    loadThemes()
})

onMounted(() => {
    loadThemes()
    resetForm()
    
    // 监听主题变更事件，自动刷新列表
    const unsubscribe = onThemeChange(({ themeKey, themes }) => {
        allThemes.value = themes
        allThemesObj.value = Object.fromEntries(themes.map(t => [t.key, { name: t.name, icon: t.icon }]))
        currentThemeKey.value = themeKey
    })
    
    // 组件卸载时取消监听
    onUnmounted(unsubscribe)
})
</script>

<style lang="scss" scoped>
.diy-theme {
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;

    h1 {
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
        color: var(--text-color);
    }

    p {
        color: var(--description-color);
        margin-bottom: 1.5rem;
        line-height: 1.6;

        code {
            background: var(--tag-bg-color);
            color: var(--tag-text-color);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-family: monospace;
            transition: background-color var(--anim-duration) var(--anim-easing);
        }
    }
}

// 主题列表
.theme-list-section {
    margin-bottom: 2rem;

    .theme-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--bg-color);
        border: 1px solid var(--border-light-color);
        border-radius: 8px;
        cursor: pointer;
        transition: var(--transition-base);

        &:hover {
            border-color: var(--primary-color);
            box-shadow: var(--shadow-sm);
            background: var(--bg-secondary-color);
        }

        h2 {
            margin: 0;
            font-size: 1.3rem;
            color: var(--primary-color);
        }
    }

    .theme-list-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.9rem;
        color: var(--text-secondary-color);

        .theme-count {
            white-space: nowrap;
            padding: 0.2rem 0.6rem;
            background: var(--tag-bg-color);
            color: var(--tag-text-color);
            border-radius: 12px;
            font-weight: 500;
        }

        .current-theme {
            white-space: nowrap;

            strong {
                color: var(--primary-color);
            }
        }

        .collapse-icon {
            font-size: 0.8rem;
            color: var(--meta-color);
            transition: transform var(--anim-duration) var(--anim-easing);

            &.collapsed {
                transform: rotate(-90deg);
            }
        }
    }
}

.theme-list-wrapper {
    padding-top: 1rem;
}

// 折叠动画
.collapse-enter-active,
.collapse-leave-active {
    overflow: hidden;
    transition:
        max-height var(--anim-duration) var(--anim-easing),
        opacity var(--anim-duration) var(--anim-easing);
}

.collapse-enter-from {
    max-height: 0;
    opacity: 0;
}

.collapse-enter-to {
    max-height: 1000px;
    opacity: 1;
}

.collapse-leave-from {
    max-height: 1000px;
    opacity: 1;
}

.collapse-leave-to {
    max-height: 0;
    opacity: 0;
}

.theme-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.theme-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--bg-color);
    border: 1px solid var(--border-light-color);
    border-radius: 8px;
    transition: var(--transition-base);

    &:hover {
        border-color: var(--primary-color);
        box-shadow: var(--shadow-sm);
        transform: translateY(-2px);
    }

    &.active {
        border-color: var(--selected-color);
        background: var(--selected-bg-color);
        box-shadow: var(--shadow-sm);
    }
}

.theme-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.theme-icon {
    font-size: 1.5rem;
}

.theme-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.theme-name {
    font-weight: 600;
    color: var(--text-color);
}

.theme-key {
    font-size: 0.8rem;
    color: var(--meta-color);
    font-family: monospace;
}

.theme-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.btn-edit {
    padding: 0.4rem 0.7rem;
    background: var(--bg-secondary-color);
    border: 1px solid var(--border-light-color);
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: var(--transition-base);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary-color);

    &:hover {
        background: var(--hover-bg-color);
        border-color: var(--primary-color);
        color: var(--primary-color);
        transform: translateY(-1px);
    }

    svg {
        width: 16px;
        height: 16px;
    }
}

.btn-delete {
    padding: 0.4rem 0.7rem;
    background: var(--bg-secondary-color);
    border: 1px solid var(--border-light-color);
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: var(--transition-base);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary-color);

    &:hover {
        background: var(--error-bg-color);
        border-color: var(--error-border-color);
        color: var(--error-color);
        transform: translateY(-1px);
    }

    svg {
        width: 16px;
        height: 16px;
    }
}

.btn-delete-text {
    padding: 0.7rem 1.5rem;
    background: transparent;
    color: var(--error-color);
    border: 1px solid var(--error-border-color);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: var(--transition-base);

    &:hover {
        background: var(--error-bg-color);
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);
    }
}

.theme-list-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.75rem;

    .btn-restore {
        padding: 0.6rem 1.2rem;
        background: var(--bg-secondary-color);
        color: var(--text-secondary-color);
        border: 1px solid var(--border-light-color);
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: var(--transition-base);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &:hover {
            background: var(--hover-bg-color);
            border-color: var(--warning-color);
            color: var(--warning-color);
        }
    }

    .btn-export {
        padding: 0.6rem 1.2rem;
        background: var(--bg-secondary-color);
        color: var(--text-secondary-color);
        border: 1px solid var(--border-light-color);
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: var(--transition-base);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &:hover {
            background: var(--hover-bg-color);
            border-color: var(--primary-color);
            color: var(--primary-color);
        }
    }

    .btn-import {
        padding: 0.6rem 1.2rem;
        background: var(--bg-secondary-color);
        color: var(--text-secondary-color);
        border: 1px solid var(--border-light-color);
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: var(--transition-base);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &:hover {
            background: var(--hover-bg-color);
            border-color: var(--success-color);
            color: var(--success-color);
        }
    }

    .btn-create {
        padding: 0.6rem 1.2rem;
        background: var(--primary-color);
        color: var(--text-color);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: var(--transition-base);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &:hover {
            background: var(--selected-color);
            box-shadow: var(--shadow-sm);
            transform: translateY(-1px);
        }

        svg {
            width: 16px;
            height: 16px;
        }
    }
}

.divider {
    border: none;
    height: 1px;
    background: var(--border-light-color);
    margin: 2rem 0;
}

// 表单样式
.theme-form {
    background: var(--bg-color);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-light-color);
    transition: var(--transition-base);

    .theme-form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;

        h2 {
            font-size: 1.3rem;
            margin: 0;
            color: var(--primary-color);
        }
    }

    .btn-close {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.4rem;
        border-radius: 6px;
        color: var(--meta-color);
        transition: var(--transition-base);
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background: var(--error-bg-color);
            color: var(--error-color);
        }
    }

    h3 {
        font-size: 1.1rem;
        margin-bottom: 1rem;
        color: var(--text-color);
    }
}

.form-section {
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1rem;

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-color);
        font-weight: 500;
    }
}

.input-field {
    width: 100%;
    padding: 0.6rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--bg-color);
    color: var(--text-color);
    transition: var(--transition-base);

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: var(--shadow-primary);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--bg-secondary-color);
    }

    &::placeholder {
        color: var(--meta-color);
    }
}

.field-hint {
    display: block;
    font-size: 0.8rem;
    color: var(--meta-color);
    margin-top: 0.25rem;
}

.emoji-input {
    max-width: 100px;
    text-align: center;
    font-size: 1.5rem;
}

.color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
}

.color-picker-group {
    display: flex;
    flex-direction: column;

    label {
        font-size: 0.9rem;
        color: var(--description-color);
        margin-bottom: 0.3rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

.color-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    input[type="color"] {
        width: 50px;
        height: 36px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        padding: 2px;
        background: var(--bg-color);
        transition: var(--transition-base);

        &:hover {
            border-color: var(--primary-color);
            box-shadow: var(--shadow-sm);
        }
    }

    .color-value {
        font-family: monospace;
        font-size: 0.85rem;
        color: var(--text-secondary-color);
        background: var(--bg-secondary-color);
        padding: 0.3rem 0.5rem;
        border-radius: 4px;
        min-width: 80px;
        border: 1px solid var(--border-light-color);
    }
}

.shadow-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.shadow-picker-group {
    display: flex;
    flex-direction: column;

    label {
        font-size: 0.9rem;
        color: var(--description-color);
        margin-bottom: 0.3rem;
    }
}

.shadow-input-wrapper {
    input[type="text"] {
        width: 100%;
        padding: 0.6rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 0.9rem;
        font-family: monospace;
        background: var(--bg-color);
        color: var(--text-color);
        transition: var(--transition-base);

        &:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: var(--shadow-primary);
        }

        &::placeholder {
            color: var(--meta-color);
            font-style: italic;
        }
    }
}

.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-light-color);

    button {
        padding: 0.7rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: var(--transition-base);

        &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        &:active {
            transform: translateY(0);
        }
    }
}

.btn-save {
    background: var(--primary-color);
    color: var(--text-color);
    font-weight: 600;

    &:hover {
        background: var(--selected-color);
        box-shadow: var(--shadow-primary);
    }
}

.btn-preview {
    background: var(--secondary-color);
    color: var(--text-color);
    font-weight: 600;
}

.btn-reset {
    background: var(--bg-secondary-color);
    color: var(--text-secondary-color);
    border: 1px solid var(--border-color);
}

.message {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
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

// 表单淡入淡出动画
.form-fade-enter-active,
.form-fade-leave-active {
    transition:
        opacity var(--anim-duration) var(--anim-easing),
        transform var(--anim-duration) var(--anim-easing);
}

.form-fade-enter-from {
    opacity: 0;
    transform: translateY(var(--anim-translate-y));
}

.form-fade-enter-to {
    opacity: 1;
    transform: translateY(0);
}

// 导入弹窗样式
.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--anim-duration) var(--anim-easing);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.import-modal {
    background: var(--bg-color);
    border-radius: 12px;
    padding: 1.5rem;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
            margin: 0;
            font-size: 1.2rem;
            color: var(--primary-color);
        }

        .btn-modal-close {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0.4rem;
            border-radius: 6px;
            color: var(--meta-color);
            transition: var(--transition-base);

            &:hover {
                background: var(--error-bg-color);
                color: var(--error-color);
            }
        }
    }

    .modal-body {
        flex: 1;
        overflow: auto;

        .import-hint {
            margin-bottom: 0.75rem;
            color: var(--text-secondary-color);
            font-size: 0.9rem;
        }

        .import-textarea {
            width: 100%;
            min-height: 200px;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.85rem;
            background: var(--bg-secondary-color);
            color: var(--text-color);
            resize: vertical;

            &:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: var(--shadow-primary);
            }
        }

        .import-error {
            margin-top: 0.75rem;
            padding: 0.5rem;
            background: var(--error-bg-color);
            color: var(--error-text-color);
            border-radius: 6px;
            font-size: 0.85rem;
        }
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1rem;

        .btn-modal-cancel {
            padding: 0.6rem 1.2rem;
            background: var(--bg-secondary-color);
            color: var(--text-secondary-color);
            border: 1px solid var(--border-light-color);
            border-radius: 8px;
            cursor: pointer;
            transition: var(--transition-base);

            &:hover {
                background: var(--hover-bg-color);
            }
        }

        .btn-modal-confirm {
            padding: 0.6rem 1.2rem;
            background: var(--primary-color);
            color: var(--text-color);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: var(--transition-base);

            &:hover {
                background: var(--selected-color);
                box-shadow: var(--shadow-sm);
            }
        }
    }
}

.form-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.form-fade-leave-to {
    opacity: 0;
    transform: translateY(var(--anim-translate-y));
}
</style>
