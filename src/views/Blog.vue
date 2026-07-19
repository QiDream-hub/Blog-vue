<template>
    <div class="blog-post-container">
        <!-- 加载状态 -->
        <LoadingSpinner v-if="loading" message="加载文章中..." />

        <!-- 文章内容 -->
        <BlogPostView v-else-if="post" v-bind="post" />

        <!-- 回到顶部悬浮球 -->
        <transition name="fade">
            <div
                v-if="showBackToTop"
                class="back-to-top"
                @click="scrollToTop"
                title="回到顶部"
            >
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                        fill="currentColor"
                        d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
                    />
                </svg>
            </div>
        </transition>
    </div>
</template>

<script setup>
import BlogPostView from '@/components/BlogPostView.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail } from '@/api/blog'
import { getArticleUrl, getImageUrl } from '@/config/blog'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)
const showBackToTop = ref(false)

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}

const handleScroll = () => {
    showBackToTop.value = window.scrollY > 300
}

const loadPost = async () => {
    loading.value = true
    post.value = null

    try {
        const ptr = route.params.ptr

        if (!ptr) {
            router.replace('/error/blog/not-found')
            return
        }

        // 1. 获取文章详情
        const postDetail = await getPostDetail(ptr)

        // 2. 从 Nginx 获取文章内容
        const contentResponse = await fetch(getArticleUrl(ptr))
        if (!contentResponse.ok) {
            throw new Error('文章内容加载失败')
        }
        const content = await contentResponse.text()

        // 3. 组装完整文章数据
        post.value = {
            title: postDetail.title,
            content: content,
            tags: postDetail.tags || [],
            cover: getImageUrl(postDetail.cover)
        }
    } catch (err) {
        console.error('Failed to load post:', err)
        // 路由到错误页面
        router.replace('/error/blog/load-failed')
    } finally {
        loading.value = false
    }
}

// 监听路由变化重新加载
watch(
    () => route.params.ptr,
    () => loadPost()
)

onMounted(() => {
    loadPost()
    window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
.blog-post-container {
    min-height: 60vh;
    position: relative;
}

.back-to-top {
    position: fixed;
    right: 30px;
    bottom: 50px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: background-color 0.3s, transform 0.3s;
    z-index: 1000;

    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
        transform: translateY(-3px);
    }

    &:active {
        transform: translateY(-1px);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
