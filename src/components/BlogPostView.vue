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
import { defineProps, computed, nextTick, watch, onMounted } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github-dark.css'

// Mermaid 实例（懒加载）
let mermaid = null

/**
 * 从 CSS 变量获取 Mermaid 主题配置
 * 使用 base 主题，所有变量从全局 CSS 变量映射
 * 设计原则：图表背景透明，与页面背景融合；配色使用主题主色，保持视觉一致性
 * @returns {Object} Mermaid themeVariables 配置
 */
function getMermaidThemeVariables() {
    const styles = getComputedStyle(document.documentElement)
    const getVar = (name) => styles.getPropertyValue(name).trim()

    // 基础配色变量
    const primaryColor = getVar('--primary-color')
    const secondaryColor = getVar('--secondary-color')
    const textColor = getVar('--text-color')
    const textSecondaryColor = getVar('--text-secondary-color')
    const bgColor = getVar('--bg-color')
    const bgSecondaryColor = getVar('--bg-secondary-color')
    const selectedBgColor = getVar('--selected-bg-color')
    const tagBgColor = getVar('--tag-bg-color')
    const borderColor = getVar('--border-color')
    const lineColor = getVar('--primary-color')

    return {
        // ===== 核心变量 (Core Variables) =====
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        // 背景透明，让图表融入页面
        background: 'transparent',
        primaryColor: bgColor,
        primaryTextColor: textColor,
        primaryBorderColor: primaryColor,
        secondaryColor,
        secondaryTextColor: textColor,
        secondaryBorderColor: secondaryColor,
        tertiaryColor: selectedBgColor,
        tertiaryTextColor: textColor,
        tertiaryBorderColor: borderColor,
        lineColor,
        textColor,

        // 注释框 - 使用半透明背景
        noteBkgColor: tagBgColor,
        noteTextColor: textColor,
        noteBorderColor: borderColor,

        // 错误状态
        errorBkgColor: getVar('--error-bg-color'),
        errorTextColor: getVar('--error-text-color'),

        // ===== Flowchart Variables =====
        nodeBorder: primaryColor,
        // 节点背景使用半透明的白色，与页面融合
        nodeBkg: 'rgba(255, 255, 255, 0.8)',
        // 集群背景使用选中状态背景，增强层次
        clusterBkg: selectedBgColor,
        clusterBorder: borderColor,
        defaultLinkColor: lineColor,
        titleColor: textColor,
        // 边标签背景使用选中状态背景，增强层次
        edgeLabelBackground: selectedBgColor,
        edgeLabelColor: textColor,
        nodeTextColor: textColor,
        arrowheadColor: primaryColor,

        // ===== Sequence Diagram Variables =====
        // 演员背景使用选中状态背景，增强层次
        actorBkg: selectedBgColor,
        actorBorder: primaryColor,
        actorTextColor: textColor,
        actorLineColor: primaryColor,
        signalColor: lineColor,
        signalTextColor: textColor,
        // 标签框背景使用选中状态背景，增强层次
        labelBoxBkgColor: selectedBgColor,
        labelBoxBorderColor: primaryColor,
        labelTextColor: textColor,
        loopTextColor: textColor,
        activationBorderColor: primaryColor,
        activationBkgColor: selectedBgColor,
        sequenceNumberColor: textSecondaryColor,
        messageTextColor: textColor,

        // ===== Pie Diagram Variables =====
        pie1: primaryColor,
        pie2: secondaryColor,
        pie3: selectedBgColor,
        pie4: primaryColor,
        pie5: secondaryColor,
        pie6: selectedBgColor,
        pie7: primaryColor,
        pie8: secondaryColor,
        pie9: primaryColor,
        pie10: secondaryColor,
        pie11: selectedBgColor,
        pie12: primaryColor,
        pieTitleTextSize: '25px',
        pieTitleTextColor: textColor,
        pieSectionTextSize: '17px',
        pieSectionTextColor: textColor,
        pieLegendTextSize: '17px',
        pieLegendTextColor: textColor,
        pieStrokeColor: borderColor,
        pieStrokeWidth: '2px',
        pieOuterStrokeWidth: '2px',
        pieOuterStrokeColor: borderColor,
        pieOpacity: '0.85',

        // ===== State Diagram Variables =====
        labelColor: textColor,
        // 状态背景使用选中状态背景，增强层次
        altBackground: selectedBgColor,
        stateBkg: selectedBgColor,
        stateBorder: primaryColor,
        stateTextColor: textColor,

        // ===== Class Diagram Variables =====
        classText: textColor,
        // 类背景使用选中状态背景，增强层次
        classBkg: selectedBgColor,
        classBorder: primaryColor,
        relationColor: lineColor,

        // ===== Gantt Diagram Variables =====
        ganttBarColor: primaryColor,
        ganttTodayLineColor: getVar('--error-color'),
        ganttMilestoneColor: secondaryColor,
        ganttCriticalColor: getVar('--error-color'),
        ganttDoneColor: getVar('--success-color'),
        ganttActiveColor: primaryColor,
        // Gantt 标签背景使用选中状态背景，增强层次
        ganttLabelBackground: selectedBgColor,
        ganttLabelColor: textColor,

        // ===== User Journey Variables =====
        fillType0: primaryColor,
        fillType1: secondaryColor,
        fillType2: selectedBgColor,
        fillType3: primaryColor,
        fillType4: secondaryColor,
        fillType5: selectedBgColor,
        fillType6: primaryColor,
        fillType7: secondaryColor,
        journeyTextColor: textColor,
        journeyBorder: borderColor,
        // Journey 背景使用选中状态背景，增强层次
        journeyBkg: selectedBgColor,

        // ===== Git Graph Variables =====
        git0: primaryColor,
        git1: secondaryColor,
        git2: selectedBgColor,
        git3: primaryColor,
        gitBranchColor0: primaryColor,
        gitBranchColor1: secondaryColor,
        gitBranchColor2: selectedBgColor,
        gitBranchColor3: primaryColor,
        commitLabelColor: textColor,
        // Commit 标签背景使用选中状态背景，增强层次
        commitLabelBackground: selectedBgColor,
        tagLabelColor: textColor,
        tagLabelBackground: tagBgColor,
        tagLabelBorder: borderColor
    }
}

