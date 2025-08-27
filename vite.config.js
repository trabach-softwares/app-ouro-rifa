import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('🔧 VITE CONFIG DEBUG:', {
    mode,
    command,
    'env.VITE_API_URL': env.VITE_API_URL,
    'env.NODE_ENV': env.NODE_ENV,
    'process.cwd()': process.cwd(),
    'allViteEnvs': Object.keys(env).filter(key => key.startsWith('VITE_'))
  })

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      __VITE_ENV_DEBUG__: JSON.stringify({
        VITE_API_URL: env.VITE_API_URL,
        NODE_ENV: env.NODE_ENV,
        mode,
        platform: 'render',
        timestamp: new Date().toISOString()
      })
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      cors: true
    },
    preview: {
      port: process.env.PORT || 4173,
      host: '0.0.0.0',
      cors: true
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
