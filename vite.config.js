import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

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
        '@': resolve(__dirname, 'src'),
      },
    },
    // ✅ RENDER: Configurações específicas para deploy no Render
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
      host: '0.0.0.0', // Necessário para Render
      cors: true
    },
    preview: {
      port: process.env.PORT || 4173, // Render usa variável PORT
      host: '0.0.0.0', // Necessário para Render
      cors: true,
      // ✅ CRÍTICO: Configuração SPA para preview
      middlewareMode: false,
      // Garantir que todas as rotas retornem index.html
      proxy: {},
      headers: {
        'Cache-Control': 'no-cache'
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // ✅ RENDER: Otimizações para deploy
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            api: ['axios']
          }
        }
      },
      // ✅ GARANTIR que arquivos públicos sejam copiados
      copyPublicDir: true
    },
    // ✅ GARANTIR pasta pública
    publicDir: 'public'
  }
})
