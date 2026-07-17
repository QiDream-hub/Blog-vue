<!-- components/Header.vue -->
<template>
  <header class="app-header">
    <!-- 左侧：Logo -->
    <div class="header-left">
      <Logo />
    </div>

    <!-- 中间：功能区（主题切换） -->
    <div class="header-center">
      <ThemeToggle />
    </div>

    <!-- 右侧：导航路由 -->
    <div class="header-right">
      <Navbar />
    </div>
  </header>
</template>

<script setup>
import Logo from './Logo.vue';
import Navbar from './Navbar.vue';
import ThemeToggle from './ThemeToggle.vue';
</script>

<style lang="scss" scoped>
.app-header {
  background-color: var(--bg-color);
  padding: 1rem 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: var(--transition-bg-color);

  // 小屏：垂直堆叠
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1.2rem;
  }
}

// 左侧：Logo
.header-left {
  flex: 0 0 auto;
  display: flex;
  align-items: center;

  .logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--secondary-color);
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.25s ease, transform 0.2s ease;

    &:hover {
      color: var(--selected-color);
      transform: scale(1.02);

      .logo-icon {
        transform: rotate(-5deg);
      }
    }
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .logo-text {
    line-height: 1;
  }

  @media (max-width: 768px) {
    justify-content: center;
  }
}

// 中间：功能区（居中对齐）
.header-center {
  flex: 1; // 占据剩余空间，实现左右固定、中间居中
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;

  // 小屏时取消 flex:1，避免拉伸
  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    justify-content: center;
  }
}

// 右侧：导航
.header-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
}
</style>