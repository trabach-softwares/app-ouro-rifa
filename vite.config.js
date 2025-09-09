import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('🔧 VITE CONFIG DEBUG:', {
    mode,
    command,
    'env.VITE_API_URL': env.VITE_API_URL,
    'env.NODE_ENV': env.NODE_ENV
  })

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: process.env.PORT || 5173,
      host: '0.0.0.0',
      cors: true,
      // ✅ CORREÇÃO: Configuração SPA para desenvolvimento
      historyApiFallback: true
    },
    preview: {
      port: process.env.PORT || 4173,
      host: '0.0.0.0',
      cors: true,
      // ✅ CRÍTICO: Configuração SPA para preview/produção
      historyApiFallback: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            api: ['axios']
          }
        }
      },
      copyPublicDir: true
    },
    publicDir: 'public'
  }
})
