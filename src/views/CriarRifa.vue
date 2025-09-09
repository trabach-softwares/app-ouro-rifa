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
            <p>Configure todos os detalhes da sua campanha</p>
          </div>
        </div>
      </div>

      <!-- ✅ Alert de Erros em Destaque -->
      <div v-if="hasValidationErrors" class="validation-errors-alert">
        <div class="alert-header">
          <div class="alert-icon">⚠️</div>
          <div>
            <strong>Dados inválidos</strong>
            <p>Por favor, corrija os seguintes erros:</p>
          </div>
        </div>
        <ul class="errors-list">
          <li v-for="(error, field) in errors" :key="field" class="error-item">
            <strong>{{ getFieldLabel(field) }}:</strong> {{ error }}
          </li>
        </ul>
      </div>

      <!-- Alert de Sucesso/Erro -->
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
          
          <!-- Nome da Campanha -->
          <div class="form-section">
            <h3 class="section-title">Como ela vai se chamar?</h3>
            <div class="form-group">
              <input
                v-model="form.title"
                type="text"
                placeholder="Ex: R$ 5.000,00 em Dinheiro via PIX"
                :class="{ 'error': errors.title }"
                :disabled="isLoading"
                maxlength="150"
                @input="clearFieldError('title')"
              />
              <div v-if="errors.title" class="field-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
                {{ errors.title }}
              </div>
            </div>
          </div>

          <!-- ✅ Descrição -->
          <div class="form-section">
            <h3 class="section-title">Descrição</h3>
            <div class="form-group">
              <textarea
                v-model="form.description"
                placeholder="Concorra a R$ 5.000,00 que serão transferidos via PIX imediatamente após o sorteio!"
                rows="4"
                :class="{ 'error': errors.description }"
                :disabled="isLoading"
                minlength="10"
                @input="clearFieldError('description')"
              ></textarea>
              <small class="field-hint">Mínimo 10 caracteres</small>
              <div v-if="errors.description" class="field-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
                {{ errors.description }}
              </div>
            </div>
          </div>

          <!-- ✅ Telefone de Contato -->
          <div class="form-section">
            <h3 class="section-title">Telefone de contato público</h3>
            <div class="form-group">
              <input
                v-model="form.publicContactPhone"
                type="tel"
                placeholder="(11) 98765-4321"
                :class="{ 'error': errors.publicContactPhone }"
                :disabled="isLoading"
                @input="clearFieldError('publicContactPhone')"
                @keyup="formatPhone"
              />
              <small class="field-hint">Formato: (11) 99999-9999</small>
              <div v-if="errors.publicContactPhone" class="field-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
                {{ errors.publicContactPhone }}
              </div>
            </div>
          </div>

          <!-- ✅ Imagem Principal -->
          <div class="form-section">
            <h3 class="section-title">Imagem principal</h3>
            <input
              ref="imageInputRef"
              type="file"
              accept="image/*"
              @change="handleImageSelect"
              style="display: none"
            />
            
            <div 
              class="image-upload-area" 
              :class="{ 'error-border': errors.image }"
              @click="selectImage"
            >
              <div v-if="selectedImage" class="image-preview">
                <img :src="selectedImage.preview" alt="Preview da imagem" />
                <button @click.stop="removeImage" type="button" class="remove-image-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>
              
              <div v-else class="upload-placeholder">
                <div class="upload-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,4V1H5V4H8V6H5V9H3V6H0V4H3M6,10V7H9V4H16L17.83,6H22A2,2 0 0,1 24,8V20A2,2 0 0,1 22,22H6A2,2 0 0,1 4,20V12A2,2 0 0,1 6,10Z"/>
                  </svg>
                </div>
                <p>Clique para selecionar uma imagem</p>
                <small>PNG, JPG até 5MB</small>
              </div>
            </div>
            
            <div v-if="errors.image" class="field-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
              </svg>
              {{ errors.image }}
            </div>
          </div>

          <!-- ✅ Categoria -->
          <div class="form-section">
            <h3 class="section-title">Categoria</h3>
            <div class="form-group">
              <div class="select-wrapper" :class="{ 'error': errors.category }">
                <select v-model="form.category" :disabled="isLoading" @change="clearFieldError('category')">
                  <option value="ELECTRONICS">Eletrônicos</option>
                  <option value="VEHICLES">Veículos</option>
                  <option value="JEWELRY">Joias</option>
                  <option value="APPLIANCES">Eletrodomésticos</option>
                  <option value="MONEY">Dinheiro</option>
                  <option value="OTHER">Outros</option>
                </select>
                <div class="select-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7,10L12,15L17,10H7Z"/>
                  </svg>
                </div>
              </div>
              <div v-if="errors.category" class="field-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
                {{ errors.category }}
              </div>
            </div>
          </div>

          <!-- ✅ Configuração dos Bilhetes -->
          <div class="form-section">
            <h3 class="section-title">Configuração dos bilhetes</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Quantidade total de bilhetes</label>
                <input
                  v-model.number="form.totalTickets"
                  type="number"
                  placeholder="500"
                  min="10"
                  max="10000"
                  step="1"
                  :class="{ 'error': errors.totalTickets }"
                  :disabled="isLoading"
                  @input="clearFieldError('totalTickets')"
                />
                <small class="field-hint">Entre 10 e 10.000 bilhetes</small>
                <div v-if="errors.totalTickets" class="field-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                  </svg>
                  {{ errors.totalTickets }}
                </div>
              </div>

              <div class="form-group">
                <label>Valor por bilhete</label>
                <div class="currency-input">
                  <span class="currency-symbol">R$</span>
                  <input
                    v-model.number="form.ticketPrice"
                    type="number"
                    step="0.01"
                    placeholder="25,00"
                    min="0.01"
                    :class="{ 'error': errors.ticketPrice }"
                    :disabled="isLoading"
                    @input="clearFieldError('ticketPrice')"
                  />
                </div>
                <small class="field-hint">Valor mínimo: R$ 0,01</small>
                <div v-if="errors.ticketPrice" class="field-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
                  {{ errors.ticketPrice }}
                </div>
              </div>
            </div>

            <!-- Configurações de compra -->
            <div class="form-row">
              <div class="form-group">
                <label>Mín. por compra</label>
                <input
                  v-model.number="form.settings.minTicketsPerPurchase"
                  type="number"
                  placeholder="1"
                  min="1"
                  :disabled="isLoading"
                />
              </div>
              
              <div class="form-group">
                <label>Máx. por pessoa</label>
                <input
                  v-model.number="form.settings.maxTicketsPerPerson"
                  type="number"
                  placeholder="100"
                  min="1"
                  :disabled="isLoading"
                />
              </div>
            </div>
          </div>

          <!-- ✅ Tipo de Sorteio -->
          <div class="form-section">
            <h3 class="section-title">Por onde será feito o sorteio?</h3>
            <div class="form-group">
              <div class="select-wrapper" :class="{ 'error': errors.drawType }">
                <select v-model="form.drawType" :disabled="isLoading" @change="clearFieldError('drawType')">
                  <option value="sorteador_com_br">Sorteador.com.br</option>
                  <option value="federal_lottery">Loteria Federal</option>
                  <option value="manual">Sorteio Manual</option>
                </select>
                <div class="select-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7,10L12,15L17,10H7Z"/>
                  </svg>
                </div>
              </div>
              <div v-if="errors.drawType" class="field-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
                {{ errors.drawType }}
              </div>
            </div>
          </div>

          <!-- ✅ Prêmios -->
          <div class="form-section">
            <h3 class="section-title">Prêmios</h3>
            
            <div v-if="form.prizes.length > 0" class="prizes-list">
              <div 
                v-for="(prize, index) in form.prizes" 
                :key="index"
                class="prize-item"
              >
                <span class="prize-position">{{ prize.position }}º</span>
                <div class="prize-info">
                  <strong>{{ prize.name }}</strong>
                  <p v-if="prize.description">{{ prize.description }}</p>
                </div>
                <button @click="removePrize(index)" type="button" class="remove-prize-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <button 
              @click="showPrizeModal = true" 
              type="button" 
              :class="['add-prize-btn', { 'error-border': errors.prizes }]"
            >
              <div class="add-icon">+</div>
              <span>{{ form.prizes.length === 0 ? 'Adicionar Prêmios' : 'Adicionar mais prêmios' }}</span>
            </button>
            
            <div v-if="errors.prizes" class="field-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
              </svg>
              {{ errors.prizes }}
            </div>
          </div>

          <!-- ✅ Configurações adicionais -->
          <div class="form-section">
            <h3 class="section-title">Configurações</h3>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="form.settings.showBuyersList"
                  type="checkbox"
                />
                <span class="checkmark"></span>
                Mostrar lista de compradores
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="form.settings.autoApprovePayments"
                  type="checkbox"
                />
                <span class="checkmark"></span>
                Aprovar pagamentos automaticamente
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isLoading || !isFormValid"
            >
              <span v-if="isLoading">⏳ Criando...</span>
              <span v-else>Criar Campanha</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ✅ Modal para prêmios -->
    <div v-if="showPrizeModal" class="modal-overlay" @click="closePrizeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Adicionar prêmio</h3>
          <button @click="closePrizeModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="prizeName">Nome do prêmio *</label>
            <input
              id="prizeName"
              v-model="currentPrize.name"
              type="text"
              placeholder="Ex: R$ 5.000,00 via PIX"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="prizeDescription">Descrição</label>
            <textarea
              id="prizeDescription"
              v-model="currentPrize.description"
              placeholder="Cinco mil reais transferidos via PIX para o ganhador"
              rows="3"
              class="form-input"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closePrizeModal" type="button" class="btn btn-outline">
            Cancelar
          </button>
          <button @click="addPrize" type="button" class="btn btn-primary">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { rifasAPI } from '@/service/api'
