<!-- filepath: src/views/EditarRifa.vue -->
<template>
  <AdminLayout>
    <div class="editar-rifa">
      <!-- Header da página -->
      <div class="page-header">
        <div class="header-content">
          <h1>Editar Rifa</h1>
          <p>{{ form.titulo || 'Modifique os dados da sua rifa' }}</p>
        </div>
        <div class="header-actions">
          <!-- ✅ CORRETO: Botão gerenciar volta para rota principal -->
          <router-link :to="`/rifas/${$route.params.id}`" class="btn btn-outline">
            📊 Gerenciar
          </router-link>
          <router-link to="/rifas" class="btn btn-secondary">
            ← Voltar
          </router-link>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Carregando dados da rifa...</p>
      </div>

      <!-- Erro de carregamento -->
      <div v-else-if="loadError" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar rifa</h3>
        <p>{{ loadError }}</p>
        <div class="error-actions">
          <button @click="carregarRifa" class="btn btn-primary">🔄 Tentar Novamente</button>
          <router-link to="/rifas" class="btn btn-outline">← Voltar à Lista</router-link>
        </div>
      </div>

      <!-- Formulário de Edição -->
      <form v-else @submit.prevent="salvarRifa" class="edit-form">
        
        <!-- Status atual da rifa -->
        <div class="status-card">
          <div class="status-header">
            <h3>Status da Rifa</h3>
            <span :class="['status-badge', form.status]">
              {{ getStatusText(form.status) }}
            </span>
          </div>
          <div v-if="temVendas" class="status-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <strong>Atenção:</strong> Esta rifa já possui {{ form.numerosVendidos }} número(s) vendido(s). 
              Alguns campos não podem ser alterados para manter a integridade das vendas.
            </div>
          </div>
        </div>

        <!-- 1. Informações Básicas -->
        <div class="form-section">
          <div class="section-header">
            <h2>📝 Informações Básicas</h2>
          </div>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="titulo">Título da Rifa *</label>
              <input
                id="titulo"
                v-model="form.titulo"
                type="text"
                placeholder="Ex: iPhone 15 Pro Max - Sorteio Natal 2024"
                required
                class="form-input"
                :class="{ 'error': errors.titulo }"
              />
              <div v-if="errors.titulo" class="field-error">{{ errors.titulo }}</div>
            </div>

            <div class="form-group full-width">
              <label for="descricao">Descrição da Rifa *</label>
              <textarea
                id="descricao"
                v-model="form.descricao"
                placeholder="Descreva o prêmio, condições do sorteio, forma de entrega, etc..."
                required
                rows="4"
                class="form-input"
                :class="{ 'error': errors.descricao }"
              ></textarea>
              <div v-if="errors.descricao" class="field-error">{{ errors.descricao }}</div>
              <small class="field-hint">Mínimo 10 caracteres</small>
            </div>

            <div class="form-group">
              <label for="telefone">Telefone de Contato</label>
              <input
                id="telefone"
                v-model="form.telefoneContato"
                type="tel"
                placeholder="(11) 99999-9999"
                class="form-input"
                :disabled="temVendas"
              />
              <small class="field-hint">Telefone público para contato dos participantes</small>
            </div>

            <div class="form-group">
              <label for="categoria">Categoria</label>
              <select
                id="categoria"
                v-model="form.categoria"
                class="form-input"
                :disabled="temVendas"
              >
                <option value="">Selecionar categoria</option>
                <option value="MONEY">💰 Dinheiro</option>
                <option value="ELECTRONICS">📱 Eletrônicos</option>
                <option value="VEHICLE">🚗 Veículo</option>
                <option value="OTHER">🎁 Outros</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. Imagem do Prêmio -->
        <div class="form-section">
          <div class="section-header">
            <h2>🖼️ Imagem do Prêmio</h2>
          </div>
          
          <div class="image-upload-container">
            <div class="current-image" v-if="form.imagemPreview">
              <img :src="form.imagemPreview" alt="Imagem atual" />
              <div class="image-overlay">
                <button type="button" @click="removeImage" class="remove-btn">❌ Remover</button>
                <button type="button" @click="$refs.fileInput.click()" class="change-btn">🔄 Alterar</button>
              </div>
            </div>
            
            <div v-else class="upload-placeholder" @click="$refs.fileInput.click()">
              <div class="upload-icon">📷</div>
              <h4>Adicionar Imagem</h4>
              <p>Clique para selecionar uma imagem do prêmio</p>
              <small>PNG, JPG até 5MB</small>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="file-input-hidden"
            />
          </div>
        </div>

        <!-- 3. Configurações do Sorteio -->
        <div class="form-section">
          <div class="section-header">
            <h2>🎯 Configurações do Sorteio</h2>
            <div v-if="temVendas" class="lock-warning">
              🔒 Bloqueado devido às vendas existentes
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="valorNumero">Valor por Número *</label>
              <div class="input-with-prefix">
                <span class="prefix">R$</span>
                <input
                  id="valorNumero"
                  v-model="form.valorNumero"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="25,00"
                  required
                  class="form-input"
                  :class="{ 'error': errors.valorNumero }"
                  :disabled="temVendas"
                />
              </div>
              <div v-if="errors.valorNumero" class="field-error">{{ errors.valorNumero }}</div>
            </div>

            <div class="form-group">
              <label for="totalNumeros">Total de Números *</label>
              <input
                id="totalNumeros"
                v-model="form.totalNumeros"
                type="number"
                min="10"
                max="10000"
                placeholder="100"
                required
                class="form-input"
                :class="{ 'error': errors.totalNumeros }"
                :disabled="temVendas"
              />
              <div v-if="errors.totalNumeros" class="field-error">{{ errors.totalNumeros }}</div>
              <small class="field-hint">Entre 10 e 10.000 números</small>
            </div>

            <div class="form-group">
              <label for="tipoSorteio">Tipo de Sorteio</label>
              <select
                id="tipoSorteio"
                v-model="form.tipoSorteio"
                class="form-input"
                :disabled="temVendas"
              >
                <option value="">Selecionar tipo</option>
                <option value="sorteador_com_br">🌐 Sorteador.com.br</option>
                <option value="federal_lottery">🎲 Loteria Federal</option>
                <option value="manual">✋ Sorteio Manual</option>
              </select>
            </div>

            <div class="form-group">
              <label for="dataFim">Data de Encerramento</label>
              <input
                id="dataFim"
                v-model="form.dataFim"
                type="datetime-local"
                class="form-input"
              />
              <small class="field-hint">Quando as vendas devem parar</small>
            </div>
          </div>

          <!-- Resumo financeiro -->
          <div class="financial-summary">
            <div class="summary-item">
              <span class="label">Valor por número:</span>
              <span class="value">{{ formatCurrency(form.valorNumero) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total de números:</span>
              <span class="value">{{ form.totalNumeros || 0 }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">Faturamento máximo:</span>
              <span class="value">{{ formatCurrency(faturamentoMaximo) }}</span>
            </div>
          </div>
        </div>

        <!-- 4. Prêmios Configurados -->
        <div v-if="form.premios && form.premios.length > 0" class="form-section">
          <div class="section-header">
            <h2>🏆 Prêmios Configurados</h2>
          </div>
          
          <div class="prizes-list">
            <div 
              v-for="(premio, index) in form.premios" 
              :key="premio.id || index"
              class="prize-item"
            >
              <div class="prize-position">{{ premio.position }}º</div>
              <div class="prize-info">
                <h4>{{ premio.name }}</h4>
                <p v-if="premio.description">{{ premio.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Estatísticas Atuais -->
        <div class="form-section">
          <div class="section-header">
            <h2>📊 Estatísticas Atuais</h2>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-info">
                <div class="stat-number">{{ form.numerosVendidos || 0 }}</div>
                <div class="stat-label">Números Vendidos</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📈</div>
              <div class="stat-info">
                <div class="stat-number">{{ Math.round(form.percentualVendido || 0) }}%</div>
                <div class="stat-label">Progresso</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <div class="stat-number">{{ formatCurrency(form.faturamento || 0) }}</div>
                <div class="stat-label">Faturamento</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <div class="stat-number">{{ formatDate(form.createdAt) }}</div>
                <div class="stat-label">Criada em</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações do formulário -->
        <div class="form-actions">
          <div class="actions-left">
            <!-- ✅ CORRETO: Cancelar volta para gerenciar -->
            <router-link :to="`/rifas/${$route.params.id}`" class="btn btn-outline">
              ← Cancelar
            </router-link>
          </div>
          
          <div class="actions-right">
            <button type="button" @click="previewChanges" class="btn btn-secondary">
              👁️ Visualizar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving || !isFormValid">
              <span v-if="isSaving">
                <div class="loading-spinner-small"></div>
                Salvando...
              </span>
              <span v-else>💾 Salvar Alterações</span>
            </button>
          </div>
        </div>

        <!-- Ações avançadas -->
        <div class="advanced-actions">
          <div class="action-group">
            <h3>Ações de Status</h3>
            <div class="status-buttons">
              <button 
                v-if="form.status === 'draft'"
                type="button"
                @click="updateStatus('active')"
                class="btn btn-success"
                :disabled="isUpdatingStatus"
              >
                🚀 Publicar Rifa
              </button>
              
              <button 
                v-if="form.status === 'active'"
                type="button"
                @click="updateStatus('paused')"
                class="btn btn-warning"
                :disabled="isUpdatingStatus"
              >
                ⏸️ Pausar Rifa
              </button>
              
              <button 
                v-if="form.status === 'paused'"
                type="button"
                @click="updateStatus('active')"
                class="btn btn-success"
                :disabled="isUpdatingStatus"
              >
                ▶️ Reativar Rifa
              </button>
              
              <button 
                v-if="!['finished', 'cancelled'].includes(form.status)"
                type="button"
                @click="updateStatus('cancelled')"
                class="btn btn-danger"
                :disabled="isUpdatingStatus"
              >
                🗑️ Cancelar Rifa
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { rifasAPI } from '@/service/api'
import { useMessage } from '@/composables/message'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const { showMessage } = useMessage()

// Estados
const isLoading = ref(true)
const isSaving = ref(false)
const isUpdatingStatus = ref(false)
const loadError = ref('')
const errors = ref({})

// Dados do formulário
const form = ref({
  id: null,
  titulo: '',
  descricao: '',
  telefoneContato: '',
  categoria: '',
  valorNumero: 0,
  totalNumeros: 0,
  tipoSorteio: '',
  dataFim: '',
  imagemPreview: null,
  imagemNova: null,
  status: 'draft',
  numerosVendidos: 0,
  percentualVendido: 0,
  faturamento: 0,
  premios: [],
  createdAt: null
})

// Computed properties
const temVendas = computed(() => (form.value.numerosVendidos || 0) > 0)

const faturamentoMaximo = computed(() => {
  const valor = parseFloat(form.value.valorNumero) || 0
  const total = parseInt(form.value.totalNumeros) || 0
  return valor * total
})

const isFormValid = computed(() => {
  return form.value.titulo?.trim() &&
         form.value.descricao?.trim() &&
         form.value.valorNumero > 0 &&
         form.value.totalNumeros > 0 &&
         Object.keys(errors.value).length === 0
})

// Funções utilitárias
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Não definida'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const getStatusText = (status) => {
  const statusMap = {
    draft: 'Rascunho',
    active: 'Ativa',
    paused: 'Pausada',
    finished: 'Finalizada',
    cancelled: 'Cancelada'
  }
  return statusMap[status] || status
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    return ''
  }
}

// Carregar dados da rifa
const carregarRifa = async () => {
  try {
    isLoading.value = true
    loadError.value = ''
    const rifaId = route.params.id
    
    console.log('🎯 Carregando rifa para edição:', rifaId)
    
    const response = await rifasAPI.get(rifaId)
    console.log('📥 Resposta da API:', response.data)
    
    let rifaData = null
    
    // Processar resposta da API
    if (response.data?.success && response.data.data?.raffle) {
      rifaData = response.data.data.raffle
    } else if (response.data?.success && response.data.data) {
      rifaData = response.data.data
    } else if (response.data?.id) {
      rifaData = response.data
    }
    
    if (!rifaData?.id) {
      throw new Error('Dados da rifa não encontrados')
    }
    
    console.log('✅ Dados da rifa:', rifaData)
    
    // Mapear dados para o formulário
    form.value = {
      id: rifaData.id,
      titulo: rifaData.title || '',
      descricao: rifaData.description || '',
      telefoneContato: rifaData.publicContactPhone || '',
      categoria: rifaData.category || '',
      valorNumero: rifaData.ticketPrice || 0,
      totalNumeros: rifaData.totalTickets || 0,
      tipoSorteio: rifaData.drawType || '',
      dataFim: formatDateForInput(rifaData.drawDate || rifaData.endDate),
      imagemPreview: getImageUrl(rifaData),
      imagemNova: null,
      status: rifaData.status || 'draft',
      numerosVendidos: rifaData.soldTickets || 0,
      percentualVendido: rifaData.progress || 0,
      faturamento: rifaData.revenue || 0,
      premios: rifaData.prizes || [],
      createdAt: rifaData.createdAt
    }
    
    console.log('✅ Formulário preenchido:', form.value)
    
  } catch (error) {
    console.error('💥 Erro ao carregar rifa:', error)
    loadError.value = error.message || 'Erro ao carregar dados da rifa'
    
    if (error.response?.status === 404) {
      loadError.value = 'Rifa não encontrada'
    } else if (error.response?.status === 403) {
      loadError.value = 'Você não tem permissão para editar esta rifa'
    }
  } finally {
    isLoading.value = false
  }
}

const getImageUrl = (rifaData) => {
  if (rifaData.campaignImages && rifaData.campaignImages.length > 0) {
    const imageUrl = rifaData.campaignImages[0]
    if (imageUrl.startsWith('http')) {
      return imageUrl
    } else {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      return `${baseUrl}${imageUrl}`
    }
  }
  return null
}

// Manipulação de imagem
const handleImageUpload = (event) => {
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
    form.value.imagemNova = file
    form.value.imagemPreview = e.target.result
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  form.value.imagemNova = null
  form.value.imagemPreview = null
}

// Validação
const validateForm = () => {
  errors.value = {}
  
  if (!form.value.titulo?.trim()) {
    errors.value.titulo = 'Título é obrigatório'
  }
  
  if (!form.value.descricao?.trim()) {
    errors.value.descricao = 'Descrição é obrigatória'
  } else if (form.value.descricao.length < 10) {
    errors.value.descricao = 'Descrição deve ter pelo menos 10 caracteres'
  }
  
  if (!form.value.valorNumero || form.value.valorNumero <= 0) {
    errors.value.valorNumero = 'Valor deve ser maior que zero'
  }
  
  if (!form.value.totalNumeros || form.value.totalNumeros < 10) {
    errors.value.totalNumeros = 'Mínimo de 10 números'
  }
  
  return Object.keys(errors.value).length === 0
}

// Salvar alterações
const salvarRifa = async () => {
  try {
    if (!validateForm()) {
      showMessage('Por favor, corrija os erros no formulário', 'error')
      return
    }
    
    isSaving.value = true
    
    // Preparar dados para envio
    const dadosParaEnvio = {
      title: form.value.titulo,
      description: form.value.descricao,
      publicContactPhone: form.value.telefoneContato,
      category: form.value.categoria,
      ticketPrice: parseFloat(form.value.valorNumero),
      totalTickets: parseInt(form.value.totalNumeros),
      drawType: form.value.tipoSorteio
    }
    
    if (form.value.dataFim) {
      dadosParaEnvio.drawDate = new Date(form.value.dataFim).toISOString()
    }
    
    console.log('💾 Salvando alterações:', dadosParaEnvio)
    
    // Se há imagem nova, usar FormData
    if (form.value.imagemNova) {
      const formData = new FormData()
      formData.append('image', form.value.imagemNova)
      
      Object.keys(dadosParaEnvio).forEach(key => {
        if (dadosParaEnvio[key] !== null && dadosParaEnvio[key] !== undefined) {
          formData.append(key, dadosParaEnvio[key])
        }
      })
      
      await rifasAPI.update(form.value.id, formData)
    } else {
      await rifasAPI.update(form.value.id, dadosParaEnvio)
    }
    
    showMessage('✅ Rifa atualizada com sucesso!', 'success')
    
    // Recarregar dados
    await carregarRifa()
    
  } catch (error) {
    console.error('💥 Erro ao salvar:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar rifa'
    showMessage('❌ ' + errorMessage, 'error')
  } finally {
    isSaving.value = false
  }
}

// Atualizar status
const updateStatus = async (novoStatus) => {
  const confirmacoes = {
    active: 'Tem certeza que deseja ATIVAR esta rifa? Ela ficará disponível para vendas.',
    paused: 'Tem certeza que deseja PAUSAR esta rifa? As vendas serão interrompidas.',
    cancelled: 'ATENÇÃO: Tem certeza que deseja CANCELAR esta rifa? Esta ação não pode ser desfeita!'
  }
  
  if (!confirm(confirmacoes[novoStatus] || `Alterar status para ${getStatusText(novoStatus)}?`)) {
    return
  }
  
  try {
    isUpdatingStatus.value = true
    
    await rifasAPI.updateStatus(form.value.id, novoStatus)
    form.value.status = novoStatus
    
    const mensagens = {
      active: '🚀 Rifa ativada com sucesso!',
      paused: '⏸️ Rifa pausada com sucesso!',
      cancelled: '🗑️ Rifa cancelada'
    }
    
    showMessage(mensagens[novoStatus] || 'Status atualizado!', 'success')
    
  } catch (error) {
    console.error('💥 Erro ao atualizar status:', error)
    showMessage('❌ Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'), 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

// Preview das alterações
const previewChanges = () => {
  showMessage('Funcionalidade de preview em desenvolvimento', 'info')
}

// Carregar dados ao montar
onMounted(() => {
  carregarRifa()
})
</script>

<style scoped>
.editar-rifa {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
}

.header-content p {
  margin: 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Loading e Error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f3f4;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Status Card */
.status-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-header h3 {
  margin: 0;
  color: #1a1d29;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.draft { background: #f3f4f6; color: #374151; }
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.paused { background: #fef3c7; color: #92400e; }
.status-badge.finished { background: #dbeafe; color: #1e40af; }
.status-badge.cancelled { background: #fee2e2; color: #dc2626; }

.status-warning {
  display: flex;
  gap: 1rem;
  background: #fef3c7;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #f59e0b;
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* Form Sections */
.form-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f3f4;
}

.section-header h2 {
  margin: 0;
  color: #1a1d29;
  font-size: 1.5rem;
  font-weight: 700;
}

.lock-warning {
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 600;
  background: #fef3c7;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-input {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
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
  color: #9ca3af;
  cursor: not-allowed;
}

.form-input.error {
  border-color: #ef4444;
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.prefix {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  font-weight: 600;
  z-index: 1;
}

.input-with-prefix .form-input {
  padding-left: 3rem;
}

.field-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.field-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Image Upload */
.image-upload-container {
  max-width: 400px;
}

.current-image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.current-image img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.current-image:hover .image-overlay {
  opacity: 1;
}

.remove-btn,
.change-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-btn {
  background: #ef4444;
  color: white;
}

.change-btn {
  background: #667eea;
  color: white;
}

.upload-placeholder {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-placeholder:hover {
  border-color: #667eea;
  background: #f8faff;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.file-input-hidden {
  display: none;
}

/* Financial Summary */
.financial-summary {
  background: #f8faff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.summary-item.total {
  border-top: 2px solid #d1d5db;
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-weight: 700;
  font-size: 1.1rem;
}

.summary-item .label {
  color: #6b7280;
}

.summary-item .value {
  color: #1a1d29;
  font-weight: 600;
}

/* Prizes */
.prizes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.prize-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8faff;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.prize-position {
  width: 40px;
  height: 40px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.prize-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1a1d29;
}

.prize-info p {
  margin: 0;
  color: #6b7280;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8faff;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1d29;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.actions-left,
.actions-right {
  display: flex;
  gap: 1rem;
}

/* Advanced Actions */
.advanced-actions {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.action-group h3 {
  margin: 0 0 1rem 0;
  color: #1a1d29;
}

.status-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  justify-content: center;
  white-space: nowrap;
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
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.btn-outline {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-1px);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Loading Spinner */
.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .editar-rifa {
    padding: 0.5rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .actions-left,
  .actions-right {
    justify-content: center;
    width: 100%;
  }
  
  .status-buttons {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>