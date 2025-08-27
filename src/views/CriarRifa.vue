<!-- filepath: src/views/CriarRifa.vue -->
<template>
  <AdminLayout>
    <div class="criar-rifa-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <button @click="$router.go(-1)" class="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div>
            <h1>Nova Campanha</h1>
            <p>Configure todos os detalhes da sua rifa</p>
          </div>
        </div>
      </div>

      <!-- Alert -->
      <div v-if="alert.message" :class="['alert', alert.type]">
        <div class="alert-content">
          <strong>{{ alert.title }}</strong>
          <p>{{ alert.message }}</p>
        </div>
        <button @click="clearAlert" class="alert-close">×</button>
      </div>

      <!-- Form Container -->
      <div class="form-container">
        <form @submit.prevent="criarRifa" class="main-form">
          
          <!-- Form Fields -->
          <div class="form-section">
            <p class="form-intro">Insira os dados de como deseja a sua campanha abaixo, eles poderão ser editados depois:</p>
            
            <!-- Title -->
            <div class="form-group">
              <label for="title">Título</label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                placeholder="Digite o título da sua campanha"
                :class="{ 'error': errors.title }"
                :disabled="isLoading"
              />
              <div v-if="errors.title" class="field-error">{{ errors.title }}</div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="description">Descrição</label>
              <textarea
                id="description"
                v-model="form.description"
                placeholder="Descreva os detalhes da sua campanha..."
                rows="3"
                :class="{ 'error': errors.description }"
                :disabled="isLoading"
              ></textarea>
              <div v-if="errors.description" class="field-error">{{ errors.description }}</div>
            </div>

            <!-- ✅ NOVO: Imagem principal da rifa -->
            <div class="form-group">
              <label for="mainImage">Imagem da campanha *</label>
              <input
                ref="mainImageInputRef"
                type="file"
                accept="image/*"
                @change="handleMainImageSelect"
                style="display: none"
              />
              
              <div class="main-image-upload-area" @click="selectMainImage">
                <div v-if="selectedMainImageFile || form.imageUrl" class="image-preview">
                  <img 
                    :src="mainImagePreviewUrl || form.imageUrl" 
                    :alt="form.title || 'Preview da campanha'" 
                    class="main-image"
                  />
                  <button @click.stop="removeMainImage" class="remove-btn" type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                  </button>
                </div>
                
                <div v-else class="upload-placeholder">
                  <div class="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <p>Clique para adicionar imagem da campanha</p>
                  <small>PNG, JPG até 5MB</small>
                </div>
              </div>
              
              <div v-if="errors.imageUrl" class="field-error">{{ errors.imageUrl }}</div>
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label for="phone">
                Telefone público para contato
                <span class="optional">?</span>
              </label>
              <div class="phone-input">
                <select class="country-code">
                  <option value="+55">🇧🇷</option>
                </select>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  placeholder="Digite o número do telefone"
                  :disabled="isLoading"
                />
              </div>
            </div>

            <!-- Category -->
            <div class="form-group">
              <label for="category">Categoria</label>
              <select
                id="category"
                v-model="form.category"
                :disabled="isLoading"
              >
                <option value="">Selecionar...</option>
                <option value="electronics">Eletrônicos</option>
                <option value="vehicles">Veículos</option>
                <option value="money">Dinheiro</option>
                <option value="others">Outros</option>
              </select>
            </div>

            <!-- Tickets and Price -->
            <div class="form-row">
              <div class="form-group">
                <label for="totalTickets">
                  Bilhetes
                  <span class="optional">?</span>
                </label>
                <input
                  id="totalTickets"
                  v-model="form.totalTickets"
                  type="number"
                  placeholder="Digite a quantidade de bilhetes"
                  min="10"
                  max="100000"
                  :class="{ 'error': errors.totalTickets }"
                  :disabled="isLoading"
                />
                <div v-if="errors.totalTickets" class="field-error">{{ errors.totalTickets }}</div>
              </div>

              <div class="form-group">
                <label for="ticketPrice">Valor por bilhete</label>
                <input
                  id="ticketPrice"
                  v-model="form.ticketPrice"
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  min="0.01"
                  :class="{ 'error': errors.ticketPrice }"
                  :disabled="isLoading"
                />
                <div v-if="errors.ticketPrice" class="field-error">{{ errors.ticketPrice }}</div>
              </div>
            </div>
          </div>

          <!-- Modelo Section -->
          <div class="form-section">
            <h3 class="section-title">Modelo</h3>
            
            <div class="model-options">
              <!-- Aleatório -->
              <label class="model-option" :class="{ active: form.model === 'random' }">
                <input 
                  type="radio" 
                  v-model="form.model" 
                  value="random"
                  style="display: none"
                />
                <div class="model-preview">
                  <div class="random-grid">
                    <div class="number-cell">+1</div>
                    <div class="number-cell">+5</div>
                    <div class="number-cell">+25</div>
                    <div class="number-cell">+50</div>
                  </div>
                </div>
                <div class="model-info">
                  <h4>Aleatório</h4>
                  <p>O usuário recebe bilhetes aleatórios</p>
                </div>
              </label>

              <!-- Escolher Bilhetes -->
              <label class="model-option" :class="{ active: form.model === 'choose' }">
                <input 
                  type="radio" 
                  v-model="form.model" 
                  value="choose"
                  style="display: none"
                />
                <div class="model-preview">
                  <div class="choose-grid">
                    <div class="number-cell">000</div>
                    <div class="number-cell">001</div>
                    <div class="number-cell">002</div>
                    <div class="number-cell">003</div>
                    <div class="number-cell">004</div>
                    <div class="number-cell">005</div>
                    <div class="number-cell">006</div>
                    <div class="number-cell">007</div>
                    <div class="number-cell">008</div>
                    <div class="number-cell">009</div>
                    <div class="number-cell">010</div>
                    <div class="number-cell">011</div>
                  </div>
                </div>
                <div class="model-info">
                  <h4>Mostrar os bilhetes</h4>
                  <p>O usuário seleciona os bilhetes que desejar</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Draw Date Section -->
          <div class="form-section">
            <div class="toggle-group">
              <label class="toggle-label">
                <span>Informar data do sorteio</span>
                <span class="optional">Opcional</span>
                <div class="toggle">
                  <input 
                    type="checkbox" 
                    v-model="form.hasDrawDate"
                  />
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div v-if="form.hasDrawDate" class="form-group">
              <label for="endDate">Data do sorteio</label>
              <input
                id="endDate"
                v-model="form.endDate"
                type="datetime-local"
                :min="minDateTime"
                :class="{ 'error': errors.endDate }"
                :disabled="isLoading"
              />
              <div v-if="errors.endDate" class="field-error">{{ errors.endDate }}</div>
            </div>
          </div>

          <!-- Payment Expiration -->
          <div class="form-section">
            <div class="form-group">
              <label for="paymentExpiration">
                Tempo para um pedido expirar
                <span class="optional">?</span>
              </label>
              <div class="time-input">
                <input
                  id="paymentExpiration"
                  v-model="form.paymentExpirationValue"
                  type="number"
                  min="1"
                  :disabled="isLoading"
                />
                <select v-model="form.paymentExpirationUnit" :disabled="isLoading">
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                  <option value="days">Dias</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ✅ ATUALIZADO: Prêmio(s) Section - Apenas texto -->
          <div class="form-section">
            <h2 class="section-title">Prêmio(s)</h2>
            <p class="section-subtitle">Insira um ou mais prêmios que os ganhadores serão contemplados:</p>
            
            <!-- Lista de prêmios -->
            <div v-if="form.prizes.length > 0" class="prizes-list">
              <div 
                v-for="(prize, index) in form.prizes" 
                :key="index"
                class="prize-item"
              >
                <div class="prize-icon">
                  🏆
                </div>
                <div class="prize-info">
                  <h4>{{ prize.title || `${index + 1}º Prêmio` }}</h4>
                  <p v-if="prize.description">{{ prize.description }}</p>
                  <p v-else class="no-description">Sem descrição</p>
                </div>
                <div class="prize-actions">
                  <button @click="editPrize(index)" type="button" class="btn-edit">
                    ✏️
                  </button>
                  <button @click="removePrize(index)" type="button" class="btn-remove">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Botão adicionar prêmio -->
            <button 
              @click="openPrizeModal()" 
              type="button" 
              class="add-prize-btn"
              :class="{ 'first-prize': form.prizes.length === 0 }"
            >
              <div class="add-prize-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
              </div>
              <span>{{ form.prizes.length === 0 ? 'Adicionar 1º prêmio' : `Adicionar ${form.prizes.length + 1}º prêmio` }}</span>
            </button>
            
            <div v-if="errors.prizes" class="field-error">{{ errors.prizes }}</div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button 
              type="button" 
              @click="salvarRascunho" 
              class="btn btn-outline"
              :disabled="isLoading || isDraftLoading || !canSaveDraft"
            >
              <span v-if="isDraftLoading">⏳ Salvando...</span>
              <span v-else">💾 Salvar Rascunho</span>
            </button>
            
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isLoading || !isFormValid"
            >
              <span v-if="isLoading">⏳ Criando...</span>
              <span v-else">🚀 Criar Campanha</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ✅ ATUALIZADO: Modal para adicionar/editar prêmio - Sem upload de imagem -->
    <div v-if="showPrizeModal" class="modal-overlay" @click="closePrizeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingPrizeIndex !== null ? 'Editar' : 'Adicionar' }} {{ getPrizePosition() }} prêmio</h3>
          <button @click="closePrizeModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="prizeTitle">Nome do prêmio *</label>
            <input
              id="prizeTitle"
              v-model="currentPrize.title"
              type="text"
              placeholder="Ex: iPhone 15 Pro Max 256GB"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="prizeDescription">
              Descrição
              <span class="optional">Opcional</span>
            </label>
            <textarea
              id="prizeDescription"
              v-model="currentPrize.description"
              placeholder="Descreva detalhes do prêmio..."
              rows="4"
              class="form-input"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closePrizeModal" type="button" class="btn btn-outline">
            Cancelar
          </button>
          <button @click="savePrize" type="button" class="btn btn-primary">
            {{ editingPrizeIndex !== null ? 'Salvar' : 'Adicionar' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { rifasAPI } from '@/service/api'
import { useMessage } from '@/composables/message'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = useRouter()
const { showMessage } = useMessage()

const isLoading = ref(false)
const isDraftLoading = ref(false)

// Alert state
const alert = ref({
  type: '',
  title: '',
  message: ''
})

// Errors state
const errors = ref({})

// ✅ ATUALIZADO: Modal de prêmios (sem imagem)
const showPrizeModal = ref(false)
const editingPrizeIndex = ref(null)
const currentPrize = ref({
  title: '',
  description: ''
})

// ✅ NOVO: File handling para imagem principal
const mainImageInputRef = ref(null)
const selectedMainImageFile = ref(null)
const mainImagePreviewUrl = ref('')

// Form data
const form = ref({
  title: '',
  description: '',
  phone: '',
  category: '',
  totalTickets: '',
  ticketPrice: '',
  model: 'choose', // 'random' ou 'choose'
  hasDrawDate: false,
  endDate: '',
  paymentExpirationValue: 1,
  paymentExpirationUnit: 'days',
  imageUrl: '', // Para imagem principal
  // ✅ ATUALIZADO: Array de prêmios (apenas texto)
  prizes: [],
  // Hidden fields required by API
  maxTicketsPerPerson: 50,
  allowComments: true,
  autoApprovePayments: false,
  publishImmediately: false
})

// Computed properties
const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

const isFormValid = computed(() => {
  return form.value.title &&
         form.value.description &&
         (form.value.imageUrl || selectedMainImageFile.value) &&
         form.value.prizes.length > 0 &&
         form.value.ticketPrice &&
         form.value.totalTickets &&
         (!form.value.hasDrawDate || form.value.endDate) &&
         Object.keys(errors.value).length === 0
})

const canSaveDraft = computed(() => {
  return form.value.title || form.value.phone || form.value.prizes.length > 0 || selectedMainImageFile.value
})

// ✅ NOVO: Métodos para imagem principal
const selectMainImage = () => {
  mainImageInputRef.value?.click()
}

const handleMainImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
      showMessage('Por favor, selecione apenas arquivos de imagem', 'error')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      showMessage('Arquivo muito grande. Máximo 5MB', 'error')
      return
    }
    
    selectedMainImageFile.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      mainImagePreviewUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    // Clear image error if exists
    if (errors.value.imageUrl) {
      delete errors.value.imageUrl
    }
    
    console.log('📁 Imagem principal selecionada:', file.name)
  }
}

