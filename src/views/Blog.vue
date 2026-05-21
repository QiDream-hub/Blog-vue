<template>
    <div class="blog-post-container">
        <!-- 加载状态 -->
        <LoadingSpinner v-if="loading" message="加载文章中..." />

        <!-- 文章内容 -->
        <BlogPostView v-else-if="post" v-bind="post" />
    </div>
</template>

<script setup>
import BlogPostView from '@/components/BlogPostView.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail } from '@/api/lmjweb'
import { getArticleUrl, getImageUrl } from '@/config/blog'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)

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
})
</script>

<style lang="scss" scoped>
.blog-post-container {
    min-height: 60vh;
    position: relative;
}
</style>
