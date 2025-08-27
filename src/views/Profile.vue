<!-- filepath: src/views/Profile.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage } from '@/composables/message'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/service/api'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const authStore = useAuthStore()
const { showMessage } = useMessage()

const isLoadingProfile = ref(true)
const isUpdating = ref(false)
const isChangingPassword = ref(false)
const profileError = ref('')

// ✅ ADICIONADO: Estado para erros específicos de campos
const fieldErrors = ref({})

// ✅ CORRIGIDO: Dados do perfil vindos da API real
const profileData = ref({
  id: null,
  name: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  role: '',
  paymentSettings: {
    pixKey: '',
    bankName: '',
    agency: '',
    account: '',
    accountType: 'corrente'
  },
  notificationSettings: {
    emailNewPurchase: true,
    emailRaffleComplete: true,
    smsNewPurchase: false,
    smsRaffleComplete: true,
    pushNotifications: true
  },
  registeredAt: null,
  lastLogin: null,
  updatedAt: null,
  isActive: false,
  totalPurchases: 0
})

const profileForm = ref({
  name: '',
  company: '',
  phone: '',
  website: '',
  paymentSettings: {
    pixKey: '',
    bankName: '',
    agency: '',
    account: '',
    accountType: 'corrente'
  }
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const userInitials = computed(() => {
  const name = profileData.value.name || authStore.userName || 'Usuário'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const isProfileFormValid = computed(() => {
  return profileForm.value.name?.trim()
})

const isPasswordFormValid = computed(() => {
  return passwordForm.value.currentPassword &&
         passwordForm.value.newPassword &&
         passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword.length >= 6
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ✅ ADICIONADO: Função para limpar erros de campo
const clearFieldErrors = () => {
  fieldErrors.value = {}
}

// ✅ ADICIONADO: Função para processar erros da API
const processApiErrors = (apiErrors) => {
  fieldErrors.value = {}
  
  if (Array.isArray(apiErrors)) {
    apiErrors.forEach(error => {
      // Mapear campos da API para campos do formulário
      const fieldMap = {
        'name': 'name',
        'company': 'company', 
        'phone': 'phone',
        'website': 'website',
        'paymentSettings.pixKey': 'paymentSettings.pixKey',
        'paymentSettings.bankName': 'paymentSettings.bankName',
        'paymentSettings.agency': 'paymentSettings.agency',
        'paymentSettings.account': 'paymentSettings.account',
        'paymentSettings.accountType': 'paymentSettings.accountType'
      }
      
      const fieldName = fieldMap[error.field] || error.field
      
      // ✅ CORRIGIDO: Traduzir mensagens de erro para português
      let translatedMessage = error.message
      
      // Dicionário de traduções comuns
      const translations = {
        '"paymentSettings.pixKey" is not allowed to be empty': 'Chave PIX é obrigatória',
        '"paymentSettings.bankName" is not allowed to be empty': 'Nome do banco é obrigatório',
        '"paymentSettings.agency" is not allowed to be empty': 'Agência é obrigatória',
        '"paymentSettings.account" is not allowed to be empty': 'Conta é obrigatória',
        '"name" is not allowed to be empty': 'Nome é obrigatório',
        '"company" is not allowed to be empty': 'Empresa é obrigatória',
        '"phone" is not allowed to be empty': 'Telefone é obrigatório',
        '"website" is not allowed to be empty': 'Website é obrigatório',
        'is not allowed to be empty': 'é obrigatório',
        'must be a valid email': 'deve ser um email válido',
        'must be a valid URL': 'deve ser uma URL válida',
        'length must be at least': 'deve ter pelo menos',
        'length must be less than or equal to': 'deve ter no máximo',
        'characters long': 'caracteres'
      }
      
      // Aplicar traduções
      for (const [english, portuguese] of Object.entries(translations)) {
        if (translatedMessage.includes(english)) {
          translatedMessage = translatedMessage.replace(english, portuguese)
        }
      }
      
      fieldErrors.value[fieldName] = translatedMessage
    })
  }
  
  console.log('📋 Erros processados:', fieldErrors.value)
}

// ✅ ADICIONADO: Função para verificar se campo tem erro
const hasFieldError = (fieldPath) => {
  return !!fieldErrors.value[fieldPath]
}

// ✅ ADICIONADO: Função para obter mensagem de erro do campo
const getFieldError = (fieldPath) => {
  return fieldErrors.value[fieldPath] || ''
}

// ✅ CORRIGIDO: Carregar dados do perfil da API conforme estrutura real
const loadProfileData = async () => {
  try {
    isLoadingProfile.value = true
    profileError.value = ''
    clearFieldErrors() // ✅ Limpar erros ao carregar
    
    console.log('🔄 Carregando dados do perfil...')
    
    // Buscar dados do usuário da API
    const response = await authAPI.me()
    
    console.log('📥 Resposta da API /auth/profile:', response.data)
    
    // ✅ PROCESSAR DADOS DO PERFIL conforme estrutura real
    // A estrutura é: response.data.data.user
    const userData = response.data.data?.user || response.data.user || response.data
    
    if (!userData) {
      throw new Error('Dados do usuário não encontrados na resposta')
    }
    
    console.log('👤 Dados do usuário extraídos:', userData)
    
    // ✅ Estruturar dados do perfil conforme a estrutura real da API
    profileData.value = {
      id: userData.id || null,
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      company: userData.company || '',
      website: userData.website || '',
      role: userData.role || 'user',
      paymentSettings: {
        pixKey: userData.paymentSettings?.pixKey || '',
        bankName: userData.paymentSettings?.bankName || '',
        agency: userData.paymentSettings?.agency || '',
        account: userData.paymentSettings?.account || '',
        accountType: userData.paymentSettings?.accountType || 'corrente'
      },
      notificationSettings: {
        emailNewPurchase: userData.notificationSettings?.emailNewPurchase ?? true,
        emailRaffleComplete: userData.notificationSettings?.emailRaffleComplete ?? true,
        smsNewPurchase: userData.notificationSettings?.smsNewPurchase ?? false,
        smsRaffleComplete: userData.notificationSettings?.smsRaffleComplete ?? true,
        pushNotifications: userData.notificationSettings?.pushNotifications ?? true
      },
      registeredAt: userData.registeredAt || null,
      lastLogin: userData.lastLogin || null,
      updatedAt: userData.updatedAt || null,
      isActive: userData.isActive ?? false,
      totalPurchases: userData.totalPurchases || 0
    }
    
    // ✅ ATUALIZAR FORMULÁRIO com os dados carregados
    profileForm.value = {
      name: profileData.value.name,
      company: profileData.value.company,
      phone: profileData.value.phone,
      website: profileData.value.website,
      paymentSettings: {
        pixKey: profileData.value.paymentSettings.pixKey,
        bankName: profileData.value.paymentSettings.bankName,
        agency: profileData.value.paymentSettings.agency,
        account: profileData.value.paymentSettings.account,
        accountType: profileData.value.paymentSettings.accountType
      }
    }
    
    console.log('✅ Dados do perfil carregados:', {
      name: profileData.value.name,
      email: profileData.value.email,
      phone: profileData.value.phone,
      company: profileData.value.company,
      website: profileData.value.website,
      paymentSettings: profileData.value.paymentSettings,
      notificationSettings: profileData.value.notificationSettings
    })
    
    // ✅ ATUALIZAR STORE com dados corretos
    if (userData.name !== authStore.userName || userData.email !== authStore.userEmail) {
      authStore.updateUserProfile({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        company: userData.company,
        role: userData.role
      })
      console.log('🔄 Store atualizada com dados do perfil')
    }
    
  } catch (error) {
    console.error('💥 Erro ao carregar dados do perfil:', error)
    profileError.value = error.response?.data?.message || error.message || 'Erro ao carregar dados do perfil'
    
    // ✅ FALLBACK: Usar dados da store se API falhar
    const fallbackData = {
      name: authStore.userName || '',
      email: authStore.userEmail || '',
      phone: authStore.user?.phone || '',
      company: authStore.user?.company || '',
      website: authStore.user?.website || '',
      role: authStore.user?.role || 'user',
      paymentSettings: {
        pixKey: '',
        bankName: '',
        agency: '',
        account: '',
        accountType: 'corrente'
      }
    }
    
    profileData.value = { ...profileData.value, ...fallbackData }
    profileForm.value = {
      name: fallbackData.name,
      company: fallbackData.company,
      phone: fallbackData.phone,
      website: fallbackData.website,
      paymentSettings: { ...fallbackData.paymentSettings }
    }
    
    console.log('⚠️ Usando dados de fallback da store')
  } finally {
    isLoadingProfile.value = false
  }
}

// ✅ CORRIGIDO: Salvar dados do perfil com tratamento de erros específicos
const updateProfile = async () => {
  if (!isProfileFormValid.value) {
    showMessage('Por favor, preencha pelo menos o nome', 'error')
    return
  }

  try {
    isUpdating.value = true
    clearFieldErrors() // ✅ Limpar erros anteriores
    
    console.log('🔄 Atualizando perfil...', profileForm.value)
    
    // ✅ PREPARAR DADOS conforme curl fornecido
    const updateData = {
      name: profileForm.value.name?.trim() || '',
      company: profileForm.value.company?.trim() || '',
      phone: profileForm.value.phone?.trim() || '',
      website: profileForm.value.website?.trim() || '',
      paymentSettings: {
        pixKey: profileForm.value.paymentSettings.pixKey?.trim() || '',
        bankName: profileForm.value.paymentSettings.bankName?.trim() || '',
        agency: profileForm.value.paymentSettings.agency?.trim() || '',
        account: profileForm.value.paymentSettings.account?.trim() || '',
        accountType: profileForm.value.paymentSettings.accountType || 'corrente'
      }
    }
    
    console.log('📤 Enviando dados para API:', updateData)
    
    // ✅ FAZER REQUISIÇÃO PUT /auth/profile
    const response = await authAPI.updateProfile(updateData)
    
    console.log('📥 Resposta da atualização:', response.data)
    
    // ✅ VERIFICAR SUCESSO da resposta
    if (response.data.success !== false && response.status === 200) {
      // ✅ ATUALIZAR dados locais com sucesso
      Object.assign(profileData.value, profileForm.value)
      
      // ✅ ATUALIZAR STORE para refletir mudanças em toda a aplicação
      authStore.updateUserProfile({
        name: profileForm.value.name,
        email: profileData.value.email, // Email não muda
        phone: profileForm.value.phone,
        company: profileForm.value.company
      })
      
      showMessage('Perfil atualizado com sucesso!', 'success')
      console.log('✅ Perfil atualizado com sucesso')
      
      // ✅ OPCIONAL: Recarregar dados para garantir sincronia
      setTimeout(() => {
        loadProfileData()
      }, 1000)
      
    } else {
      throw new Error(response.data.message || 'Erro ao atualizar perfil')
    }
  } catch (error) {
    console.error('💥 Erro ao atualizar perfil:', error)
    
    // ✅ PROCESSAR ERROS ESPECÍFICOS DE CAMPOS
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      processApiErrors(error.response.data.errors)
      showMessage('Por favor, corrija os erros destacados nos campos', 'error')
    } else {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erro ao atualizar perfil'
      
      showMessage(errorMessage, 'error')
    }
    
    // ✅ LOG detalhado do erro
    console.error('📋 Detalhes do erro:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    })
  } finally {
    isUpdating.value = false
  }
}

// ✅ CORRIGIDO: Alterar senha
const changePassword = async () => {
  if (!isPasswordFormValid.value) {
    showMessage('Verifique os dados da senha', 'error')
    return
  }

  try {
    isChangingPassword.value = true
    
    console.log('🔄 Alterando senha...')
    
    // ✅ PREPARAR DADOS para mudança de senha
    const passwordData = {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    }
    
    console.log('📤 Enviando dados de senha para API')
    
    const response = await authAPI.changePassword(passwordData)
    
    console.log('📥 Resposta da alteração de senha:', response.data)
    
    if (response.data.success !== false && response.status === 200) {
      showMessage('Senha alterada com sucesso!', 'success')
      console.log('✅ Senha alterada com sucesso')
      
      // ✅ LIMPAR FORMULÁRIO de senha
      Object.assign(passwordForm.value, {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else {
      throw new Error(response.data.message || 'Erro ao alterar senha')
    }
  } catch (error) {
    console.error('💥 Erro ao alterar senha:', error)
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Erro ao alterar senha'
    
    showMessage(errorMessage, 'error')
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  loadProfileData()
})
</script>

<template>
  <AdminLayout>
    <div class="profile-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informações pessoais e configurações</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingProfile" class="loading-state">
        <div class="loading-spinner">⏳</div>
        <p>Carregando dados do perfil...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="profileError" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar perfil</h3>
        <p>{{ profileError }}</p>
        <button @click="loadProfileData" class="btn btn-primary">
          🔄 Tentar Novamente
        </button>
      </div>

      <!-- Profile Content -->
      <div v-else class="profile-content">
        <!-- Card do Perfil -->
        <div class="profile-card">
          <!-- ✅ SEÇÃO DO AVATAR com dados reais -->
          <div class="profile-avatar-section">
            <div class="avatar-large">{{ userInitials }}</div>
            <div class="avatar-info">
              <h2>{{ profileData.name || 'Nome não informado' }}</h2>
              <p>{{ profileData.email || 'Email não informado' }}</p>
              <span class="user-role">{{ profileData.role === 'user' ? 'Usuário' : 'Administrador' }}</span>
              <div class="profile-meta">
                <div class="meta-item">
                  <span class="meta-label">Membro desde:</span>
                  <span class="meta-value">{{ formatDate(profileData.registeredAt) || 'N/A' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Total de compras:</span>
                  <span class="meta-value">{{ profileData.totalPurchases || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ✅ FORMULÁRIO DE INFORMAÇÕES PESSOAIS com loading e erros -->
          <div class="profile-section">
            <h3>Informações Pessoais</h3>
            <form @submit.prevent="updateProfile" class="profile-form">
              <div class="form-grid">
                <div class="form-group">
                  <label for="name">Nome Completo *</label>
                  <input
                    id="name"
                    v-model="profileForm.name"
                    type="text"
                    class="form-input"
                    :class="{ 'error': hasFieldError('name') }"
                    :disabled="isUpdating"
                    required
                    placeholder="Seu nome completo"
                  />
                  <div v-if="hasFieldError('name')" class="field-error">
                    {{ getFieldError('name') }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="company">Empresa (opcional)</label>
                  <input
                    id="company"
                    v-model="profileForm.company"
                    type="text"
                    class="form-input"
                    :class="{ 'error': hasFieldError('company') }"
                    :disabled="isUpdating"
                    placeholder="Nome da sua empresa"
                  />
                  <div v-if="hasFieldError('company')" class="field-error">
                    {{ getFieldError('company') }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="phone">Telefone</label>
                  <input
                    id="phone"
                    v-model="profileForm.phone"
                    type="tel"
                    class="form-input"
                    :class="{ 'error': hasFieldError('phone') }"
                    :disabled="isUpdating"
                    placeholder="(11) 99999-9999"
                  />
                  <div v-if="hasFieldError('phone')" class="field-error">
                    {{ getFieldError('phone') }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="website">Website (opcional)</label>
                  <input
                    id="website"
                    v-model="profileForm.website"
                    type="url"
                    class="form-input"
                    :class="{ 'error': hasFieldError('website') }"
                    :disabled="isUpdating"
                    placeholder="https://seusite.com"
                  />
                  <div v-if="hasFieldError('website')" class="field-error">
                    {{ getFieldError('website') }}
                  </div>
                </div>
              </div>

              <!-- ✅ CONFIGURAÇÕES DE PAGAMENTO com erros específicos -->
              <h4>Configurações de Pagamento</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label for="pixKey">Chave PIX</label>
                  <input
                    id="pixKey"
                    v-model="profileForm.paymentSettings.pixKey"
                    type="text"
                    class="form-input"
                    :class="{ 'error': hasFieldError('paymentSettings.pixKey') }"
                    :disabled="isUpdating"
                    placeholder="email@exemplo.com ou CPF/CNPJ"
                  />
                  <small v-if="!hasFieldError('paymentSettings.pixKey')" class="field-hint">Email, CPF, CNPJ ou telefone</small>
                  <div v-if="hasFieldError('paymentSettings.pixKey')" class="field-error">
                    {{ getFieldError('paymentSettings.pixKey') }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="bankName">Banco</label>
                  <input
                    id="bankName"
                    v-model="profileForm.paymentSettings.bankName"
                    type="text"
                    class="form-input"
                    :class="{ 'error': hasFieldError('paymentSettings.bankName') }"
                    :disabled="isUpdating"
                    placeholder="Ex: Banco do Brasil"
                  />
                  <div v-if="hasFieldError('paymentSettings.bankName')" class="field-error">
                    {{ getFieldError('paymentSettings.bankName') }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="agency">Agência</label>
                  <input
                    id="agency"
                    v-model="profileForm.paymentSettings.agency"
                    type="text"
                    class="form-input"
                    :class="{ 'error': hasFieldError('paymentSettings.agency') }"
                    :disabled="isUpdating"
                    placeholder="1234"
                  />
                  <div v-if="hasFieldError('paymentSettings.agency')" class="field-error">
                    {{ getFieldError('paymentSettings.agency') }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="account">Conta</label>
                  <input
                    id="account"
                    v-model="profileForm.paymentSettings.account"
                    type="text"
                    class="form-input"
                    :class="{ 'error': hasFieldError('paymentSettings.account') }"
                    :disabled="isUpdating"
                    placeholder="56789-0"
                  />
                  <div v-if="hasFieldError('paymentSettings.account')" class="field-error">
                    {{ getFieldError('paymentSettings.account') }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="accountType">Tipo de Conta</label>
                  <select
                    id="accountType"
                    v-model="profileForm.paymentSettings.accountType"
                    class="form-input"
                    :class="{ 'error': hasFieldError('paymentSettings.accountType') }"
                    :disabled="isUpdating"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Conta Poupança</option>
                  </select>
                  <div v-if="hasFieldError('paymentSettings.accountType')" class="field-error">
                    {{ getFieldError('paymentSettings.accountType') }}
                  </div>
                </div>
              </div>

              <!-- ✅ LOADING VISUAL no botão -->
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="isUpdating || !isProfileFormValid">
                  <span v-if="isUpdating" class="loading-content">
                    <span class="spinner"></span>
                    Salvando...
                  </span>
                  <span v-else>💾 Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>

          <!-- ✅ FORMULÁRIO DE ALTERAÇÃO DE SENHA -->
          <div class="profile-section">
            <h3>Alterar Senha</h3>
            <form @submit.prevent="changePassword" class="password-form">
              <div class="form-grid">
                <div class="form-group">
                  <label for="currentPassword">Senha Atual *</label>
                  <input
                    id="currentPassword"
                    v-model="passwordForm.currentPassword"
                    type="password"
                    class="form-input"
                    :disabled="isChangingPassword"
                    required
                    placeholder="Sua senha atual"
                  />
                </div>

                <div class="form-group">
                  <label for="newPassword">Nova Senha *</label>
                  <input
                    id="newPassword"
                    v-model="passwordForm.newPassword"
                    type="password"
                    class="form-input"
                    :disabled="isChangingPassword"
                    required
                    minlength="6"
                    placeholder="Nova senha"
                  />
                  <small class="field-hint">Mínimo 6 caracteres</small>
                </div>

                <div class="form-group">
                  <label for="confirmPassword">Confirmar Nova Senha *</label>
                  <input
                    id="confirmPassword"
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    class="form-input"
                    :disabled="isChangingPassword"
                    required
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-secondary" :disabled="isChangingPassword || !isPasswordFormValid">
                  <span v-if="isChangingPassword" class="loading-content">
                    <span class="spinner"></span>
                    Alterando...
                  </span>
                  <span v-else>🔐 Alterar Senha</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- ✅ CARD DE INFORMAÇÕES DA CONTA -->
        <div class="account-info-card">
          <h3>Informações da Conta</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">{{ profileData.email || 'N/A' }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Tipo de Conta</div>
              <div class="info-value">{{ profileData.role === 'user' ? 'Usuário' : 'Administrador' }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value">
                <span :class="['status-indicator', profileData.isActive ? 'active' : 'inactive']">
                  {{ profileData.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Membro desde</div>
              <div class="info-value">{{ formatDate(profileData.registeredAt) || 'N/A' }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Último login</div>
              <div class="info-value">{{ formatDate(profileData.lastLogin) || 'N/A' }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Total de compras</div>
              <div class="info-value">{{ profileData.totalPurchases || 0 }}</div>
            </div>
          </div>

          <!-- ✅ STATUS DAS CONFIGURAÇÕES DE PAGAMENTO -->
          <div class="payment-summary">
            <h4>Status das Configurações</h4>
            <div class="payment-status">
              <span v-if="profileData.paymentSettings?.pixKey" class="status-badge configured">
                ✅ PIX: {{ profileData.paymentSettings.pixKey }}
              </span>
              <span v-else class="status-badge not-configured">
                ⚠️ PIX Não Configurado
              </span>
              
              <span v-if="profileData.paymentSettings?.bankName" class="status-badge configured">
                ✅ Banco: {{ profileData.paymentSettings.bankName }}
              </span>
              <span v-else class="status-badge not-configured">
                ⚠️ Dados Bancários Pendentes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.profile-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
}

.header-content h1 {
  color: #1a1d29;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
}

.header-content p {
  color: #64748b;
  margin: 0;
  font-size: 1rem;
}

/* Estados de loading e erro */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  text-align: center;
}

.loading-spinner {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.error-state h3 {
  color: #ef4444;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.error-state p {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
}

.profile-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  overflow: hidden;
}

.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.avatar-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.avatar-info p {
  margin: 0 0 0.5rem 0;
  opacity: 0.9;
}

.user-role {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 1rem;
}

.profile-meta {
  margin-top: 1rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.meta-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.meta-value {
  font-size: 0.875rem;
  font-weight: 500;
}

.profile-section {
  padding: 2rem;
  border-bottom: 1px solid #f1f3f4;
}

.profile-section:last-child {
  border-bottom: none;
}

.profile-section h3 {
  margin: 0 0 1.5rem 0;
  color: #1a1d29;
  font-size: 1.25rem;
  font-weight: 600;
}

.profile-section h4 {
  margin: 2rem 0 1rem 0;
  color: #1a1d29;
  font-size: 1rem;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

/* ✅ ADICIONADO: Estilos para campos com erro */
.form-input.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.form-input.error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.field-error {
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-error::before {
  content: "⚠️";
  font-size: 0.875rem;
}

.field-hint {
  color: #6b7280;
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  justify-content: center;
  white-space: nowrap;
  min-height: 44px;
  position: relative;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

/* ✅ ADICIONADO: Loading content com spinner */
.loading-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ✅ CARD DE INFORMAÇÕES DA CONTA */
.account-info-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  height: fit-content;
  min-width: 320px;
}

.account-info-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1a1d29;
  font-size: 1.25rem;
  font-weight: 600;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8faff;
  border-radius: 8px;
  border: 1px solid #e0e7ff;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #1a1d29;
  font-weight: 600;
  text-align: right;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ✅ INDICADOR DE STATUS */
.status-indicator {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-indicator.active {
  background: #d1fae5;
  color: #065f46;
}

.status-indicator.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.payment-summary h4 {
  margin: 0 0 1rem 0;
  color: #1a1d29;
  font-size: 1rem;
  font-weight: 600;
}

.payment-status {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-badge {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.4;
}

.status-badge.configured {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-badge.not-configured {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .profile-avatar-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .meta-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .account-info-card {
    min-width: auto;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .info-value {
    text-align: left;
    max-width: none;
  }
}
</style>