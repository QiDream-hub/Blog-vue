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
import { ref, computed, onMounted } from 'vue';

// 可用主题配置
const availableThemes = {
    sakura: { name: '樱花粉', icon: '🌸' },
    midnight: { name: '午夜蓝', icon: '🌙' },
    forest: { name: '森林绿', icon: '🌲' },
    sunset: { name: '落日橙', icon: '🌅' }
};

const currentTheme = ref('sakura');
const showPicker = ref(false);

// 当前主题名称
const currentThemeName = computed(() => {
    return availableThemes[currentTheme.value]?.name || '樱花粉';
});

// 当前主题图标
const currentThemeIcon = computed(() => {
    return availableThemes[currentTheme.value]?.icon || '🌸';
});

// 应用主题到 HTML 元素
function applyTheme(themeKey) {
    document.documentElement.setAttribute('data-theme', themeKey);
    localStorage.setItem('theme', themeKey);
    currentTheme.value = themeKey;
}

// 切换主题（循环切换）
function toggleTheme() {
    showPicker.value = !showPicker.value;
}

// 选择特定主题
function selectTheme(themeKey) {
    applyTheme(themeKey);
    showPicker.value = false;
}

// 点击外部关闭选择器
function handleClickOutside(e) {
    if (!e.target.closest('.theme-toggle-wrapper')) {
        showPicker.value = false;
    }
}

onMounted(() => {
    // 从 localStorage 恢复主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && availableThemes[savedTheme]) {
        applyTheme(savedTheme);
    } else {
        applyTheme('sakura'); // 默认主题
    }
    
    // 添加全局点击事件监听
    document.addEventListener('click', handleClickOutside);
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
