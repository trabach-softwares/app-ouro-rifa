import axios from 'axios'

// ✅ CORRIGIDO: Função para obter a base URL focada no Render
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  const mode = import.meta.env.MODE || 'development'
  const hostname = window?.location?.hostname || 'localhost'
  
  console.log('🔧 API CONFIG DEBUG:', {
    'import.meta.env.VITE_API_URL': envUrl,
    'import.meta.env.MODE': mode,
    'window.location.hostname': hostname,
    'import.meta.env.PROD': import.meta.env.PROD,
    'import.meta.env.DEV': import.meta.env.DEV,
    'allEnvVars': import.meta.env
  })
  
  // ✅ Se a variável está definida, usar ela
  if (envUrl && envUrl.trim() !== '') {
    console.log('✅ API Base URL carregada do .env:', envUrl)
    return envUrl.trim()
  }
  
  // ✅ CORRIGIDO: Auto-detecção baseada no hostname (focado no Render)
  let autoDetectedUrl = null
  
  if (hostname.includes('onrender.com')) {
    // Produção no Render
    autoDetectedUrl = 'https://ouro-rifa-api.onrender.com/api'
    console.log('🌐 Auto-detectado ambiente RENDER')
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Desenvolvimento local
    autoDetectedUrl = 'http://localhost:3000/api'
    console.log('💻 Auto-detectado ambiente LOCAL')
  } else {
    console.error('❌ VITE_API_URL não configurada e hostname desconhecido!')
    console.error('📋 Hostname atual:', hostname)
    // Como último recurso, usar a URL do Render
    autoDetectedUrl = 'https://ouro-rifa-api.onrender.com/api'
    console.log('🆘 Usando URL do Render como último recurso')
  }
  
  console.log('🔄 API Base URL auto-detectada:', autoDetectedUrl)
  return autoDetectedUrl
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
  hostname: window?.location?.hostname,
  mode: import.meta.env.MODE,
  isProduction: import.meta.env.PROD
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
  
  // ✅ Buscar rifa específica por ID
  get: async (id) => {
    try {
      console.log('🎯 RIFAS: Buscando rifa por ID...', id)
      const response = await api.get(`/raffles/${id}`)
      console.log('📥 RIFAS: Rifa encontrada:', response.data)
      return response
    } catch (error) {
      console.error('💥 RIFAS: Erro ao buscar rifa:', error)
      throw error
    }
  },
  
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
  update: async (id, data) => {
    try {
      console.log('💾 RIFAS: Atualizando rifa...', { id, data })
      
      const config = {
        headers: {
          'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
        }
      }
      
      const response = await api.put(`/raffles/${id}`, data, config)
      console.log('✅ RIFAS: Rifa atualizada:', response.data)
      return response
    } catch (error) {
      console.error('💥 RIFAS: Erro ao atualizar:', error)
      throw error
    }
  },
  
  // ✅ ADICIONAR: Método getById para compatibilidade
  getById: async (id) => {
    try {
      console.log('🎯 RIFAS: Buscando rifa por ID (getById)...', id)
      const response = await api.get(`/raffles/${id}`)
      console.log('📥 RIFAS: Rifa encontrada:', response.data)
      return response
    } catch (error) {
      console.error('💥 RIFAS: Erro ao buscar rifa:', error)
      throw error
    }
  },
  
  // ✅ ADICIONAR: Método para comprar números
  comprarNumeros: async (rifaId, numeros) => {
    try {
      console.log('🎫 RIFAS: Comprando números...', { rifaId, numeros })
      
      const payload = {
        ticketNumbers: numeros,
        quantity: numeros.length
      }
      
      const response = await api.post(`/raffles/${rifaId}/purchase`, payload)
      console.log('✅ RIFAS: Compra realizada:', response.data)
      return response
    } catch (error) {
      console.error('💥 RIFAS: Erro ao comprar números:', error)
      throw error
    }
  },

  // ✅ ADICIONAR: Método para atualizar status
  updateStatus: async (rifaId, status) => {
    try {
      console.log('🔄 RIFAS: Atualizando status...', { rifaId, status })
      
      const payload = { status }
      const response = await api.put(`/raffles/${rifaId}/status`, payload)
      console.log('✅ RIFAS: Status atualizado:', response.data)
      return response
    } catch (error) {
      console.error('💥 RIFAS: Erro ao atualizar status:', error)
      throw error
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

// ✅ CORRIGIDO: Construir URL correta da API para as imagens
export const getRifaImageUrl = (rifa) => {
  // Verificar se tem imagem principal (ID)
  if (rifa.image) {
    // Construir URL da API para acessar a imagem
    const baseURL = getApiBaseUrl() // Usar a mesma função que já temos
    return `${baseURL}/upload/${rifa.image}`
  }
  
  // Verificar se tem imagens da campanha
  if (rifa.campaignImages && rifa.campaignImages.length > 0) {
    const firstImage = rifa.campaignImages[0]
    const imageId = firstImage.url || firstImage.id || firstImage
    
    if (imageId) {
      const baseURL = getApiBaseUrl()
      return `${baseURL}/upload/${imageId}`
    }
  }
  
  // Se não tem imagem, retornar null (vai usar placeholder)
  return null
}

// ✅ EXPORTAR função para tratar erro de imagem
export const handleImageError = (event) => {
  console.warn('Erro ao carregar imagem da rifa:', event.target.src)
  
  // Esconder a imagem com erro
  event.target.style.display = 'none'
  
  // Mostrar placeholder
  const imageContainer = event.target.parentElement
  const placeholder = imageContainer.querySelector('.fallback-placeholder')
  if (placeholder) {
    placeholder.style.display = 'flex'
  }
}

// ✅ ADICIONAR: Exportar a instância do axios
export { api }

// ✅ CORRIGIDO: API específica para tickets (baseada no novo curl)
export const ticketsAPI = {
  // ✅ NOVO: Listar vendas de tickets (endpoint correto)
  getSalesList: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      // ✅ USAR parâmetros conforme o novo curl
      if (params.status) queryParams.append('status', params.status)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      
      // ✅ USAR ENDPOINT CORRETO: /tickets/sales/list
      const url = `/tickets/sales/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      console.log('🎫 TICKETS: Carregando lista de vendas...', url)
      const response = await api.get(url)
      console.log('📥 TICKETS: Lista de vendas carregada:', response.data)
      return response
    } catch (error) {
      console.error('💥 TICKETS: Erro ao carregar lista de vendas:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar lista de vendas')
    }
  },

  // ✅ NOVO: Listar tickets por rifa (endpoint alternativo)
  getRaffleTickets: async (raffleId, params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      
      const url = `/tickets/raffle/${raffleId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      console.log('🎯 TICKETS: Carregando tickets da rifa...', url)
      const response = await api.get(url)
      console.log('📥 TICKETS: Tickets da rifa carregados:', response.data)
      return response
    } catch (error) {
      console.error('💥 TICKETS: Erro ao carregar tickets da rifa:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar tickets da rifa')
    }
  },

  // Listar todos os tickets do usuário
  getMyTickets: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.status) queryParams.append('status', params.status)
      
      const url = `/tickets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      console.log('🎫 TICKETS: Carregando meus tickets...', url)
      const response = await api.get(url)
      console.log('📥 TICKETS: Tickets carregados:', response.data)
      return response
    } catch (error) {
      console.error('💥 TICKETS: Erro ao carregar tickets:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar tickets')
    }
  },

  // Obter ticket específico por ID
  getTicketById: async (ticketId) => {
    try {
      console.log('🎫 TICKETS: Carregando ticket...', ticketId)
      const response = await api.get(`/tickets/${ticketId}`)
      console.log('📥 TICKETS: Ticket carregado:', response.data)
      return response
    } catch (error) {
      console.error('💥 TICKETS: Erro ao carregar ticket:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar ticket')
    }
  },

  // Comprar tickets
  buyTickets: async (ticketData) => {
    try {
      console.log('💰 TICKETS: Comprando tickets...', ticketData)
      const response = await api.post('/tickets', ticketData)
      console.log('✅ TICKETS: Tickets comprados:', response.data)
      return response
    } catch (error) {
      console.error('💥 TICKETS: Erro ao comprar tickets:', error)
      throw new Error(error.response?.data?.message || 'Erro ao comprar tickets')
    }
  },

  // Cancelar ticket
  cancelTicket: async (ticketId) => {
    try {
      console.log('❌ TICKETS: Cancelando ticket...', ticketId)
      const response = await api.put(`/tickets/${ticketId}/cancel`)
      console.log('✅ TICKETS: Ticket cancelado:', response.data)
      return response
    } catch (error) {
      console.error('💥 TICKETS: Erro ao cancelar ticket:', error)
      throw new Error(error.response?.data?.message || 'Erro ao cancelar ticket')
    }
  }
}

// ✅ MANTER paymentsAPI como fallback (remover getSalesList que conflita)
export const paymentsAPI = {
  // ✅ REMOVER: getSalesList (agora está em ticketsAPI)
  
  // Listar meus pagamentos (endpoint antigo mantido para compatibilidade)
  getMyPayments: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.status) queryParams.append('status', params.status)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      
      const url = `/payments/my-payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      console.log('💰 PAYMENTS: Carregando meus pagamentos...', url)
      const response = await api.get(url)
      console.log('📥 PAYMENTS: Pagamentos carregados:', response.data)
      return response
    } catch (error) {
      console.error('💥 PAYMENTS: Erro ao carregar pagamentos:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar pagamentos')
    }
  },

  // Pagamentos por rifa (para donos de rifa)
  getRafflePayments: async (raffleId, params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      
      const url = `/payments/raffle/${raffleId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      console.log('🎯 PAYMENTS: Carregando pagamentos da rifa...', url)
      const response = await api.get(url)
      console.log('📥 PAYMENTS: Pagamentos da rifa carregados:', response.data)
      return response
    } catch (error) {
      console.error('💥 PAYMENTS: Erro ao carregar pagamentos da rifa:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar pagamentos da rifa')
    }
  },

  // Todos os pagamentos (admin)
  getAllPayments: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.status) queryParams.append('status', params.status)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      
      const url = `/payments/admin/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      console.log('👮 PAYMENTS: Carregando todos os pagamentos (admin)...', url)
      const response = await api.get(url)
      console.log('📥 PAYMENTS: Todos os pagamentos carregados:', response.data)
      return response
    } catch (error) {
      console.error('💥 PAYMENTS: Erro ao carregar todos os pagamentos:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar todos os pagamentos')
    }
  },

  // Obter status do pagamento
  getPaymentStatus: async (paymentId) => {
    try {
      console.log('📊 PAYMENTS: Carregando status do pagamento...', paymentId)
      const response = await api.get(`/payments/${paymentId}`)
      console.log('📥 PAYMENTS: Status do pagamento:', response.data)
      return response
    } catch (error) {
      console.error('💥 PAYMENTS: Erro ao carregar status do pagamento:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar status do pagamento')
    }
  },

  // Gerar PIX
  generatePix: async (ticketId) => {
    try {
      console.log('🔢 PAYMENTS: Gerando PIX...', ticketId)
      const response = await api.post('/payments/pix', { ticketId })
      console.log('✅ PAYMENTS: PIX gerado:', response.data)
      return response
    } catch (error) {
      console.error('💥 PAYMENTS: Erro ao gerar PIX:', error)
      throw new Error(error.response?.data?.message || 'Erro ao gerar PIX')
    }
  },

  // Confirmar pagamento
  confirmPayment: async (paymentId, transactionId) => {
    try {
      console.log('✅ PAYMENTS: Confirmando pagamento...', { paymentId, transactionId })
      const response = await api.post('/payments/confirm', { paymentId, transactionId })
      console.log('✅ PAYMENTS: Pagamento confirmado:', response.data)
      return response
    } catch (error) {
      console.error('💥 PAYMENTS: Erro ao confirmar pagamento:', error)
      throw new Error(error.response?.data?.message || 'Erro ao confirmar pagamento')
    }
  },

  // Estatísticas de pagamentos (admin)
  getPaymentStats: async () => {
    try {
      console.log('📊 PAYMENTS: Carregando estatísticas de pagamentos...')
      const response = await api.get('/payments/admin/stats')
      console.log('📥 PAYMENTS: Estatísticas carregadas:', response.data)
      return response
    } catch (error) {
      console.error('💥 PAYMENTS: Erro ao carregar estatísticas:', error)
      throw new Error(error.response?.data?.message || 'Erro ao carregar estatísticas')
    }
  }
}