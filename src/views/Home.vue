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
            <!-- <TagCard style="width: 50px;" v-bind="tags[0]"/> -->
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
    console.log(searchTag.value)
}

const filteredPosts = computed(() => {
    const query = searchText.value.trim().toLowerCase()
    const activeTags = searchTag.value // 当前选中的标签数组

    return posts.filter(post => {
        // 1. 文本搜索（标题 + 摘要）
        const matchesText = !query ||
            post.title.toLowerCase().includes(query) ||
            post.excerpt.toLowerCase().includes(query)

        // 2. 标签筛选：如果没有任何标签被选中，则跳过标签过滤
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
    /* max-width: 1200px; */
    margin: 0 auto;
    padding: 20px;
}

.content-column {
    flex: 2;
    /* 占比更大 */
    min-width: 0;
    /* 防止 flex 子项溢出 */
}

.sidebar-column {
    flex: 1;
    /* 较窄的侧边栏 */
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
    border: 1px solid #ccc;
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
    border: 2px solid #ff6b9d;
    /* 使用标题的颜色作为边框颜色，以增强视觉焦点 */
    box-shadow: 0 4px 16px rgba(255, 107, 157, 0.3);
    /* 增加一点阴影效果，使用标题颜色的变体 */

    & .tag-card__title {
        color: #ffffff;
        /* 标题变为白色，使其在任何背景上都突出 */
        background-color: #ff6b9d;
        /* 背景颜色与标题颜色一致，给标题一个强调 */
        padding: 0.2rem 0.5rem;
        /* 给标题一些内边距 */
        border-radius: 8px;
        /* 圆角处理 */
    }

    & .tag-card__description,
    & .tag-card__meta {
        color: #ff6b9d;
        /* 文字颜色调整为标题颜色的变体，保持一致性 */
    }
}

@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
    }

    /* 手机端：标签栏在上 */
    .sidebar-column {
        order: -1;
        /* 提到最前面 */
        min-width: auto;
        margin-bottom: 20px;
        /* 和下方内容留点间距 */
    }

    .content-column {
        width: 100%;
    }
}
</style>