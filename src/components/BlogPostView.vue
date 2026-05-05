<template>
    <div class="blog-post">
        <!-- 标题 -->
        <h1 class="blog-title">{{ title }}</h1>
        <!-- 标签 -->
        <div class="blog-tags">
            <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <!-- Markdown 渲染区域 -->
        <div class="markdown-content" v-html="renderedContent"></div>
    </div>
</template>

<script setup>
import { defineProps, computed, nextTick, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // 或 github.css / atom-one-dark 等

// XSS 防护（推荐）
import DOMPurify from 'dompurify'

// 配置 marked
marked.setOptions({
    highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
    },
    langPrefix: 'hljs language-',
    breaks: true, // 支持换行
    gfm: true     // GitHub 风格
})

const props = defineProps({
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: Array, default: () => [] }
})

// 渲染 Markdown
const renderedContent = computed(() => {
    const html = marked.parse(props.content || '')
    return DOMPurify.sanitize(html)
})

// 添加复制按钮
function addCopyButtons() {
    nextTick(() => {
        const preBlocks = document.querySelectorAll('.markdown-content pre')
        preBlocks.forEach(pre => {
            if (pre.querySelector('.copy-code-button')) return // 避免重复添加

            const button = document.createElement('button')
            button.className = 'copy-code-button'
            button.textContent = '📋 Copy'

            button.onclick = async () => {
                const code = pre.querySelector('code')?.innerText || ''
                try {
                    await navigator.clipboard.writeText(code)
                    const original = button.textContent
                    button.textContent = '✅ Copied!'
                    setTimeout(() => {
                        button.textContent = original
                    }, 1500)
                } catch (err) {
                    console.warn('Failed to copy:', err)
                }
            }

            pre.style.position = 'relative'
            pre.appendChild(button)
        })
    })
}

// 监听 content 变化，重新绑定按钮
watch(() => props.content, addCopyButtons, { immediate: true })
</script>

<style lang="scss" scoped>
.blog-post {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--text-color);
    transition: var(--transition-bg-color);
}

.blog-title {
    color: var(--secondary-color);
    font-size: 2.2rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 1.2rem;
    letter-spacing: -0.5px;
}

.blog-tags {
    display: flex;
    justify-content: center;
    gap: 0.6rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.tag {
    background-color: var(--tag-bg-color);
    color: var(--tag-text-color);
    padding: 0.35rem 0.8rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;

    &:hover {
        background-color: var(--hover-bg-color);
        transform: translateY(-1px);
    }
}

/* Markdown 内容区域 —— 复用你原来的样式 */
:deep(.markdown-content) {
    color: var(--text-color);
    line-height: 1.7;
    font-size: 1.05rem;

    pre {
        position: relative;
        background-color: var(--bg-secondary-color) !important;
        border: 1px solid var(--border-light-color);
        border-radius: 10px;
        padding: 1.1rem !important;
        overflow-x: auto;
        margin: 1.2rem 0;
        box-shadow: var(--shadow-sm);

        .copy-code-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 0.85rem;
            cursor: pointer;
            z-index: 1;
            transition: all 0.2s ease;
        }

        .copy-code-button:hover {
            background: var(--selected-color);
            box-shadow: var(--shadow-sm);
        }
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: var(--secondary-color);
        margin-top: 1.6em;
        margin-bottom: 0.8em;
        font-weight: 600;
    }

    h1 {
        border-bottom: 2px solid var(--border-light-color);
        padding-bottom: 0.3em;
        font-size: 1.8rem;
    }

    h2 {
        font-size: 1.5rem;
        border-left: 4px solid var(--secondary-color);
        padding-left: 0.6em;
    }

    a {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 600;

        &:hover {
            text-decoration: underline;
            color: var(--selected-color);
        }
    }

    blockquote {
        border-left: 4px solid var(--primary-color);
        background-color: var(--tag-bg-color);
        padding: 0.9rem 1.2rem;
        margin: 1.4rem 0;
        color: var(--text-secondary-color);
        font-style: italic;
        border-radius: 0 6px 6px 0;
    }

    code {
        background-color: var(--selected-bg-color);
        color: var(--secondary-color);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-family: 'SFMono-Regular', Consolas, monospace;
        font-size: 0.95em;
    }

    table {
        border-collapse: collapse;
        width: 100%;
        margin: 1.2rem 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: var(--shadow-sm);
    }

    th,
    td {
        border: 1px solid var(--border-light-color);
        padding: 0.7rem;
        text-align: left;
    }

    th {
        background-color: var(--selected-bg-color);
        color: var(--secondary-color);
        font-weight: 600;
    }

    img {
        max-width: 100%;
        border-radius: 10px;
        margin: 1.2rem 0;
        box-shadow: var(--shadow-md);
    }

    ul,
    ol {
        padding-left: 1.4rem;
        margin: 1rem 0;
    }

    li {
        margin-bottom: 0.4rem;
    }

    p {
        margin: 1rem 0;
    }
}
</style>