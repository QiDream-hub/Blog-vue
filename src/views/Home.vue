<template>
    <div class="main-layout">
        <!-- 左侧：搜索 + 博客卡片 -->
        <div class="content-column">
            <!-- 加载状态 -->
            <LoadingSpinner v-if="loading" message="加载中..." />

            <!-- 正常内容 -->
            <template v-else>
                <!-- 刷新状态指示器 -->
                <div class="refresh-indicator">
                    <span v-if="refreshing" class="refresh-indicator__status refresh-indicator__status--refreshing">
                        <span class="refresh-indicator__spinner"></span>
                        更新中...
                    </span>
                    <span v-else class="refresh-indicator__status">
                        已更新：{{ lastUpdated ? formatTime(lastUpdated) : '-' }}
                    </span>
                    <button 
                        class="refresh-indicator__btn" 
                        @click="refresh"
                        :disabled="refreshing"
                        title="手动刷新"
                    >
                        <span class="refresh-indicator__icon">↻</span>
                    </button>
                </div>

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
            <LoadingSpinner v-if="tagsLoading" message="加载标签..." />

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
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogCache } from '@/composables/useBlogCache'

defineOptions({
  name: '首页'
})

const router = useRouter()
const searchText = ref('')
const searchTag = ref([])

// 使用博客缓存策略（5 分钟自动刷新）
const {
  posts,
  tags,
  loading,
  tagsLoading,
  refreshing,
  lastUpdated,
  error,
  refresh
} = useBlogCache(5 * 60 * 1000)

// 监听错误，无缓存时路由到错误页面
let hasCachedData = false

// 初始化时检查是否有缓存
const cachedPosts = localStorage.getItem('blog_cache_posts')
const cachedTags = localStorage.getItem('blog_cache_tags')
hasCachedData = !!(cachedPosts && cachedTags)

// 监听错误状态
watch(error, (err) => {
  if (err && !hasCachedData) {
    // 无缓存且加载失败，路由到错误页面
    console.error('[Home] Load failed, redirecting to error page:', err)
    router.replace('/error/home/load-failed')
  }
})

// 格式化时间显示
function formatTime(date) {
  if (!date) return '-'
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return date.toLocaleDateString('zh-CN')
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

/* --- 刷新指示器 --- */
.refresh-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 90%;
    max-width: 600px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background-color: var(--bg-secondary-color);
    border-radius: 8px;
    border: 1px solid var(--border-light-color);
}

.refresh-indicator__status {
    font-size: 0.85rem;
    color: var(--meta-color);
    display: flex;
    align-items: center;
    gap: 6px;
}

.refresh-indicator__status--refreshing {
    color: var(--primary-color);
}

.refresh-indicator__spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-light-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.refresh-indicator__btn {
    margin-left: auto;
    padding: 4px 8px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.refresh-indicator__btn:hover:not(:disabled) {
    background-color: var(--hover-bg-color);
    border-color: var(--primary-color);
}

.refresh-indicator__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.refresh-indicator__icon {
    font-size: 1rem;
    line-height: 1;
    color: var(--text-color);
}

.refresh-indicator__btn:hover:not(:disabled) .refresh-indicator__icon {
    color: var(--primary-color);
    transform: rotate(180deg);
    transition: transform 0.3s ease;
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
