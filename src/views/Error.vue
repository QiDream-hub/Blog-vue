<template>
    <div class="error-page" role="main" aria-labelledby="error-title">
        <div class="error-bg">
            <div class="error-bg__shape error-bg__shape--1"></div>
            <div class="error-bg__shape error-bg__shape--2"></div>
            <div class="error-bg__shape error-bg__shape--3"></div>
        </div>

        <div class="container">
            <div class="card" :aria-describedby="errorInfo.details ? 'error-details' : null">
                <div class="error-icon" aria-hidden="true">{{ errorInfo.icon }}</div>
                <h1 id="error-title" class="title">{{ errorInfo.title }}</h1>
                <p class="message">{{ errorInfo.message }}</p>
                <p v-if="errorInfo.details" id="error-details" class="details">
                    <span class="details-icon" aria-hidden="true">💡</span>
                    {{ errorInfo.details }}
                </p>
                <div class="actions">
                    <router-link to="/" class="btn btn--home">
                        <span class="btn-icon" aria-hidden="true">🏠</span>
                        返回首页
                    </router-link>
                    <button v-if="errorInfo.retry" @click="goBack" class="btn btn--back" type="button">
                        <span class="btn-icon" aria-hidden="true">←</span>
                        返回上一页
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    slug: {
        type: String,
        required: true
    }
});

const router = useRouter();

const goBack = () => {
    router.back();
};

const errorInfo = computed(() => {
    const path = props.slug.split('/');
    const [category, subCategory] = path;

    const errorConfig = {
        home: {
            'load-failed': {
                icon: '🔌',
                title: '数据加载失败',
                message: '无法连接到数据服务，请稍后重试',
                details: '可能是 lmjweb 服务未启动或网络连接问题',
                retry: true
            }
        },
        blog: {
            'not-found': {
                icon: '📄',
                title: '文章未找到',
                message: '您访问的文章不存在或已被移除',
                details: '可能是文章链接已失效或被作者删除',
                retry: false
            },
            'load-failed': {
                icon: '⚠️',
                title: '文章加载失败',
                message: '文章内容无法加载，请稍后重试',
                details: '可能是文章内容文件丢失或网络问题',
                retry: true
            }
        },
        default: {
            icon: '❌',
            title: '页面未找到',
            message: '很抱歉，您访问的页面不存在',
            details: '请检查 URL 是否正确，或返回首页浏览其他内容',
            retry: false
        }
    };

    if (category && errorConfig[category]) {
        const categoryConfig = errorConfig[category];
        if (subCategory && categoryConfig[subCategory]) {
            return categoryConfig[subCategory];
        }
    }

    return errorConfig.default;
});
</script>

<style lang="scss" scoped>
.error-page {
    background-color: var(--bg-color);
    transition: var(--transition-bg-color);
    min-height: 75vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;

    // 背景装饰形状
    .error-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;

        &__shape {
            position: absolute;
            border-radius: 50%;
            opacity: 0.1;
            filter: blur(60px);
            animation: float 20s ease-in-out infinite;

            &--1 {
                width: 400px;
                height: 400px;
                background: var(--primary-color);
                top: -200px;
                left: -100px;
                animation-delay: 0s;
            }

            &--2 {
                width: 300px;
                height: 300px;
                background: var(--secondary-color);
                bottom: -150px;
                right: -50px;
                animation-delay: -7s;
            }

            &--3 {
                width: 250px;
                height: 250px;
                background: var(--selected-color);
                top: 50%;
                left: 60%;
                animation-delay: -14s;
            }
        }
    }

    .container {
        position: relative;
        z-index: 1;
        max-width: 580px;
        width: 100%;

        .card {
            background: var(--bg-secondary-color);
            transition: var(--transition-bg-color);
            padding: 3rem 2.5rem;
            border-radius: 20px;
            box-shadow: var(--shadow-lg), 0 0 0 1px var(--border-color);
            text-align: center;
            line-height: 1.6;
            color: var(--text-color);
            backdrop-filter: blur(10px);
            animation: card-appear 0.5s ease-out;

            .error-icon {
                font-size: 4.5rem;
                margin-bottom: 1.25rem;
                display: block;
                animation: icon-bounce 2s ease-in-out infinite;
                user-select: none;
            }

            .title {
                color: var(--secondary-color);
                font-size: 1.85rem;
                margin-bottom: 0.85rem;
                font-weight: 700;
                letter-spacing: -0.02em;
            }

            .message {
                color: var(--text-color);
                margin-bottom: 1.25rem;
                font-size: 1.05rem;
                line-height: 1.7;
                max-width: 450px;
                margin-left: auto;
                margin-right: auto;
            }

            .details {
                color: var(--description-color);
                font-size: 0.95rem;
                margin-bottom: 1.75rem;
                padding: 0.85rem 1.25rem;
                background: var(--bg-color);
                border-radius: 10px;
                border-left: 3px solid var(--primary-color);
                text-align: left;
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;

                .details-icon {
                    flex-shrink: 0;
                }
            }

            .actions {
                display: flex;
                gap: 0.85rem;
                justify-content: center;
                flex-wrap: wrap;

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.85rem 1.75rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 1rem;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid transparent;

                    .btn-icon {
                        font-size: 1.15em;
                        transition: transform 0.25s ease;
                    }

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

                        .btn-icon {
                            transform: scale(1.1);
                        }
                    }

                    &:active {
                        transform: translateY(0);
                    }

                    &--home {
                        color: var(--primary-color);
                        border-color: var(--primary-color);
                        background: transparent;

                        &:hover {
                            color: var(--bg-color);
                            background: var(--primary-color);
                        }
                    }

                    &--back {
                        background: var(--primary-color);
                        color: white;
                        border-color: var(--primary-color);

                        &:hover {
                            background: var(--selected-color);
                            border-color: var(--selected-color);
                        }
                    }
                }
            }
        }
    }
}

// 动画定义
@keyframes float {
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(30px, -30px) scale(1.1);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }
}

@keyframes icon-bounce {
    0%, 100% {
        transform: translateY(0) scale(1);
    }
    50% {
        transform: translateY(-8px) scale(1.05);
    }
}

@keyframes card-appear {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

// 响应式设计
@media (max-width: 640px) {
    .error-page {
        padding: 1rem 0.75rem;

        .container {
            .card {
                padding: 2rem 1.25rem;

                .error-icon {
                    font-size: 3.5rem;
                }

                .title {
                    font-size: 1.5rem;
                }

                .message {
                    font-size: 0.95rem;
                }

                .details {
                    font-size: 0.85rem;
                    padding: 0.6rem 0.75rem;
                }

                .actions {
                    flex-direction: column;
                    gap: 0.6rem;

                    .btn {
                        width: 100%;
                        padding: 0.7rem 1.25rem;
                    }
                }
            }
        }
    }
}

@media (max-width: 400px) {
    .error-page .container .card {
        padding: 1.5rem 1rem;

        .error-icon {
            font-size: 3rem;
        }

        .title {
            font-size: 1.25rem;
        }
    }
}

// 深色模式优化
@media (prefers-color-scheme: dark) {
    .error-page .container .card {
        box-shadow: var(--shadow-lg), 0 0 0 1px var(--border-color);
    }
}
</style>