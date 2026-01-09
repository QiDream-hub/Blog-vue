<!-- components/Footer.vue -->
<template>
    <footer class="app-footer">
        <div class="footer-content">
            <div class="footer-section footer-brand">
                <h3 class="footer-logo">📝 My Blog</h3>
                <p class="footer-desc">记录技术点滴，分享思考与成长。</p>
            </div>

            <!-- <div class="footer-section footer-links">
                <h4>导航</h4>
                <ul>
                    <li v-for="route in navRoutes" :key="route.path">
                        <router-link :to="route.path">{{ route.name }}</router-link>
                    </li>
                </ul>
            </div> -->

            <div class="footer-section footer-contact">
                <h4>联系我</h4>
                <p>📧 email@example.com</p>
                <p>📍 虚拟宇宙 · 开发者星系</p>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; {{ currentYear }} My Blog. 保留所有权利。</p>
            <p class="footer-copyright-extra">用心写代码，用爱写文章 ❤️</p>
        </div>
    </footer>
</template>

<script setup>
import { ref } from 'vue'
import router from '@/router'

// 获取当前年份
const currentYear = ref(new Date().getFullYear())

// 复用导航路由逻辑（与 Navbar 一致）
const navRoutes = router.options.routes.filter(
    (route) => route.name && route.meta?.showInNav !== false
)
</script>

<style lang="scss" scoped>
.app-footer {
    background-color: #ffffff;
    color: #5d8aa8;
    padding: 2.5rem 2rem 1.5rem;
    border-top: 1px solid rgba(93, 138, 168, 0.15);

    .footer-content {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        flex-wrap: wrap;
    }

    .footer-section {
        flex: 1;
        min-width: 200px;

        h4 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #5d8aa8;
        }

        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        li {
            margin-bottom: 0.6rem;
        }

        a {
            text-decoration: none;
            color: #5d8aa8;
            transition: color 0.2s ease;

            &:hover {
                color: #ff6b9d;
            }
        }

        p {
            margin: 0.4rem 0;
            line-height: 1.5;
        }
    }

    .footer-logo {
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 0.6rem;
        color: #5d8aa8;
        cursor: pointer;
        display: inline-block;

        &:hover {
            color: #ff6b9d;
        }
    }

    .footer-desc {
        font-size: 0.95rem;
        color: #7a9bb8;
    }

    .footer-bottom {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.2rem;
        border-top: 1px solid rgba(93, 138, 168, 0.1);
        color: #7a9bb8;
        font-size: 0.9rem;

        p {
            margin: 0.3rem 0;
        }

        .footer-copyright-extra {
            color: #ff9eb5;
            font-style: italic;
        }
    }

    // 响应式：小屏堆叠
    @media (max-width: 768px) {
        .footer-content {
            flex-direction: column;
            text-align: center;
        }

        .footer-section h4,
        .footer-section p,
        .footer-section ul {
            text-align: center;
        }

        .footer-section li {
            display: inline-block;
            margin: 0 0.5rem 0.5rem;
        }
    }
}
</style>