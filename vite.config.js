import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      "qdream.xyz"
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'markdown-vendor': ['marked', 'dompurify'],
          'highlight-vendor': ['highlight.js'],
        },
      },
    },
    // 启用更激进代码分割
    minify: 'esbuild',
    cssCodeSplit: true,
    // 调整 chunk 大小警告限制
    chunkSizeWarningLimit: 500,
  },
  // 优化 esbuild 打包
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
