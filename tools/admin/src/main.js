import { createApp } from 'vue'
import { initConfig } from '@shared/config/blog'
import App from './App.vue'
import router from './router'

// 初始化配置
initConfig()

const app = createApp(App)
app.use(router)
app.mount('#app')
