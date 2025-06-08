import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['modest-exactly-asp.ngrok-free.app', 'localhost', '127.0.0.1', '0.0.0.0'],
  },
  plugins: [react(), tailwindcss()],
})
