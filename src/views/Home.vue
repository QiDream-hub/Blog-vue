<template>
    <div class="main-layout">
        <!-- 左侧：搜索 + 博客卡片 -->
        <div class="content-column">
            <div class="search-container">
                <input type="text" v-model="searchText" placeholder="搜索标题或摘要..." />
            </div>
            <div class="posts-container">
                <BlogCard v-for="post in filteredPosts" :key="post.id" v-bind="post" class="blog-card" />
            </div>
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

    return posts.filter(post => {
        const matchesText = !query ||
            post.title.toLowerCase().includes(query) ||
            post.excerpt.toLowerCase().includes(query)

        const matchesTag = activeTags.length === 0 ||
            activeTags.some(tag => post.tags.includes(tag))

        return matchesText && matchesTag
    })
})

const tags = [
    { name: "编程语言", count: 1 },
    { name: "历史", count: 1 },
    { name: "前端", count: 2 },
]

const posts = [
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
]
</script>

<style scoped>
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
    border: 1px solid var(--border-color, rgba(93, 138, 168, 0.15));
    border-radius: 4px;
}

.posts-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.blog-card {
    max-width: 400px;
    box-sizing: border-box;
}

.tags-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tag-card--selected {
    border: 2px solid var(--primary-color, #ff7aae);
    box-shadow: 0 4px 16px rgba(255, 107, 157, 0.3);
    /* 使用 --primary-color 的变体 */
    transition: all 0.2s ease;

    & .tag-card__title {
        color: #ffffff;
        background-color: var(--primary-color, #ff7aae);
        padding: 0.2rem 0.5rem;
        border-radius: 8px;
    }

    & .tag-card__description,
    & .tag-card__meta {
        color: var(--primary-color, #ff7aae);
    }
}

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