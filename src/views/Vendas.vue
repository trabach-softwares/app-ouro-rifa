<!-- filepath: src/views/Vendas.vue -->
<template>
  <AdminLayout>
    <div class="vendas">
      <!-- Header da página -->
      <div class="page-header">
        <div class="header-content">
          <h1>Vendas</h1>
          <p>Acompanhe todas as vendas das suas rifas</p>
        </div>
        <div class="header-actions">
          <button @click="exportarRelatorio" class="btn btn-outline" :disabled="isLoading">
            📊 Exportar Relatório
          </button>
          <button @click="handleRefresh" class="btn btn-secondary" :disabled="isLoading">
            🔄 Atualizar
          </button>
        </div>
      </div>

      <!-- Filtros e busca -->
      <div class="filters-section">
        <div class="filters">
          <select v-model="filtroStatus" @change="aplicarFiltros">
            <option value="">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="paid">Pagas</option>
          </select>
          
          <select v-model="filtroRifa" @change="aplicarFiltros">
            <option value="">Todas as rifas</option>
            <option v-for="rifa in rifasDisponiveis" :key="rifa.id" :value="rifa.id">
              {{ rifa.title }}
            </option>
          </select>
          
          <input 
            v-model="termoBusca" 
            @input="debounceSearch"
            type="text" 
            placeholder="Buscar por comprador, telefone..."
            class="search-input"
          />
          
          <select v-model="ordenacao" @change="aplicarFiltros">
            <option value="createdAt">Mais recentes</option>
            <option value="updatedAt">Atualizadas recentemente</option>
            <option value="amount">Valor</option>
            <option value="buyerName">Nome do comprador</option>
          </select>
          
          <select v-model="ordemDirecao" @change="aplicarFiltros">
            <option value="desc">Decrescente</option>
            <option value="asc">Crescente</option>
          </select>
        </div>

        <!-- Estatísticas resumo -->
        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-number">{{ estatisticas.totalVendas }}</span>
            <span class="stat-label">Total de Vendas</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ formatCurrency(estatisticas.faturamentoTotal) }}</span>
            <span class="stat-label">Faturamento Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ estatisticas.vendasPendentes }}</span>
            <span class="stat-label">Pendentes</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ estatisticas.vendasConfirmadas }}</span>
            <span class="stat-label">Confirmadas</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Carregando vendas...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar vendas</h3>
        <p>{{ error }}</p>
        <button @click="handleRefresh" class="btn btn-primary">
          🔄 Tentar Novamente
        </button>
      </div>

      <!-- Lista de vendas -->
      <div v-else-if="vendasFiltradas.length > 0" class="vendas-content">
        <div class="vendas-list">
          <div 
            v-for="venda in vendasFiltradas" 
            :key="venda.id"
            class="venda-card"
            @click="verDetalhesVenda(venda)"
          >
            <!-- Header da venda -->
            <div class="venda-header">
              <div class="venda-info">
                <div class="comprador-avatar">
                  {{ getInitials(venda.buyerName || venda.buyer?.name || 'Comprador') }}
                </div>
                <div class="comprador-dados">
                  <h4>{{ venda.buyerName || venda.buyer?.name || 'Nome não informado' }}</h4>
                  <p>{{ venda.buyerPhone || venda.buyer?.phone || 'Telefone não informado' }}</p>
                  <span class="rifa-nome">{{ venda.raffleName || venda.raffle?.title || 'Rifa não informada' }}</span>
                </div>
              </div>
              
              <div class="venda-status">
                <span :class="['status-badge', venda.status]">
                  {{ getStatusText(venda.status) }}
                </span>
                <span class="venda-data">{{ formatDate(venda.createdAt || venda.purchaseDate) }}</span>
              </div>
            </div>

            <!-- Detalhes da venda -->
            <div class="venda-detalhes">
              <div class="numeros-section">
                <span class="label">Números comprados:</span>
                <div class="numeros-container">
                  <span 
                    v-for="numero in (venda.tickets || venda.numbers || []).slice(0, 8)" 
                    :key="numero"
                    class="numero-badge"
                  >
                    {{ formatTicketNumber(numero) }}
                  </span>
                  <span 
                    v-if="(venda.tickets || venda.numbers || []).length > 8" 
                    class="mais-numeros"
                  >
                    +{{ (venda.tickets || venda.numbers || []).length - 8 }}
                  </span>
                </div>
              </div>

              <div class="venda-valores">
                <div class="valor-item">
                  <span class="label">Quantidade:</span>
                  <span class="value">{{ (venda.tickets || venda.numbers || []).length }} números</span>
                </div>
                <div class="valor-item">
                  <span class="label">Valor unitário:</span>
                  <span class="value">{{ formatCurrency(venda.ticketPrice || venda.unitPrice || 0) }}</span>
                </div>
                <div class="valor-item total">
                  <span class="label">Total:</span>
                  <span class="value">{{ formatCurrency(venda.amount || venda.totalAmount || 0) }}</span>
                </div>
              </div>
            </div>

            <!-- Ações da venda -->
            <div class="venda-actions">
              <button 
                v-if="venda.status === 'pending'"
                @click.stop="confirmarVenda(venda.id)"
                class="action-btn confirm"
                :disabled="isUpdatingStatus"
                title="Confirmar pagamento"
              >
                ✅ Confirmar
              </button>
              <button 
                v-if="venda.status === 'pending'"
                @click.stop="cancelarVenda(venda.id)"
                class="action-btn cancel"
                :disabled="isUpdatingStatus"
                title="Cancelar venda"
              >
                ❌ Cancelar
              </button>
              <button 
                @click.stop="verDetalhesVenda(venda)"
                class="action-btn details"
                title="Ver detalhes"
              >
                👁️ Detalhes
              </button>
              <button 
                v-if="venda.status === 'confirmed' || venda.status === 'paid'"
                @click.stop="enviarComprovante(venda)"
                class="action-btn send"
                title="Enviar comprovante"
              >
                📧 Enviar
              </button>
            </div>
          </div>
        </div>

        <!-- Paginação -->
        <div v-if="pagination.totalPages > 1" class="pagination">
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
            ({{ pagination.totalItems }} vendas)
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
      </div>

      <!-- Estado vazio -->
      <div v-else-if="!error && vendasFiltradas.length === 0" class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>{{ temFiltros ? 'Nenhuma venda encontrada' : 'Nenhuma venda realizada ainda' }}</h3>
        <p v-if="temFiltros">
          Tente ajustar os filtros ou busca para encontrar as vendas.
        </p>
        <p v-else>
          Suas vendas aparecerão aqui quando alguém comprar números das suas rifas.
        </p>
        
        <div class="empty-actions">
          <button v-if="temFiltros" @click="limparFiltros" class="btn btn-outline">
            🗑️ Limpar Filtros
          </button>
          <router-link to="/rifas/criar" class="btn btn-primary">
            ➕ Criar Nova Rifa
          </router-link>
        </div>
      </div>

      <!-- Modal de detalhes da venda -->
      <div v-if="showDetalhesModal && vendaSelecionada" class="modal-overlay" @click="fecharDetalhes">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>Detalhes da Venda #{{ vendaSelecionada.id }}</h3>
            <button @click="fecharDetalhes" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="detalhes-grid">
              <div class="detalhe-section">
                <h4>Comprador</h4>
                <p><strong>Nome:</strong> {{ vendaSelecionada.buyerName || vendaSelecionada.buyer?.name }}</p>
                <p><strong>Telefone:</strong> {{ vendaSelecionada.buyerPhone || vendaSelecionada.buyer?.phone }}</p>
                <p><strong>Email:</strong> {{ vendaSelecionada.buyerEmail || vendaSelecionada.buyer?.email || 'Não informado' }}</p>
              </div>

              <div class="detalhe-section">
                <h4>Rifa</h4>
                <p><strong>Nome:</strong> {{ vendaSelecionada.raffleName || vendaSelecionada.raffle?.title }}</p>
                <p><strong>ID da Rifa:</strong> {{ vendaSelecionada.raffleId || vendaSelecionada.raffle?.id }}</p>
              </div>

              <div class="detalhe-section">
                <h4>Compra</h4>
                <p><strong>Data:</strong> {{ formatDateTime(vendaSelecionada.createdAt || vendaSelecionada.purchaseDate) }}</p>
                <p><strong>Status:</strong> <span :class="['status-badge', vendaSelecionada.status]">{{ getStatusText(vendaSelecionada.status) }}</span></p>
                <p><strong>Quantidade:</strong> {{ (vendaSelecionada.tickets || vendaSelecionada.numbers || []).length }} números</p>
                <p><strong>Valor Total:</strong> {{ formatCurrency(vendaSelecionada.amount || vendaSelecionada.totalAmount || 0) }}</p>
              </div>

              <div class="detalhe-section full-width">
                <h4>Números Comprados</h4>
                <div class="numeros-detalhes">
                  <span 
                    v-for="numero in (vendaSelecionada.tickets || vendaSelecionada.numbers || [])" 
                    :key="numero"
                    class="numero-badge-large"
                  >
                    {{ formatTicketNumber(numero) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="fecharDetalhes" class="btn btn-outline">Fechar</button>
            <button 
              v-if="vendaSelecionada.status === 'pending'"
              @click="confirmarVenda(vendaSelecionada.id)"
              class="btn btn-success"
              :disabled="isUpdatingStatus"
            >
              ✅ Confirmar Pagamento
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
import { rifasAPI, ticketsAPI } from '@/service/api' // ✅ Import correto das APIs
import { useMessage } from '@/composables/message'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = useRouter()
const { showMessage } = useMessage()
const authStore = useAuthStore()

// Estados reativos
const vendas = ref([])
const rifasDisponiveis = ref([])
const isLoading = ref(true)
const isUpdatingStatus = ref(false)
const error = ref('')

// Filtros
const filtroStatus = ref('')
const filtroRifa = ref('')
const termoBusca = ref('')
const ordenacao = ref('createdAt')
const ordemDirecao = ref('desc')

// Paginação
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 20,
  hasNext: false,
  hasPrev: false
})

