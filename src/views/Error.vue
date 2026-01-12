<template>
    <div class="error-page">
        <div class="container">
            <div class="card">
                <h1 class="title">{{ error }}</h1>
                <p class="message">很抱歉，您访问的页面似乎不存在 😢</p>
                <router-link to="/" class="back-link">← 返回首页</router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { defineProps } from 'vue';

const props = defineProps({
    slug: {
        type: String,
        required: true
    }
});

const error = computed(() => {
    let message = "错误路径";
    let path = props.slug.split('/')
    if (path[0] === "blog") {
        message = "博客页面";
        if (path[1] === "not-found") {
            message += "未找到";
        }
    }
    return message;
});
</script>

<style lang="scss" scoped>
.error-page {
    background-color: var(--bg-color, #ffffff);
    padding: 1.5rem 1rem 2rem; // 上 1.5rem，下 2rem（略多一点避免贴底）
    min-height: calc(100vh - 80px); // 减去 header 高度

    .container {
        max-width: 600px;
        width: 100%;
        margin: 0 auto; // 水平居中

        .card {
            background: var(--bg-color, #fff);
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(93, 138, 168, 0.1); // 保持原始值，但基于 --secondary-color 的透明版本
            text-align: center;
            line-height: 1.6;
            color: var(--text-color, #333);

            .title {
                color: var(--secondary-color, #5d8aa8);
                font-size: 2rem;
                margin-bottom: 1rem;
                font-weight: 700;
            }

            .message {
                color: var(--meta-color, #666); // 使用 --meta-color 更合适
                margin-bottom: 1.5rem;
                font-size: 1.1rem;
            }

            .back-link {
                display: inline-block;
                color: var(--primary-color, #ff7aae); // 强调色使用 --primary-color
                text-decoration: none;
                font-weight: 600;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                transition: all 0.2s ease;

                &:hover {
                    color: var(--secondary-color, #5d8aa8); // hover 状态使用 --secondary-color
                    background-color: var(--selected-bg-color, rgba(255, 158, 181, 0.1)); // 背景高亮使用 --selected-bg-color
                    text-decoration: none;
                }
            }
        }
    }
}

// 响应式优化
@media (max-width: 600px) {
    .error-page {
        padding: 1.2rem 0.8rem 1.5rem;

        .card {
            padding: 1.8rem 1.2rem;

            .title {
                font-size: 1.7rem;
            }

            .message {
                font-size: 1rem;
            }
        }
    }
}
</style>