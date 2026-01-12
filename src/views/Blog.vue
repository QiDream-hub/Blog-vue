<template>
  <BlogPostView v-bind="post" />
</template>

<script setup>
import BlogPostView from '@/components/BlogPostView.vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const posts = [{
  title: '我的第一篇博客',
  content: `# 欢迎使用 Markdown

这是一个用 **Vue + v-md-editor** 渲染的博客示例。

- 支持代码高亮
- 支持图片
- 支持列表、表格等

\`\`\`js
console.log('Hello, pink-blue-white theme!')
\`\`\`

> 这是一段引用，使用了粉色边框突出显示。
`,
  tags: ['Vue', 'Markdown', '前端']
},
{
  title: "js-guide",
  content: `# 路径测试`,
  tags: ['Vue', 'Markdown', '前端']
}
]

const props = defineProps({
  slug: {
    type: String,
    default: ""
  }
})

const route = useRoute()
const router = useRouter()
const post = ref(null)

const loadPost = async () => {
  const slug = route.params.slug
  const found = posts.find(p => p.title === slug) // 测试数据使用title匹配,后期替换路径请求
  if (!found) {
    router.replace('/error/blog/not-found')
    return
  }
  post.value = found
}

// 初始加载 + 监听变化
watch(
  () => route.params.slug,
  loadPost,
  { immediate: true }
)
</script>

<style lang="scss" scoped></style>