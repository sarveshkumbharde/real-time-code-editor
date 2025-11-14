import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://real-time-code-editor-1-hv89.onrender.com',  
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://real-time-code-editor-1-hv89.onrender.com',  // For WebSocket connections
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    },
  },  // ← Missing comma added here
})