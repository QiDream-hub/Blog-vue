<template>
  <article class="blog-card" @click="handleClick" role="link" tabindex="0">
    <!-- 封面图（如果有） -->
    <div v-if="cover" class="blog-card__cover">
      <img :src="cover" :alt="title" loading="lazy" />
    </div>

    <!-- 内容区 -->
    <div class="blog-card__content">
      <h2 class="blog-card__title">{{ title }}</h2>
      <p class="blog-card__excerpt">{{ excerpt || '暂无简介' }}</p>

      <!-- 标签区 -->
      <div v-if="tags && tags.length" class="blog-card__tags">
        <span v-for="tag in tags" :key="tag" class="blog-card__tag">
          #{{ tag }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    default: ''
  },
  cover: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  },
  to: {
    type: [String, Object],
    default: ''
  }
})

const router = useRouter()

const handleClick = () => {
  if (props.to) {
    router.push(props.to)
  }
}
</script>

<style lang="scss" scoped>
.blog-card {
  width: 100%;
  background: var(--bg-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  &__cover {
    width: 100%;
    padding-top: 56.25%; // 对应于 16:9 的比例
    position: relative;
    overflow: hidden;
    background: var(--bg-secondary-color);

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;

      .blog-card:hover & {
        transform: scale(1.03);
      }
    }
  }

  &__content {
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--secondary-color);
    margin: 0 0 0.8rem;
    line-height: 1.4;
  }

  &__excerpt {
    font-size: 0.95rem;
    color: var(--description-color);
    line-height: 1.6;
    margin: 0 0 1rem;
    flex: 1;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__tag {
    background-color: var(--tag-bg-color);
    color: var(--tag-text-color);
    font-size: 0.85rem;
    padding: 0.25rem 0.6rem;
    border-radius: 20px;
    font-weight: 600;
  }
}

@media (max-width: 480px) {
  .blog-card {
    max-width: none;

    &__cover {
      padding-top: 50%;
    }
  }
}
</style>
