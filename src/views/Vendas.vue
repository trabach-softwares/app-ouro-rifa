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
          <!-- ✅ ATUALIZAR: Status nos filtros -->
          <select v-model="filtroStatus" @change="aplicarFiltros">
            <option value="">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="completed">Pagas</option>
            <option value="failed">Canceladas</option>
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
            <span class="stat-number">{{ estatisticas.vendasPagas }}</span>
            <span class="stat-label">Pagas</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
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
                  {{ getInitials(venda.buyerName) }}
                </div>
                <div class="comprador-dados">
                  <h4>{{ venda.buyerName }}</h4>
                  <p>{{ venda.buyerPhone }}</p>
                  <span class="rifa-nome">{{ venda.raffleName }}</span>
                </div>
              </div>
              
              <div class="venda-status">
                <span :class="['status-badge', venda.paymentStatus]">
                  {{ getStatusText(venda.paymentStatus) }}
                </span>
                <span class="venda-data">{{ formatDate(venda.createdAt) }}</span>
              </div>
            </div>

            <!-- Detalhes da venda -->
            <div class="venda-detalhes">
              <div class="numeros-section">
                <span class="label">Números comprados:</span>
                <div class="numeros-container">
                  <span 
                    v-for="numero in venda.tickets.slice(0, 8)" 
                    :key="numero"
                    class="numero-badge"
                  >
                    {{ numero.toString().padStart(3, '0') }}
                  </span>
                  <span v-if="venda.tickets.length > 8" class="mais-numeros">
                    +{{ venda.tickets.length - 8 }}
                  </span>
                </div>
              </div>
              
              <div class="valor-section">
                <div class="valor-info">
                  <span class="label">Valor total:</span>
                  <span class="value">{{ formatCurrency(venda.totalAmount) }}</span>
                </div>
              </div>
            </div>

            <!-- Ações da venda -->
            <div class="venda-actions">
              <!-- Confirmar pagamento (pending, processing) -->
              <button 
                v-if="podeConfirmar(venda.paymentStatus)"
                @click.stop="confirmarVenda(venda.id)"
                class="action-btn confirm"
                :disabled="isUpdatingStatus"
                :title="`Confirmar pagamento manualmente\nStatus atual: ${getStatusText(venda.paymentStatus)}\nValor: ${formatCurrency(venda.totalAmount)}`"
              >
                <span v-if="isUpdatingStatus">⏳</span>
                <span v-else>✅</span>
                {{ isUpdatingStatus ? 'Confirmando...' : 'Confirmar' }}
              </button>
              
              <!-- Cancelar (pending, processing) -->
              <button 
                v-if="podeCancelar(venda.paymentStatus)"
                @click.stop="cancelarVenda(venda.id)"
                class="action-btn cancel"
                :disabled="isUpdatingStatus"
                :title="`Cancelar esta venda\nStatus atual: ${getStatusText(venda.paymentStatus)}\nAção irreversível`"
              >
                <span v-if="isUpdatingStatus">⏳</span>
                <span v-else>❌</span>
                {{ isUpdatingStatus ? 'Cancelando...' : 'Cancelar' }}
              </button>
              
              <!-- Ver detalhes (sempre disponível) -->
              <button 
                @click.stop="verDetalhesVenda(venda)"
                class="action-btn details"
                :title="`Ver detalhes completos\nID: ${venda.id}\nComprador: ${venda.buyerName}`"
              >
                👁️ Detalhes
              </button>
              
              <!-- Enviar comprovante (paid) -->
              <button 
                v-if="podeEnviarComprovante(venda.paymentStatus)"
                @click.stop="enviarComprovante(venda)"
                class="action-btn send"
                title="Enviar comprovante por email"
              >
                📧 Enviar
              </button>

              <!-- ✅ ADICIONAR: Indicador visual do status problemático -->
              <div 
                v-if="venda.paymentStatus === PAYMENT_STATUS.FAILED"
                class="status-indicator failed"
                title="Esta venda falhou no processamento"
              >
                ⚠️ Falhou
              </div>
              
              <div 
                v-if="venda.paymentStatus === PAYMENT_STATUS.EXPIRED"
                class="status-indicator expired"
                title="Esta venda expirou"
              >
                ⏰ Expirada
              </div>
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
                <p><strong>Nome:</strong> {{ vendaSelecionada.buyerName }}</p>
                <p><strong>Telefone:</strong> {{ vendaSelecionada.buyerPhone }}</p>
                <p><strong>Email:</strong> {{ vendaSelecionada.buyerEmail || 'Não informado' }}</p>
              </div>

              <div class="detalhe-section">
                <h4>Rifa</h4>
                <p><strong>Nome:</strong> {{ vendaSelecionada.raffleName }}</p>
                <p><strong>ID da Rifa:</strong> {{ vendaSelecionada.raffleId }}</p>
              </div>

              <div class="detalhe-section">
                <h4>Compra</h4>
                <p><strong>Data:</strong> {{ formatDateTime(vendaSelecionada.createdAt) }}</p>
                <p><strong>Status:</strong> {{ getStatusText(vendaSelecionada.paymentStatus) }}</p>
                <p><strong>Método:</strong> {{ vendaSelecionada.paymentMethod }}</p>
              </div>

              <div class="detalhe-section">
                <h4>Números Comprados</h4>
                <div class="numeros-grid">
                  <span 
                    v-for="numero in vendaSelecionada.tickets" 
                    :key="numero"
                    class="numero-detalhado"
                  >
                    {{ numero.toString().padStart(3, '0') }}
                  </span>
                </div>
                <p><strong>Total:</strong> {{ vendaSelecionada.tickets.length }} números</p>
                <p><strong>Valor Total:</strong> {{ formatCurrency(vendaSelecionada.totalAmount) }}</p>
              </div>

              <!-- ✅ ADICIONAR: Seção de Status Detalhado -->
              <div class="detalhe-section status-section">
                <h4>Status do Pagamento</h4>
                <div class="status-detailed">
                  <span :class="['status-badge-large', getStatusClass(vendaSelecionada.paymentStatus)]">
                    {{ getStatusText(vendaSelecionada.paymentStatus) }}
                  </span>
                  
                  <!-- Informações específicas por status -->
                  <div class="status-info">
                    <p v-if="vendaSelecionada.paymentStatus === PAYMENT_STATUS.PENDING">
                      <strong>ℹ️ Aguardando:</strong> Pagamento ainda não foi confirmado
                    </p>
                    <p v-else-if="vendaSelecionada.paymentStatus === PAYMENT_STATUS.PROCESSING">
                      <strong>🔄 Processando:</strong> Pagamento em análise
                    </p>
                    <p v-else-if="vendaSelecionada.paymentStatus === PAYMENT_STATUS.PAID">
                      <strong>✅ Confirmado:</strong> Pagamento aprovado e processado
                    </p>
                    <p v-else-if="vendaSelecionada.paymentStatus === PAYMENT_STATUS.FAILED">
                      <strong>❌ Falhou:</strong> Houve problema no processamento do pagamento
                    </p>
                    <p v-else-if="vendaSelecionada.paymentStatus === PAYMENT_STATUS.CANCELLED">
                      <strong>🚫 Cancelado:</strong> Pagamento foi cancelado
                    </p>
                    <p v-else-if="vendaSelecionada.paymentStatus === PAYMENT_STATUS.EXPIRED">
                      <strong>⏰ Expirado:</strong> Prazo para pagamento expirou
                    </p>
                  </div>

                  <!-- Ações disponíveis -->
                  <div class="status-actions">
                    <button 
                      v-if="podeConfirmar(vendaSelecionada.paymentStatus)"
                      @click="confirmarVenda(vendaSelecionada.id)"
                      class="btn btn-success"
                      :disabled="isUpdatingStatus"
                    >
                      <span v-if="isUpdatingStatus">⏳ Confirmando...</span>
                      <span v-else>✅ Confirmar Pagamento</span>
                    </button>
                    
                    <button 
                      v-if="podeCancelar(vendaSelecionada.paymentStatus)"
                      @click="cancelarVenda(vendaSelecionada.id)"
                      class="btn btn-danger"
                      :disabled="isUpdatingStatus"
                    >
                      <span v-if="isUpdatingStatus">⏳ Cancelando...</span>
                      <span v-else>❌ Cancelar Venda</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="detalhe-section">
                <h4>Notas Internas</h4>
                <p v-if="vendaSelecionada.internalNotes">{{ vendaSelecionada.internalNotes }}</p>
                <p v-else>Sem notas internas.</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="fecharDetalhes" class="btn btn-outline">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from '@/composables/message'
