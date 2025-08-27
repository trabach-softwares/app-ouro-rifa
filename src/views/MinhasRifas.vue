<!-- filepath: src/views/MinhasRifas.vue -->
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

        <!-- ✅ ADICIONADO: Debug info (remover em produção) -->
        <div v-if="false" class="debug-info" style="margin-top: 1rem; padding: 1rem; background: #f0f0f0; border-radius: 8px; font-size: 0.8rem;">
          <strong>Debug:</strong><br>
          - isLoading: {{ isLoading }}<br>
          - error: {{ error }}<br>
          - rifas.length: {{ rifas.length }}<br>
          - rifasFiltradas.length: {{ rifasFiltradas.length }}<br>
          - temFiltros: {{ temFiltros }}<br>
          - Condição empty-state: {{ !isLoading && !error && rifasFiltradas.length === 0 }}
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading">
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

      <!-- ✅ CORRIGIDO: Lista de rifas com condição mais específica -->
      <div v-else-if="!isLoading && !error && rifasFiltradas.length > 0" class="rifas-grid">
        <div 
          v-for="rifa in rifasFiltradas" 
          :key="rifa.id"
          class="rifa-card"
        >
          <div class="rifa-image">
            <!-- ✅ Placeholder CSS em vez de imagem -->
            <div class="image-placeholder">
              <div class="placeholder-icon">🎯</div>
              <div class="placeholder-text">{{ rifa.title }}</div>
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
              <button 
                @click="gerenciarRifa(rifa.id)"
                class="btn btn-outline"
              >
                📊 Gerenciar
              </button>
              <button 
                @click="editarRifa(rifa.id)"
                class="btn btn-secondary"
              >
                ✏️ Editar
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
              <button 
                v-if="rifa.status === 'pending'"
                @click="aprovarRifa(rifa.id)"
                class="btn btn-success"
                :disabled="isUpdatingStatus"
              >
                ✅ Aprovar
              </button>
              <button 
                @click="confirmarExclusao(rifa)"
                class="btn btn-danger"
                :disabled="isUpdatingStatus"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ✅ CORRIGIDO: Paginação aparece apenas quando há rifas -->
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

      <!-- ✅ CORRIGIDO: Estado vazio só aparece quando realmente não há rifas -->
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
        
        <!-- Ações contextuais -->
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

      <!-- Modal de confirmação -->
      <div v-if="showConfirmModal" class="modal-overlay" @click="cancelarExclusao">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Confirmar Exclusão</h3>
            <button @click="cancelarExclusao" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <p>Tem certeza que deseja excluir a rifa <strong>"{{ rifaParaExcluir?.title }}"</strong>?</p>
            <p class="warning">Esta ação não pode ser desfeita.</p>
          </div>
          <div class="modal-footer">
            <button @click="cancelarExclusao" class="btn btn-outline">Cancelar</button>
            <button @click="excluirRifa" class="btn btn-danger" :disabled="isUpdatingStatus">
              {{ isUpdatingStatus ? 'Excluindo...' : 'Excluir' }}
            </button>
          </div>
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

// Paginação
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
  hasNext: false,
  hasPrev: false
})

// Modal de confirmação
const showConfirmModal = ref(false)
const rifaParaExcluir = ref(null)

// Debounce para busca
let searchTimeout = null

