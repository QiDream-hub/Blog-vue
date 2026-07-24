<template>
  <div class="article-form-page">
    <h1 class="page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>

    <div class="admin-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">文章标题</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="admin-input"
            required
            placeholder="输入文章标题"
          />
        </div>

        <div class="form-group" v-if="!isEdit">
          <label for="articleFile">文章内容文件</label>
          <input
            id="articleFile"
            type="file"
            class="admin-input"
            accept=".md,.markdown"
            @change="handleFileSelect"
            required
          />
          <p class="form-hint">
            选择文件后将自动生成指针并打包，下载后直接解压到 Nginx 文章目录即可
          </p>
        </div>

        <div v-if="selectedFile && !isEdit" class="file-preview">
          <div class="file-info">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <div v-if="!fileSelected" class="file-actions">
            <button type="button" class="admin-btn admin-btn--primary" @click="confirmFileSelection">
              确认选择此文件
            </button>
            <button type="button" class="admin-btn admin-btn--secondary" @click="removeSelectedFile">
              重新选择
            </button>
          </div>
          <div v-if="fileSelected && generatedPtr" class="ptr-info">
            <strong>生成的指针：</strong> <code>{{ generatedPtr }}</code>
            <p class="hint">打包时文件将自动重命名为：<code>{{ generatedPtr }}</code>（无扩展名）</p>
          </div>
        </div>

        <div class="form-group">
          <label for="tags">标签</label>
          <div class="tag-input-container">
            <input
              id="tags"
              v-model="tagInput"
              type="text"
              class="admin-input"
              placeholder="输入标签，按回车添加"
              @keydown.enter="addTag"
            />
          </div>
          <div class="tag-list">
            <span v-for="tag in form.tags" :key="tag" class="admin-tag">
              {{ tag }}
              <button type="button" @click="removeTag(tag)">×</button>
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>封面图片</label>
          <div v-if="form.cover" class="cover-preview">
            <span class="cover-name">已选择：{{ form.cover.filename }}</span>
            <button type="button" class="admin-btn admin-btn--danger" @click="removeCover">移除</button>
          </div>
          <div v-else class="cover-selector">
            <select v-model="selectedCoverPtr" class="admin-input" style="width: 300px;">
              <option value="">选择封面图片</option>
              <option v-for="img in images" :key="img.ptr" :value="img.ptr">
                {{ img.filename }} ({{ img.ptr }})
              </option>
            </select>
            <button type="button" class="admin-btn admin-btn--primary" @click="setCover" style="margin-left: 0.5rem;">
              确定
            </button>
          </div>
        </div>

        <div v-if="!isEdit && generatedPtr" class="form-group">
          <label>文件路径提示</label>
          <div class="path-hint">
            <p>请将 Markdown 文件重命名后放置到：</p>
            <code>{{ articlePath }}</code>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="admin-btn admin-btn--primary" :disabled="submitting || (!isEdit && !selectedFile)">
            {{ submitting ? '处理中...' : (isEdit ? '更新' : '生成指针并打包') }}
          </button>
          <router-link to="/articles">
            <button type="button" class="admin-btn admin-btn--secondary">取消</button>
          </router-link>
        </div>
      </form>
    </div>

    <!-- 打包下载提示 -->
    <div v-if="showBatchDownload" class="modal-overlay" @click.self="closeBatchDownload">
      <div class="modal batch-download-modal">
        <div class="modal-header">
          <h3>准备打包</h3>
          <button class="modal-close" @click="closeBatchDownload">×</button>
        </div>
        <div class="batch-download-content">
          <p>文件将自动重命名为指针格式并打包：</p>
          <div class="file-check">
            <code>{{ pendingUpload.originalName }}</code> → <code>{{ pendingUpload.ptr }}</code>
          </div>
          <p class="hint">点击下方按钮下载 ZIP 包，解压后将文件复制到 Nginx 文章目录即可。</p>
          <div class="batch-actions">
            <button class="admin-btn admin-btn--primary" @click="downloadFile" :disabled="downloading">
              {{ downloading ? '打包中...' : '📦 打包下载' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { publisher } from '@shared/api/publisher'
import { getConfig } from '@shared/config/blog'
import JSZip from 'jszip'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.ptr)
const form = ref({
  title: '',
  tags: [],
  cover: null
})
const tagInput = ref('')
const images = ref([])
const selectedCoverPtr = ref('')
const submitting = ref(false)
const selectedFile = ref(null)
const generatedPtr = ref('')
const showBatchDownload = ref(false)
const pendingUpload = ref(null)
const downloading = ref(false)
const fileSelected = ref(false) // 标记文件已选择但尚未确认

const articlePath = computed(() => {
  const config = getConfig()
  const ptr = route.params.ptr || generatedPtr.value || '(新指针)'
  return `${config.ARTICLE_BASE}/${ptr}`
})

onMounted(async () => {
  // 加载图片列表
  try {
    const imagePtrs = await publisher.getAllImages()
    const details = await Promise.all(
      imagePtrs.map(ptr => publisher.getImageDetail(ptr))
    )
    images.value = details
  } catch (e) {
    console.error('加载图片列表失败:', e)
  }

  // 如果是编辑模式，加载文章信息
  if (isEdit.value) {
    try {
      const detail = await publisher.getArticleDetail(route.params.ptr)
      form.value.title = detail.title
      form.value.tags = detail.tags
      form.value.cover = detail.cover
      if (detail.cover) {
        selectedCoverPtr.value = detail.cover.ptr
      }
    } catch (e) {
      alert('加载文章信息失败：' + e.message)
      router.push('/articles')
    }
  }
})

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    generatedPtr.value = ''
    pendingUpload.value = null
    fileSelected.value = true // 仅标记文件已选择，不生成指针
  }
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const removeSelectedFile = () => {
  selectedFile.value = null
  fileSelected.value = false
  generatedPtr.value = ''
  pendingUpload.value = null
}

