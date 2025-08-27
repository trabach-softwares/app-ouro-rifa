<template>
  <div class="login-container">
    <AuthBackground />
    
    <div class="content-wrapper">
      <!-- Branding Panel -->
      <div class="branding-panel">
        <BrandingPanel />
      </div>
      
      <div class="auth-panel">
        <div class="auth-container">
          <!-- Loading Overlay -->
          <LoadingOverlay v-if="isSubmitting" :is-login="isLogin" />

          <!-- Mobile Header -->
          <div class="mobile-brand-header mobile-only">
            <div class="mobile-brand">
              <img src="@/assets/logo.png" alt="Ouro Rifa" class="brand-logo-img" />
              <h1>Ouro Rifa</h1>
            </div>
            <p class="brand-tagline">Sistema completo para suas rifas</p>
          </div>

          <!-- Header -->
          <div class="auth-header">
            <h2>{{ isLogin ? 'Bem-vindo!' : 'Crie sua conta' }}</h2>
            <p>{{ isLogin ? 'Acesse sua conta para continuar' : 'Comece a criar suas rifas hoje mesmo' }}</p>
          </div>

          <!-- Mode Tabs -->
          <AuthTabs :is-login="isLogin" :is-submitting="isSubmitting" @switch-mode="switchMode" />

          <!-- Alert Messages -->
          <AuthAlert 
            :type="alertType"
            :title="alertTitle"
            :message="alertMessage"
            @close="clearAlert"
          />

          <!-- Login Form -->
          <LoginForm 
            v-if="isLogin"
            ref="loginFormRef"
            :form="loginForm"
            :is-submitting="isSubmitting"
            @submit="handleLogin"
            @input="clearAlert"
          />

          <!-- Register Form -->
          <RegisterForm 
            v-else
            ref="registerFormRef"
            :form="registerForm"
            :is-submitting="isSubmitting"
            @submit="handleRegister"
            @input="clearAlert"
          />

          <!-- Social Login -->
          <SocialLogin />

          <!-- Mobile Features Info -->
          <div class="mobile-features mobile-only">
            <div class="feature-item">
              <span class="feature-icon">⚡</span>
              <span>Criação rápida</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💰</span>
              <span>Pagamentos seguros</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span>Relatórios completos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Components
import AuthBackground from '@/components/auth/AuthBackground.vue'
import BrandingPanel from '@/components/auth/BrandingPanel.vue'
import AuthAlert from '@/components/auth/AuthAlert.vue'
import AuthTabs from '@/components/auth/AuthTabs.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import SocialLogin from '@/components/auth/SocialLogin.vue'
import LoadingOverlay from '@/components/auth/LoadingOverlay.vue'

const router = useRouter()
const authStore = useAuthStore()

// ✅ NOVO: Refs para os formulários
const loginFormRef = ref(null)
const registerFormRef = ref(null)

// State
const isLogin = ref(true)
const isSubmitting = ref(false)

// Alert system
const alertMessage = ref('')
const alertTitle = ref('')
const alertType = ref('error')

// Forms
const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

const registerForm = reactive({
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  company: '',
  acceptTerms: false
})

// Methods
const switchMode = (login) => {
  isLogin.value = login
  clearAlert()
  clearForms()
}

const clearAlert = () => {
  alertMessage.value = ''
  alertTitle.value = ''
}

const clearForms = () => {
  Object.assign(loginForm, {
    email: '',
    password: '',
    remember: false
  })
  
  Object.assign(registerForm, {
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    acceptTerms: false
  })
}

const showAlert = (type, title, message) => {
  alertType.value = type
  alertTitle.value = title
  alertMessage.value = message
}

const handleLogin = async (formData) => {
  clearAlert()
  
  try {
    isSubmitting.value = true
    
    const result = await authStore.login(formData)
    
    if (result.success) {
      showAlert('success', 'Login realizado!', 'Redirecionando para o dashboard...')
      setTimeout(() => router.push('/dashboard'), 1500)
    } else {
      showAlert('error', 'Erro no login', result.error || 'Credenciais inválidas.')
    }
  } catch (error) {
    console.error('Erro no login:', error)
    showAlert('error', 'Erro de conexão', 'Verifique sua conexão e tente novamente.')
  } finally {
    isSubmitting.value = false
  }
}

