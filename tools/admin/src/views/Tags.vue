<template>
  <div class="tags-page">
    <h1 class="page-title">标签管理</h1>

    <div class="admin-card">
      <div class="card-header">
        <h2>标签列表</h2>
        <button class="admin-btn admin-btn--primary" @click="showAddModal = true">+ 新建标签</button>
      </div>

      <div v-if="loading" class="admin-loading">加载中...</div>
      <div v-else-if="tags.length === 0" class="admin-empty">暂无标签</div>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>标签名</th>
            <th>文章数</th>
            <th>指针</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in tags" :key="tag.ptr">
            <td>{{ tag.name }}</td>
            <td>{{ tag.articleCount }} 篇</td>
            <td><code>{{ tag.ptr }}</code></td>
            <td>
              <button 
                class="admin-btn admin-btn--danger" 
                style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                @click="handleDelete(tag.name)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新建标签模态框 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建标签</h3>
          <button class="modal-close" @click="showAddModal = false">×</button>
        </div>
        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label for="name">标签名称</label>
            <input
              id="name"
              v-model="tagName"
              type="text"
              class="admin-input"
              required
              placeholder="例如：技术"
            />
          </div>
          <div class="form-actions">
            <button type="submit" class="admin-btn admin-btn--primary" :disabled="submitting">
              {{ submitting ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { publisher } from '@shared/api/publisher'
import { batchGet, getSet } from '@shared/api/lmjweb'

const tags = ref([])
const loading = ref(true)
const showAddModal = ref(false)
const tagName = ref('')
const submitting = ref(false)

onMounted(async () => {
  await loadTags()
})

const loadTags = async () => {
  try {
    const tagPtrs = await publisher.getAllTags()

    if (tagPtrs.length === 0) {
      tags.value = []
      loading.value = false
      return
    }

    // 使用批量 API 获取所有标签对象（减少请求次数）
    const operations = tagPtrs.map(ptr => ({
      method: 'GET',
      path: `/obj/${ptr}`
    }))

    const batchResult = await batchGet(operations)

    if (!batchResult.success) {
      throw new Error('批量查询失败')
    }

    // 解析批量结果并获取文章数量
    const tagObjects = batchResult.results
      .filter(r => r.status === 200)
      .map(r => r.body)

    const details = await Promise.allSettled(
      tagObjects.map(async (tagObj) => {
        const postsPtr = tagObj.members.find(m => m.name === 'posts')?.value
        let articleCount = 0
        if (postsPtr) {
          try {
            const postsSet = await getSet(postsPtr)
            articleCount = (postsSet.elements || []).filter(e => e.value).length
          } catch (e) {
            console.warn(`获取标签文章数失败 (${tagObj.ptr}):`, e)
          }
        }
        return {
          ptr: tagObj.ptr,
          name: tagObj.members.find(m => m.name === 'name')?.value,
          articleCount
        }
      })
    )

    // 过滤出成功的结果
    tags.value = details
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)

    // 记录失败的条目（便于调试）
    const failed = details.filter(r => r.status === 'rejected')
    if (failed.length > 0) {
      console.warn(`有 ${failed.length} 个标签详情加载失败:`, failed.map(f => f.reason))
    }
  } catch (e) {
    console.error('加载标签列表失败:', e)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!tagName.value.trim()) {
    alert('请输入标签名称')
    return
  }

  submitting.value = true

  try {
    await publisher.createTag(tagName.value)
    alert('标签已创建')
    showAddModal.value = false
    tagName.value = ''
    await loadTags()
  } catch (e) {
    alert('创建失败：' + e.message)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (name) => {
  if (!confirm(`确定要删除标签 "${name}" 吗？\n\n此操作会：\n1. 从博客标签列表中移除\n2. 从所有关联文章中移除\n3. 删除标签对象\n\n文件不会被删除。`)) {
    return
  }

  try {
    await publisher.deleteTag(name)
    alert('标签已删除')
    await loadTags()
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
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

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
