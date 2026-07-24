<template>
  <div class="images-page">
    <h1 class="page-title">图片管理</h1>

    <div class="admin-card">
      <div class="card-header">
        <h2>图片列表</h2>
        <button class="admin-btn admin-btn--primary" @click="showAddModal = true">+ 注册图片</button>
      </div>

      <div v-if="loading" class="admin-loading">加载中...</div>
      <div v-else-if="images.length === 0" class="admin-empty">暂无图片</div>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>指针</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="image in images" :key="image.ptr">
            <td>{{ image.filename }}</td>
            <td><code>{{ image.ptr }}</code></td>
            <td>
              <div class="actions">
                <button
                  class="admin-btn admin-btn--secondary"
                  style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                  @click="copyPath(image.ptr)"
                >
                  复制路径
                </button>
                <button
                  class="admin-btn admin-btn--danger"
                  style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.5rem;"
                  @click="handleDelete(image.ptr, image.filename)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 注册图片模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>注册图片</h3>
          <button class="modal-close" @click="showAddModal = false">×</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="imageFile">选择图片文件</label>
            <input
              id="imageFile"
              type="file"
              class="admin-input"
              accept="image/*"
              @change="handleFileSelect"
              required
            />
          </div>

          <div v-if="selectedFile" class="file-preview">
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

          <div class="form-actions">
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="!selectedFile || submitting">
              {{ submitting ? '处理中...' : '生成指针并打包' }}
            </button>
          </div>
        </form>
      </div>
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
          <p class="hint">点击下方按钮下载 ZIP 包，解压后将文件复制到 Nginx 图片目录即可。</p>
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
import { ref, onMounted, computed } from 'vue'
import { publisher } from '@shared/api/publisher'
import { getConfig } from '@shared/config/blog'
import { batchGet, getObject } from '@shared/api/lmjweb'
import JSZip from 'jszip'

const images = ref([])
const loading = ref(true)
const showAddModal = ref(false)
const showBatchDownload = ref(false)
const selectedFile = ref(null)
const generatedPtr = ref('')
const submitting = ref(false)
const pendingUpload = ref(null)
const downloading = ref(false)
const fileSelected = ref(false) // 标记文件已选择但尚未确认

const imagesDir = computed(() => {
  const config = getConfig()
  return config.IMAGE_BASE.replace(/\/$/, '')
})

onMounted(async () => {
  await loadImages()
})

const loadImages = async () => {
  try {
    const imagePtrs = await publisher.getAllImages()

    if (imagePtrs.length === 0) {
      images.value = []
      loading.value = false
      return
    }

    // 使用批量 API 获取所有图片对象（减少请求次数）
    const operations = imagePtrs.map(ptr => ({
      method: 'GET',
      path: `/obj/${ptr}`
    }))

    const batchResult = await batchGet(operations)

    if (!batchResult.success) {
      throw new Error('批量查询失败')
    }

    // 解析批量结果
    const imageObjects = batchResult.results
      .filter(r => r.status === 200)
      .map(r => r.body)

    // 构建图片列表
    images.value = imageObjects.map(imgObj => ({
      ptr: imgObj.ptr,
      filename: imgObj.members.find(m => m.name === 'filename')?.value
    }))

    // 记录失败的条目（便于调试）
    const failed = batchResult.results.filter(r => r.status !== 200)
    if (failed.length > 0) {
      console.warn(`有 ${failed.length} 张图片加载失败:`, failed)
    }
  } catch (e) {
    console.error('加载图片列表失败:', e)
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    generatedPtr.value = ''
    pendingUpload.value = null
    fileSelected.value = true // 仅标记文件已选择，不生成指针
  }
}

const removeSelectedFile = () => {
  selectedFile.value = null
  fileSelected.value = false
  generatedPtr.value = ''
  pendingUpload.value = null
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const confirmFileSelection = async () => {
  if (!selectedFile.value) {
    alert('请先选择文件')
    return
  }

  try {
    // 使用临时文件名注册获取指针
    const result = await publisher.registerImage('temp_' + Date.now())
    generatedPtr.value = result.ptr

    pendingUpload.value = {
      ptr: result.ptr,
      originalName: selectedFile.value.name,
      file: selectedFile.value
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

const handleSubmit = async () => {
  if (!selectedFile.value) {
    alert('请选择图片文件')
    return
  }

  submitting.value = true

  try {
    // 如果还未生成指针，先生成指针
    if (!generatedPtr.value) {
      await confirmFileSelection()
      // confirmFileSelection 已显示打包对话框，无需再操作
    } else {
      // 已生成指针，更新元数据中的文件名为原始文件名
      await publisher.updateImageFilename(generatedPtr.value, pendingUpload.value.originalName)
    }
  } catch (e) {
    alert('注册失败：' + e.message)
  } finally {
    submitting.value = false
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
    const imagesDir = zip.folder('images')

    const { ptr, file } = pendingUpload.value

    // 添加文件到 ZIP
    imagesDir.file(ptr, file)

    // 生成 README
    const readme = `# 图片导出文件

**导出时间：** ${new Date().toLocaleString('zh-CN')}

## 文件说明

| 原始文件名 | 指针（文件名） |
|------------|----------------|
| ${pendingUpload.value.originalName} | ${ptr} |

## 使用说明

1. 将 \`images/\` 目录中的文件复制到 Nginx 配置的图片目录
2. 确保文件名保持为指针格式（无扩展名）：\`${ptr}\`

## 元数据

图片已注册到 lmjweb 服务中。
`

    zip.file('README.md', readme)

    // 生成下载
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${ptr}.zip`
    link.click()
    URL.revokeObjectURL(url)

    // 完成
    showBatchDownload.value = false
    showAddModal.value = false
    pendingUpload.value = null
    selectedFile.value = null
    generatedPtr.value = ''

    // 刷新列表
    await loadImages()
  } catch (e) {
    console.error(e)
    alert('打包失败：' + e.message)
  } finally {
    downloading.value = false
  }
}

const handleDelete = async (ptr, filename) => {
  if (!confirm(`确定要删除图片 "${filename}" 吗？\n\n注意：此操作仅删除元数据，文件需要手动删除。`)) {
    return
  }

  try {
    await publisher.deleteImage(ptr)
    alert('图片已删除')
    await loadImages()
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}

const copyPath = (ptr) => {
  const path = `${imagesDir.value}/${ptr}`
  navigator.clipboard.writeText(path)
  alert('路径已复制到剪贴板：' + path)
}
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

code {
  background: #f5f5f5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }
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

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
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
