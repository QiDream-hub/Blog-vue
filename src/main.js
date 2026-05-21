import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import { initTheme } from './styles/ThemeStore'
import { initConfig } from './config/blog'

// 初始化主题和配置（同步执行）
initTheme()
initConfig()

const app = createApp(App)

app.use(router)
app.mount('#app')