// 懒加载 Mermaid
async function loadMermaid() {
    if (mermaid) return mermaid

    const module = await import(/* @vite-ignore */ 'mermaid')
    const core = module.mermaid || module.default

    if (!core) {
        throw new Error('Failed to load mermaid: unknown export structure')
    }

    core.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: getMermaidThemeVariables()
    })

    mermaid = core
    return core
}

const props = defineProps({
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: Array, default: () => [] }
})

// 自定义 marked extension 处理 mermaid 代码块
const mermaidExtension = {
    name: 'mermaid',
    level: 'block',
    start(src) {
        // 必须匹配 ```mermaid 开头，注意可能有前导空格
        const match = src.match(/^```mermaid\s*\n/)
        return match ? match.index : null
    },
    tokenizer(src, tokens) {
        const rule = /^```mermaid\s*\n([\s\S]*?)\n```/
        const match = rule.exec(src)
        if (match) {
            return {
                type: 'mermaid',
                raw: match[0],
                text: match[1].trim()
            }
        }
        return null
    },
    renderer(token) {
        // 返回带有特殊标记的 HTML，稍后由 Mermaid 渲染
        return `<pre class="mermaid" data-mermaid-graph="${encodeURIComponent(token.text)}">Loading...</pre>`
    }
}

// 注册 mermaid 扩展 - 必须在使用 marked.parse 之前注册
marked.use({ extensions: [mermaidExtension] })

// 渲染 Markdown
const renderedContent = computed(() => {
    const html = marked.parse(props.content || '')
    // 配置 DOMPurify 允许 data-mermaid-graph 属性
    return DOMPurify.sanitize(html, {
        ADD_ATTR: ['data-mermaid-graph']
    })
})

// 懒加载 highlight.js 和语言包
async function loadHighlightJs() {
    const [{ default: hljs }, ...languages] = await Promise.all([
        import('highlight.js/lib/core'),
        import('highlight.js/lib/languages/javascript'),
        import('highlight.js/lib/languages/typescript'),
        import('highlight.js/lib/languages/python'),
        import('highlight.js/lib/languages/java'),
        import('highlight.js/lib/languages/go'),
        import('highlight.js/lib/languages/bash'),
        import('highlight.js/lib/languages/sql'),
        import('highlight.js/lib/languages/json'),
        import('highlight.js/lib/languages/yaml'),
        import('highlight.js/lib/languages/markdown'),
        import('highlight.js/lib/languages/xml'),
        import('highlight.js/lib/languages/cpp'),
        import('highlight.js/lib/languages/lua'),
    ])

    const langNames = ['javascript', 'typescript', 'python', 'java', 'go', 'bash', 'sql', 'json', 'yaml', 'markdown', 'xml', 'cpp', 'lua']
    langNames.forEach((name, i) => {
        hljs.registerLanguage(name, languages[i + 1].default)
    })

    return hljs
}

// 配置 marked 的 highlight 选项
marked.setOptions({
    highlight: async (code, lang) => {
        const hljs = await loadHighlightJs()
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
    },
    langPrefix: 'hljs language-',
    breaks: true,
    gfm: true
})

// 添加复制按钮
function addCopyButtons() {
    nextTick(() => {
        const preBlocks = document.querySelectorAll('.markdown-content pre')
        preBlocks.forEach(pre => {
            if (pre.querySelector('.copy-code-button')) return

            const button = document.createElement('button')
            button.className = 'copy-code-button'
            button.innerHTML = `${COPY_ICON} Copy`

            button.onclick = async () => {
                const code = pre.querySelector('code')?.innerText || ''
                try {
                    await navigator.clipboard.writeText(code)
                    button.innerHTML = `${CHECK_ICON} Copied!`
                    setTimeout(() => { button.innerHTML = `${COPY_ICON} Copy` }, 1500)
                } catch (err) {
                    console.warn('Failed to copy:', err)
                }
            }

            pre.style.position = 'relative'
            pre.appendChild(button)
        })

        // 渲染 Mermaid 图表
        renderMermaidDiagrams()
    })
}

// 渲染 Mermaid 图表
async function renderMermaidDiagrams() {
    const mermaidBlocks = document.querySelectorAll('.markdown-content pre.mermaid')
    if (mermaidBlocks.length === 0) return

    const core = await loadMermaid()

    for (const block of mermaidBlocks) {
        if (block.classList.contains('mermaid-rendered')) continue

        const graphDefinition = block.dataset.mermaidGraph
        if (!graphDefinition) continue

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        try {
            const { svg, bindFunctions } = await core.render(id, decodeURIComponent(graphDefinition))
            block.innerHTML = svg
            // 绑定交互事件（tooltip、点击事件等）
            if (bindFunctions) {
                bindFunctions(block)
            }
            block.classList.add('mermaid-rendered')
            // 添加切换按钮
            addMermaidToggleButtons(block, decodeURIComponent(graphDefinition))
        } catch (error) {
            console.error('Mermaid render error:', error)
            block.innerHTML = `<div class="mermaid-error">图表渲染失败：${error.message}</div>`
        }
    }
}

// SVG 图标
const CODE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
const CHART_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

// 为 Mermaid 图表添加切换按钮
function addMermaidToggleButtons(block, graphDefinition) {
    // 检查是否已存在按钮
    if (block.querySelector('.mermaid-toggle-button')) return

    const button = document.createElement('button')
    button.className = 'mermaid-toggle-button'
    button.innerHTML = `${CODE_ICON} 查看代码`
    button.dataset.viewMode = 'graph' // 'graph' 或 'code'

    button.onclick = () => {
        const isGraphView = button.dataset.viewMode === 'graph'

        if (isGraphView) {
            // 切换到代码视图
            const pre = document.createElement('pre')
            pre.className = 'mermaid-code-view'
            pre.innerHTML = `<code class="language-mermaid">${escapeHtml(graphDefinition)}</code>`

            // 保存原始 SVG 内容
            block.dataset.originalSvg = block.innerHTML

            // 替换为代码视图
            block.innerHTML = ''
            block.appendChild(pre)
            block.appendChild(button)

            // 更新按钮文本
            button.innerHTML = `${CHART_ICON} 查看图表`
            button.dataset.viewMode = 'code'

            // 为代码块添加复制按钮
            addCopyButtonToElement(pre, graphDefinition)
        } else {
            // 切换回图表视图 - 直接使用保存的 SVG，避免重复渲染
            block.innerHTML = block.dataset.originalSvg
            block.classList.add('mermaid-rendered')

            // 重新添加切换按钮
            const oldButton = block.querySelector('.mermaid-toggle-button')
            if (oldButton) {
                oldButton.remove()
            }
            addMermaidToggleButtons(block, graphDefinition)

            // 更新按钮文本
            // 按钮已重新创建，无需更新
        }
    }

    block.appendChild(button)
}

// HTML 转义辅助函数
function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// 为指定元素添加复制按钮
function addCopyButtonToElement(element, textContent) {
    if (element.querySelector('.copy-code-button')) return

    const button = document.createElement('button')
    button.className = 'copy-code-button'
    button.innerHTML = `${COPY_ICON} Copy`

    button.onclick = async () => {
        try {
            await navigator.clipboard.writeText(textContent)
            button.innerHTML = `${CHECK_ICON} Copied!`
            setTimeout(() => {
                button.innerHTML = `${COPY_ICON} Copy`
            }, 1500)
        } catch (err) {
            console.warn('Failed to copy:', err)
            button.innerHTML = `${COPY_ICON} Copy`
        }
    }

    element.style.position = 'relative'
    element.appendChild(button)
}

// 主题变化时重新渲染 Mermaid 图表
async function reRenderMermaidOnThemeChange() {
    // 重新初始化 Mermaid 配置
    const core = await loadMermaid()
    core.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: getMermaidThemeVariables()
    })

    // 重置所有已渲染的图表
    const mermaidBlocks = document.querySelectorAll('.markdown-content pre.mermaid.mermaid-rendered')
    for (const block of mermaidBlocks) {
        block.classList.remove('mermaid-rendered')
        const graphDefinition = block.dataset.mermaidGraph
        if (graphDefinition) {
            const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            try {
                const { svg, bindFunctions } = await core.render(id, decodeURIComponent(graphDefinition))
                block.innerHTML = svg
                // 重新绑定交互事件
                if (bindFunctions) {
                    bindFunctions(block)
                }
                block.classList.add('mermaid-rendered')
            } catch (error) {
                console.error('Mermaid re-render error:', error)
            }
        }
    }
}

// 监听主题变化（通过 MutationObserver 监听 CSS 变量变化）
function observeThemeChanges() {
    const observer = new MutationObserver(() => {
        reRenderMermaidOnThemeChange()
    })

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style']
    })

    // 同时监听 storage 事件（用于多标签页同步）
    window.addEventListener('storage', (e) => {
        if (e.key === 'app-theme') {
            reRenderMermaidOnThemeChange()
        }
    })
}

// 监听 content 变化
watch(() => props.content, () => {
    nextTick(() => {
        addCopyButtons()
    })
}, { immediate: true })

onMounted(() => {
    addCopyButtons()
    observeThemeChanges()
})
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

/* Markdown 内容区域 */
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
        transition: var(--transition-bg-color);

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
            transition: var(--transition-bg-color);
            display: flex;
            align-items: center;
            gap: 4px;

            svg {
                width: 14px;
                height: 14px;
            }
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
        /* 允许长单词和 URL 换行 */
        word-wrap: break-word;
        word-break: break-word;
        white-space: normal;
        /* 设置最小宽度，避免内容被过度压缩 */
        min-width: 100px;
        /* 最大宽度限制，配合 overflow-wrap 确保换行 */
        max-width: 300px;
        overflow-wrap: break-word;
    }

    th {
        background-color: var(--selected-bg-color);
        color: var(--secondary-color);
        font-weight: 600;
        /* 表头同样需要换行支持 */
        word-wrap: break-word;
        word-break: break-word;
        white-space: normal;
        overflow-wrap: break-word;
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

    /* Mermaid 图表样式 */
    pre.mermaid {
        display: flex;
        justify-content: center;
        margin: 1.5rem 0;
        padding: 1.2rem;
        background-color: var(--bg-secondary-color);
        border: 1px solid var(--border-light-color);
        border-radius: 10px;
        box-shadow: var(--shadow-sm);
        overflow: auto;
        transition: var(--transition-bg-color);
        position: relative;

        svg {
            max-width: 100%;
            height: auto;
            // SVG 背景透明，融入页面
            background: transparent;
        }

        &.mermaid-rendered {
            // 渲染后移除容器样式，让 SVG 直接融入内容区
            background-color: transparent;
            border: 1px solid var(--border-light-color);
            box-shadow: none;
            padding: 1.2rem;
        }

        // 切换按钮样式
        .mermaid-toggle-button {
            position: absolute;
            top: 5px;
            right: 90px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 0.85rem;
            cursor: pointer;
            z-index: 2;
            transition: var(--transition-bg-color);
            display: flex;
            align-items: center;
            gap: 6px;

            svg {
                width: 16px;
                height: 16px;
            }

            &:hover {
                background: var(--selected-color);
            }
        }

        // 代码视图时的复制按钮位置调整
        .mermaid-code-view .copy-code-button {
            top: 5px;
            right: 5px;
        }

        // 代码视图样式
        .mermaid-code-view {
            background-color: var(--bg-secondary-color);
            border-radius: 6px;
            padding: 1rem;
            overflow: auto;
            max-width: 100%;
            text-align: left;

            code {
                display: block;
                white-space: pre;
                font-family: 'SFMono-Regular', Consolas, monospace;
                font-size: 0.85rem;
                line-height: 1.5;
                color: var(--text-color);
            }
        }
    }

    .mermaid-error {
        color: var(--error-text-color);
        background-color: var(--error-bg-color);
        border: 1px solid var(--error-border-color);
        padding: 1rem;
        border-radius: 8px;
        font-family: monospace;
        font-size: 0.9rem;
        width: 100%;
        text-align: center;
    }

    .mermaid-loading {
        color: var(--text-secondary-color);
        font-style: italic;
        padding: 2rem;
        text-align: center;
    }
}
</style>