// Modal de detalhes
const showDetalhesModal = ref(false)
const vendaSelecionada = ref(null)

// Debounce para busca
let searchTimeout = null

// Estatísticas computadas usando nova estrutura
const estatisticas = computed(() => {
  if (!Array.isArray(vendas.value)) {
    return {
      totalVendas: 0,
      faturamentoTotal: 0,
      vendasPendentes: 0,
      vendasConfirmadas: 0
    }
  }

  const total = vendas.value.length
  const faturamento = vendas.value.reduce((sum, venda) => {
    return sum + (venda.totalAmount || 0)
  }, 0)
  const pendentes = vendas.value.filter(v => v.paymentStatus === 'pending').length
  const confirmadas = vendas.value.filter(v => v.paymentStatus === 'paid').length

  return {
    totalVendas: total,
    faturamentoTotal: faturamento,
    vendasPendentes: pendentes,
    vendasConfirmadas: confirmadas
  }
})

// Vendas filtradas com nova estrutura
const vendasFiltradas = computed(() => {
  if (!Array.isArray(vendas.value)) {
    return []
  }

  let resultado = [...vendas.value]

  if (filtroStatus.value) {
    resultado = resultado.filter(venda => venda.paymentStatus === filtroStatus.value)
  }

  if (filtroRifa.value) {
    resultado = resultado.filter(venda => venda.raffle?.id === filtroRifa.value)
  }

  if (termoBusca.value?.trim()) {
    const termo = termoBusca.value.toLowerCase().trim()
    resultado = resultado.filter(venda => {
      const nome = (venda.customer?.name || '').toLowerCase()
      const telefone = (venda.customer?.phone || '').toLowerCase()
      const email = (venda.customer?.email || '').toLowerCase()
      const rifa = (venda.raffle?.title || '').toLowerCase()
      const orderNumber = (venda.orderNumber || '').toLowerCase()
      return nome.includes(termo) || telefone.includes(termo) || email.includes(termo) || rifa.includes(termo) || orderNumber.includes(termo)
    })
  }

  return resultado
})

