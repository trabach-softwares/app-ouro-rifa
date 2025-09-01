<template>
  <AdminLayout>
    <div class="minhas-rifas">
      <!-- Header da página -->
      <div class="page-header">
        <div class="header-content">
          <h1>Minhas Rifas</h1>
          <p>Gerencie e acompanhe todas as suas rifas</p>
        </div>
        <div class="header-actions">
          <router-link to="/rifas/criar" class="btn btn-primary">
            ➕ Nova Rifa
          </router-link>
        </div>
      </div>

      <!-- Filtros e busca -->
      <div class="filters-section">
        <div class="filters">
          <select v-model="filtroStatus" @change="aplicarFiltros">
            <option value="">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="pending">Pendentes</option>
            <option value="paused">Pausadas</option>
            <option value="finished">Finalizadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="draft">Rascunho</option>
          </select>
          
          <input 
            v-model="termoBusca" 
            @input="debounceSearch"
            type="text" 
            placeholder="Buscar rifas..."
            class="search-input"
          />
          
          <select v-model="ordenacao" @change="aplicarFiltros">
            <option value="createdAt">Mais recentes</option>
            <option value="updatedAt">Atualizadas recentemente</option>
            <option value="title">Nome (A-Z)</option>
            <option value="endDate">Data de sorteio</option>
          </select>
          
          <select v-model="ordemDirecao" @change="aplicarFiltros">
            <option value="desc">Decrescente</option>
            <option value="asc">Crescente</option>
          </select>
          
          <button @click="handleRefresh" class="btn btn-outline" :disabled="isLoading">
            🔄 Atualizar
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Carregando suas rifas...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar rifas</h3>
        <p>{{ error }}</p>
        <button @click="handleRefresh" class="btn btn-primary">
          🔄 Tentar Novamente
        </button>
      </div>

      <!-- Lista de rifas -->
      <div v-else-if="!isLoading && !error && rifasFiltradas.length > 0" class="rifas-grid">
        <div 
          v-for="rifa in rifasFiltradas" 
          :key="rifa.id"
          class="rifa-card"
        >
          <div class="rifa-image">
            <div v-if="!getRifaImageUrl(rifa)" class="image-placeholder">
              <div class="placeholder-icon">🎯</div>
              <div class="placeholder-text">{{ rifa.title }}</div>
            </div>
            
            <div v-else class="rifa-image-container">
              <img 
                :src="getRifaImageUrl(rifa)"
                :alt="rifa.title"
                class="rifa-image-real"
                @error="handleImageError"
                loading="lazy"
              />
              
              <div class="image-placeholder fallback-placeholder" style="display: none;">
                <div class="placeholder-icon">🎯</div>
                <div class="placeholder-text">{{ rifa.title }}</div>
              </div>
            </div>
            
            <div class="rifa-status">
              <span :class="['status-badge', rifa.status]">
                {{ getStatusText(rifa.status) }}
              </span>
            </div>
          </div>
          
          <div class="rifa-content">
            <h3>{{ rifa.title }}</h3>
            <p class="rifa-premio">{{ formatCurrency(calculateTotalPrize(rifa)) }}</p>
            
            <div class="rifa-stats">
              <div class="stat">
                <span class="label">Vendidos:</span>
                <span class="value">{{ rifa.soldTickets || 0 }}/{{ rifa.totalTickets || 0 }}</span>
              </div>
              <div class="stat">
                <span class="label">Progresso:</span>
                <span class="value">{{ Math.round(rifa.progress || 0) }}%</span>
              </div>
              <div class="stat">
                <span class="label">Faturamento:</span>
                <span class="value success">{{ formatCurrency(rifa.revenue || 0) }}</span>
              </div>
              <div class="stat">
                <span class="label">Valor do número:</span>
                <span class="value">{{ formatCurrency(rifa.ticketPrice || 0) }}</span>
              </div>
              <div class="stat">
                <span class="label">Data do sorteio:</span>
                <span class="value">{{ formatDate(rifa.endDate) }}</span>
              </div>
            </div>
            
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${rifa.progress || 0}%` }"
              ></div>
            </div>
            
            <div class="rifa-actions">
              <router-link 
                :to="`/rifas/${rifa.id}`"
                class="btn btn-outline"
              >
                📊 Gerenciar
              </router-link>
              <button 
                v-if="rifa.status === 'pending'"
                @click="ativarRifa(rifa.id)"
                class="btn btn-success"
                :disabled="isUpdatingStatus"
              >
                ✅ Ativar
              </button>
              <button 
                v-if="rifa.status === 'active'"
                @click="pausarRifa(rifa.id)"
                class="btn btn-warning"
                :disabled="isUpdatingStatus"
              >
                ⏸️ Pausar
              </button>
              <button 
                v-else-if="rifa.status === 'paused'"
                @click="ativarRifa(rifa.id)"
                class="btn btn-success"
                :disabled="isUpdatingStatus"
              >
                ▶️ Ativar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginação -->
      <div v-if="!isLoading && !error && rifasFiltradas.length > 0 && pagination.totalPages > 1" class="pagination">
        <button 
          @click="goToPage(1)" 
          :disabled="pagination.currentPage === 1 || isLoading"
          class="btn btn-outline"
        >
          ⏮️ Primeira
        </button>
        <button 
          @click="goToPage(pagination.currentPage - 1)" 
          :disabled="pagination.currentPage === 1 || isLoading"
          class="btn btn-outline"
        >
          ⬅️ Anterior
        </button>
        
        <span class="pagination-info">
          Página {{ pagination.currentPage }} de {{ pagination.totalPages }}
          ({{ pagination.totalItems }} rifas)
        </span>
        
        <button 
          @click="goToPage(pagination.currentPage + 1)" 
          :disabled="pagination.currentPage === pagination.totalPages || isLoading"
          class="btn btn-outline"
        >
          Próxima ➡️
        </button>
        <button 
          @click="goToPage(pagination.totalPages)" 
          :disabled="pagination.currentPage === pagination.totalPages || isLoading"
          class="btn btn-outline"
        >
          Última ⏭️
        </button>
      </div>

      <!-- Estado vazio -->
      <div v-else-if="!isLoading && !error && rifasFiltradas.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>{{ temFiltros ? 'Nenhuma rifa encontrada' : 'Nenhuma rifa criada ainda' }}</h3>
        <p v-if="temFiltros">
          Tente ajustar os filtros ou busca para encontrar suas rifas.
        </p>
        <p v-else-if="rifas.length === 0">
          Você ainda não criou nenhuma rifa. Comece criando sua primeira rifa!
        </p>
        <p v-else>
          Nenhuma rifa corresponde aos filtros aplicados.
        </p>
        
        <div class="empty-actions">
          <router-link v-if="rifas.length === 0" to="/rifas/criar" class="btn btn-primary">
            ➕ Criar Primeira Rifa
          </router-link>
          <div v-else class="filter-actions">
            <button @click="limparFiltros" class="btn btn-outline">
              🗑️ Limpar Filtros
            </button>
            <router-link to="/rifas/criar" class="btn btn-primary">
              ➕ Nova Rifa
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ NOVO: Modal de Confirmação para Ativar Rifa -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-icon success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
            </svg>
          </div>
          <div class="modal-title">
            <h3>Ativar Rifa</h3>
            <p>Você está prestes a ativar esta rifa</p>
          </div>
          <button @click="closeConfirmModal" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="confirmation-details">
            <div class="rifa-preview">
              <div class="rifa-preview-info">
                <h4>{{ rifaParaAtivar?.title }}</h4>
                <div class="rifa-stats-small">
                  <span class="stat-item">
                    <strong>{{ rifaParaAtivar?.totalTickets || 0 }}</strong> números
                  </span>
                  <span class="stat-item">
                    <strong>{{ formatCurrency(rifaParaAtivar?.ticketPrice || 0) }}</strong> cada
                  </span>
                  <span class="stat-item">
                    <strong>{{ formatCurrency(calculateTotalPrize(rifaParaAtivar || {})) }}</strong> total
                  </span>
                </div>
              </div>
            </div>

            <div class="confirmation-checklist">
              <div class="checklist-item">
                <div :class="['check-icon', (rifaParaAtivar?.totalTickets > 0) ? 'valid' : 'invalid']">
                  <svg v-if="rifaParaAtivar?.totalTickets > 0" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </div>
                <span>Quantidade de números configurada</span>
              </div>

              <div class="checklist-item">
                <div :class="['check-icon', (rifaParaAtivar?.ticketPrice > 0) ? 'valid' : 'invalid']">
                  <svg v-if="rifaParaAtivar?.ticketPrice > 0" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </div>
                <span>Preço por número definido</span>
              </div>
            </div>

            <div class="activation-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-content">
                <strong>Atenção!</strong>
                <p>Após ativar, a rifa ficará disponível para vendas imediatamente. Certifique-se de que todas as informações estão corretas.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeConfirmModal" class="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
            Cancelar
          </button>
          <button 
            @click="confirmarAtivacao" 
            class="btn btn-success"
            :disabled="isUpdatingStatus || !podeAtivarRifa"
          >
            <svg v-if="!isUpdatingStatus" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
            <div v-else class="loading-spinner-small"></div>
            {{ isUpdatingStatus ? 'Ativando...' : 'Ativar Rifa' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ NOVO: Modal de Erro -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-container error-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
            </svg>
          </div>
          <div class="modal-title">
            <h3>Não foi possível ativar a rifa</h3>
            <p>Corrija os problemas abaixo antes de ativar</p>
          </div>
          <button @click="closeErrorModal" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="error-details">
            <!-- ✅ NOVO: Erro principal em destaque -->
            <div class="error-highlight">
              <div class="error-icon-main">⚠️</div>
              <div class="error-content-main">
                <h4>{{ errorModalData.title }}</h4>
                <p class="error-message-main">{{ errorModalData.message }}</p>
              </div>
            </div>

            <!-- ✅ MELHORADO: Detalhes técnicos mais visíveis -->
            <div v-if="errorModalData.technicalInfo" class="technical-error-card">
              <div class="technical-header">
                <div class="technical-icon">🔍</div>
                <h5>Detalhes do Erro</h5>
              </div>
              <div class="technical-content">
                <div class="error-code">{{ errorModalData.technicalInfo }}</div>
              </div>
            </div>

            <!-- ✅ Sugestões de solução -->
            <div v-if="errorModalData.suggestions?.length" class="error-solutions">
              <div class="solutions-header">
                <div class="solutions-icon">💡</div>
                <h5>Como resolver</h5>
              </div>
              <ul class="solutions-list">
                <li v-for="(suggestion, index) in errorModalData.suggestions" :key="index">
                  <span class="solution-number">{{ index + 1 }}</span>
                  <span class="solution-text">{{ suggestion }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeErrorModal" class="btn btn-outline">
            Fechar
          </button>
          <button 
            v-if="errorModalData.actionButton"
            @click="errorModalData.actionButton.action" 
            :class="['btn', errorModalData.actionButton.type]"
          >
            {{ errorModalData.actionButton.text }}
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
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = useRouter()
const { showMessage } = useMessage()
const authStore = useAuthStore()

const rifas = ref([])
const isLoading = ref(true)
const isUpdatingStatus = ref(false)
const error = ref('')
const filtroStatus = ref('')
const termoBusca = ref('')
const ordenacao = ref('createdAt')
const ordemDirecao = ref('desc')

// ✅ ADICIONAR variáveis para os modais que estavam faltando
const showConfirmModal = ref(false)
const showErrorModal = ref(false)
const showTechnicalDetails = ref(false)
const rifaParaAtivar = ref(null)
const errorModalData = ref({
  title: '',
  message: '',
  suggestions: [],
  technicalInfo: '',
  actionButton: null
})

// Paginação
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
  hasNext: false,
  hasPrev: false
})

// Debounce para busca
let searchTimeout = null

// ✅ ADICIONAR computed para validação
const podeAtivarRifa = computed(() => {
  if (!rifaParaAtivar.value) return false
  return (rifaParaAtivar.value.totalTickets > 0) && (rifaParaAtivar.value.ticketPrice > 0)
})

const rifasFiltradas = computed(() => {
  let resultado = [...rifas.value]

  if (termoBusca.value?.trim()) {
    const termo = termoBusca.value.toLowerCase().trim()
    resultado = resultado.filter(rifa => {
      const title = (rifa.title || '').toLowerCase()
      const description = (rifa.description || '').toLowerCase()
      return title.includes(termo) || description.includes(termo)
    })
  }

  return resultado
})

const temFiltros = computed(() => {
  return !!(filtroStatus.value || termoBusca.value?.trim())
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Não definida'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getStatusText = (status) => {
  const statusMap = {
    active: 'Ativa',
    pending: 'Pendente',
    paused: 'Pausada',
    finished: 'Finalizada',
    cancelled: 'Cancelada',
    draft: 'Rascunho'
  }
  return statusMap[status] || status
}

const calculateTotalPrize = (rifa) => {
  return (rifa.ticketPrice || 0) * (rifa.totalTickets || 0)
}

const limparFiltros = () => {
  filtroStatus.value = ''
  termoBusca.value = ''
  aplicarFiltros()
}

const gerenciarRifa = (id) => {
  router.push(`/rifas/${id}/gerenciar`)
}

const pausarRifa = async (id) => {
  try {
    isUpdatingStatus.value = true
    await rifasAPI.updateStatus(id, 'paused')
    showMessage('Rifa pausada com sucesso!', 'success')
    await carregarRifas(pagination.value.currentPage)
  } catch (error) {
    console.error('Erro ao pausar rifa:', error)
    showMessage('Erro ao pausar rifa: ' + error.message, 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

// ✅ FUNÇÃO para ativar rifa (já existe no código, mantendo)
const ativarRifa = async (id) => {
  // Encontrar a rifa
  const rifa = rifas.value.find(r => r.id === id)
  if (!rifa) {
    showErrorModal.value = true
    errorModalData.value = {
      title: 'Rifa não encontrada',
      message: 'Não foi possível encontrar os dados da rifa selecionada.',
      suggestions: ['Recarregue a página e tente novamente'],
      technicalInfo: `Rifa ID: ${id}`,
      actionButton: {
        text: 'Recarregar Página',
        type: 'btn-primary',
        action: () => window.location.reload()
      }
    }
    return
  }

  // Definir rifa para ativar e mostrar modal de confirmação
  rifaParaAtivar.value = rifa
  showConfirmModal.value = true
}

// ✅ FUNÇÃO de confirmação (já existe no código, mantendo)
const confirmarAtivacao = async () => {
  if (!rifaParaAtivar.value || !podeAtivarRifa.value) return

  try {
    isUpdatingStatus.value = true
    
    console.log('🔄 Ativando rifa:', rifaParaAtivar.value.id)
    
    const response = await rifasAPI.updateStatus(rifaParaAtivar.value.id, 'active')
    
    console.log('✅ Status atualizado:', response.data)
    
    // Atualizar o status localmente na lista
    const rifaIndex = rifas.value.findIndex(r => r.id === rifaParaAtivar.value.id)
    if (rifaIndex !== -1) {
      rifas.value[rifaIndex].status = 'active'
    }
    
    // Fechar modal e mostrar sucesso
    closeConfirmModal()
    showMessage('🚀 Rifa ativada com sucesso! Agora está disponível para vendas.', 'success')
    
  } catch (error) {
    console.error('💥 Erro ao ativar rifa:', error)
    
    // Fechar modal de confirmação
    closeConfirmModal()
    
    // Processar erro e mostrar modal de erro
    processarErroAtivacao(error)
    
  } finally {
    isUpdatingStatus.value = false
  }
}

// ✅ FUNÇÃO para processar erros (já existe no código, mantendo)
const processarErroAtivacao = (error) => {
  let errorInfo = {
    title: 'Erro ao ativar rifa',
    message: 'Ocorreu um erro inesperado ao tentar ativar a rifa.',
    suggestions: [],
    technicalInfo: '',
    actionButton: null
  }

  if (error.response?.data) {
    const errorData = error.response.data
    
    // Mapear erros específicos da API
    if (errorData.message) {
      const message = errorData.message.toLowerCase()
      
      if (message.includes('data de fim') || message.includes('sorteio') || message.includes('drawdate')) {
        errorInfo = {
          title: 'Data de sorteio não definida',
          message: 'A rifa precisa ter uma data de término ou sorteio definida antes de ser ativada.',
          suggestions: [
            'Acesse as configurações da rifa',
            'Defina uma data de encerramento',
            'Salve as alterações e tente ativar novamente'
          ],
          technicalInfo: errorData.message,
          actionButton: {
            text: 'Editar Rifa',
            type: 'btn-primary',
            action: () => {
              closeErrorModal()
              router.push(`/rifas/${rifaParaAtivar.value.id}`)
            }
          }
        }
      } else if (message.includes('números') || message.includes('tickets')) {
        errorInfo = {
          title: 'Configuração de números incompleta',
          message: 'A quantidade de números da rifa não está configurada corretamente.',
          suggestions: [
            'Verifique se a quantidade total de números foi definida',
            'Confirme se o valor é maior que zero',
            'Edite a rifa e corrija as configurações'
          ],
          technicalInfo: errorData.message,
          actionButton: {
            text: 'Editar Rifa',
            type: 'btn-primary',
            action: () => {
              closeErrorModal()
              router.push(`/rifas/${rifaParaAtivar.value.id}`)
            }
          }
        }
      } else if (message.includes('preço') || message.includes('price') || message.includes('valor')) {
        errorInfo = {
          title: 'Preço não definido',
          message: 'O preço por número da rifa não foi definido ou é inválido.',
          suggestions: [
            'Defina um preço válido para cada número',
            'Certifique-se de que o valor é maior que R$ 0,00',
            'Salve as alterações antes de ativar'
          ],
          technicalInfo: errorData.message,
          actionButton: {
            text: 'Editar Rifa',
            type: 'btn-primary',
            action: () => {
              closeErrorModal()
              router.push(`/rifas/${rifaParaAtivar.value.id}`)
            }
          }
        }
      } else if (message.includes('permissão') || message.includes('permission')) {
        errorInfo = {
          title: 'Sem permissão',
          message: 'Você não tem permissão para ativar esta rifa.',
          suggestions: [
            'Verifique se você é o proprietário da rifa',
            'Entre em contato com o suporte se o problema persistir'
          ],
          technicalInfo: errorData.message,
          actionButton: null
        }
      } else {
        // Erro genérico da API
        errorInfo.message = errorData.message
        errorInfo.technicalInfo = JSON.stringify(errorData, null, 2)
        errorInfo.suggestions = [
          'Verifique se todas as configurações da rifa estão corretas',
          'Tente novamente em alguns momentos',
          'Entre em contato com o suporte se o problema persistir'
        ]
      }
    }
  } else if (error.response?.status) {
    // Erros HTTP específicos
    switch (error.response.status) {
      case 400:
        errorInfo.title = 'Dados inválidos'
        errorInfo.message = 'Os dados da rifa contêm informações inválidas.'
        break
      case 403:
        errorInfo.title = 'Acesso negado'
        errorInfo.message = 'Você não tem permissão para ativar esta rifa.'
        break
      case 404:
        errorInfo.title = 'Rifa não encontrada'
        errorInfo.message = 'A rifa não foi encontrada no servidor.'
        break
      case 500:
        errorInfo.title = 'Erro do servidor'
        errorInfo.message = 'Ocorreu um erro interno no servidor.'
        errorInfo.suggestions = [
          'Tente novamente em alguns minutos',
          'Entre em contato com o suporte se o problema persistir'
        ]
        break
    }
    errorInfo.technicalInfo = `HTTP ${error.response.status}: ${error.response.statusText}`
  } else {
    // Erro de rede ou conexão
    errorInfo.title = 'Erro de conexão'
    errorInfo.message = 'Não foi possível conectar com o servidor.'
    errorInfo.suggestions = [
      'Verifique sua conexão com a internet',
      'Tente novamente em alguns momentos',
      'Recarregue a página se necessário'
    ]
    errorInfo.technicalInfo = error.message
    errorInfo.actionButton = {
      text: 'Tentar Novamente',
      type: 'btn-primary', 
      action: () => {
        closeErrorModal()
        ativarRifa(rifaParaAtivar.value.id)
      }
    }
  }

  errorModalData.value = errorInfo
  showErrorModal.value = true
}

// ✅ FUNÇÕES para fechar modais
const closeConfirmModal = () => {
  showConfirmModal.value = false
  rifaParaAtivar.value = null
  isUpdatingStatus.value = false
}

const closeErrorModal = () => {
  showErrorModal.value = false
  showTechnicalDetails.value = false
  errorModalData.value = {
    title: '',
    message: '',
    suggestions: [],
    technicalInfo: '',
    actionButton: null
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    aplicarFiltros()
  }, 500)
}

const aplicarFiltros = () => {
  carregarRifas(1)
}

const handleRefresh = () => {
  carregarRifas(pagination.value.currentPage)
}

const goToPage = (pageNumber) => {
  const page = typeof pageNumber === 'number' ? pageNumber : parseInt(pageNumber) || 1
  carregarRifas(page)
}

// ✅ MANTER função carregarRifas inalterada
const carregarRifas = async (page = 1) => {
  try {
    const pageNumber = typeof page === 'number' ? page : parseInt(page) || 1
    
    console.log('🎯 Carregando rifas - Página:', pageNumber)
    console.log('🔐 Usuário autenticado:', authStore.isAuthenticated)
    console.log('🎫 Token presente:', !!authStore.token)
    
    isLoading.value = true
    error.value = ''
    
    if (!authStore.isAuthenticated) {
      console.warn('⚠️ Usuário não autenticado')
      error.value = 'Usuário não autenticado'
      router.push('/login')
      return
    }
    
    const params = {
      page: pageNumber,
      limit: pagination.value.limit,
      sort: ordenacao.value,
      order: ordemDirecao.value
    }
    
    if (filtroStatus.value) {
      params.status = filtroStatus.value
    }
    
    console.log('📋 Parâmetros da requisição:', params)
    
    const response = await rifasAPI.listMyRaffles(params)
    
    console.log('📥 Resposta completa da API:', response.data)
    
    if (response && response.data) {
      if (response.data.success === true) {
        console.log('✅ Resposta com success=true')
        rifas.value = response.data.data || []
        
        if (response.data.pagination) {
          pagination.value = {
            currentPage: response.data.pagination.currentPage || pageNumber,
            totalPages: response.data.pagination.totalPages || 1,
            totalItems: response.data.pagination.totalItems || 0,
            limit: response.data.pagination.limit || pagination.value.limit,
            hasNext: response.data.pagination.hasNext || false,
            hasPrev: response.data.pagination.hasPrev || false
          }
        } else {
          pagination.value.currentPage = pageNumber
          pagination.value.totalItems = rifas.value.length
          pagination.value.totalPages = Math.ceil(rifas.value.length / pagination.value.limit) || 1
          pagination.value.hasNext = false
          pagination.value.hasPrev = false
        }
        
        console.log('✅ Rifas carregadas com sucesso:', {
          total: rifas.value.length,
          pagina: pagination.value.currentPage,
          totalPaginas: pagination.value.totalPages,
          totalItens: pagination.value.totalItems
        })
        
        error.value = ''
        
      } else if (response.data.success === false) {
        console.error('❌ Resposta da API com success=false:', response.data)
        error.value = response.data.message || 'Erro ao carregar rifas'
        rifas.value = []
      } else if (Array.isArray(response.data.data) || Array.isArray(response.data)) {
        console.log('✅ Resposta sem campo success mas com dados válidos')
        rifas.value = response.data.data || response.data || []
        
        pagination.value.currentPage = pageNumber
        pagination.value.totalItems = rifas.value.length
        pagination.value.totalPages = Math.ceil(rifas.value.length / pagination.value.limit) || 1
        pagination.value.hasNext = false
        pagination.value.hasPrev = false
        
        error.value = ''
      } else {
        console.error('❌ Estrutura de resposta não reconhecida:', response.data)
        error.value = 'Formato de resposta inesperado da API'
        rifas.value = []
      }
    } else {
      console.error('❌ Resposta vazia ou inválida')
      error.value = 'Resposta inválida do servidor'
      rifas.value = []
    }
    
  } catch (err) {
    console.error('💥 Erro ao carregar rifas:', err)
    error.value = err.message || 'Erro ao carregar rifas'
    rifas.value = []
    
    if (err.response?.status === 401) {
      console.warn('🔐 Token inválido, redirecionando para login')
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  console.log('🚀 MinhasRifas: Componente montado')
  
  if (authStore.isLoading) {
    console.log('⏳ Aguardando verificação de autenticação...')
    await new Promise(resolve => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.isLoading) {
          unwatch()
          resolve()
        }
      })
    })
  }
  
  await carregarRifas()
})

const getRifaImageUrl = (rifa) => {
  if (rifa.image) {
    return rifa.image
  }
  
  if (rifa.campaignImages && rifa.campaignImages.length > 0) {
    return rifa.campaignImages[0].url || rifa.campaignImages[0]
  }
  
  return null
}

const handleImageError = (event) => {
  console.warn('Erro ao carregar imagem da rifa:', event.target.src)
  
  event.target.style.display = 'none'
  
  const fallbackPlaceholder = event.target.parentElement.querySelector('.fallback-placeholder')
  if (fallbackPlaceholder) {
    fallbackPlaceholder.style.display = 'flex'
  }
}
</script>

<style scoped>
/* ===== LAYOUT PRINCIPAL ===== */
.minhas-rifas {
  width: 100%;
}

/* ===== HEADER ===== */
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

/* ===== BOTÕES ===== */
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

.btn-outline {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-outline:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
  transform: translateY(-1px);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

/* ===== FILTROS ===== */
.filters-section {
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.filters select,
.search-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
}

.filters select:focus,
.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input {
  min-width: 250px;
  flex: 1;
}

/* ===== ESTADOS DE CARREGAMENTO E ERRO ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: #64748b;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
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

/* ===== GRID DE RIFAS ===== */
.rifas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

/* ✅ CORRIGIDO: Card com altura consistente */
.rifa-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 500px; /* Altura mínima consistente */
}

.rifa-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border-color: #e5e7eb;
}

/* ===== IMAGEM DA RIFA ===== */
.rifa-image {
  position: relative;
  height: 200px; /* Altura fixa para todas as imagens */
  width: 100%;
  overflow: hidden;
  flex-shrink: 0; /* Não permite que a imagem encolha */
}

.rifa-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.rifa-image-real {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
}

.rifa-card:hover .rifa-image-real {
  transform: scale(1.05);
}

.image-placeholder,
.fallback-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  text-align: center;
  padding: 1rem;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.7;
}

.placeholder-text {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: center;
}

/* ===== STATUS BADGE ===== */
.rifa-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-badge.active {
  background: rgba(220, 252, 231, 0.9);
  color: #166534;
}

.status-badge.pending {
  background: rgba(255, 248, 220, 0.9);
  color: #b45309;
}

.status-badge.paused {
  background: rgba(254, 243, 199, 0.9);
  color: #92400e;
}

.status-badge.finished {
  background: rgba(219, 234, 254, 0.9);
  color: #1e40af;
}

.status-badge.cancelled {
  background: rgba(254, 226, 226, 0.9);
  color: #dc2626;
}

.status-badge.draft {
  background: rgba(243, 244, 246, 0.9);
  color: #4b5563;
}

/* ===== CONTEÚDO DA RIFA ===== */
.rifa-content {
  padding: 1.5rem;
  flex: 1; /* Permite que o conteúdo expanda */
  display: flex;
  flex-direction: column;
}

.rifa-content h3 {
  color: #1a1d29;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.3;
}

.rifa-premio {
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

/* ===== ESTATÍSTICAS ===== */
.rifa-stats {
  margin-bottom: 1rem;
  flex: 1; /* Permite que as stats expandam */
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  align-items: center;
}

.stat .label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat .value {
  font-weight: 600;
  color: #1a1d29;
  font-size: 0.9rem;
}

.stat .value.success {
  color: #059669;
  font-weight: 700;
}

/* ===== PROGRESSO ===== */
.progress-bar {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.6s ease;
  border-radius: 4px;
}

/* ===== AÇÕES DA RIFA ===== */
.rifa-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: auto; /* Empurra as ações para o fundo */
}

.rifa-actions .btn {
  flex: 1;
  min-width: 100px;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
}

/* ===== PAGINAÇÃO ===== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
}

.pagination-info {
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;
}

/* ===== ESTADO VAZIO ===== */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.empty-state h3 {
  color: #1a1d29;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

/* ===== MODAIS ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(8px);
  animation: overlayFadeIn 0.2s ease;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-container.error-modal {
  max-width: 520px;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== HEADER REFINADO ===== */
.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0;
  position: relative;
}

.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-icon.error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.modal-icon.success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  border: 1px solid #22c55e;
}

.modal-title {
  flex: 1;
}

.modal-title h3 {
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
}

.modal-title p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  font-weight: 500;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 28px;
  height: 28px;
  border: none;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.2s ease;
  font-size: 14px;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* ===== CORPO REFINADO ===== */
.modal-body {
  padding: 1rem 1.5rem 1.5rem;
}

/* ===== ERRO PRINCIPAL MAIS DELICADO ===== */
.error-highlight {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fca5a5;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
}

.error-icon-main {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content-main {
  flex: 1;
  min-width: 0;
}

.error-content-main h4 {
  color: #dc2626;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.error-message-main {
  color: #b91c1c;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}

/* ===== DETALHES TÉCNICOS REFINADOS ===== */
.technical-error-card {
  background: white; /* ✅ MUDADO: de #1e293b para white */
  border: 1px solid #e11d48;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.15);
}

.technical-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #e11d48 0%, #be185d 100%);
  color: white;
}

.technical-icon {
  font-size: 1rem;
}

.technical-header h5 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.technical-content {
  padding: 1rem;
  background: white; /* ✅ ADICIONADO: garantir fundo branco */
}

.error-code {
  background: #f8f9fa; /* ✅ MUDADO: de #0f172a para cinza claro */
  color: #dc2626; /* ✅ MUDADO: de #ef4444 para vermelho mais escuro */
  padding: 1rem;
  border-radius: 6px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.85rem; /* ✅ AUMENTADO: de 0.8rem para 0.85rem */
  font-weight: 600; /* ✅ MUDADO: de 500 para 600 (mais negrito) */
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #e5e7eb; /* ✅ MUDADO: de #334155 para cinza claro */
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05); /* ✅ MUDADO: sombra mais sutil */
  letter-spacing: 0.25px;
}

/* ===== SOLUÇÕES REFINADAS ===== */
.error-solutions {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #0ea5e9;
  border-radius: 10px;
  overflow: hidden;
}

.solutions-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
}

.solutions-icon {
  font-size: 1rem;
}

.solutions-header h5 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.solutions-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.solutions-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #bae6fd;
  transition: background 0.15s ease;
}

.solutions-list li:last-child {
  border-bottom: none;
}

.solutions-list li:hover {
  background: rgba(14, 165, 233, 0.08);
}

.solution-number {
  background: #0ea5e9;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.7rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.solution-text {
  color: #075985;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.4;
  flex: 1;
}

/* ===== FOOTER DO MODAL MELHORADO ===== */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  margin:  0;
}

.modal-footer .btn {
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.modal-footer .btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.modal-footer .btn:hover::before {
  left: 100%;
}

.modal-footer .btn-outline {
  background: white;
  color: #6b7280;
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modal-footer .btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.modal-footer .btn-success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  border: none;
  position: relative;
}

.modal-footer .btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.modal-footer .btn-success:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
}

.modal-footer .btn-success:active {
  transform: translateY(-1px);
}

/* ===== ÍCONES DOS BOTÕES ===== */
.modal-footer .btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.modal-footer .btn:hover svg {
  transform: scale(1.1);
}

/* ===== ANIMAÇÕES MELHORADAS ===== */
.modal-container {
  animation: modalConfirmEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalConfirmEnter {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-10px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== MICRO-INTERAÇÕES ===== */
.rifa-preview {
  transition: all 0.3s ease;
}

.modal-container:hover .rifa-preview {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ===== MELHORIAS VISUAIS ===== */
.modal-header {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
  margin: 0;
  padding: 1.5rem;
  border-radius: 16px 16px 0 0;
}

.modal-body {
  padding: 1.5rem;
  background: white;
}

/* ===== ESTADOS DE LOADING ===== */
.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ===== RESPONSIVIDADE MELHORADA ===== */
@media (max-width: 640px) {
  .modal-container {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
    border-radius: 12px;
  }

  .rifa-stats-small {
    gap: 0.75rem;
  }
  
  .stat-item {
    font-size: 0.8rem;
    padding: 0.5rem 0;
  }
  
  .modal-footer {
    padding: 1.25rem;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modal-footer .btn {
    width: 100%;
    min-width: auto;
    justify-content: center;
  }
  
  .activation-warning {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .checklist-item {
    padding: 0.75rem;
  }
  
  .checklist-item span {
    font-size: 0.85rem;
  }

  .confirmation-details {
    gap: 1rem;
  }

  .rifa-preview {
    padding: 1rem;
  }

  .rifa-preview-info h4 {
    font-size: 1rem;
  }
}

/* ===== ESTADOS DE FOCUS MELHORADOS ===== */
.modal-footer .btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.modal-close:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ===== TIPOGRAFIA MELHORADA ===== */
.modal-title h3 {
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
}

.modal-title p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  font-weight: 500;
}

/* ===== SOMBRAS E PROFUNDIDADE ===== */
.modal-container {
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 0 100px rgba(34, 197, 94, 0.1);
}

/* ===== EFEITOS DE BRILHO ===== */
.btn-success {
  position: relative;
  overflow: hidden;
}

.btn-success::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  transition: all 0.6s ease;
  opacity: 0;
}

.btn-success:hover::after {
  opacity: 1;
  transform: rotate(45deg) translate(50%, 50%);
}

/* ===== MODAL DE CONFIRMAÇÃO MELHORADO ===== */
.modal-icon.success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  border: 1px solid #22c55e;
}

/* ===== DETALHES DE CONFIRMAÇÃO REFINADOS ===== */
.confirmation-details {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.rifa-preview {
  background: linear-gradient(135deg, #f8faff 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.rifa-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmerConfirm 2s infinite;
  pointer-events: none;
}

@keyframes shimmerConfirm {
  0% { left: -100%; }
  100% { left: 100%; }
}

.rifa-preview-info h4 {
  color: #1e293b;
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
}

.rifa-stats-small {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #475569;
  font-size: 0.875rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.stat-item:last-child {
  border-bottom: 2px solid #0ea5e9;
  font-weight: 600;
  color: #0369a1;
}

.stat-item strong {
  color: #1e293b;
  font-weight: 700;
}

/* ===== CHECKLIST REFINADO ===== */
.confirmation-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.checklist-item:hover {
  background: #f8fafc;
  border-color: #22c55e;
  transform: translateX(2px);
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid;
  transition: all 0.2s ease;
}

.check-icon.valid {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  border-color: #22c55e;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.check-icon.invalid {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.checklist-item:hover .check-icon {
  transform: scale(1.1);
}

.checklist-item span {
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
}

/* ===== AVISO DE ATIVAÇÃO REFINADO ===== */
.activation-warning {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fbbf24;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
  position: relative;
  overflow: hidden;
}

.activation-warning::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  animation: warningPulse 2s infinite;
}

@keyframes warningPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.warning-content {
  flex: 1;
}

.warning-content strong {
  color: #92400e;
  font-size: 0.95rem;
  font-weight: 700;
  display: block;
  margin-bottom: 0.5rem;
}

.warning-content p {
  color: #92400e;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 500;
}

/* ===== FOOTER DO MODAL MELHORADO ===== */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  margin:  0;
}

.modal-footer .btn {
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.modal-footer .btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.modal-footer .btn:hover::before {
  left: 100%;
}

.modal-footer .btn-outline {
  background: white;
  color: #6b7280;
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modal-footer .btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.modal-footer .btn-success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  border: none;
  position: relative;
}

.modal-footer .btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.modal-footer .btn-success:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);
}

.modal-footer .btn-success:active {
  transform: translateY(-1px);
}

/* ===== ÍCONES DOS BOTÕES ===== */
.modal-footer .btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.modal-footer .btn:hover svg {
  transform: scale(1.1);
}

/* ===== ANIMAÇÕES MELHORADAS ===== */
.modal-container {
  animation: modalConfirmEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalConfirmEnter {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-10px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== MICRO-INTERAÇÕES ===== */
.rifa-preview {
  transition: all 0.3s ease;
}

.modal-container:hover .rifa-preview {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ===== MELHORIAS VISUAIS ===== */
.modal-header {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
  margin: 0;
  padding: 1.5rem;
  border-radius: 16px 16px 0 0;
}

.modal-body {
  padding: 1.5rem;
  background: white;
}

/* ===== ESTADOS DE LOADING ===== */
.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* ===== RESPONSIVIDADE MELHORADA ===== */
@media (max-width: 640px) {
  .modal-container {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
    border-radius: 12px;
  }

  .rifa-stats-small {
    gap: 0.75rem;
  }
  
  .stat-item {
    font-size: 0.8rem;
    padding: 0.5rem 0;
  }
  
  .modal-footer {
    padding: 1.25rem;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modal-footer .btn {
    width: 100%;
    min-width: auto;
    justify-content: center;
  }
  
  .activation-warning {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .checklist-item {
    padding: 0.75rem;
  }
  
  .checklist-item span {
    font-size: 0.85rem;
  }

  .confirmation-details {
    gap: 1rem;
  }

  .rifa-preview {
    padding: 1rem;
  }

  .rifa-preview-info h4 {
    font-size: 1rem;
  }
}

/* ===== ESTADOS DE FOCUS MELHORADOS ===== */
.modal-footer .btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.modal-close:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ===== TIPOGRAFIA MELHORADA ===== */
.modal-title h3 {
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
}

.modal-title p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  font-weight: 500;
}

/* ===== SOMBRAS E PROFUNDIDADE ===== */
.modal-container {
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 0 100px rgba(34, 197, 94, 0.1);
}

/* ===== EFEITOS DE BRILHO ===== */
.btn-success {
  position: relative;
  overflow: hidden;
}

.btn-success::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  transition: all 0.6s ease;
  opacity: 0;
}

.btn-success:hover::after {
  opacity: 1;
  transform: rotate(45deg) translate(50%, 50%);
}
</style>