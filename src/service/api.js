import axios from 'axios'

// ✅ MELHORADO: Função para obter a base URL com validação e debug
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  
  console.log('🔧 API CONFIG DEBUG:', {
    'import.meta.env': import.meta.env,
    'VITE_API_URL': envUrl,
    'typeof': typeof envUrl,
    'isUndefined': envUrl === undefined,
    'isEmpty': envUrl === '',
    'length': envUrl?.length || 0
  })
  
  // ✅ Validar se a URL foi carregada corretamente
  if (!envUrl || envUrl === undefined || envUrl.trim() === '') {
    console.error('❌ VITE_API_URL não está definida ou está vazia!')
    console.error('📋 Verifique:')
    console.error('   1. Se o arquivo .env existe na raiz do projeto')
    console.error('   2. Se a variável está definida como: VITE_API_URL=sua_url_aqui')
    console.error('   3. Se o servidor foi reiniciado após criar/modificar o .env')
    throw new Error('URL da API não configurada. Verifique a variável VITE_API_URL no arquivo .env')
  }
  
  console.log('✅ API Base URL carregada:', envUrl)
  return envUrl.trim()
}

// Configuração base do axios
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ✅ Log da configuração final para debug
console.log('🚀 AXIOS CONFIGURADO:', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  headers: api.defaults.headers
})

// Função helper para verificar se o token está expirado
const isTokenExpired = (token) => {
  if (!token || token === 'undefined' || token === 'null') return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp < now
    
    if (isExpired) {
      console.warn('⚠️ TOKEN EXPIRADO:', {
        issued: new Date(payload.iat * 1000).toLocaleString(),
        expires: new Date(payload.exp * 1000).toLocaleString(),
        now: new Date().toLocaleString(),
        expired: true
      })
    }
    
    return isExpired
  } catch (error) {
    console.error('❌ Erro ao verificar expiração do token:', error)
    return true
  }
}

// Função para obter token válido (prioriza a store, depois localStorage)
const getValidToken = async () => {
  // Tentar obter da store primeiro (se disponível)
  let token = null
  
  try {
    // Importar store dinamicamente para evitar dependência circular
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    token = authStore.getCurrentToken()
  } catch (error) {
    // Se não conseguir acessar a store, usar localStorage diretamente
    token = localStorage.getItem('auth_token')
  }
  
  // Verificar se o token é válido
  if (!token || token === 'undefined' || token === 'null') {
    console.log('🔍 TOKEN: Não encontrado')
    return null
  }

  // Verificar se não está expirado
  if (isTokenExpired(token)) {
    console.warn('🧹 TOKEN: Expirado, removendo...')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    return null
  }

  return token
}

// Função helper para debug do token
const debugToken = async () => {
  const token = await getValidToken()
  
  if (!token) {
    console.log('🔍 DEBUG TOKEN: Token não encontrado ou inválido')
    return null
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = Math.max(0, payload.exp - now)
    const minutesLeft = Math.floor(timeLeft / 60)
    
    console.log('🔍 DEBUG TOKEN:', {
      exists: true,
      length: token.length,
      firstChars: token.substring(0, 30),
      issued: new Date(payload.iat * 1000).toLocaleString(),
      expires: new Date(payload.exp * 1000).toLocaleString(),
      isExpired: payload.exp < now,
      timeLeft: timeLeft > 0 ? `${minutesLeft} minutos` : 'EXPIRADO',
      userId: payload.id,
      userEmail: payload.email,
      userRole: payload.role
    })
    
    return token
  } catch (error) {
    console.error('❌ Erro ao decodificar token:', error)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    return null
  }
}

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  async (config) => {
    console.log('🚀 INTERCEPTOR: Preparando requisição para:', config.url)
    
    const token = await debugToken()
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ INTERCEPTOR: Header Authorization definido')
    } else {
      console.warn('⚠️ INTERCEPTOR: Token não encontrado, expirado ou inválido')
      delete config.headers.Authorization
      
      // Se não há token válido e a rota precisa de autenticação, redirecionar
      if (!window.location.pathname.includes('/login') && !config.url.includes('/auth/login')) {
        console.log('🔄 INTERCEPTOR: Redirecionando para login por token expirado...')
        // Usar timeout para evitar problemas de timing
        setTimeout(async () => {
          try {
            const { default: router } = await import('@/router')
            router.push('/login?expired=true')
          } catch (error) {
            console.error('Erro ao redirecionar:', error)
            window.location.href = '/login?expired=true'
          }
        }, 100)
      }
    }
    
    return config
  },
  (error) => {
    console.error('💥 INTERCEPTOR: Erro no request:', error)
    return Promise.reject(error)
  }
)

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    console.log('✅ INTERCEPTOR: Resposta bem-sucedida para:', response.config.url)
    return response
  },
  async (error) => {
    console.error('❌ INTERCEPTOR: Erro na resposta:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })
    
    if (error.response?.status === 401) {
      console.warn('🔐 INTERCEPTOR: Erro 401 - Token inválido ou expirado')
      
      // Limpar dados de autenticação
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      
      // Limpar store se disponível
      try {
        const { useAuthStore } = await import('@/stores/auth')
        const authStore = useAuthStore()
        authStore.clearAuthData()
      } catch (storeError) {
        console.warn('Não foi possível limpar store:', storeError)
      }
      
      // Redirecionar para login se não estiver na página de login
      if (!window.location.pathname.includes('/login')) {
        console.log('🔄 INTERCEPTOR: Redirecionando para login...')
        setTimeout(async () => {
          try {
            const { default: router } = await import('@/router')
            router.push('/login?expired=true')
          } catch (routerError) {
            console.error('Erro ao redirecionar:', routerError)
            window.location.href = '/login?expired=true'
          }
        }, 100)
      }
    }
    return Promise.reject(error)
  }
)

