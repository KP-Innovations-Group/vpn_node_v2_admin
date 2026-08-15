import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const API_TARGET = process.env.VITE_API_ORIGIN || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/health': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/swagger': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
