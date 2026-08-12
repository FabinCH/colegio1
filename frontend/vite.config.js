import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // Escucha en todas las interfaces de red (WiFi incluida)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // Conecta directamente al backend en la misma PC
        changeOrigin: true,
      }
    }
  }
})