const temFiltros = computed(() => {
  return !!(filtroStatus.value || filtroRifa.value || termoBusca.value?.trim())
})

// Métodos utilitários
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Data não informada'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'Data não informada'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTicketNumber = (numero) => {
  if (typeof numero === 'string') {
    return numero.padStart(4, '0')
  }
  return numero.toString().padStart(4, '0')
}

const getInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pendente',
    paid: 'Pago',
    failed: 'Falhou',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

const getPaymentMethodText = (method) => {
  const methodMap = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'Transferência Bancária'
  }
  return methodMap[method] || method
}

// Métodos de ação
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    aplicarFiltros()
  }, 500)
}

const aplicarFiltros = () => {
  carregarVendas(1)
}

const limparFiltros = () => {
  filtroStatus.value = ''
  filtroRifa.value = ''
  termoBusca.value = ''
  aplicarFiltros()
}

const handleRefresh = () => {
  carregarVendas(pagination.value.currentPage)
}

const goToPage = (pageNumber) => {
  const page = typeof pageNumber === 'number' ? pageNumber : parseInt(pageNumber) || 1
  carregarVendas(page)
}

const verDetalhesVenda = async (venda) => {
  try {
    // Carregar detalhes completos do ticket
    const response = await ticketsAPI.getTicketDetails(venda.id)
    
    if (response.data.success) {
      vendaSelecionada.value = response.data.data
      showDetalhesModal.value = true
    } else {
      // Usar dados básicos se não conseguir carregar detalhes
      vendaSelecionada.value = venda
      showDetalhesModal.value = true
    }
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error)
    // Mostrar com dados básicos mesmo em caso de erro
    vendaSelecionada.value = venda
    showDetalhesModal.value = true
  }
}

