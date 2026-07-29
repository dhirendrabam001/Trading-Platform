import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ports are pinned because the login redirect targets the dashboards by
  // absolute URL. strictPort makes a clash fail loudly rather than silently
  // drifting to the next free port and breaking the handoff.
  server: {
    port: 5173,
    strictPort: true,
  },
})