import { useMessage } from '@/composables/message'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = useRouter()
const { showMessage } = useMessage()

const isLoading = ref(false)

// Alert state
const alert = ref({
  type: '',
  title: '',
  message: ''
})

// Errors state
const errors = ref({})

// Modal de prêmios
const showPrizeModal = ref(false)
const currentPrize = ref({
  name: '',
  description: ''
})

// File input ref
const imageInputRef = ref(null)

// Image state
const selectedImage = ref(null)

// ✅ Form data seguindo exatamente o CURL correto
const form = ref({
  title: '',
  description: '',
  publicContactPhone: '',
  category: 'MONEY',
  totalTickets: 500,
  ticketPrice: 25.00,
  drawType: 'sorteador_com_br',
  campaignImages: [], // ✅ Array vazio como no CURL
  prizes: [],
  settings: {
    minTicketsPerPurchase: 1,
    maxTicketsPerPerson: 100,
    showBuyersList: false,
    autoApprovePayments: true
  }
})

// Computed properties
const hasValidationErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

const isFormValid = computed(() => {
  return form.value.title &&
         form.value.description &&
         form.value.publicContactPhone &&
         form.value.totalTickets &&
         form.value.ticketPrice &&
         form.value.drawType &&
         form.value.prizes.length > 0 &&
         Object.keys(errors.value).length === 0
})

