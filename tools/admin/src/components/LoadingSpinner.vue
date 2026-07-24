<template>
  <div class="loading-spinner" :class="{ 'loading-spinner--fullscreen': fullscreen }">
    <div class="spinner"></div>
    <div v-if="text" class="loading-text">{{ text }}</div>
  </div>
</template>

<script setup>
defineProps({
  fullscreen: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &--fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e0e0e0;
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-text {
    margin-top: 1rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