import { useAuthStore } from '@/stores/auth'
import { ticketsAPI, rifasAPI, paymentsAPI } from '@/service/api'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = useRouter()
const { showMessage } = useMessage()
const authStore = useAuthStore()

// ✅ ADICIONAR: Constantes de status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
}

// Estados reativos
const vendas = ref([])
const rifasDisponiveis = ref([])
const isLoading = ref(false)
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

// ✅ ATUALIZAR: Computeds para incluir todos os status
const estatisticas = computed(() => {
  const total = vendas.value.length
  const faturamento = vendas.value.reduce((sum, venda) => sum + venda.totalAmount, 0)
  const pendentes = vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PENDING).length
  const processando = vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PROCESSING).length
  const pagas = vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PAID).length
  const canceladas = vendas.value.filter(v => 
    v.paymentStatus === PAYMENT_STATUS.FAILED || 
    v.paymentStatus === PAYMENT_STATUS.CANCELLED ||
    v.paymentStatus === PAYMENT_STATUS.EXPIRED
  ).length

  return {
    totalVendas: total,
    faturamentoTotal: faturamento,
    vendasPendentes: pendentes,
    vendasProcessando: processando,
    vendasPagas: pagas,
    vendasCanceladas: canceladas
  }
})

const vendasFiltradas = computed(() => {
  let resultado = [...vendas.value]

  if (filtroStatus.value) {
    resultado = resultado.filter(venda => venda.paymentStatus === filtroStatus.value)
  }

  if (filtroRifa.value) {
    resultado = resultado.filter(venda => venda.raffleId === filtroRifa.value)
  }

  if (termoBusca.value?.trim()) {
    const termo = termoBusca.value.toLowerCase()
    resultado = resultado.filter(venda => {
      const nome = (venda.buyerName || '').toLowerCase()
      const telefone = (venda.buyerPhone || '').toLowerCase()
      return nome.includes(termo) || telefone.includes(termo)
    })
  }

  // Ordenação
  resultado.sort((a, b) => {
    let valueA, valueB
    
    switch (ordenacao.value) {
      case 'amount':
        valueA = a.totalAmount
        valueB = b.totalAmount
        break
      case 'buyerName':
        valueA = a.buyerName?.toLowerCase() || ''
        valueB = b.buyerName?.toLowerCase() || ''
        break
      default: // createdAt
        valueA = new Date(a.createdAt)
        valueB = new Date(b.createdAt)
    }

    if (ordemDirecao.value === 'asc') {
      return valueA > valueB ? 1 : -1
    } else {
      return valueA < valueB ? 1 : -1
    }
  })

  return resultado
})

