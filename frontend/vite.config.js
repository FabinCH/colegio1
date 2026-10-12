import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://colegio1.onrender.com',  
        changeOrigin: true,
      }
    }
  }
})