// ✅ Função para limpar erro específico
const clearFieldError = (fieldName) => {
  if (errors.value[fieldName]) {
    delete errors.value[fieldName]
  }
}

// Função para obter label do campo em português
const getFieldLabel = (field) => {
  const labels = {
    'title': 'Nome da campanha',
    'description': 'Descrição',
    'publicContactPhone': 'Telefone de contato',
    'image': 'Imagem',
    'category': 'Categoria',
    'totalTickets': 'Quantidade de bilhetes',
    'ticketPrice': 'Valor do bilhete',
    'drawType': 'Tipo de sorteio',
    'prizes': 'Prêmios'
  }
  return labels[field] || field
}

// ✅ Formatação de telefone
const formatPhone = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  
  if (value.length <= 11) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
    value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2')
    value = value.replace(/^(\d{0,2})$/, '($1')
    
    form.value.publicContactPhone = value
  }
}

// ✅ Métodos para imagem
const selectImage = () => {
  imageInputRef.value?.click()
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    showMessage('Apenas arquivos de imagem são permitidos', 'error')
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showMessage('Arquivo muito grande. Máximo 5MB', 'error')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImage.value = {
      file: file,
      preview: e.target.result
    }
  }
  reader.readAsDataURL(file)
  
  if (errors.value.image) {
    delete errors.value.image
  }
}

