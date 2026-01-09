<template>
    <div>
        <div style="width: 60%;">
            <div class="search-container">
                <input type="text" v-model="searchText" placeholder="搜索标题或摘要..." />
            </div>
            <div class="posts-container">
                <BlogCard v-for="post in filteredPosts" :key="post.id" v-bind="post" class="blog-card" />
            </div>
        </div>
        <div>
            <div>
                <p>ddd</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import BlogCard from '@/components/BlogCard.vue'
import { ref, computed } from 'vue'

const searchText = ref('')

// 使用 computed 提高性能：只在 searchText 或 posts 变化时重新计算
const filteredPosts = computed(() => {
    const query = searchText.value.trim()
    if (!query) {
        return posts // 无搜索词时显示全部
    }

    const lowerQuery = query.toLowerCase()
    return posts.filter(post => {
        const title = (post.title || '').toLowerCase()
        const excerpt = (post.excerpt || '').toLowerCase()
        return title.includes(lowerQuery) || excerpt.includes(lowerQuery)
    })
})

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
        to: '/blogs/vue3-reactivity',
    },
]
</script>

<style scoped>
.search-container {
    width: 100%;
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
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
}

.blog-card {
    max-width: 400px;
    box-sizing: border-box;
}
</style>