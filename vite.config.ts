import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    target: 'esnext', // Required for top-level await in some libraries
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-worker': ['pdfjs-dist'],
          'vendor': ['react', 'react-dom', 'lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  }
})