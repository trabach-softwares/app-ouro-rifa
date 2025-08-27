import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  // ✅ Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '')
  
  // ✅ Debug das variáveis de ambiente
  console.log('🔧 VITE CONFIG DEBUG:', {
    mode,
    command,
    'env.VITE_API_URL': env.VITE_API_URL,
    'process.cwd()': process.cwd()
  })
  
  // ✅ Validar se a URL está definida
  if (!env.VITE_API_URL) {
    console.error('❌ VITE_API_URL não encontrada no arquivo .env')
    console.error('📁 Verifique se o arquivo .env existe em:', process.cwd())
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    // ✅ Expor variáveis de ambiente para o cliente
    define: {
      __VITE_ENV_DEBUG__: JSON.stringify({
        VITE_API_URL: env.VITE_API_URL,
        NODE_ENV: env.NODE_ENV,
        mode
      })
    },
    server: {
      port: 5173,
      open: true,
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
      }
    },
    preview: {
      port: 4173,
      open: true
    }
  }
})