const handleRegister = async (formData) => {
  clearAlert()
  
  try {
    isSubmitting.value = true
    
    const result = await authStore.register(formData)
    
    if (result.success) {
      showAlert('success', 'Conta criada!', 'Fazendo login automático...')
      
      setTimeout(async () => {
        const loginResult = await authStore.login({
          email: formData.email,
          password: formData.password,
          remember: false
        })
        
        if (loginResult.success) {
          showAlert('success', 'Bem-vindo!', 'Redirecionando para o dashboard...')
          setTimeout(() => router.push('/dashboard'), 1000)
        } else {
          showAlert('success', 'Conta criada!', 'Faça login para continuar.')
          setTimeout(() => {
            loginForm.email = formData.email
            switchMode(true)
          }, 2000)
        }
      }, 1000)
    } else {
      // ✅ NOVO: Tratar erros específicos da API
      if (result.errors && Array.isArray(result.errors)) {
        // Processar erros específicos de campos
        registerFormRef.value?.processApiErrors(result.errors)
        
        // Criar mensagem resumida
        const errorFields = result.errors.map(err => {
          const fieldLabels = {
            'name': 'Nome',
            'email': 'E-mail',
            'phone': 'Telefone',
            'password': 'Senha'
          }
          return fieldLabels[err.field] || err.field
        })
        
        showAlert('error', 'Dados inválidos', `Verifique: ${errorFields.join(', ')}`)
      } else {
        showAlert('error', 'Erro no cadastro', result.error || 'Não foi possível criar a conta.')
      }
    }
  } catch (error) {
    console.error('Erro no registro:', error)
    
    // ✅ NOVO: Tratar erros específicos da resposta da API
    if (error.response?.data?.errors) {
      registerFormRef.value?.processApiErrors(error.response.data.errors)
      showAlert('error', 'Dados inválidos', 'Por favor, corrija os erros destacados nos campos.')
    } else {
      showAlert('error', 'Erro de conexão', 'Verifique sua conexão e tente novamente.')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content-wrapper {
  display: flex;
  width: 100%;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* Branding Panel */
.branding-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  position: relative;
}

.auth-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: white;
  position: relative;
}

.auth-container {
  width: 100%;
  max-width: 440px;
  position: relative;
}

/* Mobile Branding Header */
.mobile-brand-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid #f1f3f4;
}

.mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.brand-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.brand-logo-img {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.mobile-brand h1 {
  margin: 0;
  color: #1a1d29;
  font-size: 1.5rem;
  font-weight: 700;
}

.brand-tagline {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.auth-header p {
  color: #6b7280;
  margin: 0;
  font-size: 1rem;
}

/* Mobile Features */
.mobile-features {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #f1f3f4;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.feature-icon {
  font-size: 1.25rem;
  opacity: 0.8;
}

/* Responsividade */
@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }
  
  .branding-panel {
    flex: none;
    min-height: 30vh;
    padding: 2rem;
  }
  
  .auth-panel {
    flex: none;
    min-height: 70vh;
  }
}

@media (max-width: 768px) {
  .login-container {
    background: white;
  }
  
  .content-wrapper {
    flex-direction: column;
  }
  
  .branding-panel {
    display: none; /* Esconder no mobile, usar mobile-brand-header */
  }
  
  .auth-panel {
    min-height: 100vh;
    padding: 1.5rem;
    background: white;
  }
  
  .auth-header h2 {
    font-size: 1.5rem;
  }
  
  .auth-header p {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .auth-panel {
    padding: 1rem;
  }
  
  .auth-container {
    max-width: 100%;
  }
  
  .mobile-brand-header {
    padding: 1rem 0;
  }
  
  .brand-logo-img {
    width: 40px;
    height: 40px;
  }
  
  .mobile-brand h1 {
    font-size: 1.25rem;
  }
}

/* Utilidades de visibilidade */
.mobile-only {
  display: none;
}

.desktop-only {
  display: block;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
  
  .desktop-only {
    display: none;
  }
}
</style>