const removeMainImage = () => {
  selectedMainImageFile.value = null
  mainImagePreviewUrl.value = ''
  form.value.imageUrl = ''
  
  if (mainImageInputRef.value) {
    mainImageInputRef.value.value = ''
  }
}

// ✅ ATUALIZADO: Métodos para prêmios (sem imagem)
const openPrizeModal = (index = null) => {
  editingPrizeIndex.value = index
  
  if (index !== null) {
    // Editando prêmio existente
    currentPrize.value = { ...form.value.prizes[index] }
  } else {
    // Novo prêmio
    currentPrize.value = {
      title: '',
      description: ''
    }
  }
  
  showPrizeModal.value = true
}

const closePrizeModal = () => {
  showPrizeModal.value = false
  editingPrizeIndex.value = null
  currentPrize.value = {
    title: '',
    description: ''
  }
}

const getPrizePosition = () => {
  if (editingPrizeIndex.value !== null) {
    return `${editingPrizeIndex.value + 1}º`
  }
  return `${form.value.prizes.length + 1}º`
}

const savePrize = () => {
  if (!currentPrize.value.title.trim()) {
    showMessage('Nome do prêmio é obrigatório', 'error')
    return
  }
  
  if (editingPrizeIndex.value !== null) {
    // Editando prêmio existente
    form.value.prizes[editingPrizeIndex.value] = { ...currentPrize.value }
  } else {
    // Adicionando novo prêmio
    form.value.prizes.push({ ...currentPrize.value })
  }
  
  closePrizeModal()
  
  // Clear prizes error if exists
  if (errors.value.prizes) {
    delete errors.value.prizes
  }
}