const temFiltros = computed(() => {
  return filtroStatus.value || filtroRifa.value || termoBusca.value
})

// Métodos de formatação
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('pt-BR')
}

const getInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
}

// ✅ ATUALIZAR: Função getStatusText para todos os status
const getStatusText = (status) => {
  const statusMap = {
    [PAYMENT_STATUS.PENDING]: 'Pendente',
    [PAYMENT_STATUS.PROCESSING]: 'Processando',
    [PAYMENT_STATUS.PAID]: 'Pago',
    [PAYMENT_STATUS.FAILED]: 'Falhou',
    [PAYMENT_STATUS.CANCELLED]: 'Cancelado',
    [PAYMENT_STATUS.EXPIRED]: 'Expirado'
  }
  return statusMap[status] || status
}

// ✅ ADICIONAR: Função para obter classe CSS do status
const getStatusClass = (status) => {
  switch (status) {
    case PAYMENT_STATUS.PENDING:
      return 'pending'
    case PAYMENT_STATUS.PROCESSING:
      return 'processing'
    case PAYMENT_STATUS.PAID:
      return 'paid'
    case PAYMENT_STATUS.FAILED:
    case PAYMENT_STATUS.CANCELLED:
    case PAYMENT_STATUS.EXPIRED:
      return 'cancelled'
    default:
      return 'pending'
  }
}

// ✅ ADICIONAR: Verificar se ação é permitida para o status
const podeConfirmar = (status) => {
  return [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING].includes(status)
}

const podeCancelar = (status) => {
  return [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING].includes(status)
}

const podeEnviarComprovante = (status) => {
  return status === PAYMENT_STATUS.PAID
}

const podeReativar = (status) => {
  return [PAYMENT_STATUS.FAILED, PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.EXPIRED].includes(status)
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
  carregarVendas(1)
}

const handleRefresh = () => {
  carregarVendas(pagination.value.currentPage)
}

const goToPage = (pageNumber) => {
  carregarVendas(pageNumber)
}

const verDetalhesVenda = (venda) => {
  vendaSelecionada.value = venda
  showDetalhesModal.value = true
}

const fecharDetalhes = () => {
  vendaSelecionada.value = null
  showDetalhesModal.value = false
}

