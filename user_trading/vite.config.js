import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pinned so theme_trading's post-login redirect can target this app by URL
  server: {
    port: 5174,
    strictPort: true,
  },
})
