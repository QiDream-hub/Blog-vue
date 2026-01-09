import About from '@/views/About.vue'
import Blog from '@/views/Blog.vue'
import Error from '@/views/Error.vue'
import Home from '@/views/Home.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/",
      name: "首页",
      component: Home,
    },
    {
      path: "/about",
      name: "关于",
      component: About
    },
    {
      path: '/blogs/:slug',
      component: Blog,
      props: true

    },
    {
      path: '/error/:slug(.*)*',
      component: Error,
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      component: Error,
      props: true
    }
  ],
})

export default router