// ✅ CORRIGIDO: Computed mais robusto para filtros
const rifasFiltradas = computed(() => {
  let resultado = [...rifas.value]

  // Filtrar por busca local (após filtro da API)
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

// ✅ NOVA FUNÇÃO: Limpar todos os filtros
const limparFiltros = () => {
  filtroStatus.value = ''
  termoBusca.value = ''
  aplicarFiltros()
}

const gerenciarRifa = (id) => {
  router.push(`/rifas/${id}/gerenciar`)
}

const editarRifa = (id) => {
  router.push(`/rifas/${id}/editar`)
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

const ativarRifa = async (id) => {
  try {
    isUpdatingStatus.value = true
    await rifasAPI.updateStatus(id, 'active')
    showMessage('Rifa ativada com sucesso!', 'success')
    await carregarRifas(pagination.value.currentPage)
  } catch (error) {
    console.error('Erro ao ativar rifa:', error)
    showMessage('Erro ao ativar rifa: ' + error.message, 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

const aprovarRifa = async (id) => {
  try {
    isUpdatingStatus.value = true
    await rifasAPI.updateStatus(id, 'active')
    showMessage('Rifa aprovada com sucesso!', 'success')
    await carregarRifas(pagination.value.currentPage)
  } catch (error) {
    console.error('Erro ao aprovar rifa:', error)
    showMessage('Erro ao aprovar rifa: ' + error.message, 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

const confirmarExclusao = (rifa) => {
  rifaParaExcluir.value = rifa
  showConfirmModal.value = true
}

const cancelarExclusao = () => {
  rifaParaExcluir.value = null
  showConfirmModal.value = false
}

const excluirRifa = async () => {
  if (!rifaParaExcluir.value) return
  
  try {
    isUpdatingStatus.value = true
    await rifasAPI.delete(rifaParaExcluir.value.id)
    showMessage('Rifa excluída com sucesso!', 'success')
    cancelarExclusao()
    await carregarRifas(pagination.value.currentPage)
  } catch (error) {
    console.error('Erro ao excluir rifa:', error)
    showMessage('Erro ao excluir rifa: ' + error.message, 'error')
  } finally {
    isUpdatingStatus.value = false
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

const carregarRifas = async (page = 1) => {
  try {
    const pageNumber = typeof page === 'number' ? page : parseInt(page) || 1
    
    console.log('🎯 Carregando rifas - Página:', pageNumber)
    console.log('🔐 Usuário autenticado:', authStore.isAuthenticated)
    console.log('🎫 Token presente:', !!authStore.token)
    
    isLoading.value = true
    error.value = '' // ✅ CRÍTICO: Limpar erro antes da requisição
    
    // Verificar se o usuário está autenticado
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
    
    // ✅ CORREÇÃO: Fazer requisição e processar corretamente
    const response = await rifasAPI.listMyRaffles(params)
    
    console.log('📥 Resposta completa da API:', response.data)
    
    // ✅ CRITICAL FIX: Verificar mais especificamente a estrutura da resposta
    if (response && response.data) {
      // Se tem success = true na resposta, processar normalmente
      if (response.data.success === true) {
        console.log('✅ Resposta com success=true')
        rifas.value = response.data.data || []
        
        // Atualizar paginação
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
          // Fallback para paginação quando não há dados de paginação
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
        
        // ✅ IMPORTANTE: Garantir que error está limpo em caso de sucesso
        error.value = ''
        
      } 
      // Se success = false na resposta, tratar como erro
      else if (response.data.success === false) {
        console.error('❌ Resposta da API com success=false:', response.data.message)
        error.value = response.data.message || 'Erro ao carregar rifas'
        rifas.value = []
      }
      // ✅ NEW: Se não tem campo success, mas tem dados válidos, assumir sucesso
      else if (Array.isArray(response.data.data) || Array.isArray(response.data)) {
        console.log('✅ Resposta sem campo success mas com dados válidos')
        rifas.value = response.data.data || response.data || []
        
        // Configurar paginação básica
        pagination.value.currentPage = pageNumber
        pagination.value.totalItems = rifas.value.length
        pagination.value.totalPages = Math.ceil(rifas.value.length / pagination.value.limit) || 1
        pagination.value.hasNext = false
        pagination.value.hasPrev = false
        
        error.value = ''
      }
      // Se não conseguiu processar a resposta
      else {
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
    
    // Se for erro 401, redirecionar para login
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
  
  // Aguardar autenticação se ainda estiver carregando
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
</script>

<style scoped>
/* ✅ ADICIONADO: Estilos para as novas ações */
.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

/* ...resto dos estilos permanece igual... */
.minhas-rifas {
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

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

.loading {
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

.rifas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.rifa-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  transition: all 0.3s ease;
}

.rifa-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border-color: #e5e7eb;
}

.rifa-image {
  position: relative;
  height: 220px;
  overflow: hidden;
}

/* ✅ Placeholder CSS para evitar problemas com imagens */
.image-placeholder {
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
}

.rifa-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
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

.rifa-content {
  padding: 1.5rem;
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

.rifa-stats {
  margin-bottom: 1rem;
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

.rifa-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.rifa-actions .btn {
  flex: 1;
  min-width: 100px;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
}

/* Paginação */
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
}

.modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1a1d29;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin-bottom: 1rem;
  color: #374151;
  line-height: 1.6;
}

.modal-body .warning {
  color: #dc3545;
  font-weight: 500;
  margin-bottom: 0;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    padding: 1.5rem;
  }
  
  .header-content h1 {
    font-size: 1.75rem;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .rifas-grid {
    grid-template-columns: 1fr;
  }
  
  .rifa-actions {
    flex-direction: column;
  }
  
  .rifa-actions .btn {
    min-width: auto;
  }
  
  .modal {
    width: 95%;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .empty-actions,
  .filter-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .rifas-grid {
    gap: 1rem;
  }
  
  .rifa-content {
    padding: 1rem;
  }
  
  .filters-section {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
}
</style>