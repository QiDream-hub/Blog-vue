<!-- components/Footer.vue -->
<template>
    <footer class="app-footer">
        <div class="footer-content">
            <div class="footer-section footer-brand">
                <Logo :show-text="true" :clickable="true" />
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
                <a href="mailto:30505023815@qq.com" target="_blank" rel="noopener">📧 邮箱</a>
                <p>📍 虚拟宇宙 · 开发者星系</p>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; {{ currentYear }} 祁梦的小屋. 保留所有权利。</p>
            <p class="footer-copyright-extra">用心写代码，用爱写文章 ❤️</p>
        </div>
    </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Logo from './Logo.vue'

// 获取当前年份
const currentYear = ref(new Date().getFullYear())

// 复用导航路由逻辑（与 Navbar 一致）
const router = useRouter()
const navRoutes = router.options.routes.filter(
    (route) => route.name && route.meta?.showInNav !== false
)
</script>

<style lang="scss" scoped>
.app-footer {
    background-color: var(--bg-color);
    color: var(--secondary-color);
    padding: 3rem 2rem 1.5rem;
    border-top: 1px solid var(--border-color);
    transition: var(--transition-bg-color);

    .footer-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 2.5rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .footer-section {
        h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1.2rem;
            color: var(--secondary-color);
            position: relative;

            &::after {
                content: '';
                position: absolute;
                left: 0;
                bottom: -0.4rem;
                width: 2rem;
                height: 2px;
                background: linear-gradient(90deg, var(--primary-color), transparent);
                border-radius: 1px;
            }
        }

        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        li {
            margin-bottom: 0.7rem;
        }

        a {
            text-decoration: none;
            color: var(--secondary-color);
            transition: all 0.25s ease;
            position: relative;
            padding-left: 0.3rem;

            &:hover {
                color: var(--primary-color);
                padding-left: 0.5rem;
            }
        }

        p {
            margin: 0.5rem 0;
            line-height: 1.6;
            color: var(--secondary-color);
        }
    }

    .footer-brand {
        .logo-component {

            // 缩小 Footer 中的 Logo 尺寸，使其与其他 section 高度一致
            .logo-icon {
                width: 28px;
                height: 28px;
            }

            .logo-text {
                font-size: 1.1rem;
            }
        }

        .logo-wrapper {
            margin-bottom: 0.6rem;
        }

        // 确保品牌部分的内容基线与其他部分对齐
        >*:first-child {
            margin-top: 0.2rem;
        }
    }

    .footer-desc {
        font-size: 0.95rem;
        color: var(--secondary-color);
        line-height: 1.7;
        max-width: 280px;
    }

    .footer-contact {
        a {
            display: inline-block;
            margin-bottom: 0.5rem;
        }
    }

    .footer-bottom {
        text-align: center;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-light-color);
        color: var(--meta-color);
        font-size: 0.9rem;

        p {
            margin: 0.4rem 0;
        }

        .footer-copyright-extra {
            color: var(--primary-color);
            font-style: italic;
            font-size: 0.85rem;
        }
    }

    // 平板响应式
    @media (max-width: 992px) {
        .footer-content {
            gap: 2rem;
        }
    }

    // 手机响应式
    @media (max-width: 768px) {
        .app-footer {
            padding: 2rem 1.5rem 1rem;
        }

        .footer-content {
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
        }

        .footer-section {
            display: flex;
            flex-direction: column;
            align-items: center;

            h4 {
                &::after {
                    left: 50%;
                    transform: translateX(-50%);
                }
            }

            a {
                &:hover {
                    padding-left: 0.3rem;
                }
            }
        }

        // Footer 中的 Logo 在移动端进一步缩小
        .footer-brand {
            .logo-component {
                .logo-icon {
                    width: 24px;
                    height: 24px;
                }

                .logo-text {
                    font-size: 1rem;
                }
            }
        }

        .footer-desc {
            max-width: none;
        }

        .footer-bottom {
            margin-top: 2rem;
            padding-top: 1.2rem;
        }
    }

    // 小屏手机
    @media (max-width: 480px) {
        .footer-bottom {
            font-size: 0.85rem;

            .footer-copyright-extra {
                font-size: 0.8rem;
            }
        }
    }
}
</style>