// ✅ MELHORAR: Confirmar venda com tratamento específico de erros
const confirmarVenda = async (ticketId) => {
  try {
    isUpdatingStatus.value = true
    
    const venda = vendas.value.find(v => v.id === ticketId)
    if (!venda) {
      throw new Error('Venda não encontrada na lista local')
    }
    
    if (!podeConfirmar(venda.paymentStatus)) {
      throw new Error(`Não é possível confirmar pagamento com status "${getStatusText(venda.paymentStatus)}"`)
    }
    
    console.log('✅ Confirmando pagamento do ticket:', ticketId)
    
    // Usar API de pagamentos para confirmar
    const transactionId = `MANUAL_CONFIRM_${Date.now()}`
    
    try {
      await paymentsAPI.confirmPayment(ticketId, transactionId)
      
      // Atualizar venda local apenas se a API retornou sucesso
      venda.paymentStatus = PAYMENT_STATUS.PAID
      
      showMessage('✅ Pagamento confirmado com sucesso!', 'success')
      
      if (showDetalhesModal.value && vendaSelecionada.value?.id === ticketId) {
        // Atualizar também os dados do modal
        vendaSelecionada.value.paymentStatus = PAYMENT_STATUS.PAID
        fecharDetalhes()
      }
      
    } catch (apiError) {
      console.error('💥 Erro na API de confirmação:', apiError)
      
      // ✅ TRATAR erros específicos da API
      if (apiError.response?.data) {
        const errorData = apiError.response.data
        
        // Tratar erro específico de "Pagamento não encontrado"
        if (errorData.message === 'Pagamento não encontrado' || 
            errorData.message?.includes('não encontrado')) {
          
          showMessage(
            `❌ Não foi possível confirmar o pagamento:\n\n` +
            `💡 O pagamento para este ticket não foi encontrado no sistema.\n\n` +
            `🔍 Possíveis causas:\n` +
            `• O ticket foi criado antes da integração com pagamentos\n` +
            `• O pagamento foi processado por outro método\n` +
            `• Houve um problema na sincronização de dados\n\n` +
            `💡 Sugestão: Verifique o status diretamente no sistema de pagamentos ou contate o suporte.`,
            'error'
          )
          
          // ✅ IMPORTANTE: Não atualizar o status local se o pagamento não existe
          return
        }
        
        // Tratar outros erros específicos
        if (errorData.message?.includes('já confirmado') || 
            errorData.message?.includes('already confirmed')) {
          
          // Se já está confirmado, atualizar o status local
          venda.paymentStatus = PAYMENT_STATUS.PAID
          if (vendaSelecionada.value?.id === ticketId) {
            vendaSelecionada.value.paymentStatus = PAYMENT_STATUS.PAID
          }
          
          showMessage('ℹ️ Este pagamento já estava confirmado no sistema.', 'info')
          return
        }
        
        if (errorData.message?.includes('expirado') || 
            errorData.message?.includes('expired')) {
          
          showMessage(
            `⏰ Não foi possível confirmar o pagamento:\n\n` +
            `O prazo para confirmação deste pagamento expirou.\n\n` +
            `💡 Para resolver: Entre em contato com o comprador para gerar um novo pagamento.`,
            'warning'
          )
          return
        }
        
        if (errorData.message?.includes('cancelado') || 
            errorData.message?.includes('cancelled')) {
          
          // Atualizar status local para cancelado
          venda.paymentStatus = PAYMENT_STATUS.CANCELLED
          if (vendaSelecionada.value?.id === ticketId) {
            vendaSelecionada.value.paymentStatus = PAYMENT_STATUS.CANCELLED
          }
          
          showMessage(
            `❌ Este pagamento foi cancelado e não pode ser confirmado.\n\n` +
            `💡 Para resolver: O comprador precisa fazer uma nova compra.`,
            'error'
          )
          return
        }
        
        // Erro genérico da API com detalhes
        const errorMessage = errorData.message || 'Erro desconhecido na API'
        showMessage(
          `❌ Erro ao confirmar pagamento:\n\n${errorMessage}\n\n` +
          `💡 Tente novamente em alguns momentos ou contate o suporte se o problema persistir.`,
          'error'
        )
        return
      }
      
      // Erro de conexão ou outros erros técnicos
      if (apiError.code === 'NETWORK_ERROR' || !apiError.response) {
        showMessage(
          `🌐 Erro de conexão ao confirmar pagamento:\n\n` +
          `Não foi possível conectar com o servidor.\n\n` +
          `💡 Verifique sua conexão e tente novamente.`,
          'error'
        )
        return
      }
      
      // Erro HTTP genérico
      if (apiError.response?.status) {
        const statusMessages = {
          400: 'Dados inválidos enviados para confirmação',
          401: 'Sessão expirada. Faça login novamente',
          403: 'Você não tem permissão para confirmar este pagamento',
          404: 'Pagamento não encontrado no sistema',
          500: 'Erro interno do servidor',
          503: 'Serviço temporariamente indisponível'
        }
        
        const statusMessage = statusMessages[apiError.response.status] || 
                             `Erro HTTP ${apiError.response.status}`
        
        showMessage(
          `❌ ${statusMessage}\n\n` +
          `💡 Tente novamente em alguns momentos.`,
          'error'
        )
        return
      }
      
      // Erro completamente desconhecido
      showMessage(
        `❌ Erro inesperado ao confirmar pagamento:\n\n` +
        `${apiError.message || 'Erro desconhecido'}\n\n` +
        `💡 Entre em contato com o suporte técnico.`,
        'error'
      )
      throw apiError
    }
    
    // Recarregar dados para garantir sincronização (apenas se confirmação foi bem-sucedida)
    await carregarVendas(pagination.value.currentPage)
    
  } catch (error) {
    console.error('💥 Erro geral ao confirmar pagamento:', error)
    
    // Se chegou aqui, é um erro não tratado acima
    if (!error.response) {
      showMessage(
        `❌ Erro inesperado:\n\n${error.message || 'Erro desconhecido'}\n\n` +
        `💡 Recarregue a página e tente novamente.`,
        'error'
      )
    }
  } finally {
    isUpdatingStatus.value = false
  }
}