const removeImage = () => {
  selectedImage.value = null
  if (imageInputRef.value) {
    imageInputRef.value.value = ''
  }
}

// ✅ Métodos para prêmios
const closePrizeModal = () => {
  showPrizeModal.value = false
  currentPrize.value = {
    name: '',
    description: ''
  }
}

const addPrize = () => {
  if (!currentPrize.value.name.trim()) {
    showMessage('Nome do prêmio é obrigatório', 'error')
    return
  }
  
  form.value.prizes.push({
    id: `prize_${Date.now()}`,
    name: currentPrize.value.name,
    description: currentPrize.value.description || '',
    position: form.value.prizes.length + 1
  })
  
  closePrizeModal()
  
  if (errors.value.prizes) {
    delete errors.value.prizes
  }
}

const removePrize = (index) => {
  form.value.prizes.splice(index, 1)
  
  // Reordenar posições
  form.value.prizes.forEach((prize, idx) => {
    prize.position = idx + 1
  })
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

// ✅ Processamento de erros da API
const processApiErrors = (apiErrors) => {
  errors.value = {}
  
  if (Array.isArray(apiErrors)) {
    console.log('🚨 Processando erros da API:', apiErrors)
    
    apiErrors.forEach(error => {
      const fieldName = error.field
      let message = error.message
      
      // ✅ Traduzir mensagens de erro mais comuns
      const translations = {
        'title is required': 'Nome da campanha é obrigatório',
        'description is required': 'Descrição é obrigatória',
        'publicContactPhone is required': 'Telefone de contato é obrigatório',
        'totalTickets is required': 'Quantidade de bilhetes é obrigatória',
        'ticketPrice is required': 'Valor do bilhete é obrigatório',
        'prizes is required': 'Pelo menos um prêmio é obrigatório',
        'description must be at least 10 characters': 'Descrição deve ter pelo menos 10 caracteres',
        'publicContactPhone must be in format (11) 99999-9999': 'Telefone deve estar no formato (11) 99999-9999'
      }
      
      if (translations[message]) {
        message = translations[message]
      }
      
      errors.value[fieldName] = message
    })
    
    console.log('✅ Erros processados:', errors.value)
  }
}

// ✅ Validação melhorada
const validateForm = () => {
  errors.value = {}
  let isValid = true

  // Título
  if (!form.value.title?.trim()) {
    errors.value.title = 'Nome da campanha é obrigatório'
    isValid = false
  } else if (form.value.title.trim().length < 3) {
    errors.value.title = 'Nome da campanha deve ter pelo menos 3 caracteres'
    isValid = false
  }

  // Descrição
  if (!form.value.description?.trim()) {
    errors.value.description = 'Descrição é obrigatória'
    isValid = false
  } else if (form.value.description.trim().length < 10) {
    errors.value.description = 'Descrição deve ter pelo menos 10 caracteres'
    isValid = false
  }

  // Telefone
  if (!form.value.publicContactPhone?.trim()) {
    errors.value.publicContactPhone = 'Telefone de contato é obrigatório'
    isValid = false
  } else {
    const phoneNumbers = form.value.publicContactPhone.replace(/\D/g, '')
    if (phoneNumbers.length !== 11) {
      errors.value.publicContactPhone = 'Telefone deve estar no formato (11) 99999-9999'
      isValid = false
    }
  }

  // Quantidade de bilhetes
  if (!form.value.totalTickets) {
    errors.value.totalTickets = 'Quantidade de bilhetes é obrigatória'
    isValid = false
  } else if (form.value.totalTickets < 10) {
    errors.value.totalTickets = 'Quantidade de bilhetes deve ser pelo menos 10'
    isValid = false
  } else if (form.value.totalTickets > 10000) {
    errors.value.totalTickets = 'Quantidade de bilhetes deve ser no máximo 10.000'
    isValid = false
  }

  // Valor do bilhete
  if (!form.value.ticketPrice) {
    errors.value.ticketPrice = 'Valor do bilhete é obrigatório'
    isValid = false
  } else if (form.value.ticketPrice <= 0) {
    errors.value.ticketPrice = 'Valor do bilhete deve ser maior que zero'
    isValid = false
  } else if (form.value.ticketPrice < 0.01) {
    errors.value.ticketPrice = 'Valor mínimo do bilhete é R$ 0,01'
    isValid = false
  }

  // Tipo de sorteio
  if (!form.value.drawType) {
    errors.value.drawType = 'Tipo de sorteio é obrigatório'
    isValid = false
  }

  // Prêmios
  if (form.value.prizes.length === 0) {
    errors.value.prizes = 'Pelo menos um prêmio é obrigatório'
    isValid = false
  }

  return isValid
}

// ✅ Preparar FormData ou JSON dependendo da presença de imagem
const prepareData = () => {
  if (selectedImage.value) {
    // Se tem imagem, usar FormData
    const formData = new FormData()
    
    // Imagem
    formData.append('image', selectedImage.value.file)
    
    // Campos básicos
    formData.append('title', form.value.title?.trim() || '')
    formData.append('description', form.value.description?.trim() || '')
    formData.append('publicContactPhone', form.value.publicContactPhone?.trim() || '')
    formData.append('category', form.value.category)
    formData.append('totalTickets', parseInt(form.value.totalTickets))
    formData.append('ticketPrice', parseFloat(form.value.ticketPrice))
    formData.append('drawType', form.value.drawType)
    
    // Prêmios
    form.value.prizes.forEach((prize, index) => {
      formData.append(`prizes[${index}][id]`, prize.id)
      formData.append(`prizes[${index}][name]`, prize.name)
      formData.append(`prizes[${index}][description]`, prize.description)
      formData.append(`prizes[${index}][position]`, prize.position)
    })
    
    // Settings
    formData.append('settings[minTicketsPerPurchase]', form.value.settings.minTicketsPerPurchase)
    formData.append('settings[maxTicketsPerPerson]', form.value.settings.maxTicketsPerPerson)
    formData.append('settings[showBuyersList]', form.value.settings.showBuyersList)
    formData.append('settings[autoApprovePayments]', form.value.settings.autoApprovePayments)
    
    return { data: formData, hasImage: true }
  } else {
    // Se não tem imagem, usar JSON
    const jsonData = {
      title: form.value.title?.trim() || '',
      description: form.value.description?.trim() || '',
      publicContactPhone: form.value.publicContactPhone?.trim() || '',
      category: form.value.category,
      totalTickets: parseInt(form.value.totalTickets) || 0,
      ticketPrice: parseFloat(form.value.ticketPrice) || 0,
      drawType: form.value.drawType,
      campaignImages: [], // Array vazio
      prizes: form.value.prizes.map(prize => ({
        id: prize.id,
        name: prize.name,
        description: prize.description,
        position: prize.position
      })),
      settings: {
        minTicketsPerPurchase: parseInt(form.value.settings.minTicketsPerPurchase) || 1,
        maxTicketsPerPerson: parseInt(form.value.settings.maxTicketsPerPerson) || 100,
        showBuyersList: Boolean(form.value.settings.showBuyersList),
        autoApprovePayments: Boolean(form.value.settings.autoApprovePayments)
      }
    }
    
    return { data: jsonData, hasImage: false }
  }
}

const criarRifa = async () => {
  try {
    clearAlert()
    
    if (!validateForm()) {
      console.log('❌ Validação falhou:', errors.value)
      return
    }
    
    isLoading.value = true
    
    const { data, hasImage } = prepareData()
    
    console.log('📤 Enviando dados para API:', data)
    
    let response
    if (hasImage) {
      // ✅ Usar endpoint /raffles/with-image com FormData
      response = await rifasAPI.createWithImage(data)
    } else {
      // ✅ Usar endpoint /raffles com JSON
      response = await rifasAPI.create(data)
    }
    
    if (response && (response.status === 200 || response.status === 201)) {
      showAlert('success', 'Campanha criada!', 'Sua campanha foi criada com sucesso!')
      setTimeout(() => {
        router.push('/rifas')
      }, 2000)
    } else {
      throw new Error('Erro ao criar campanha')
    }
  } catch (error) {
    console.error('💥 Erro ao criar campanha:', error)
    
    // Processar erros específicos da API
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      console.log('🚨 Erros da API detectados:', error.response.data.errors)
      processApiErrors(error.response.data.errors)
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar campanha'
      showAlert('error', 'Erro', errorMessage)
    }
  } finally {
    isLoading.value = false
  }
}
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

