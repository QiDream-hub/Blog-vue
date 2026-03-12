<template>
    <nav class="navbar">
        <router-link v-for="route in routes" :key="route.path" :to="route.path" class="nav-link"
            active-class="nav-link--active">
            {{ route.name }}
        </router-link>
    </nav>
</template>

<script setup>
import router from '@/router'

// 过滤出需要在导航中显示的路由
const routes = router.options.routes.filter(
    (route) => route.name && route.meta?.showInNav !== false
)
</script>

<style lang="scss" scoped>
.navbar {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    transition: var(--transition-bg-color);
}

.nav-link {
    text-decoration: none;
    color: var(--secondary-color, #5d8aa8);
    font-weight: 600;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background-color: var(--primary-color, #ff9eb5);
        transition: all 0.3s ease;
        transform: translateX(-50%);
    }

    &:hover {
        color: var(--selected-color, #ff6b9d);

        &::after {
            width: 80%;
        }
    }
}

.nav-link--active {
    color: var(--selected-color, #ff6b9d) !important;
    background-color: var(--selected-bg-color, rgba(255, 158, 181, 0.1)) !important;

    &::after {
        width: 100% !important;
        background-color: var(--selected-color, #ff6b9d);
    }
}
</style>