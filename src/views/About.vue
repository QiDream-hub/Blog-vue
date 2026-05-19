<template>
  <div class="about-page">
    <div class="container">
      <h1 class="title">关于博客</h1>
      <div class="card">
        <p>
          👋 你好！我是这个博客的作者，一个热爱写作与代码的开发者。
        </p>
        <p>
          这个博客是我用来记录学习笔记、分享技术心得和生活思考的小天地。每一篇文章都倾注了我的热情与时间，希望它们能对你有所帮助。
        </p>

        <h2>🎨 设计理念</h2>
        <p>
          界面使用 <strong>主题化配色系统</strong>（由 <code>themes.js</code> 管理），支持多主题切换：
        </p>
        <ul class="theme-list">
          <li><strong>🌸 樱花粉</strong> - 粉蓝白清爽配色，适合日常阅读</li>
          <li><strong>🌙 午夜蓝</strong> - 深色模式，护眼舒适</li>
          <li><strong>🌲 森林绿</strong> - 自然清新风格</li>
          <li><strong>🌅 落日橙</strong> - 温暖活泼色调</li>
        </ul>
        <p style="margin-top: 0.8rem;">
          所有主题均基于 CSS 变量实现，通过 <code>--primary-color</code>、<code>--bg-color</code> 等变量统一控制界面样式。
        </p>

        <h2>🛠 技术栈</h2>
        <ul class="tech-list">
          <li>前端框架：<strong>Vue 3 + Vite</strong></li>
          <li>路由管理：<strong>Vue Router</strong></li>
          <li>样式预处理：<strong>SCSS</strong></li>
          <li>部署方式：<strong>静态站点（支持 History 模式）</strong></li>
        </ul>

        <h2>🏗 架构设计</h2>
        <p>
          本博客采用 <strong>三层分离架构</strong>，实现内容管理与前端展示的完全解耦：
        </p>
        <div class="architecture-diagram">
          <div class="arch-layer">
            <span class="layer-icon">🌐</span>
            <strong>Nginx</strong>
            <span class="layer-desc">反向代理 + 静态资源</span>
          </div>
          <div class="arch-arrow">↓</div>
          <div class="arch-layer">
            <span class="layer-icon">📦</span>
            <strong>lmjweb</strong>
            <span class="layer-desc">元数据服务 (obj/set)</span>
          </div>
          <div class="arch-arrow">↓</div>
          <div class="arch-layer">
            <span class="layer-icon">🎨</span>
            <strong>Vue Blog</strong>
            <span class="layer-desc">前端展示层</span>
          </div>
        </div>

        <h3>核心组件</h3>
        <ul class="arch-list">
          <li>
            <strong>Nginx</strong> - 负责反向代理和静态资源服务
            <ul>
              <li><code>/img/{ptr}</code> → 读取图片文件内容</li>
              <li><code>/article/{ptr}</code> → 读取文章内容文件</li>
            </ul>
          </li>
          <li>
            <strong>lmjweb</strong> - 元数据存储服务
            <ul>
              <li>使用 <code>obj</code> 存储对象（博客信息、文章、图片）</li>
              <li>使用 <code>set</code> 存储集合（文章列表、标签）</li>
            </ul>
          </li>
          <li>
            <strong>Vue Blog</strong> - 前端展示
            <ul>
              <li>只读展示，不负责文件上传</li>
              <li>运行时从 <code>/blog.config.json</code> 动态加载配置</li>
            </ul>
          </li>
        </ul>

        <h3>数据结构</h3>
        <div class="data-structure">
          <div class="struct-item">
            <code>博客信息对象</code>
            <span>标题 + 文章集合指针 + 标签集合指针</span>
          </div>
          <div class="struct-item">
            <code>文章对象</code>
            <span>标题 + slug + 封面指针 + 标签集合</span>
          </div>
          <div class="struct-item">
            <code>图片对象</code>
            <span>原始文件名</span>
          </div>
        </div>

        <h2>📬 联系我</h2>
        <p>
          如果你有任何问题、建议，或只是想打个招呼，欢迎通过以下方式联系我：
        </p>
        <div class="contact-links">
          <a href="mailto:30505023815@qq.com" target="_blank" rel="noopener">📧 邮箱</a>
          <a href="https://github.com/QiDream-hub" target="_blank" rel="noopener">🐙 GitHub</a>
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
  background-color: var(--bg-color);
  transition: var(--transition-bg-color);
  min-height: calc(100vh - 80px); // 减去 header 高度估算
  padding: 2rem 1rem;

  .container {
    max-width: 800px;
    margin: 0 auto;

    .title {
      text-align: center;
      color: var(--secondary-color);
      font-size: 2.2rem;
      margin-bottom: 2rem;
      font-weight: 700;
    }

    .card {
      background: var(--bg-secondary-color);
      transition: var(--transition-bg-color);
      padding: 2rem;
      border-radius: 12px;
      /* 阴影基于 --secondary-color，fallback 为 rgba(93,138,168,0.1) */
      box-shadow: var(--shadow-md);
      line-height: 1.7;
      color: var(--text-color);

      h2 {
        color: var(--secondary-color);
        margin-top: 1.5rem;
        margin-bottom: 0.8rem;
        font-size: 1.4rem;
      }

      p {
        margin-bottom: 1rem;
        color: var(--text-color);
        /* 显式声明，避免继承问题 */
      }

      code {
        background: var(--bg-secondary-color);
        transition: var(--transition-bg-color);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        color: var(--secondary-color);
        font-family: monospace;
      }

      .tech-list {
        padding-left: 1.5rem;
        margin: 1rem 0;

        li {
          margin-bottom: 0.5rem;
          color: var(--text-color);
        }
      }

      /* 主题列表样式 */
      .theme-list {
        padding-left: 1.5rem;
        margin: 1rem 0;

        li {
          margin-bottom: 0.5rem;
          color: var(--text-color);
          line-height: 1.6;
        }
      }

      .contact-links {
        display: flex;
        gap: 1.2rem;
        margin: 1rem 0;

        a {
          color: var(--primary-color);
          /* ✅ 使用主强调色 */
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;

          &:hover {
            color: var(--secondary-color);
            /* 与 Footer 一致 */
            text-decoration: underline;
          }
        }
      }

      .footer-note {
        margin-top: 2rem;
        text-align: center;
        color: var(--meta-color);
        font-style: italic;
      }

      /* 架构图样式 */
      .architecture-diagram {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1.5rem;
        background: var(--bg-color);
        border-radius: 8px;
        margin: 1rem 0;

        .arch-layer {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem 1.5rem;
          background: var(--bg-secondary-color);
          border-radius: 8px;
          border: 2px solid var(--border-color);
          min-width: 200px;
          justify-content: center;

          .layer-icon {
            font-size: 1.5rem;
          }

          strong {
            color: var(--secondary-color);
          }

          .layer-desc {
            color: var(--meta-color);
            font-size: 0.85rem;
          }
        }

        .arch-arrow {
          font-size: 1.2rem;
          color: var(--meta-color);
        }
      }

      /* 架构列表样式 */
      .arch-list {
        padding-left: 1.5rem;
        margin: 1rem 0;

        li {
          margin-bottom: 0.8rem;
          color: var(--text-color);

          ul {
            margin-top: 0.5rem;
            padding-left: 1.5rem;

            li {
              margin-bottom: 0.3rem;

              code {
                background: var(--bg-color);
                padding: 0.15em 0.4em;
                border-radius: 4px;
                color: var(--primary-color);
                font-size: 0.9em;
              }
            }
          }
        }
      }

      /* 数据结构展示 */
      .data-structure {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        margin: 1rem 0;

        .struct-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 1rem;
          background: var(--bg-color);
          border-radius: 6px;
          border-left: 3px solid var(--primary-color);

          code {
            min-width: 100px;
            color: var(--primary-color);
            font-weight: 600;
          }

          span {
            color: var(--text-color);
            font-size: 0.9rem;
          }
        }
      }

      h3 {
        color: var(--secondary-color);
        margin-top: 1.5rem;
        margin-bottom: 0.8rem;
        font-size: 1.2rem;
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

      .architecture-diagram {
        padding: 1rem;

        .arch-layer {
          min-width: auto;
          width: 100%;
          box-sizing: border-box;
          flex-direction: column;
          text-align: center;
        }
      }

      .data-structure {
        .struct-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.3rem;

          code {
            min-width: auto;
          }
        }
      }
    }
  }
}
</style>