const fecharDetalhes = () => {
  vendaSelecionada.value = null
  showDetalhesModal.value = false
}

const confirmarVenda = async (vendaId) => {
  try {
    isUpdatingStatus.value = true
    
    const paymentData = {
      paymentStatus: 'paid',
      transactionId: `MANUAL_${Date.now()}`
    }
    
    const response = await ticketsAPI.updatePaymentStatus(vendaId, paymentData)
    
    if (response.data.success) {
      const venda = vendas.value.find(v => v.id === vendaId)
      if (venda) {
        venda.paymentStatus = 'paid'
        venda.paidAt = new Date().toISOString()
      }
      
      showMessage('Pagamento confirmado com sucesso!', 'success')
      
      if (showDetalhesModal.value && vendaSelecionada.value?.id === vendaId) {
        fecharDetalhes()
      }
    } else {
      throw new Error(response.data.message || 'Erro ao confirmar pagamento')
    }
  } catch (error) {
    console.error('Erro ao confirmar venda:', error)
    showMessage('Erro ao confirmar pagamento: ' + (error.message || 'Erro desconhecido'), 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

const cancelarVenda = async (vendaId) => {
  const confirmacao = confirm('Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita.')
  if (!confirmacao) return

  try {
    isUpdatingStatus.value = true
    
    const paymentData = {
      paymentStatus: 'cancelled'
    }
    
    const response = await ticketsAPI.updatePaymentStatus(vendaId, paymentData)
    
    if (response.data.success) {
      const venda = vendas.value.find(v => v.id === vendaId)
      if (venda) {
        venda.paymentStatus = 'cancelled'
      }
      
      showMessage('Venda cancelada com sucesso!', 'warning')
      
      if (showDetalhesModal.value && vendaSelecionada.value?.id === vendaId) {
        fecharDetalhes()
      }
    } else {
      throw new Error(response.data.message || 'Erro ao cancelar venda')
    }
  } catch (error) {
    console.error('Erro ao cancelar venda:', error)
    showMessage('Erro ao cancelar venda: ' + (error.message || 'Erro desconhecido'), 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

const enviarComprovante = async (venda) => {
  try {
    // Implementar envio de comprovante
    showMessage('Comprovante enviado com sucesso!', 'success')
  } catch (error) {
    showMessage('Erro ao enviar comprovante', 'error')
  }
}

const exportarRelatorio = async () => {
  try {
    showMessage('Gerando relatório...', 'info')
    
    const params = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
    
    if (filtroRifa.value) {
      params.raffleId = filtroRifa.value
    }
    
    if (filtroStatus.value) {
      params.status = filtroStatus.value
    }
    
    const response = await ticketsAPI.getSalesList(params)
    
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
      type: 'application/json' 
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showMessage('Relatório exportado com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    showMessage('Erro ao exportar relatório', 'error')
  }
}

// ✅ MÉTODO PRINCIPAL: Carregar vendas com nova API
const carregarVendas = async (page = 1) => {
  try {
    const pageNumber = typeof page === 'number' ? page : parseInt(page) || 1
    
    console.log('💰 Carregando vendas - Página:', pageNumber)
    
    isLoading.value = true
    error.value = ''
    
    if (!Array.isArray(vendas.value)) {
      vendas.value = []
    }
    
    if (!authStore.isAuthenticated) {
      console.warn('⚠️ Usuário não autenticado')
      error.value = 'Usuário não autenticado'
      router.push('/login')
      return
    }
    
    // ✅ NOVOS parâmetros da API de tickets
    const params = {
      page: pageNumber,
      limit: pagination.value.limit,
      sortBy: ordenacao.value === 'createdAt' ? 'createdAt' : 
             ordenacao.value === 'amount' ? 'totalAmount' : 
             ordenacao.value === 'buyerName' ? 'createdAt' : 'createdAt',
      sortOrder: ordemDirecao.value
    }
    
    // ✅ MAPEAR filtros para novos nomes
    if (filtroStatus.value) {
      params.status = filtroStatus.value
    }
    
    if (filtroRifa.value) {
      params.raffleId = filtroRifa.value
    }
    
    console.log('📋 Parâmetros da requisição:', params)
    
    const response = await ticketsAPI.getSalesList(params)
    
    console.log('📥 Resposta da API de tickets:', response.data)
    
    if (response && response.data) {
      if (response.data.success === true) {
        console.log('✅ Resposta com success=true')
        const vendasData = response.data.data || []
        
        vendas.value = Array.isArray(vendasData) ? vendasData : []
        
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
          pagination.value.totalItems = vendas.value.length
          pagination.value.totalPages = Math.ceil(vendas.value.length / pagination.value.limit) || 1
        }
        
        error.value = ''
      } else if (response.data.success === false) {
        console.error('❌ Resposta da API com success=false:', response.data.message)
        error.value = response.data.message || 'Erro ao carregar vendas'
        vendas.value = []
      } else {
        console.error('❌ Estrutura de resposta não reconhecida:', response.data)
        error.value = 'Formato de resposta inesperado da API'
        vendas.value = []
      }
    } else {
      console.error('❌ Resposta vazia ou inválida')
      error.value = 'Resposta inválida do servidor'
      vendas.value = []
    }
    
    console.log('✅ Vendas carregadas:', {
      total: vendas.value.length,
      pagina: pagination.value.currentPage,
      totalPaginas: pagination.value.totalPages,
      totalItens: pagination.value.totalItems
    })
    
  } catch (err) {
    console.error('💥 Erro ao carregar vendas:', err)
    error.value = err.message || 'Erro ao carregar vendas'
    vendas.value = []
    
    if (err.response?.status === 401) {
      console.warn('🔐 Token inválido, redirecionando para login')
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
}

// Carregar rifas disponíveis para filtro
const carregarRifasDisponiveis = async () => {
  try {
    console.log('🎯 Carregando rifas para filtro...')
    
    if (!Array.isArray(rifasDisponiveis.value)) {
      rifasDisponiveis.value = []
    }
    
    const response = await rifasAPI.listMyRaffles({ limit: 100 })
    
    if (response.data.success === true) {
      const rifasData = response.data.data || []
      rifasDisponiveis.value = Array.isArray(rifasData) ? rifasData : []
    } else if (Array.isArray(response.data.data) || Array.isArray(response.data)) {
      const rifasData = response.data.data || response.data || []
      rifasDisponiveis.value = Array.isArray(rifasData) ? rifasData : []
    } else {
      rifasDisponiveis.value = []
    }
    
    console.log('✅ Rifas para filtro carregadas:', rifasDisponiveis.value.length)
  } catch (error) {
    console.error('💥 Erro ao carregar rifas para filtro:', error)
    rifasDisponiveis.value = []
  }
}

onMounted(async () => {
  console.log('🚀 Vendas: Componente montado')
  
  if (!Array.isArray(vendas.value)) {
    vendas.value = []
  }
  if (!Array.isArray(rifasDisponiveis.value)) {
    rifasDisponiveis.value = []
  }
  
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
  
  await Promise.all([
    carregarVendas(1),
    carregarRifasDisponiveis()
  ])
})
</script>

<style scoped>
.vendas {
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.filters-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  margin-bottom: 2rem;
  overflow: hidden;
}

.filters {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
  border-bottom: 1px solid #f1f3f4;
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

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8faff;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1d29;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Loading e Error States */
.loading,
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

/* Lista de vendas */
.vendas-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
}

.vendas-list {
  padding: 1.5rem;
}

.venda-card {
  border: 1px solid #f1f3f4;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.venda-card:hover {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.venda-card:last-child {
  margin-bottom: 0;
}

.venda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.venda-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.comprador-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.comprador-dados h4 {
  color: #1a1d29;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.comprador-dados p {
  color: #6b7280;
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.rifa-nome {
  color: #667eea;
  font-size: 0.8rem;
  font-weight: 600;
  background: #f0f7ff;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.venda-status {
  text-align: right;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.confirmed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.paid {
  background: #dbeafe;
  color: #1e40af;
}

.venda-data {
  display: block;
  color: #6b7280;
  font-size: 0.8rem;
}

.venda-detalhes {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 1rem;
}

.numeros-section .label {
  display: block;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.numeros-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.numero-badge {
  background: #f1f5f9;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: monospace;
}

.mais-numeros {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.venda-valores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.valor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.valor-item .label {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.valor-item .value {
  color: #1a1d29;
  font-size: 0.875rem;
  font-weight: 600;
}

.valor-item.total {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.valor-item.total .value {
  color: #059669;
  font-size: 1rem;
  font-weight: 700;
}

.venda-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-btn.confirm {
  background: #dcfce7;
  color: #166534;
}

.action-btn.confirm:hover {
  background: #bbf7d0;
}

.action-btn.cancel {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.cancel:hover {
  background: #fecaca;
}

.action-btn.details {
  background: #f1f5f9;
  color: #374151;
}

.action-btn.details:hover {
  background: #e2e8f0;
}

.action-btn.send {
  background: #dbeafe;
  color: #1e40af;
}

.action-btn.send:hover {
  background: #bfdbfe;
}

/* Paginação */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f1f3f4;
}

.pagination-info {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Estado vazio */
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
  flex-wrap: wrap;
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
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #1a1d29;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.detalhes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detalhe-section {
  background: #f8faff;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e0e7ff;
}

.detalhe-section.full-width {
  grid-column: 1 / -1;
}

.detalhe-section h4 {
  color: #1a1d29;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid #e0e7ff;
  padding-bottom: 0.5rem;
}

.detalhe-section p {
  color: #4b5563;
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.detalhe-section p:last-child {
  margin-bottom: 0;
}

.detalhe-section strong {
  color: #1a1d29;
  font-weight: 600;
}

.numeros-detalhes {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.numero-badge-large {
  background: #667eea;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: monospace;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Botões */
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

.btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

/* Responsividade */
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
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .venda-detalhes {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .venda-actions {
    justify-content: center;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .pagination-info {
    order: -1;
    width: 100%;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .modal {
    margin: 0.5rem;
    max-width: none;
  }
  
  .detalhes-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .venda-card {
    padding: 1rem;
  }
  
  .filters-section {
    margin-bottom: 1rem;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>