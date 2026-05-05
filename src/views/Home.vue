<template>
    <div class="main-layout">
        <!-- 左侧：搜索 + 博客卡片 -->
        <div class="content-column">
            <div class="search-container">
                <input type="text" v-model="searchText" placeholder="搜索标题或摘要..." />
            </div>
            <!-- 重点：Grid 布局直接定义在 transition-group 上 -->
            <transition-group name="blog-list" tag="div" class="posts-grid">
                <BlogCard v-for="post in filteredPosts" :key="post.id" v-bind="post" class="blog-card" />
            </transition-group>
        </div>

        <!-- 右侧：标签栏 -->
        <div class="sidebar-column">
            <div class="tags-container">
                <TagCard v-for="tag in tags" :key="tag.name" v-bind="tag" @click="addOrDelTag(tag.name)"
                    :class="{ 'tag-card--selected': searchTag.includes(tag.name) }" />
            </div>
        </div>
    </div>
</template>

<script setup>
import BlogCard from '@/components/BlogCard.vue'
import TagCard from '@/components/TagCard.vue'
import { ref, computed } from 'vue'

const searchText = ref('')
const searchTag = ref([])


const posts = ref([
    {
        id: 1,
        title: '编程语言介绍',
        excerpt: '从汇编到高级语言，探索编程语言的演进历程。',
        cover: '/原神-神里凌华-棕色.jpg',
        tags: ['编程语言', '历史'],
        to: '/blogs/编程语言介绍',
    },
    {
        id: 2,
        title: 'JavaScript 入门指南',
        excerpt: '学习 JavaScript 的基础语法与核心概念。',
        cover: '/原神-神里凌华-棕色.jpg',
        tags: ['JavaScript', '前端'],
        to: '/blogs/js-guide',
    },
    {
        id: 3,
        title: 'Vue 3 响应式原理',
        excerpt: '深入理解 Vue 3 的 Composition API 和响应式系统。',
        cover: '/原神-神里凌华-棕色.jpg',
        tags: ['Vue', '前端'],
        to: '/blogs/我的第一篇博客',
    },
])

const tags = computed(() => {
    const tagCount = new Map()

    // 1. 遍历所有文章
    posts.value.forEach(post => {
        // 2. 遍历每篇文章的标签
        post.tags.forEach(tagName => {
            // 3. 统计次数
            tagCount.set(tagName, (tagCount.get(tagName) || 0) + 1)
        })
    })

    // 4. 转换为数组格式 [{ name, count }]
    return Array.from(tagCount, ([name, count]) => ({ name, count }))
})

const addOrDelTag = (name) => {
    const tagName = name?.trim()
    if (!tagName) return

    const index = searchTag.value.indexOf(tagName)
    if (index > -1) {
        searchTag.value = searchTag.value.filter(t => t !== tagName)
    } else {
        searchTag.value = [...searchTag.value, tagName]
    }
}

const filteredPosts = computed(() => {
    const query = searchText.value.trim().toLowerCase()
    const activeTags = searchTag.value

    return posts.value.filter(post => {
        const matchesText = !query ||
            post.title.toLowerCase().includes(query) ||
            post.excerpt.toLowerCase().includes(query)

        const matchesTag = activeTags.length === 0 ||
            activeTags.some(tag => post.tags.includes(tag))

        return matchesText && matchesTag
    })
})
</script>

<style scoped>
/* --- 布局基础 --- */
.main-layout {
    display: flex;
    gap: 24px;
    margin: 0 auto;
    padding: 20px;
}

.content-column {
    flex: 2;
    min-width: 0;
}

.sidebar-column {
    flex: 1;
    min-width: 200px;
}

.search-container {
    width: 90%;
    max-width: 600px;
    margin-bottom: 20px;
}

input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-color);
    transition: var(--transition-bg-color);
    color: var(--text-color);
}

/* --- 修复后的卡片网格 --- */
/* 重点：将 Grid 布局直接应用在 transition-group 上，确保 gap 生效 */
.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    /* 间隙在这里定义，不会被动画破坏 */
    list-style: none;
    /* 清除 transition-group 默认样式 */
    padding: 0;
    margin: 0;
}

.blog-card {
    max-width: 400px;
    box-sizing: border-box;
    /* 优化动画性能 */
    transform: translateZ(0);
}

.tags-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* --- 标签选中状态 --- */
.tag-card--selected {
    border: 2px solid var(--primary-color);
    box-shadow: var(--shadow-primary);
    transition: all 0.2s ease;
}

.tag-card--selected .tag-card__title {
    color: var(--bg-color);
    background-color: var(--primary-color);
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
}

.tag-card--selected .tag-card__description,
.tag-card--selected .tag-card__meta {
    color: var(--primary-color);
}

/* --- 动画定义 --- */
.blog-list-enter-from {
    opacity: 0;
    transform: translateY(var(--anim-translate-y));
}

.blog-list-leave-to {
    opacity: 0;
    transform: translateY(calc(var(--anim-translate-y) * -1));
}

.blog-list-enter-active {
    transition:
        opacity var(--anim-duration) var(--anim-easing),
        transform var(--anim-duration) var(--anim-easing);
}

.blog-list-leave-active {
    /* 关键：position: absolute 会导致脱离文档流，破坏 gap */
    /* 解决方案：不使用 absolute，或者确保父容器是相对定位 */
    /* 这里我们移除 absolute，仅靠 transform 和 opacity 实现淡入淡出 */
    /* 如果必须用 absolute，请确保 .posts-grid 有 position: relative */
    transition:
        opacity var(--anim-duration) var(--anim-easing),
        transform var(--anim-duration) var(--anim-easing);
}

/* 移动动画 (当列表重新排序时) */
.blog-list-move {
    transition: transform var(--anim-duration) var(--anim-easing);
}

/* --- 响应式 --- */
@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
    }

    .sidebar-column {
        order: -1;
        min-width: auto;
        margin-bottom: 20px;
    }

    .content-column {
        width: 100%;
    }
}
</style>