// ✅ MELHORAR: Cancelar venda com tratamento similar
const cancelarVenda = async (ticketId) => {
  const venda = vendas.value.find(v => v.id === ticketId)
  if (!venda) {
    showMessage('❌ Venda não encontrada na lista local', 'error')
    return
  }
  
  if (!podeCancelar(venda.paymentStatus)) {
    showMessage(
      `❌ Não é possível cancelar:\n\n` +
      `Esta venda tem status "${getStatusText(venda.paymentStatus)}" e não pode ser cancelada.\n\n` +
      `💡 Apenas vendas pendentes ou em processamento podem ser canceladas.`,
      'error'
    )
    return
  }
  
  const confirmacao = confirm(
    `⚠️ Cancelar esta venda?\n\n` +
    `Comprador: ${venda.buyerName}\n` +
    `Valor: ${formatCurrency(venda.totalAmount)}\n` +
    `Números: ${venda.tickets.length} número(s)\n\n` +
    `Esta ação não pode ser desfeita.`
  )
  if (!confirmacao) return

  try {
    isUpdatingStatus.value = true
    
    console.log('❌ Cancelando ticket:', ticketId)
    
    try {
      // Usar API de tickets para cancelar
      await ticketsAPI.cancelTicket(ticketId)
      
      // Atualizar venda local apenas se a API retornou sucesso
      venda.paymentStatus = PAYMENT_STATUS.CANCELLED
      if (vendaSelecionada.value?.id === ticketId) {
        vendaSelecionada.value.paymentStatus = PAYMENT_STATUS.CANCELLED
      }
      
      showMessage('✅ Venda cancelada com sucesso!', 'warning')
      
    } catch (apiError) {
      console.error('💥 Erro na API de cancelamento:', apiError)
      
      // ✅ TRATAR erros específicos da API
      if (apiError.response?.data?.message) {
        const errorMessage = apiError.response.data.message
        
        if (errorMessage.includes('não encontrado')) {
          showMessage(
            `❌ Ticket não encontrado:\n\n` +
            `O ticket não foi encontrado no sistema.\n\n` +
            `💡 Pode ter sido removido ou já processado.`,
            'error'
          )
          return
        }
        
        if (errorMessage.includes('já cancelado')) {
          // Se já está cancelado, atualizar status local
          venda.paymentStatus = PAYMENT_STATUS.CANCELLED
          if (vendaSelecionada.value?.id === ticketId) {
            vendaSelecionada.value.paymentStatus = PAYMENT_STATUS.CANCELLED
          }
          showMessage('ℹ️ Esta venda já estava cancelada.', 'info')
          return
        }
        
        showMessage(
          `❌ Erro ao cancelar:\n\n${errorMessage}\n\n` +
          `💡 Tente novamente ou contate o suporte.`,
          'error'
        )
        return
      }
      
      // Erro genérico
      showMessage(
        `❌ Erro ao cancelar venda:\n\n` +
        `${apiError.message || 'Erro desconhecido'}\n\n` +
        `💡 Tente novamente em alguns momentos.`,
        'error'
      )
      throw apiError
    }
    
    // Recarregar dados para garantir sincronização
    await carregarVendas(pagination.value.currentPage)
    
  } catch (error) {
    console.error('💥 Erro geral ao cancelar venda:', error)
    
    if (!error.response) {
      showMessage(
        `❌ Erro inesperado:\n\n${error.message || 'Erro desconhecido'}\n\n` +
        `💡 Recarregue a página e tente novamente.`,
        'error'
      )
    }
  } finally {
    isUpdatingStatus.value = false
  }
}

