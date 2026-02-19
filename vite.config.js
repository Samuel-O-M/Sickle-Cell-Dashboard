import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: "/Sickle-Cell-Dashboard/",
  server: {
    allowedHosts: ['modest-exactly-asp.ngrok-free.app', 'localhost', '127.0.0.1', '0.0.0.0'],
    static: { dirs: ['src/private'] },
  },
  plugins: [react(), tailwindcss()],
})
