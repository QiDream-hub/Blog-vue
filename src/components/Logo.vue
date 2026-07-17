<!-- components/Logo.vue -->
<template>
  <div class="logo-component" :class="{ 'logo-clickable': clickable }" @click="handleClick">
    <svg class="logo-icon" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="var(--primary-color)"/>
      <text x="35" y="68" font-family="monospace" font-size="52" font-weight="bold" fill="var(--bg-color)">&gt;_</text>
    </svg>
    <span v-if="showText" class="logo-text">祁梦的小屋</span>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  // 是否显示文字
  showText: {
    type: Boolean,
    default: true
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  },
  // 点击跳转路径，默认为首页
  to: {
    type: String,
    default: '/'
  }
})

const router = useRouter()

const handleClick = () => {
  if (props.clickable && props.to) {
    router.push(props.to)
  }
}
</script>

<style lang="scss" scoped>
.logo-component {
  display: flex;
  align-items: center;
  gap: 0.6rem;

  &.logo-clickable {
    cursor: pointer;
    transition: color 0.25s ease, transform 0.2s ease;

    &:hover {
      color: var(--selected-color);
      transform: scale(1.02);

      .logo-icon {
        transform: rotate(-5deg);
      }
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
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--secondary-color);
  line-height: 1;
  white-space: nowrap;
}

// 响应式：小屏下调整尺寸
@media (max-width: 768px) {
  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 1.2rem;
  }
}
</style>
