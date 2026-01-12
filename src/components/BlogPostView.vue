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
    color: var(--text-color, #333);
}

.blog-title {
    color: var(--secondary-color, #5d8aa8);
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
    background-color: var(--tag-bg-color, rgba(255, 170, 190, 0.12));
    color: var(--tag-text-color, #ff7aae);
    padding: 0.35rem 0.8rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid rgba(255, 170, 190, 0.3);
    transition: all 0.2s ease;

    &:hover {
        background-color: rgba(255, 170, 190, 0.2);
        transform: translateY(-1px);
    }
}

/* Markdown 内容区域 —— 复用你原来的样式 */
:deep(.markdown-content) {
    color: var(--text-color, #333);
    line-height: 1.7;
    font-size: 1.05rem;

    pre {
        position: relative;
        background-color: #f9fbfd !important;
        border: 1px solid #eaeef5;
        border-radius: 10px;
        padding: 1.1rem !important;
        overflow-x: auto;
        margin: 1.2rem 0;
        box-shadow: 0 2px 6px rgba(90, 139, 194, 0.05);

        .copy-code-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--primary-color, #ff7aae);
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
            background: var(--selected-color, #ff5c9d);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: var(--secondary-color, #5d8aa8);
        margin-top: 1.6em;
        margin-bottom: 0.8em;
        font-weight: 600;
    }

    h1 {
        border-bottom: 2px solid #eaeef5;
        padding-bottom: 0.3em;
        font-size: 1.8rem;
    }

    h2 {
        font-size: 1.5rem;
        border-left: 4px solid var(--secondary-color, #5d8aa8);
        padding-left: 0.6em;
    }

    a {
        color: var(--primary-color, #ff7aae);
        text-decoration: none;
        font-weight: 600;

        &:hover {
            text-decoration: underline;
            color: var(--selected-color, #ff5c9d);
        }
    }

    blockquote {
        border-left: 4px solid var(--primary-color, #ff7aae);
        background-color: rgba(255, 170, 190, 0.06);
        padding: 0.9rem 1.2rem;
        margin: 1.4rem 0;
        color: var(--description-color, #555);
        font-style: italic;
        border-radius: 0 6px 6px 0;
    }

    code {
        background-color: rgba(90, 139, 194, 0.08);
        color: var(--secondary-color, #5d8aa8);
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
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    th,
    td {
        border: 1px solid #eaeef5;
        padding: 0.7rem;
        text-align: left;
    }

    th {
        background-color: rgba(90, 139, 194, 0.08);
        color: var(--secondary-color, #5d8aa8);
        font-weight: 600;
    }

    img {
        max-width: 100%;
        border-radius: 10px;
        margin: 1.2rem 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
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