// ✅ NOVO: Reativar venda (para status cancelled, failed, expired)
const reativarVenda = async (ticketId) => {
  const venda = vendas.value.find(v => v.id === ticketId)
  if (!venda) {
    showMessage('Venda não encontrada', 'error')
    return
  }
  
  if (!podeReativar(venda.paymentStatus)) {
    showMessage(`Não é possível reativar venda com status "${getStatusText(venda.paymentStatus)}"`, 'error')
    return
  }
  
  const confirmacao = confirm('Tem certeza que deseja reativar esta venda como pendente?')
  if (!confirmacao) return

  try {
    isUpdatingStatus.value = true
    
    console.log('🔄 Reativando ticket:', ticketId)
    
    // ✅ PLACEHOLDER: Implementar endpoint de reativação quando disponível
    // await ticketsAPI.reactivateTicket(ticketId)
    
    // Atualizar venda local temporariamente
    venda.paymentStatus = PAYMENT_STATUS.PENDING
    
    showMessage('Venda reativada como pendente!', 'success')
    
    // Recarregar dados para garantir sincronização
    await carregarVendas(pagination.value.currentPage)
    
  } catch (error) {
    console.error('💥 Erro ao reativar venda:', error)
    showMessage('Erro ao reativar venda: ' + (error.message || 'Erro desconhecido'), 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

// ✅ PLACEHOLDER: Enviar comprovante
const enviarComprovante = async (venda) => {
  if (!podeEnviarComprovante(venda.paymentStatus)) {
    showMessage(`Não é possível enviar comprovante para venda com status "${getStatusText(venda.paymentStatus)}"`, 'error')
    return
  }
  
  showMessage('Funcionalidade de envio de comprovante em desenvolvimento', 'info')
}

// ✅ PLACEHOLDER: Marcar como expirado
const marcarComoExpirado = async (ticketId) => {
  const venda = vendas.value.find(v => v.id === ticketId)
  if (!venda) {
    showMessage('Venda não encontrada', 'error')
    return
  }
  
  if (venda.paymentStatus !== PAYMENT_STATUS.PENDING) {
    showMessage(`Não é possível expirar venda com status "${getStatusText(venda.paymentStatus)}"`, 'error')
    return
  }
  
  const confirmacao = confirm('Tem certeza que deseja marcar esta venda como expirada?')
  if (!confirmacao) return

  try {
    isUpdatingStatus.value = true
    
    console.log('⏰ Marcando ticket como expirado:', ticketId)
    
    // ✅ PLACEHOLDER: Implementar endpoint quando disponível
    // await ticketsAPI.expireTicket(ticketId)
    
    // Atualizar venda local temporariamente
    venda.paymentStatus = PAYMENT_STATUS.EXPIRED
    
    showMessage('Venda marcada como expirada!', 'warning')
    
    // Recarregar dados para garantir sincronização
    await carregarVendas(pagination.value.currentPage)
    
  } catch (error) {
    console.error('💥 Erro ao expirar venda:', error)
    showMessage('Erro ao expirar venda: ' + (error.message || 'Erro desconhecido'), 'error')
  } finally {
    isUpdatingStatus.value = false
  }
}

// ✅ CORRIGIR: Exportar relatório usando dados locais
const exportarRelatorio = async () => {
  try {
    showMessage('Gerando relatório...', 'info')
    
    const dados = {
      vendas: vendas.value,
      estatisticas: estatisticas.value,
      filtros: {
        status: filtroStatus.value,
        rifa: filtroRifa.value,
        busca: termoBusca.value
      },
      paymentStatusCounts: {
        pending: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PENDING).length,
        processing: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PROCESSING).length,
        paid: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PAID).length,
        failed: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.FAILED).length,
        cancelled: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.CANCELLED).length,
        expired: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.EXPIRED).length
      },
      dataExportacao: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { 
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
    console.error('💥 Erro ao exportar relatório:', error)
    showMessage('Erro ao exportar relatório: ' + (error.message || 'Erro desconhecido'), 'error')
  }
}

