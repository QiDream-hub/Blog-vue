<template>
  <div class="about-page">
    <BlogPostView :title="pageTitle" :content="content" :tags="[]" />
  </div>
</template>

<script setup>
import BlogPostView from '@/components/BlogPostView.vue'

const pageTitle = '关于博客'

const content = `👋 你好！我是这个博客的作者，一个热爱写作与代码的开发者。

这个博客是我用来记录学习笔记、分享技术心得和生活思考的小天地。每一篇文章都倾注了我的热情与时间，希望它们能对你有所帮助。

## 🎨 设计理念

界面使用 **主题化配色系统**（由 \`themes.js\` 管理），支持多主题切换：

- **🌸 樱花粉** - 粉蓝白清爽配色，适合日常阅读
- **🌙 午夜蓝** - 深色模式，护眼舒适
- **🌲 森林绿** - 自然清新风格
- **🌅 落日橙** - 温暖活泼色调

所有主题均基于 CSS 变量实现，通过 \`--primary-color\`、\`--bg-color\` 等变量统一控制界面样式。

## 🛠 技术栈

- 前端框架：**Vue 3 + Vite**
- 路由管理：**Vue Router**
- 样式预处理：**SCSS**
- 部署方式：**静态站点（支持 History 模式）**

## 🏗 架构设计

本博客采用 **三层分离架构**，实现内容管理与前端展示的完全解耦：

\`\`\`mermaid
graph TD
    A["🌐 Nginx<br/>反向代理 + 静态资源"] --> B["📦 lmjweb<br/>元数据服务 obj/set"]
    B --> C["🎨 Vue Blog<br/>前端展示层"]
\`\`\`

### 核心组件

- **Nginx** - 负责反向代理和静态资源服务
  - \`/img/{ptr}\` → 读取图片文件内容
  - \`/article/{ptr}\` → 读取文章内容文件

- **lmjweb** - 元数据存储服务
  - 使用 \`obj\` 存储对象（博客信息、文章、图片）
  - 使用 \`set\` 存储集合（文章列表、标签）

- **Vue Blog** - 前端展示
  - 只读展示，不负责文件上传
  - 运行时从 \`/blog.config.json\` 动态加载配置

### 数据结构

- \`博客信息对象\` - 标题 + 文章集合指针 + 标签集合指针
- \`文章对象\` - 标题 + slug + 封面指针 + 标签集合
- \`图片对象\` - 原始文件名

## 📬 联系我

如果你有任何问题、建议，或只是想打个招呼，欢迎通过以下方式联系我：

- [📧 邮箱](mailto:30505023815@qq.com)
- [🐙 GitHub](https://github.com/QiDream-hub)

---
*感谢你的访问！愿你在探索知识的路上，始终充满好奇与勇气 💫*
`
</script>

<style lang="scss" scoped>
.about-page {
  background-color: var(--bg-color);
  transition: var(--transition-bg-color);
  min-height: calc(100vh - 80px);
}
</style>