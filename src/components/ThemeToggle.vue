<!-- components/ThemeToggle.vue -->
<template>
    <div class="theme-toggle-wrapper">
        <button @click="toggleTheme" class="theme-toggle-btn" :title="`当前主题：${currentThemeName}`">
            <span class="theme-icon">{{ currentThemeIcon }}</span>
            <span class="theme-name">{{ currentThemeName }}</span>
        </button>
        <!-- 主题选择下拉菜单 -->
        <div v-if="showPicker" class="theme-picker">
            <button
                v-for="(theme, key) in availableThemes"
                :key="key"
                @click="selectTheme(key)"
                :class="['theme-option', { active: currentTheme === key }]"
            >
                <span class="theme-option-icon">{{ theme.icon }}</span>
                <span class="theme-option-name">{{ theme.name }}</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getAvailableThemes, getThemeMeta, getCurrentTheme, setTheme, getAllThemes } from '../styles/ThemeManager';

// 可用主题配置（从 ThemeManager 获取）
const availableThemes = ref({});

const currentTheme = ref(getCurrentTheme()||'');
const showPicker = ref(false);

// 当前主题名称
const currentThemeName = computed(() => {
    const meta = getThemeMeta(currentTheme.value);
    return meta?.name || '未知主题';
});

// 当前主题图标
const currentThemeIcon = computed(() => {
    const meta = getThemeMeta(currentTheme.value);
    return meta?.icon || '❓';
});

// 切换主题（显示/隐藏选择器）
function toggleTheme() {
    showPicker.value = !showPicker.value;
}

// 选择特定主题
function selectTheme(themeKey) {
    setTheme(themeKey);
    currentTheme.value = themeKey;
    showPicker.value = false;
}

// 点击外部关闭选择器
function handleClickOutside(e) {
    if (!e.target.closest('.theme-toggle-wrapper')) {
        showPicker.value = false;
    }
}

// 检查当前主题是否仍然有效，如果无效则清除
function validateCurrentTheme() {
    const allThemes = getAllThemes();
    const themeExists = allThemes.some(t => t.key === currentTheme.value);
    
    if (!themeExists) {
        // 当前主题已被删除，清空选择（不自动切换默认主题）
        currentTheme.value = '';
    }
}

// 监听 localStorage 变化（其他标签页或手动修改）
function handleStorageChange(e) {
    if (e.key === 'app-theme' || e.key === 'app-themes') {
        const newTheme = getCurrentTheme();
        validateCurrentTheme();
        if (currentTheme.value !== newTheme && currentTheme.value !== '') {
            currentTheme.value = newTheme;
        }
        availableThemes.value = getAvailableThemes();
    }
}

onMounted(() => {
    // 加载主题列表
    availableThemes.value = getAvailableThemes();
    currentTheme.value = getCurrentTheme();
    validateCurrentTheme();
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('storage', handleStorageChange);
});
</script>

<style lang="scss" scoped>
.theme-toggle-wrapper {
    position: relative;
    display: inline-block;
}

.theme-toggle-btn {
    background: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    padding: 0.45rem 1rem;
    border-radius: 24px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: var(--transition-base);
    box-shadow: var(--shadow-sm);

    &:hover {
        background: var(--hover-bg-color);
        color: var(--primary-color);
        border-color: var(--primary-color);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }

    &:active {
        transform: translateY(0);
    }
}

.theme-icon {
    font-size: 1.1rem;
}

.theme-name {
    white-space: nowrap;
}

.theme-picker {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 0.5rem;
    box-shadow: var(--shadow-lg);
    z-index: 1001;
    min-width: 140px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &::before {
        content: '';
        position: absolute;
        top: -6px;
        right: 12px;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid var(--border-color);
    }
}

.theme-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text-color);
    transition: var(--transition-base);
    text-align: left;

    &:hover {
        background: var(--hover-bg-color);
        color: var(--primary-color);
    }

    &.active {
        background: var(--selected-bg-color);
        color: var(--selected-color);
        font-weight: 600;
    }
}

.theme-option-icon {
    font-size: 1.1rem;
}

.theme-option-name {
    flex: 1;
}
</style>
