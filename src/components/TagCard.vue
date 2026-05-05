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
        default: undefined
    }
})
</script>

<style lang="scss" scoped>
.tag-card {
    width: 100%;
    background: var(--bg-color);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    padding: 1.2rem;
    user-select: none;

    &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
    }

    &__title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--selected-color);
        margin: 0 0 0.6rem;
        line-height: 1.4;
    }

    &__description {
        font-size: 0.95rem;
        color: var(--secondary-color);
        line-height: 1.6;
        margin: 0 0 0.8rem;
        flex: 1;
    }

    &__meta {
        font-size: 0.85rem;
        color: var(--meta-color);
        font-weight: 500;
    }
}

@media (max-width: 480px) {
    .tag-card {
        padding: 1rem;
    }
}
</style>