// ✅ MANTER: Carregar vendas (implementação existente)
const carregarVendas = async (page = 1) => {
  try {
    isLoading.value = true
    error.value = ''
    
    console.log('📊 Carregando vendas via ticketsAPI...', { page, filtros: {
      status: filtroStatus.value,
      rifa: filtroRifa.value,
      busca: termoBusca.value
    }})
    
    const params = {
      page: page,
      limit: pagination.value.limit,
      status: filtroStatus.value || undefined
    }
    
    console.log('📤 Parâmetros da requisição:', params)
    
    // ✅ USAR ENDPOINT CORRETO: /tickets/sales/list
    let response
    try {
      console.log('🔄 Tentando endpoint /tickets/sales/list...')
      response = await ticketsAPI.getSalesList(params)
      console.log('📥 Resposta ticketsAPI.getSalesList:', response.data)
    } catch (ticketsError) {
      console.warn('⚠️ Endpoint /tickets/sales/list falhou, tentando fallback...', ticketsError)
      
      // Fallback 1: Usar tickets por rifa se filtro especificado
      if (filtroRifa.value) {
        response = await ticketsAPI.getRaffleTickets(filtroRifa.value, params)
        console.log('📥 Resposta ticketsAPI.getRaffleTickets (fallback):', response.data)
      } else {
        // Fallback 2: Usar paymentsAPI
        response = await paymentsAPI.getMyPayments(params)
        console.log('📥 Resposta paymentsAPI.getMyPayments (fallback):', response.data)
      }
    }
    
    // ✅ PROCESSAR resposta da API de tickets (nova estrutura)
    let vendasData = []
    let paginationData = null
    
    console.log('🔍 Analisando estrutura da resposta:', {
      hasData: !!response.data,
      isSuccess: response.data?.success,
      dataType: typeof response.data?.data,
      isDataArray: Array.isArray(response.data?.data),
      directArray: Array.isArray(response.data)
    })
    
    // ✅ PROCESSAR nova estrutura da API de tickets
    if (response.data?.success === true) {
      // Resposta com success: true
      if (Array.isArray(response.data.data)) {
        vendasData = response.data.data
      } else {
        console.warn('⚠️ Dados não são array em resposta com success=true:', response.data)
        vendasData = []
      }
      paginationData = response.data.pagination
    } else if (Array.isArray(response.data)) {
      vendasData = response.data
    } else if (response.data?.data) {
      if (Array.isArray(response.data.data)) {
        vendasData = response.data.data
      } else {
        console.warn('⚠️ Campo data não é array:', response.data.data)
        vendasData = []
      }
      paginationData = response.data.pagination
    } else {
      console.warn('⚠️ Estrutura de resposta não reconhecida, usando array vazio')
      vendasData = []
    }
    
    // ✅ GARANTIR que vendasData é sempre um array
    if (!Array.isArray(vendasData)) {
      console.error('❌ vendasData não é um array:', typeof vendasData, vendasData)
      vendasData = []
    }
    
    console.log('📋 Dados processados:', { 
      vendas: vendasData.length, 
      pagination: paginationData,
      amostra: vendasData.slice(0, 2)
    })
    
    // ✅ MAPEAR dados conforme nova estrutura da API
    vendas.value = vendasData.map(ticket => {
      if (!ticket || typeof ticket !== 'object') {
        console.warn('⚠️ Item de ticket inválido:', ticket)
        return {
          id: 'invalid_' + Math.random(),
          buyerName: 'N/A',
          buyerPhone: 'N/A',
          buyerEmail: '',
          raffleName: 'N/A',
          raffleId: '',
          tickets: [],
          totalAmount: 0,
          paymentStatus: PAYMENT_STATUS.PENDING,
          paymentMethod: 'PIX',
          createdAt: new Date().toISOString()
        }
      }
      
      // ✅ NORMALIZAR status para constantes definidas
      let normalizedStatus = ticket.payment?.status || ticket.paymentStatus || PAYMENT_STATUS.PENDING
      
      // Mapear status diferentes que podem vir da API
      if (normalizedStatus === 'completed') normalizedStatus = PAYMENT_STATUS.PAID
      if (normalizedStatus === 'canceled') normalizedStatus = PAYMENT_STATUS.CANCELLED
      
      return {
        // ✅ MAPEAR conforme nova estrutura da API
        id: ticket.id || ticket.orderId || 'unknown_' + Math.random(),
        buyerName: ticket.customer?.name || ticket.buyer?.name || 'N/A',
        buyerPhone: ticket.customer?.phone || ticket.buyer?.phone || 'N/A',
        buyerEmail: ticket.customer?.email || ticket.buyer?.email || '',
        raffleName: ticket.raffle?.title || 'Rifa',
        raffleId: ticket.raffle?.id || ticket.raffle || '',
        tickets: ticket.ticketNumbers || [],
        totalAmount: parseFloat(ticket.totalAmount || 0),
        paymentStatus: normalizedStatus,
        paymentMethod: ticket.paymentMethod || 'pix',
        createdAt: ticket.createdAt || new Date().toISOString(),
        isWinner: ticket.isWinner || false,
        transactionId: ticket.transactionId || null
      }
    })
    
    // Atualizar paginação (mantém lógica existente)
    if (paginationData && typeof paginationData === 'object') {
      pagination.value = {
        currentPage: parseInt(paginationData.currentPage || page),
        totalPages: parseInt(paginationData.totalPages || 1),
        totalItems: parseInt(paginationData.totalItems || vendasData.length),
        limit: parseInt(paginationData.limit || pagination.value.limit),
        hasNext: Boolean(paginationData.hasNext || false),
        hasPrev: Boolean(paginationData.hasPrev || false)
      }
    } else {
      pagination.value.currentPage = page
      pagination.value.totalItems = vendasData.length
      pagination.value.totalPages = Math.ceil(vendasData.length / pagination.value.limit) || 1
      pagination.value.hasNext = false
      pagination.value.hasPrev = false
    }
    
    console.log('✅ Vendas carregadas com sucesso:', {
      total: vendas.value.length,
      pagina: pagination.value.currentPage,
      totalPaginas: pagination.value.totalPages,
      statusDistribution: {
        pending: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PENDING).length,
        processing: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PROCESSING).length,
        paid: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.PAID).length,
        failed: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.FAILED).length,
        cancelled: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.CANCELLED).length,
        expired: vendas.value.filter(v => v.paymentStatus === PAYMENT_STATUS.EXPIRED).length
      }
    })
    
  } catch (err) {
    console.error('💥 Erro ao carregar vendas:', err)
    error.value = err.message || 'Erro ao carregar vendas'
    vendas.value = []
    
    // Resetar paginação em caso de erro
    pagination.value = {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      limit: 20,
      hasNext: false,
      hasPrev: false
    }
    
    // Tratamento específico de erros
    if (err.response?.status === 401) {
      showMessage('Sessão expirada. Redirecionando para login...', 'error')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      showMessage('Erro ao carregar vendas: ' + (err.message || 'Erro desconhecido'), 'error')
    }
  } finally {
    isLoading.value = false
  }
}