// ✅ CORRIGIDO: API de autenticação com endpoints corretos
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('🔐 LOGIN: Iniciando para:', credentials.email)
      const response = await api.post('/auth/login', credentials)
      console.log('📥 LOGIN: Resposta completa:', response.data)
      
      return response
    } catch (error) {
      console.error('💥 LOGIN: Erro:', error)
      throw new Error(error.response?.data?.message || 'Erro de conexão')
    }
  },

  register: async (userData) => {
    try {
      console.log('📝 REGISTER: Iniciando...')
      const response = await api.post('/auth/register', userData)
      console.log('📥 REGISTER: Resposta:', response.data)
      return response
    } catch (error) {
      console.error('💥 REGISTER: Erro:', error)
      throw new Error(error.response?.data?.message || 'Erro de conexão')
    }
  },

  logout: async () => {
    try {
      console.log('🚪 LOGOUT: Iniciando...')
      return await api.post('/auth/logout')
    } catch (error) {
      console.error('💥 LOGOUT: Erro:', error)
      return { data: { success: true } }
    }
  },

  // ✅ CORRIGIDO: Obter dados do perfil - GET /auth/profile
  me: async () => {
    try {
      console.log('👤 ME: Buscando dados do perfil...')
      const response = await api.get('/auth/profile')
      console.log('📥 ME: Dados do perfil carregados:', response.data)
      return response
    } catch (error) {
      console.error('💥 ME: Erro ao carregar perfil:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw new Error(error.response?.data?.message || 'Erro ao carregar perfil')
    }
  },

  // ✅ CORRIGIDO: Atualizar perfil - PUT /auth/profile (conforme curl)
  updateProfile: async (userData) => {
    try {
      console.log('🔄 API: Atualizando perfil...', userData)
      
      // Preparar payload conforme curl fornecido
      const payload = {
        name: userData.name?.trim() || '',
        company: userData.company?.trim() || '',
        phone: userData.phone?.trim() || '',
        paymentSettings: {
          pixKey: userData.paymentSettings?.pixKey?.trim() || '',
          bankName: userData.paymentSettings?.bankName?.trim() || '',
          agency: userData.paymentSettings?.agency?.trim() || '',
          account: userData.paymentSettings?.account?.trim() || '',
          accountType: userData.paymentSettings?.accountType || 'corrente'
        }
      }
      
      console.log('📤 API: Payload final:', payload)
      
      const response = await api.put('/auth/profile', payload)
      console.log('✅ API: Perfil atualizado:', response.data)
      return response
    } catch (error) {
      console.error('💥 API: Erro ao atualizar perfil:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      })
      throw error
    }
  },

  // ✅ CORRIGIDO: Alterar senha - PUT /auth/change-password
  changePassword: async (passwordData) => {
    try {
      console.log('🔄 API: Alterando senha...')
      
      // Payload conforme esperado pela API
      const payload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }
      
      const response = await api.put('/auth/change-password', payload)
      console.log('✅ API: Senha alterada com sucesso')
      return response
    } catch (error) {
      console.error('💥 API: Erro ao alterar senha:', error)
      throw error
    }
  },
}

// API do Dashboard
export const dashboardAPI = {
  getStats: async () => {
    try {
      return await api.get('/reports/dashboard')
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao carregar estatísticas')
    }
  },

  getRecentRifas: async () => {
    try {
      console.log('📊 DASHBOARD: Carregando rifas recentes...')
      return await api.get('/raffles/user/my-raffles?limit=5&sort=created_at&order=desc')
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao carregar rifas recentes')
    }
  }
}

