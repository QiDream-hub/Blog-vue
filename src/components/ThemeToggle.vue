<!-- components/ThemeToggle.vue -->
<template>
    <button @click="toggleTheme" class="theme-toggle-btn">
        {{ isDark ? '🌙 暗色' : '☀️ 亮色' }}
    </button>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    themes: {
        type: Object,
        required: true,
        validator(value) {
            return value.light && value.dark;
        }
    },
    defaultTheme: {
        type: String,
        default: 'light' // or 'dark'
    }
});

const isDark = ref(false);

// 将主题对象映射为 CSS 变量名
function applyTheme(themeObj) {
    const root = document.documentElement;
    const map = {
        primaryColor: '--primary-color',
        secondaryColor: '--secondary-color',
        bgColor: '--bg-color',
        textColor: '--text-color',
        selectedColor: '--selected-color',
        selectedBgColor: '--selected-bg-color',
        metaColor: '--meta-color',
        descriptionColor: '--description-color',
        tagBgColor: '--tag-bg-color',
        tagTextColor: '--tag-text-color',
    };

    for (const key in map) {
        if (themeObj[key] !== undefined) {
            root.style.setProperty(map[key], themeObj[key]);
        }
    }
}

function toggleTheme() {
    isDark.value = !isDark.value;
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
}

// 初始化主题
const savedTheme = localStorage.getItem('theme') || props.defaultTheme;
isDark.value = savedTheme === 'dark';
applyTheme(isDark.value ? props.themes.dark : props.themes.light);

// 响应式监听 isDark 变化
watch(isDark, (newVal) => {
    applyTheme(newVal ? props.themes.dark : props.themes.light);
});
</script>
<style scoped>
.theme-toggle-btn {
    background: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--secondary-color);
    padding: 0.45rem 1rem;
    border-radius: 24px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: var(--transition-bg-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

    &:hover {
        background: var(--selected-bg-color);
        color: var(--selected-color);
        border-color: var(--selected-color);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
}
</style>