const confirmFileSelection = async () => {
  if (!selectedFile.value) {
    alert('请先选择文件')
    return
  }

  // 用户确认文件后，生成指针并保存待上传信息
  try {
    const result = await publisher.registerArticle({
      title: form.value.title || '临时标题',
      filename: selectedFile.value.name
    })
    generatedPtr.value = result.ptr

    pendingUpload.value = {
      ptr: result.ptr,
      originalName: selectedFile.value.name,
      file: selectedFile.value,
      title: form.value.title,
      tags: [...form.value.tags],
      cover: form.value.cover ? { ...form.value.cover } : null
    }

    fileSelected.value = false // 文件已确认，进入待打包状态
    showBatchDownload.value = true // 显示打包下载对话框
  } catch (e) {
    alert('生成指针失败：' + e.message)
    generatedPtr.value = ''
  }
}

const generatePtr = async () => {
  // 此函数保留用于兼容性，但主要逻辑已移至 confirmFileSelection
  await confirmFileSelection()
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (tag) => {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

const setCover = () => {
  if (selectedCoverPtr.value) {
    const image = images.value.find(img => img.ptr === selectedCoverPtr.value)
    if (image) {
      form.value.cover = image
      // 更新 pendingUpload 中的封面信息
      if (pendingUpload.value) {
        pendingUpload.value.cover = { ...image }
      }
    }
  }
}

const removeCover = () => {
  form.value.cover = null
  selectedCoverPtr.value = ''
  if (pendingUpload.value) {
    pendingUpload.value.cover = null
  }
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    alert('请输入文章标题')
    return
  }

  if (!isEdit.value && !selectedFile.value) {
    alert('请选择文章文件')
    return
  }

  if (isEdit.value) {
    // 编辑模式处理
    submitting.value = true
    try {
      const articlePtr = route.params.ptr

      // 更新标题
      await publisher.updateArticleTitle(articlePtr, form.value.title)

      // 更新标签
      await publisher.updateArticleTags(articlePtr, form.value.tags)

      // 更新封面
      if (form.value.cover) {
        await publisher.updateArticleCover(articlePtr, form.value.cover.ptr)
      } else {
        await publisher.removeArticleCover(articlePtr)
      }

      alert('文章已更新')
      router.push('/articles')
    } catch (e) {
      console.error(e)
      alert('更新失败：' + e.message)
    } finally {
      submitting.value = false
    }
  } else {
    // 新建模式：如果还未生成指针，先生成指针
    if (!generatedPtr.value && selectedFile.value) {
      await confirmFileSelection()
      // confirmFileSelection 已显示打包对话框，无需再操作
    } else {
      // 已生成指针，更新 pendingUpload 中的元数据
      if (pendingUpload.value) {
        pendingUpload.value.title = form.value.title
        pendingUpload.value.tags = [...form.value.tags]
        pendingUpload.value.cover = form.value.cover ? { ...form.value.cover } : null
      }
      // 重新打开打包对话框（如果已关闭）
      showBatchDownload.value = true
    }
  }
}

const closeBatchDownload = () => {
  showBatchDownload.value = false
}

const downloadFile = async () => {
  if (!pendingUpload.value) {
    alert('没有可下载的文件')
    return
  }

  downloading.value = true

  try {
    const zip = new JSZip()
    const articlesDir = zip.folder('articles')

    const { ptr, file, title, tags } = pendingUpload.value

    // 读取文件内容
    const content = await file.text()
    articlesDir.file(ptr, content)

    // 生成 README
    const readme = `# 文章导出文件

**导出时间：** ${new Date().toLocaleString('zh-CN')}

## 文件说明

| 标题 | 指针（文件名） | 标签 |
|------|----------------|------|
| ${title} | ${ptr} | ${tags.join(', ')} |

## 使用说明

1. 将 \`articles/\` 目录中的文件复制到 Nginx 配置的文章目录
2. 确保文件名保持为指针格式（无扩展名）：\`${ptr}\`

## 元数据

文章已注册到 lmjweb 服务中。
`

    zip.file('README.md', readme)

    // 生成下载
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `article-${ptr}.zip`
    link.click()
    URL.revokeObjectURL(url)

    // 完成
    showBatchDownload.value = false
    pendingUpload.value = null
    selectedFile.value = null
    generatedPtr.value = ''

    // 跳转到文章列表
    router.push('/articles')
  } catch (e) {
    console.error(e)
    alert('打包失败：' + e.message)
  } finally {
    downloading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.file-preview {
  margin: 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;

  .file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    .file-name {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .file-size {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  }

  .file-actions {
    margin-top: 0.75rem;
  }

  .ptr-info {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.875rem;

    code {
      display: inline-block;
      margin: 0.25rem 0;
      padding: 0.25rem 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
      font-family: monospace;
    }

    .hint {
      margin-top: 0.5rem;
      color: var(--text-secondary);
    }
  }
}

.tag-list {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .admin-tag {
    button {
      background: none;
      border: none;
      cursor: pointer;
      margin-left: 0.25rem;
      padding: 0;
      font-size: 1rem;
      color: #1890ff;
    }
  }
}

.cover-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;

  .cover-name {
    font-family: monospace;
    font-size: 0.875rem;
  }
}

.cover-selector {
  display: flex;
  align-items: center;
}

.path-hint {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;

  code {
    display: block;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
    word-break: break-all;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    color: var(--text-primary);
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
  }
}

.batch-download-content {
  .file-check {
    margin: 1rem 0;
    padding: 0.75rem;
    background: #f5f5f5;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .hint {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
}

.batch-actions {
  margin-top: 1.5rem;
}
</style>