const editPrize = (index) => {
  openPrizeModal(index)
}

const removePrize = (index) => {
  if (confirm('Tem certeza que deseja remover este prêmio?')) {
    form.value.prizes.splice(index, 1)
  }
}

// Alert methods
const showAlert = (type, title, message) => {
  alert.value = { type, title, message }
  if (type === 'success') {
    setTimeout(clearAlert, 5000)
  }
}

const clearAlert = () => {
  alert.value = { type: '', title: '', message: '' }
}

// Validation
const validateForm = () => {
  errors.value = {}
  let isValid = true

  // Title validation
  if (!form.value.title?.trim()) {
    errors.value.title = 'Título é obrigatório'
    isValid = false
  }

  // Description validation
  if (!form.value.description?.trim()) {
    errors.value.description = 'Descrição é obrigatória'
    isValid = false
  }

  // Image validation (imagem principal)
  if (!form.value.imageUrl?.trim() && !selectedMainImageFile.value) {
    errors.value.imageUrl = 'Imagem da campanha é obrigatória'
    isValid = false
  }

  // Prizes validation
  if (form.value.prizes.length === 0) {
    errors.value.prizes = 'Pelo menos um prêmio é obrigatório'
    isValid = false
  }

  // Price validation
  const ticketPrice = parseFloat(form.value.ticketPrice)
  if (!form.value.ticketPrice || isNaN(ticketPrice) || ticketPrice <= 0) {
    errors.value.ticketPrice = 'Valor deve ser maior que zero'
    isValid = false
  }

  // Tickets validation
  const totalTickets = parseInt(form.value.totalTickets)
  if (!form.value.totalTickets || isNaN(totalTickets) || totalTickets < 10) {
    errors.value.totalTickets = 'Mínimo 10 bilhetes'
    isValid = false
  }

  // End date validation (if enabled)
  if (form.value.hasDrawDate && !form.value.endDate) {
    errors.value.endDate = 'Data do sorteio é obrigatória'
    isValid = false
  } else if (form.value.hasDrawDate && form.value.endDate) {
    const endDate = new Date(form.value.endDate)
    const now = new Date()
    if (endDate <= now) {
      errors.value.endDate = 'Data deve ser no futuro'
      isValid = false
    }
  }

  return isValid
}

