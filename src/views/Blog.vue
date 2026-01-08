<template>
  <BlogPostView
    :title="post.title"
    :content="post.content"
    :tags="post.tags"
  />
</template>

<script setup>
import BlogPostView from '@/components/BlogPostView.vue'

const post = {
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
}
</script>