// ✅ MANTER: Carregar rifas disponíveis (inalterado)
const carregarRifasDisponiveis = async () => {
  try {
    console.log('🎯 Carregando rifas disponíveis...')
    
    const response = await rifasAPI.listMyRaffles({
      limit: 100,
      sort: 'title',
      order: 'asc'
    })
    
    console.log('📥 Resposta rifas:', response.data)
    
    let rifasData = []
    
    if (response.data?.success) {
      rifasData = response.data.data || []
    } else if (Array.isArray(response.data)) {
      rifasData = response.data
    }
    
    rifasDisponiveis.value = rifasData.map(rifa => ({
      id: rifa.id,
      title: rifa.title || 'Rifa sem nome'
    }))
    
    console.log('✅ Rifas disponíveis carregadas:', rifasDisponiveis.value.length)
    
  } catch (error) {
    console.error('💥 Erro ao carregar rifas:', error)
    rifasDisponiveis.value = []
  }
}

// ✅ Inicialização (inalterada)
onMounted(async () => {
  console.log('🚀 Vendas: Componente montado')
  
  if (!authStore.isAuthenticated) {
    console.warn('⚠️ Usuário não autenticado')
    router.push('/login')
    return
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

/* Header */
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
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Filtros */
.filters-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  align-items: center;
}

.filters select,
.filters input {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  background: white;
  min-width: 150px;
}

.search-input {
  min-width: 250px;
  flex: 1;
}

/* Estatísticas */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8faff 0%, #f0f7ff 100%);
  border-radius: 12px;
  border: 1px solid #e0e7ff;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1d29;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Loading */
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
  to { transform: rotate(360deg); }
}

/* Error State */
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

/* Lista de vendas */
.vendas-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
}

.vendas-list {
  padding: 2rem;
}

.venda-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
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
}

.comprador-dados h4 {
  margin: 0 0 0.25rem 0;
  color: #1a1d29;
  font-size: 1rem;
  font-weight: 600;
}

.comprador-dados p {
  margin: 0 0 0.25rem 0;
  color: #64748b;
  font-size: 0.9rem;
}

.rifa-nome {
  color: #667eea;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.processing {
  background: #e0f2fe;
  color: #0369a1;
}

.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.venda-data {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

/* Detalhes da venda */
.venda-detalhes {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  margin-bottom: 1rem;
  align-items: start;
}

.numeros-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.numeros-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.numero-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: monospace;
}

.mais-numeros {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.valor-section {
  text-align: right;
}

.value {
  color: #059669;
  font-weight: 700;
  font-size: 1.1rem;
}

/* Ações */
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
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.action-btn.expire {
  background: #fef3c7;
  color: #92400e;
}

.action-btn.expire:hover {
  background: #fde68a;
}

.action-btn.reactivate {
  background: #e0f2fe;
  color: #0369a1;
}

.action-btn.reactivate:hover {
  background: #bae6fd;
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

.detalhe-section h4 {
  color: #667eea;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 700;
}

.detalhe-section p {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.9rem;
}

.numeros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
}

.numero-detalhado {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: monospace;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* ✅ NOVOS: Indicadores de status problemático */
.status-indicator {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-indicator.failed {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.status-indicator.expired {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fed7aa;
}

/* ✅ MELHORAR: Status badge grande para modal */
.status-badge-large {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 1rem;
}

.status-section {
  grid-column: 1 / -1; /* Ocupar toda a largura */
}

.status-detailed {
  text-align: center;
}

.status-info {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.status-info p {
  margin: 0;
  font-weight: 500;
  color: #374151;
}

.status-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

/* ✅ MELHORAR: Tooltips para botões */
.action-btn {
  position: relative;
}

.action-btn[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: pre-line;
  z-index: 1000;
  max-width: 200px;
  text-align: center;
  margin-bottom: 5px;
}

/* ✅ MELHORAR: Estados de loading nos botões */
.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* ... resto dos estilos mantidos ... */
</style>