// Prepare FormData for API according to curl
const prepareFormData = (status = 'draft') => {
  const formData = new FormData()
  
  // Required fields from curl
  formData.append('title', form.value.title?.trim() || '')
  formData.append('description', form.value.description?.trim() || 'Descrição automática')
  formData.append('ticketPrice', parseFloat(form.value.ticketPrice || 0))
  formData.append('totalTickets', parseInt(form.value.totalTickets || 0))
  
  // End date
  if (form.value.hasDrawDate && form.value.endDate) {
    formData.append('endDate', new Date(form.value.endDate).toISOString())
  } else {
    // Default: 30 days from now
    const defaultEnd = new Date()
    defaultEnd.setDate(defaultEnd.getDate() + 30)
    formData.append('endDate', defaultEnd.toISOString())
  }
  
  // ✅ ATUALIZADO: Imagem principal da rifa
  if (selectedMainImageFile.value) {
    formData.append('image', selectedMainImageFile.value)
  }
  
  // ✅ ATUALIZADO: Prêmios (apenas texto)
  formData.append('prizes', JSON.stringify(form.value.prizes.map(prize => ({
    title: prize.title,
    description: prize.description || ''
  }))))
  
  // Settings from curl
  formData.append('settings[maxTicketsPerPerson]', form.value.maxTicketsPerPerson || 50)
  formData.append('settings[allowComments]', form.value.allowComments.toString())
  formData.append('settings[autoApprovePayments]', form.value.autoApprovePayments.toString())
  
  return formData
}

