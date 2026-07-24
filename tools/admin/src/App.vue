<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h1>博客管理</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="active">
          <span class="nav-icon">📊</span>
          <span>仪表盘</span>
        </router-link>
        <router-link to="/articles" class="nav-item" active-class="active">
          <span class="nav-icon">📝</span>
          <span>文章管理</span>
        </router-link>
        <router-link to="/images" class="nav-item" active-class="active">
          <span class="nav-icon">🖼️</span>
          <span>图片管理</span>
        </router-link>
        <router-link to="/tags" class="nav-item" active-class="active">
          <span class="nav-icon">🏷️</span>
          <span>标签管理</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --sidebar-width: 240px;
  --primary-color: #409eff;
  --sidebar-bg: #1a1a2e;
  --sidebar-text: #eaeaea;
  --sidebar-active: #16213e;
  --bg-color: #f5f7fa;
  --card-bg: #ffffff;
  --text-primary: #303133;
  --text-secondary: #606266;
  --border-color: #dcdfe6;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-color);
}

.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: var(--sidebar-width);
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h1 {
      font-size: 1.25rem;
      font-weight: 600;
    }
  }

  .sidebar-nav {
    padding: 1rem 0;

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      color: var(--sidebar-text);
      text-decoration: none;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      &.active {
        background-color: var(--sidebar-active);
        border-left: 3px solid var(--primary-color);
      }

      .nav-icon {
        margin-right: 0.75rem;
        font-size: 1.2rem;
      }
    }
  }
}

.admin-main {
  margin-left: var(--sidebar-width);
  flex: 1;
  padding: 2rem;
  min-height: 100vh;
}

// 通用组件样式
.admin-card {
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);

    h2 {
      font-size: 1.25rem;
      color: var(--text-primary);
    }
  }
}

.admin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &--primary {
    background-color: var(--primary-color);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }

  &--success {
    background-color: #67c23a;
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }

  &--danger {
    background-color: #f56c6c;
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }

  &--secondary {
    background-color: #909399;
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.admin-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.admin-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    background-color: #fafafa;
    font-weight: 600;
    color: var(--text-primary);
  }

  tr:hover {
    background-color: #fafafa;
  }
}

.admin-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  background-color: #e6f7ff;
  color: #1890ff;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.admin-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.admin-loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}
</style>
