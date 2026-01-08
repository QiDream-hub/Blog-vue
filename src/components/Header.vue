<template>
  <header class="app-header">
    <div class="logo" @click="$router.push('/')">
      📝 My Blog
    </div>
    <Navbar />
  </header>
</template>

<script setup>
import Navbar from './Navbar.vue'
</script>

<style lang="scss" scoped>
.app-header {
  background-color: #ffffff;
  padding: 0.8rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  // 响应式：小屏时堆叠
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
}

.logo {
  font-size: 1.4rem;
  font-weight: 700;
  color: #5d8aa8;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #ff6b9d;
  }
}
</style>