// Save draft
const salvarRascunho = async () => {
  try {
    clearAlert()
    isDraftLoading.value = true
    
    const formData = prepareFormData('draft')
    const response = await rifasAPI.createWithImage(formData)
    
    if (response && (response.status === 200 || response.status === 201)) {
      showAlert('success', 'Rascunho salvo!', 'Sua campanha foi salva como rascunho.')
      setTimeout(() => {
        router.push('/rifas')
      }, 2000)
    } else {
      throw new Error('Erro ao salvar rascunho')
    }
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar rascunho'
    showAlert('error', 'Erro', errorMessage)
  } finally {
    isDraftLoading.value = false
  }
}

// Create raffle
const criarRifa = async () => {
  try {
    clearAlert()
    
    if (!validateForm()) {
      showAlert('error', 'Dados inválidos', 'Por favor, corrija os erros antes de continuar.')
      return
    }
    
    isLoading.value = true
    
    const formData = prepareFormData('pending')
    const response = await rifasAPI.createWithImage(formData)
    
    if (response && (response.status === 200 || response.status === 201)) {
      showAlert('success', 'Campanha criada!', 'Sua campanha foi criada com sucesso!')
      setTimeout(() => {
        router.push('/rifas')
      }, 2000)
    } else {
      throw new Error('Erro ao criar campanha')
    }
  } catch (error) {
    console.error('Erro ao criar campanha:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar campanha'
    showAlert('error', 'Erro', errorMessage)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Set default end date to 30 days from now
  const defaultEndDate = new Date()
  defaultEndDate.setDate(defaultEndDate.getDate() + 30)
  defaultEndDate.setHours(23, 59, 0, 0)
  defaultEndDate.setMinutes(defaultEndDate.getMinutes() - defaultEndDate.getTimezoneOffset())
  form.value.endDate = defaultEndDate.toISOString().slice(0, 16)
})
</script>

<style scoped>
.criar-rifa-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f7fa;
  min-height: 100vh;
}

