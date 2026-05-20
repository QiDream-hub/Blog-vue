<template>
    <div class="main-layout">
        <!-- 左侧：搜索 + 博客卡片 -->
        <div class="content-column">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>
            
            <!-- 正常内容 -->
            <template v-else>
                <div class="search-container">
                    <input type="text" v-model="searchText" placeholder="搜索标题或摘要..." />
                </div>
                <transition-group name="blog-list" tag="div" class="posts-grid">
                    <BlogCard 
                        v-for="post in filteredPosts" 
                        :key="post.ptr" 
                        v-bind="post" 
                        class="blog-card" 
                    />
                </transition-group>
            </template>
        </div>

        <!-- 右侧：标签栏 -->
        <div class="sidebar-column">
            <!-- 标签加载状态 -->
            <div v-if="tagsLoading" class="tags-loading">
                <p>加载标签...</p>
            </div>
            
            <div v-else class="tags-container">
                <TagCard 
                    v-for="tag in tags" 
                    :key="tag.ptr" 
                    :name="tag.name" 
                    :count="tag.count"
                    @click="addOrDelTag(tag.name)"
                    :class="{ 'tag-card--selected': searchTag.includes(tag.name) }" 
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import BlogCard from '@/components/BlogCard.vue'
import TagCard from '@/components/TagCard.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    getBlogInfo,
    getAllPostPtrs,
    batchGetPosts,
    batchGetTagsWithCount
} from '@/api/lmjweb'
import { getImageUrl } from '@/config/blog'

const router = useRouter()
const searchText = ref('')
const searchTag = ref([])
const loading = ref(true)
const tagsLoading = ref(true)

const posts = ref([])
const tags = ref([])

const loadData = async () => {

    try {
        // 1. 获取博客信息
        const blogInfo = await getBlogInfo()

        // 2. 获取所有文章指针
        const postPtrs = await getAllPostPtrs(blogInfo.postsPtr)

        // 3. 批量获取所有文章详情
        const postDetails = await batchGetPosts(postPtrs)

        // 4. 过滤失败的文章，添加图片 URL
        posts.value = postDetails
            .filter(post => post !== null)
            .map(post => ({
                ...post,
                id: post.ptr,
                cover: getImageUrl(post.cover),
                to: `/blogs/${post.ptr}`
            }))

        // 5. 批量获取标签列表及文章数量（优化：单次批量请求）
        const tagsWithCount = await batchGetTagsWithCount(blogInfo.tagsPtr)

        tags.value = tagsWithCount
    } catch (err) {
        console.error('Failed to load blog data:', err)
        // 路由到错误页面
        router.replace('/error/home/load-failed')
    } finally {
        loading.value = false
        tagsLoading.value = false
    }
}

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
            (post.excerpt && post.excerpt.toLowerCase().includes(query))

        const matchesTag = activeTags.length === 0 ||
            activeTags.some(tag => post.tags && post.tags.includes(tag))

        return matchesText && matchesTag
    })
})

onMounted(() => {
    loadData()
})
</script>

<style lang="scss" scoped>
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

/* --- 加载状态 --- */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.tags-loading {
    text-align: center;
    padding: 20px;
    color: var(--description-color);
}

/* --- 卡片网格 --- */
.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    list-style: none;
    padding: 0;
    margin: 0;
}

.blog-card {
    max-width: 400px;
    box-sizing: border-box;
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

/* --- 动画 --- */
.blog-list-enter-from {
    opacity: 0;
    transform: translateY(var(--anim-translate-y));
}

.blog-list-leave-to {
    opacity: 0;
    transform: translateY(calc(var(--anim-translate-y) * -1));
}

.blog-list-enter-active,
.blog-list-leave-active {
    transition:
        opacity var(--anim-duration) var(--anim-easing),
        transform var(--anim-duration) var(--anim-easing);
}

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
