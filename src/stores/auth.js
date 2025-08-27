import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authAPI } from '@/service/api'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const token = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(true)
  
  // Função para verificar se o token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      const isExpired = payload.exp < now
      
      if (isExpired) {
        console.warn('⚠️ TOKEN EXPIRADO:', {
          issued: new Date(payload.iat * 1000).toLocaleString(),
          expires: new Date(payload.exp * 1000).toLocaleString(),
          now: new Date().toLocaleString(),
          timeExpired: Math.floor((now - payload.exp) / 60) + ' minutos atrás'
        })
      }
      
      return isExpired
    } catch (error) {
      console.error('❌ Erro ao verificar expiração do token:', error)
      return true
    }
  }
  
  // Função para salvar token e dados do usuário
  const saveAuthData = (tokenValue, userData) => {
    console.log('💾 AUTH STORE: Salvando dados de autenticação...')
    
    // Atualizar estado da store
    token.value = tokenValue
    user.value = userData
    isAuthenticated.value = true
    
    // Salvar no localStorage
    localStorage.setItem('auth_token', tokenValue)
    localStorage.setItem('user_data', JSON.stringify(userData))
    
    // Verificar se foi salvo corretamente
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user_data')
    
    console.log('✅ AUTH STORE: Dados salvos:', {
      tokenInStore: !!token.value,
      tokenInLocalStorage: !!savedToken,
      tokensMatch: token.value === savedToken,
      userInStore: !!user.value,
      userInLocalStorage: !!savedUser,
      tokenLength: tokenValue?.length || 0,
      tokenStart: tokenValue?.substring(0, 30) || 'N/A'
    })
    
    // Log da expiração do token
    if (tokenValue) {
      try {
        const payload = JSON.parse(atob(tokenValue.split('.')[1]))
        const timeLeft = Math.floor((payload.exp - Math.floor(Date.now() / 1000)) / 60)
        console.log(`⏰ AUTH STORE: Token expira em ${timeLeft} minutos (${new Date(payload.exp * 1000).toLocaleString()})`)
      } catch (error) {
        console.warn('Não foi possível decodificar a data de expiração do token')
      }
    }
  }
  
  // Actions
  const login = async (credentials) => {
    try {
      console.log('🔐 AUTH STORE: Iniciando login para:', credentials.email)
      const response = await authAPI.login(credentials)
      
      console.log('📥 AUTH STORE: Resposta completa do login:', response.data)
      
      if (response.data.success) {
        // Buscar token em diferentes possíveis localizações na resposta
        const possibleTokenFields = [
          'token',
          'access_token',
          'accessToken',
          'jwt',
          'authToken'
        ]
        
        let authToken = null
        let userData = null
        
        // Verificar no nível raiz
        for (const field of possibleTokenFields) {
          if (response.data[field]) {
            authToken = response.data[field]
            console.log(`✅ AUTH STORE: Token encontrado em response.data.${field}`)
            break
          }
        }
        
        // Verificar no data.data se não encontrou no nível raiz
        if (!authToken && response.data.data) {
          for (const field of possibleTokenFields) {
            if (response.data.data[field]) {
              authToken = response.data.data[field]
              console.log(`✅ AUTH STORE: Token encontrado em response.data.data.${field}`)
              break
            }
          }
        }
        
        // Buscar dados do usuário
        userData = response.data.user || 
                  response.data.data?.user ||
                  response.data.userData ||
                  response.data.data?.userData
        
        console.log('🔍 AUTH STORE: Debug dos dados extraídos:', {
          tokenFound: !!authToken,
          tokenLength: authToken?.length || 0,
          tokenStart: authToken?.substring(0, 30) || 'N/A',
          userFound: !!userData,
          userEmail: userData?.email || 'N/A'
        })
        
        if (!authToken) {
          console.error('❌ AUTH STORE: Nenhum token encontrado na resposta!')
          console.error('📋 AUTH STORE: Estrutura da resposta:', JSON.stringify(response.data, null, 2))
          throw new Error('Token não recebido do servidor')
        }
        
        // Verificar se o token não está expirado
        if (isTokenExpired(authToken)) {
          console.error('❌ AUTH STORE: Token recebido já está expirado!')
          throw new Error('Token expirado recebido do servidor')
        }
        
        // Salvar dados de autenticação usando a função centralizada
        saveAuthData(authToken, userData)
        
        // Forçar atualização imediata da store e localStorage para próximas requisições
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('🎉 AUTH STORE: Login realizado com sucesso!')
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro no login')
      }
    } catch (error) {
      console.error('💥 AUTH STORE: Erro no login:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login' 
      }
    }
  }

  const register = async (userData) => {
    try {
      isLoading.value = true
      console.log('📝 AUTH STORE: Iniciando registro...', userData)
      
      // ✅ CORRIGIDO: Preparar dados conforme esperado pela API
      const registrationData = {
        name: userData.name?.trim() || '',
        email: userData.email?.trim() || '',
        phone: userData.phone?.trim() || '',
        password: userData.password || '',
        company: userData.company?.trim() || '',
        // Remover campos que não são enviados para API
        // confirmPassword e acceptTerms são apenas para validação frontend
      }
      
      console.log('📤 AUTH STORE: Dados de registro preparados:', registrationData)
      
      const response = await authAPI.register(registrationData)
      console.log('📥 AUTH STORE: Resposta do registro:', response.data)
      
      if (response.data.success || response.status === 201) {
        console.log('✅ AUTH STORE: Registro realizado com sucesso')
        return { success: true, message: 'Conta criada com sucesso!' }
      } else {
        throw new Error(response.data.message || 'Erro no cadastro')
      }
    } catch (error) {
      console.error('💥 AUTH STORE: Erro no registro:', error)
      
      // ✅ NOVO: Retornar erros estruturados
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        return { 
          success: false, 
          error: error.response.data.message || 'Dados de entrada inválidos',
          errors: error.response.data.errors
        }
      } else {
        return { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Erro ao criar conta'
        }
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async () => {
    try {
      console.log('🚪 AUTH STORE: Iniciando logout...')
      // Opcional: chamar API de logout
      if (token.value) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('💥 AUTH STORE: Erro na API de logout:', error)
    } finally {
      // Sempre limpar dados locais
      clearAuthData()
    }
    
    return { success: true }
  }

  const clearAuthData = () => {
    console.log('🧹 AUTH STORE: Limpando dados de autenticação...')
    user.value = null
    token.value = null
    isAuthenticated.value = false
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('sidebarCollapsed')
  }

  // ✅ CORREÇÃO PRINCIPAL: Lógica mais robusta para initializeAuth
  const initializeAuth = async () => {
    try {
      console.log('🚀 AUTH STORE: Inicializando autenticação...')
      isLoading.value = true
      
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('user_data')
      
      console.log('🔍 AUTH STORE: Verificação inicial do localStorage:', {
        tokenExists: !!savedToken,
        tokenLength: savedToken?.length || 0,
        tokenFirst30: savedToken?.substring(0, 30) || 'N/A',
        userExists: !!savedUser,
        isTokenUndefined: savedToken === 'undefined',
        isTokenNull: savedToken === 'null'
      })
      
      // ✅ FASE 1: Verificar se temos dados básicos
      if (!savedToken || !savedUser || savedToken === 'undefined' || savedToken === 'null') {
        console.log('❌ AUTH STORE: Dados de autenticação não encontrados ou inválidos')
        isLoading.value = false
        return false
      }

      // ✅ FASE 2: Verificar se o token não está expirado
      if (isTokenExpired(savedToken)) {
        console.log('⏰ AUTH STORE: Token expirado encontrado no localStorage')
        clearAuthData()
        isLoading.value = false
        return false
      }

      // ✅ FASE 3: Restaurar dados básicos primeiro (para funcionar offline)
      try {
        const parsedUser = JSON.parse(savedUser)
        token.value = savedToken
        user.value = parsedUser
        isAuthenticated.value = true
        
        console.log('✅ AUTH STORE: Dados básicos restaurados do localStorage')
        
        // Log da expiração do token
        try {
          const payload = JSON.parse(atob(savedToken.split('.')[1]))
          const timeLeft = Math.floor((payload.exp - Math.floor(Date.now() / 1000)) / 60)
          console.log(`⏰ AUTH STORE: Token expira em ${timeLeft} minutos`)
        } catch (error) {
          console.warn('Não foi possível decodificar a data de expiração do token')
        }
      } catch (parseError) {
        console.error('💥 AUTH STORE: Erro ao fazer parse dos dados do usuário:', parseError)
        clearAuthData()
        isLoading.value = false
        return false
      }

      // ✅ FASE 4: Verificar com o servidor (mas sem deslogar se falhar)
      try {
        console.log('🔍 AUTH STORE: Verificando validade do token com o servidor...')
        const response = await authAPI.me()
        
        if (response.data.success && response.data.user) {
          console.log('✅ AUTH STORE: Token validado pelo servidor')
          // Atualizar dados do usuário se necessário
          user.value = response.data.user
          localStorage.setItem('user_data', JSON.stringify(user.value))
        } else {
          console.warn('⚠️ AUTH STORE: Resposta inesperada do servidor, mas mantendo sessão local')
        }
      } catch (serverError) {
        console.warn('⚠️ AUTH STORE: Erro ao verificar com servidor, mas mantendo sessão local:', {
          status: serverError.response?.status,
          message: serverError.message
        })
        
        // ✅ IMPORTANTE: Só limpar dados se for erro 401 (token inválido)
        if (serverError.response?.status === 401) {
          console.error('💥 AUTH STORE: Token rejeitado pelo servidor (401), fazendo logout')
          clearAuthData()
          isLoading.value = false
          return false
        }
        
        // Para outros erros (500, network, etc), manter sessão local
        console.log('🔄 AUTH STORE: Mantendo sessão local devido a erro de rede/servidor')
      }
      
      // ✅ SUCESSO: Autenticação inicializada
      isLoading.value = false
      console.log('🎉 AUTH STORE: Autenticação inicializada com sucesso')
      return true
      
    } catch (error) {
      console.error('💥 AUTH STORE: Erro crítico ao inicializar autenticação:', error)
      clearAuthData()
      isLoading.value = false
      return false
    }
  }

  // Alias para initializeAuth (compatibilidade)
  const checkAuth = async () => {
    return await initializeAuth()
  }
  
  const updateUserProfile = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user_data', JSON.stringify(user.value))
  }

  const refreshUserData = async () => {
    try {
      const response = await authAPI.me()
      if (response.data.success && response.data.user) {
        user.value = response.data.user
        localStorage.setItem('user_data', JSON.stringify(user.value))
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error)
      return false
    }
  }

  // Getter para verificar se há token válido
  const hasValidToken = () => {
    const currentToken = token.value || localStorage.getItem('auth_token')
    return currentToken && !isTokenExpired(currentToken)
  }

  // Getter para obter o token atual
  const getCurrentToken = () => {
    return token.value || localStorage.getItem('auth_token')
  }
  
  return {
    // Estado
    user,
    token,
    isAuthenticated,
    isLoading,
    
    // Actions
    login,
    register,
    logout,
    initializeAuth,
    checkAuth,
    updateUserProfile,
    refreshUserData,
    clearAuthData,
    saveAuthData,
    
    // Getters
    hasValidToken,
    getCurrentToken
  }
})