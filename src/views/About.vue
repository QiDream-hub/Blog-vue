<template>
  <div class="about-page">
    <div class="container">
      <h1 class="title">关于我</h1>
      <div class="card">
        <p>
          👋 你好！我是这个博客的作者，一个热爱写作与代码的开发者。
        </p>
        <p>
          这个博客是我用来记录学习笔记、分享技术心得和生活思考的小天地。每一篇文章都倾注了我的热情与时间，希望它们能对你有所帮助。
        </p>

        <h2>🎨 设计理念</h2>
        <p>
          界面采用清爽的 <strong>粉蓝白配色</strong>：  
          - 主色调 <code>#5d8aa8</code>（宁静蓝）用于标题与链接；  
          - 强调色 <code>#ff6b9d</code>（活力粉）用于交互与高亮；  
          - 背景与卡片保持纯白，确保阅读舒适。
        </p>

        <h2>🛠 技术栈</h2>
        <ul class="tech-list">
          <li>前端框架：<strong>Vue 3 + Vite</strong></li>
          <li>路由管理：<strong>Vue Router</strong></li>
          <li>样式预处理：<strong>SCSS</strong></li>
          <li>部署方式：<strong>静态站点（支持 History 模式）</strong></li>
        </ul>

        <h2>📬 联系我</h2>
        <p>
          如果你有任何问题、建议，或只是想打个招呼，欢迎通过以下方式联系我：
        </p>
        <div class="contact-links">
          <a href="mailto:your-email@example.com" target="_blank" rel="noopener">📧 邮箱</a>
          <a href="https://github.com/your-username" target="_blank" rel="noopener">🐙 GitHub</a>
        </div>

        <p class="footer-note">
          感谢你的访问！愿你在探索知识的路上，始终充满好奇与勇气 💫
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 无需逻辑，纯展示页面
</script>

<style lang="scss" scoped>
.about-page {
  background-color: #ffffff;
  min-height: calc(100vh - 80px); // 减去 header 高度估算
  padding: 2rem 1rem;

  .container {
    max-width: 800px;
    margin: 0 auto;

    .title {
      text-align: center;
      color: #5d8aa8;
      font-size: 2.2rem;
      margin-bottom: 2rem;
      font-weight: 700;
    }

    .card {
      background: #fff;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(93, 138, 168, 0.1);
      line-height: 1.7;
      color: #333;

      h2 {
        color: #5d8aa8;
        margin-top: 1.5rem;
        margin-bottom: 0.8rem;
        font-size: 1.4rem;
      }

      p {
        margin-bottom: 1rem;
      }

      code {
        background: #f0f8ff;
        padding: 0.2em 0.4em;
        border-radius: 4px;
        color: #5d8aa8;
        font-family: monospace;
      }

      .tech-list {
        padding-left: 1.5rem;
        margin: 1rem 0;

        li {
          margin-bottom: 0.5rem;
        }
      }

      .contact-links {
        display: flex;
        gap: 1.2rem;
        margin: 1rem 0;

        a {
          color: #ff6b9d;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;

          &:hover {
            color: #5d8aa8;
            text-decoration: underline;
          }
        }
      }

      .footer-note {
        margin-top: 2rem;
        text-align: center;
        color: #777;
        font-style: italic;
      }
    }
  }
}

// 响应式优化
@media (max-width: 600px) {
  .about-page {
    padding: 1.5rem 0.8rem;

    .container .title {
      font-size: 1.8rem;
    }

    .card {
      padding: 1.5rem;

      .contact-links {
        flex-direction: column;
        gap: 0.8rem;
      }
    }
  }
}
</style>