/* Header */
.header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.btn-back:hover {
  background: #e2e8f0;
  color: #475569;
}

.header-content h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.header-content p {
  margin: 0.25rem 0 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Alert */
.alert {
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
}

.alert.success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.alert.error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.alert-content strong {
  display: block;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #1e293b;
}

.alert-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.alert-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
  line-height: 1;
}

/* Form Container */
.form-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.main-form {
  padding: 2rem;
}

/* Form Sections */
.form-section {
  margin-bottom: 2.5rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  color: #64748b;
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
}

.form-intro {
  color: #64748b;
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
}

/* ✅ NOVO: Upload de imagem principal */
.main-image-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image-upload-area:hover {
  border-color: #3b82f6;
  background: #f1f5f9;
}

.image-preview {
  position: relative;
  max-width: 400px;
  width: 100%;
}

.main-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.upload-placeholder .upload-icon {
  color: #94a3b8;
  margin-bottom: 1rem;
}

.upload-placeholder p {
  color: #475569;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.upload-placeholder small {
  color: #94a3b8;
  font-size: 0.8rem;
}

/* ✅ ATUALIZADO: Lista de prêmios (sem imagem) */
.prizes-list {
  margin-bottom: 1.5rem;
}

.prize-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 1rem;
  background: #fafafa;
}

.prize-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.prize-info {
  flex: 1;
}

.prize-info h4 {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.prize-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.no-description {
  font-style: italic;
  color: #94a3b8;
}

.prize-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit,
.btn-remove {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-edit:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.btn-remove:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

/* Botão adicionar prêmio */
.add-prize-btn {
  width: 100%;
  padding: 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.add-prize-btn:hover {
  border-color: #3b82f6;
  background: #f1f5f9;
  color: #3b82f6;
}

.add-prize-btn.first-prize {
  padding: 3rem;
}

.add-prize-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.3s ease;
}

.add-prize-btn:hover .add-prize-icon {
  background: #3b82f6;
  color: white;
}

/* Form Groups */
.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.optional {
  color: #94a3b8;
  font-weight: 400;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.field-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Phone Input */
.phone-input {
  display: flex;
  gap: 0.5rem;
}

.country-code {
  width: 80px !important;
  flex-shrink: 0;
}

/* Time Input */
.time-input {
  display: flex;
  gap: 0.5rem;
}

.time-input input {
  flex: 1;
}

.time-input select {
  width: 120px;
}

/* Model Options */
.model-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.model-option {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.model-option:hover {
  border-color: #3b82f6;
}

.model-option.active {
  border-color: #3b82f6;
  background: #f1f5f9;
}

.model-preview {
  margin-bottom: 1rem;
}

.random-grid {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.choose-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
}

.number-cell {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.model-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.model-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Toggle */
.toggle-group {
  margin-bottom: 1rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
}

.toggle {
  position: relative;
  width: 48px;
  height: 24px;
}

.toggle input {
  display: none;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #cbd5e1;
  border-radius: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  background: #3b82f6;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
  line-height: 1;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #64748b;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

/* Buttons */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-outline {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .criar-rifa-container {
    padding: 0.5rem;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .model-options {
    grid-template-columns: 1fr;
  }
  
  .form-actions,
  .modal-footer {
    flex-direction: column;
  }
  
  .prize-item {
    flex-direction: column;
    text-align: center;
  }
  
  .main-form {
    padding: 1.5rem;
  }
  
  .modal {
    margin: 0.5rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 1.5rem;
  }
  
  .main-form {
    padding: 1rem;
  }
  
  .phone-input {
    flex-direction: column;
  }
  
  .country-code {
    width: 100% !important;
  }
  
  .modal-header,
  .modal-footer {
    padding: 1rem 1.5rem;
  }
  
  .modal-body {
    padding: 1rem 1.5rem;
  }
}
</style>