<template>
    <article class="tag-card" role="link" tabindex="0">
        <div class="tag-card__content">
            <h2 class="tag-card__title">{{ name }}</h2>
            <p v-if="description" class="tag-card__description">{{ description }}</p>
            <div v-if="count !== undefined" class="tag-card__meta">
                {{ count }} 篇文章
            </div>
        </div>
    </article>
</template>

<script setup>
const props = defineProps({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    count: {
        type: Number,
        default: undefined // 若不传，则不显示数量
    },
})

</script>

<style lang="scss" scoped>
.tag-card {
    width: 100%;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(93, 138, 168, 0.12);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    padding: 1.2rem;
    user-select: none;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 20px rgba(93, 138, 168, 0.18);
    }

    &__title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #ff6b9d;
        /* 使用标签主色调 */
        margin: 0 0 0.6rem;
        line-height: 1.4;
    }

    &__description {
        font-size: 0.95rem;
        color: #6a8ba8;
        line-height: 1.6;
        margin: 0 0 0.8rem;
        flex: 1;
    }

    &__meta {
        font-size: 0.85rem;
        color: #999;
        font-weight: 500;
    }
}

@media (max-width: 480px) {
    .tag-card {
        padding: 1rem;
    }
}
</style>