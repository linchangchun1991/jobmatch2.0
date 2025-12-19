import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  preview: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    target: 'esnext', // 关键：允许 Top-level await 等现代语法
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'], // 强制预构建 PDF 库
  }
})