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

const app = createApp(App)

app.use(router)
app.component("AppFooter", Footer)
app.component("AppHader", Hader)
app.component("Navbar", Navbar)
app.component("BlogPostView", BlogPostView)

app.component("BlogCard", BlogCard)
app.component("TagCrad",TagCard)

app.mount('#app')