/* ✅ Alert de erros em destaque */
.validation-errors-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.1);
}

.alert-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.alert-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.alert-header strong {
  color: #dc2626;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: block;
}

.alert-header p {
  color: #7f1d1d;
  margin: 0;
}

.errors-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-item {
  color: #7f1d1d;
  padding: 0.5rem 0;
  border-bottom: 1px solid #fecaca;
  font-size: 0.9rem;
}

.error-item:last-child {
  border-bottom: none;
}

.error-item strong {
  color: #dc2626;
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
  padding-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.form-section:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

/* Form Groups */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
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

/* Error states */
.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.error-border {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

/* Field error */
.field-error {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.field-error svg {
  flex-shrink: 0;
}

/* ✅ Field hint */
.field-hint {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

/* Form row */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Select wrapper */
.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  background: white;
  padding-right: 3rem;
  cursor: pointer;
}

.select-wrapper.error select {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6b7280;
}

/* Currency Input */
.currency-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  font-weight: 600;
  z-index: 1;
  pointer-events: none;
}

.currency-input input {
  padding-left: 2.5rem !important;
}

/* ✅ Image Upload */
.image-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-area:hover {
  border-color: #3b82f6;
  background: #f1f5f9;
}

.image-upload-area.error-border {
  border-color: #ef4444;
  background: #fef2f2;
}

.image-preview {
  position: relative;
  max-width: 300px;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}

.upload-placeholder {
  text-align: center;
  color: #6b7280;
}

.upload-icon {
  margin-bottom: 1rem;
}

.upload-placeholder p {
  margin: 0.5rem 0;
  font-weight: 500;
}

.upload-placeholder small {
  color: #9ca3af;
}

/* Prizes */
.prizes-list {
  margin-bottom: 1rem;
}

.prize-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #fafafa;
}

.prize-position {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.prize-info {
  flex: 1;
}

.prize-info strong {
  display: block;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.prize-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.remove-prize-btn {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-prize-btn:hover {
  background: #fecaca;
}

/* Add button */
.add-prize-btn {
  width: 100%;
  background: transparent;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #6b7280;
  font-weight: 500;
}

.add-prize-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.add-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.2s ease;
}

.add-prize-btn:hover .add-icon {
  background: #3b82f6;
  color: white;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 400 !important;
  margin-bottom: 0 !important;
}

.checkbox-label input {
  margin-right: 0.75rem;
  width: auto !important;
}

/* Modal */
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
  border-radius: 12px;
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
  font-size: 1.125rem;
  font-weight: 600;
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

/* Form Input Style */
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Action Buttons */
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 8px;
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
  background: #4c63d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3b4db8;
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
  
  .main-form {
    padding: 1.5rem;
  }
  
  .modal {
    margin: 0.5rem;
  }
}
</style>