<template>
  <div class="articles-page">
    <h1 class="page-title">文章管理</h1>

    <div class="admin-card">
      <div class="card-header">
        <h2>文章列表</h2>
        <router-link to="/articles/new">
          <button class="admin-btn admin-btn--primary">+ 新建文章</button>
        </router-link>
      </div>

      <div v-if="loading" class="admin-loading">加载中...</div>
      <div v-else-if="articles.length === 0" class="admin-empty">暂无文章</div>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>标签</th>
            <th>封面</th>
            <th>文件路径</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in articles" :key="article.ptr">
            <td>{{ article.title }}</td>
            <td>
              <span v-for="tag in article.tags" :key="tag" class="admin-tag">
                {{ tag }}
              </span>
            </td>
            <td>{{ article.cover?.filename || '无' }}</td>
            <td><code>{{ article.ptr }}</code></td>
            <td>
              <div class="actions">
                <router-link :to="`/articles/${article.ptr}/edit`">
                  <button class="admin-btn admin-btn--secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                    编辑
                  </button>
                </router-link>
                <button 
                  class="admin-btn admin-btn--danger" 
                  style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.5rem;"
                  @click="handleDelete(article.ptr, article.title)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { publisher } from '@shared/api/publisher'
import { batchGet, getObject, getSet } from '@shared/api/lmjweb'

const articles = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const articlePtrs = await publisher.getAllArticles()

    if (articlePtrs.length === 0) {
      articles.value = []
      loading.value = false
      return
    }

    // 使用批量 API 获取所有文章对象（减少请求次数）
    const operations = articlePtrs.map(ptr => ({
      method: 'GET',
      path: `/obj/${ptr}`
    }))

    const batchResult = await batchGet(operations)

    if (!batchResult.success) {
      throw new Error('批量查询失败')
    }

    // 解析批量结果，获取每篇文章的基础信息
    const articleObjects = batchResult.results
      .filter(r => r.status === 200)
      .map(r => r.body)

    // 为每篇文章获取详细信息（封面和标签）
    const details = await Promise.allSettled(
      articleObjects.map(async (articleObj) => {
        const ptr = articleObj.ptr

        // 获取封面信息
        const coverPtr = articleObj.members.find(m => m.name === 'cover')?.value
        let cover = null
        if (coverPtr) {
          try {
            cover = await getObject(coverPtr)
          } catch (e) {
            console.warn(`获取封面失败 (${coverPtr}):`, e)
          }
        }

        // 获取标签列表
        const tagsPtr = articleObj.members.find(m => m.name === 'tags')?.value
        let tags = []
        if (tagsPtr) {
          try {
            const tagsSet = await getSet(tagsPtr)
            tags = (tagsSet.elements || []).map(e => e.value).filter(Boolean)
          } catch (e) {
            console.warn(`获取标签失败 (${ptr}):`, e)
          }
        }

        return {
          ptr,
          title: articleObj.members.find(m => m.name === 'title')?.value,
          cover: cover ? {
            ptr: coverPtr,
            filename: cover.members.find(m => m.name === 'filename')?.value
          } : null,
          tags
        }
      })
    )

    // 过滤出成功的结果
    articles.value = details
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)

    // 记录失败的条目（便于调试）
    const failed = details.filter(r => r.status === 'rejected')
    if (failed.length > 0) {
      console.warn(`有 ${failed.length} 篇文章详情加载失败:`, failed.map(f => f.reason))
    }
  } catch (e) {
    console.error('加载文章列表失败:', e)
  } finally {
    loading.value = false
  }
})

const handleDelete = async (ptr, title) => {
  if (!confirm(`确定要删除文章 "${title}" 吗？\n\n注意：此操作仅删除元数据，文件需要手动删除。`)) {
    return
  }

  try {
    await publisher.deleteArticle(ptr)
    alert('文章已删除')
    // 刷新列表
    const articlePtrs = await publisher.getAllArticles()
    const details = await Promise.all(
      articlePtrs.map(ptr => publisher.getArticleDetail(ptr))
    )
    articles.value = details
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
</style>
