<template>
    <div class="loading-spinner-container">
        <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
        </div>
        <p v-if="message" class="loading-message">{{ message }}</p>
    </div>
</template>

<script setup>
defineProps({
    message: {
        type: String,
        default: '加载中...'
    }
})
</script>

<style lang="scss" scoped>
.loading-spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    min-height: 400px;
}

.loading-spinner {
    position: relative;
    width: 60px;
    height: 60px;
    margin-bottom: 20px;
}

.spinner-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;

    &:nth-child(1) {
        animation-delay: -0.45s;
        border-top-color: var(--primary-color);
    }

    &:nth-child(2) {
        animation-delay: -0.3s;
        border-top-color: var(--secondary-color);
    }

    &:nth-child(3) {
        animation-delay: -0.15s;
        border-top-color: var(--selected-color);
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.loading-message {
    color: var(--text-secondary-color);
    font-size: 0.95rem;
    margin: 0;
    transition: var(--transition-bg-color);
}
</style>
