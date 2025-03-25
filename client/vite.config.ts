import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig((): UserConfig => {
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      strictPort: true
    },
    preview: {
      port: 3000
    }
  }
})