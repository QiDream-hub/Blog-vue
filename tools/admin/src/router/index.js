import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '仪表盘' }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: () => import('@/views/Articles.vue'),
    meta: { title: '文章管理' }
  },
  {
    path: '/articles/new',
    name: 'ArticleNew',
    component: () => import('@/views/ArticleForm.vue'),
    meta: { title: '新建文章' }
  },
  {
    path: '/articles/:ptr/edit',
    name: 'ArticleEdit',
    component: () => import('@/views/ArticleForm.vue'),
    meta: { title: '编辑文章' }
  },
  {
    path: '/images',
    name: 'Images',
    component: () => import('@/views/Images.vue'),
    meta: { title: '图片管理' }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/views/Tags.vue'),
    meta: { title: '标签管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 博客管理` : '博客管理'
  next()
})

export default router
