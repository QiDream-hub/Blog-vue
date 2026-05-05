import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Footer from './components/Footer.vue'
import Hader from './components/Header.vue'
import Navbar from './components/Navbar.vue'
import BlogCard from './components/BlogCard.vue'
import BlogPostView from './components/BlogPostView.vue'
import 'highlight.js/styles/github.css'
import TagCard from './components/TagCard.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import './styles/variables.css'
import { initTheme } from './styles/ThemeStore'

// 初始化主题（在挂载应用之前）
initTheme()

const app = createApp(App)

app.use(router)
app.component("AppFooter", Footer)
app.component("AppHader", Hader)
app.component("Navbar", Navbar)
app.component("BlogPostView", BlogPostView)

app.component("BlogCard", BlogCard)
app.component("TagCrad",TagCard)
app.component("ThemeToggle",ThemeToggle)

app.mount('#app')
