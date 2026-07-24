<template>
  <div class="dashboard">
    <h1 class="page-title">仪表盘</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.articles }}</div>
          <div class="stat-label">文章</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🖼️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.images }}</div>
          <div class="stat-label">图片</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🏷️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.tags }}</div>
          <div class="stat-label">标签</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <div class="stat-value">{{ blogTitle }}</div>
          <div class="stat-label">博客名称</div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="card-header">
        <h2>快速操作</h2>
      </div>
      <div class="quick-actions">
        <router-link to="/articles/new">
          <button class="admin-btn admin-btn--primary">
            <span>✨ 新建文章</span>
          </button>
        </router-link>
        <router-link to="/images">
          <button class="admin-btn admin-btn--success">
            <span>🖼️ 管理图片</span>
          </button>
        </router-link>
        <router-link to="/tags">
          <button class="admin-btn admin-btn--secondary">
            <span>🏷️ 管理标签</span>
          </button>
        </router-link>
      </div>
    </div>

    <div class="admin-card">
      <div class="card-header">
        <h2>系统状态</h2>
      </div>
      <div class="system-status">
        <div class="status-item">
          <span class="status-label">lmjweb 服务</span>
          <span :class="['status-value', healthStatus ? 'status-ok' : 'status-error']">
            {{ healthStatus ? '✓ 正常' : '✗ 异常' }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">API 地址</span>
          <span class="status-value">{{ apiUrl }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { publisher } from '@shared/api/publisher'
import { getConfig } from '@shared/config/blog'
import { healthCheck } from '@shared/api/lmjweb'

const stats = ref({
  articles: 0,
  images: 0,
  tags: 0
})

const blogTitle = ref('')
const healthStatus = ref(false)
const apiUrl = ref('')

onMounted(async () => {
  try {
    // 加载统计数据
    const [articles, images, tags] = await Promise.all([
      publisher.getAllArticles(),
      publisher.getAllImages(),
      publisher.getAllTags()
    ])

    stats.value = {
      articles: articles.length,
      images: images.length,
      tags: tags.length
    }

    // 加载博客信息
    const blogInfo = await publisher.getBlogInfo()
    blogTitle.value = blogInfo.members.find(m => m.name === 'title')?.value || '未知'

    // 健康检查
    try {
      const health = await healthCheck()
      healthStatus.value = health.status === 'ok'
    } catch (e) {
      healthStatus.value = false
    }

    apiUrl.value = getConfig().LMJWEB_API
  } catch (e) {
    console.error('加载仪表盘数据失败:', e)
  }
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .stat-icon {
    font-size: 2.5rem;
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
  }
}

.quick-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.system-status {
  .status-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    .status-label {
      color: var(--text-secondary);
    }

    .status-value {
      font-weight: 500;

      &.status-ok {
        color: #67c23a;
      }

      &.status-error {
        color: #f56c6c;
      }
    }
  }
}
</style>
