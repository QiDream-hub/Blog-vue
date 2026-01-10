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
    background-color: #ffffff;
    // 不再使用 flex 居中，改用自然流式布局
    padding: 1.5rem 1rem 2rem; // 上 1.5rem，下 2rem（略多一点避免贴底）
    min-height: calc(100vh - 80px); // 减去 header 高度

    .container {
        max-width: 600px;
        width: 100%;
        margin: 0 auto; // 水平居中

        .card {
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(93, 138, 168, 0.1);
            text-align: center;
            line-height: 1.6;
            color: #333;

            .title {
                color: #5d8aa8;
                font-size: 2rem;
                margin-bottom: 1rem;
                font-weight: 700;
            }

            .message {
                color: #666;
                margin-bottom: 1.5rem;
                font-size: 1.1rem;
            }

            .back-link {
                display: inline-block;
                color: #ff6b9d;
                text-decoration: none;
                font-weight: 600;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                transition: all 0.2s ease;

                &:hover {
                    color: #5d8aa8;
                    background-color: #f8f9fa;
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