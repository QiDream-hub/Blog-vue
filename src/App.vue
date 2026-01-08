<script setup></script>

<template>
  <div id="app" class="app-layout">
    <header>
      <AppHader />
    </header>

    <main class="main-content ">
      <router-view />
    </main>

    <footer>
      <AppFooter />
    </footer>
  </div>
</template>

<style lang="scss">
// 全局或 scoped 都可，建议用 scoped + deep 或全局样式
.app-layout {
  min-height: 100vh; // 至少占满整个视口高度
  display: flex;
  flex-direction: column; // 垂直排列子元素
}


.main-content {
  flex: 1; // 关键！让 main 占据剩余所有空间
  padding: 2rem;
  background-color: #fafafa;
}
</style>