// API de Relatórios  
export const reportsAPI = {
  getDashboard: async () => {
    try {
      return await api.get('/reports/dashboard')
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao carregar dados do dashboard')
    }
  },

  getSales: async (params = {}) => {
    try {
      const { startDate, endDate, raffleId } = params
      const queryParams = new URLSearchParams()
      
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)
      if (raffleId) queryParams.append('raffleId', raffleId)
      
      const url = `/reports/sales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      return await api.get(url)
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao carregar relatório de vendas')
    }
  },

  getRevenue: async (period = 'monthly') => {
    try {
      return await api.get(`/reports/revenue?period=${period}`)
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao carregar relatório de receita')
    }
  }
}

// API das Rifas
export const rifasAPI = {
  // Listar rifas do usuário autenticado
  listMyRaffles: async (params = {}) => {
    try {
      console.log('🎯 RIFAS: Listando rifas do usuário...')
      
      const queryParams = new URLSearchParams()
      
      // Parâmetros específicos da API
      if (params.status) queryParams.append('status', params.status)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.order) queryParams.append('order', params.order)
      
      const url = `/raffles/user/my-raffles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      console.log('🌐 RIFAS: URL da requisição:', url)
      
      const response = await api.get(url)
      console.log('📥 RIFAS: Resposta:', response.data)
      return response
    } catch (error) {
      console.error('💥 RIFAS: Erro ao listar:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      })
      throw error
    }
  },
  
  // Método compatível com código existente
  list: async (params = {}) => {
    return rifasAPI.listMyRaffles(params)
  },
  
  // Buscar rifa específica
  get: (id) => api.get(`/raffles/${id}`),
  
  // ✅ NOVO: Criar nova rifa (com suporte a FormData)
  create: async (data) => {
    try {
      console.log('🎯 RIFAS: Criando nova rifa...')
      
      const config = {
        headers: {
          'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
        }
      }
      
      const response = await api.post('/raffles', data, config)
      console.log('📥 RIFAS: Rifa criada:', response.data)
      return response
    } catch (error) {
      console.error('💥 RIFAS: Erro ao criar:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw error
    }
  },
  
  // ✅ NOVO: Criar rifa com imagem usando FormData
  createWithImage: (formData) => {
    return api.post('/raffles/with-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Atualizar rifa
  update: (id, data) => api.put(`/raffles/${id}`, data),
  
  // Deletar rifa
  delete: (id) => api.delete(`/raffles/${id}`),
  
  // Alterar status da rifa
  updateStatus: async (id, status) => {
    try {
      return await api.patch(`/raffles/${id}/status`, { status })
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao alterar status da rifa')
    }
  },
  
  // Método para alternar status (compatibilidade)
  toggleStatus: async (id) => {
    try {
      return await api.patch(`/raffles/${id}/toggle-status`)
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao alterar status da rifa')
    }
  }
}

// API de Upload
export const uploadAPI = {
  // Upload de imagem
  uploadImage: async (file, description = '', category = 'raffle_images') => {
    try {
      console.log('📤 UPLOAD: Enviando imagem...', { 
        fileName: file.name, 
        size: file.size, 
        type: file.type 
      })
      
      const formData = new FormData()
      formData.append('image', file)
      formData.append('description', description)
      formData.append('category', category)
      
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      console.log('✅ UPLOAD: Imagem enviada com sucesso:', response.data)
      return response
    } catch (error) {
      console.error('💥 UPLOAD: Erro ao enviar imagem:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw new Error(error.response?.data?.message || 'Erro ao fazer upload da imagem')
    }
  },
  
  // Listar uploads do usuário
  getMyUploads: async (params = {}) => {
    try {
      console.log('📂 UPLOAD: Carregando uploads do usuário...', params)
      
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.category) queryParams.append('category', params.category)
      
      const url = `/upload/my-uploads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await api.get(url)
      console.log('📥 UPLOAD: Uploads carregados:', response.data)
      return response
    } catch (error) {
      console.error('💥 UPLOAD: Erro ao carregar uploads:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw new Error(error.response?.data?.message || 'Erro ao carregar uploads')
    }
  },
  
  // Deletar upload
  deleteUpload: async (uploadId) => {
    try {
      console.log('🗑️ UPLOAD: Deletando upload...', uploadId)
      
      const response = await api.delete(`/upload/${uploadId}`)
      console.log('✅ UPLOAD: Upload deletado:', response.data)
      return response
    } catch (error) {
      console.error('💥 UPLOAD: Erro ao deletar upload:', error)
      throw new Error(error.response?.data?.message || 'Erro ao deletar upload')
    }
  }
}

export default api