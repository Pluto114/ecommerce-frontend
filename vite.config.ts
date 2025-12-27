import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 引入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 关键配置：告诉 Vite，'@' 等于项目根目录下的 'src'
      '@': path.resolve(__dirname, 'src')
    }
  }
})