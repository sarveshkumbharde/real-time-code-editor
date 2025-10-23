import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // This helps with local development
      '/api': {
        target: 'https://real-time-code-editor-yzuv.onrender.com',  // Local backend during development
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://real-time-code-editor-yzuv.onrender.com',  // For WebSocket connections
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    },
  },  // ← Missing comma added here
})