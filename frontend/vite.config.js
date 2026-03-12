import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // /SAI-APP-3.0/ for GitHub Pages (set via VITE_BASE_PATH in workflow), / everywhere else
    base: env.VITE_BASE_PATH || '/',
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      watch: {
        usePolling: true
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
        '@components': path.resolve(rootDir, './src/components'),
        '@pages': path.resolve(rootDir, './src/pages'),
        '@services': path.resolve(rootDir, './src/services'),
        '@hooks': path.resolve(rootDir, './src/hooks'),
        '@contexts': path.resolve(rootDir, './src/contexts'),
        '@utils': path.resolve(rootDir, './src/utils'),
        '@config': path.resolve(rootDir, './src/config'),
        '@assets': path.resolve(rootDir, './src/assets')
      }
    }
  }
})
