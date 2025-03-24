import { defineConfig, loadEnv, ConfigEnv, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '3000'),
      host: true,
      strictPort: true
    },
    preview: {
      port: parseInt(env.VITE_PORT || '3000')
    }
  }
})