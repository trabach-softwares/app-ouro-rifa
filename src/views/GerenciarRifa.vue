<!-- filepath: src/views/GerenciarRifa.vue -->
<template>
  <AdminLayout>
    <div class="gerenciar-rifa">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Carregando dados da rifa...</p>
      </div>

      <!-- Conteúdo normal da tela -->
      <div v-else>
        <!-- ✅ NOVO: Header da Rifa - Nome em destaque -->
        <div class="rifa-header">
          <div class="rifa-header-content">
            <div class="rifa-title-section">
              <h1 class="rifa-title">{{ rifa.title || 'Rifa sem nome' }}</h1>
              <p class="rifa-subtitle">Acompanhe vendas e gerencie sua rifa</p>
            </div>
            <div class="rifa-header-status">
              <span :class="['status-badge-large', rifa.status]">
                {{ getStatusText(rifa.status) }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <router-link :to="`/rifas/${$route.params.id}`" class="btn btn-outline">
              ✏️ Editar
            </router-link>
            <router-link to="/rifas" class="btn btn-secondary">
              ← Voltar
            </router-link>
          </div>
        </div>

        <!-- ✅ NOVO: Controle de Status da Rifa -->
        <div class="status-control-card">
          <div class="card-header">
            <h2>⚙️ Controle de Status</h2>
            <div class="status-info">
              <span class="current-status-label">Status atual:</span>
              <span :class="['status-badge-medium', rifa.status]">
                {{ getStatusText(rifa.status) }}
              </span>
            </div>
          </div>
          
          <div class="status-actions-grid">
            <!-- Ativar Rifa -->
            <button 
              v-if="['draft', 'paused'].includes(rifa.status)"
              @click="atualizarStatus('active')"
              class="status-action-card active-card"
              :disabled="isUpdatingStatus"
            >
              <div class="status-action-icon">🚀</div>
              <div class="status-action-content">
                <h3>Ativar Rifa</h3>
                <p>Rifa ficará disponível para vendas</p>
                <div class="status-requirements">
                  <span v-if="rifa.totalTickets > 0" class="requirement-ok">✅ Números configurados</span>
                  <span v-else class="requirement-error">❌ Configure os números</span>
                  
                  <span v-if="rifa.ticketPrice > 0" class="requirement-ok">✅ Preço definido</span>
                  <span v-else class="requirement-error">❌ Defina o preço</span>
                </div>
              </div>
            </button>

            <!-- Pausar Rifa -->
            <button 
              v-if="rifa.status === 'active'"
              @click="atualizarStatus('paused')"
              class="status-action-card paused-card"
              :disabled="isUpdatingStatus"
            >
              <div class="status-action-icon">⏸️</div>
              <div class="status-action-content">
                <h3>Pausar Rifa</h3>
                <p>Interromper vendas temporariamente</p>
                <div class="status-warning">
                  <span>⚠️ Vendas serão interrompidas</span>
                </div>
              </div>
            </button>

            <!-- Finalizar Rifa -->
            <button 
              v-if="['active', 'paused'].includes(rifa.status) && (rifa.soldTickets > 0)"
              @click="atualizarStatus('finished')"
              class="status-action-card finished-card"
              :disabled="isUpdatingStatus"
            >
              <div class="status-action-icon">🏁</div>
              <div class="status-action-content">
                <h3>Finalizar Rifa</h3>
                <p>Encerrar rifa e preparar sorteio</p>
                <div class="status-info-small">
                  <span>💰 {{ rifa.soldTickets }} números vendidos</span>
                </div>
              </div>
            </button>

            <!-- Cancelar Rifa -->
            <button 
              v-if="!['finished', 'cancelled'].includes(rifa.status)"
              @click="atualizarStatus('cancelled')"
              class="status-action-card cancelled-card"
              :disabled="isUpdatingStatus"
            >
              <div class="status-action-icon">🗑️</div>
              <div class="status-action-content">
                <h3>Cancelar Rifa</h3>
                <p>Cancelar rifa permanentemente</p>
                <div class="status-warning">
                  <span>⚠️ Esta ação não pode ser desfeita</span>
                </div>
              </div>
            </button>

            <!-- Reativar Rifa Cancelada (apenas para debug/admin) -->
            <button 
              v-if="rifa.status === 'cancelled'"
              @click="atualizarStatus('draft')"
              class="status-action-card draft-card"
              :disabled="isUpdatingStatus"
            >
              <div class="status-action-icon">🔄</div>
              <div class="status-action-content">
                <h3>Reativar como Rascunho</h3>
                <p>Voltar rifa para rascunho</p>
              </div>
            </button>
          </div>

          <!-- Loading indicator -->
          <div v-if="isUpdatingStatus" class="status-updating">
            <div class="loading-spinner-small"></div>
            <span>Atualizando status...</span>
          </div>
        </div>

        <!-- ✅ MELHORADO: Cards de Estatísticas principais -->
        <div class="main-stats">
          <div class="stat-card-large vendidos">
            <div class="stat-header">
              <div class="stat-icon-large">🎯</div>
              <div class="stat-info">
                <div class="stat-number-large">{{ rifa.soldTickets || 0 }}</div>
                <div class="stat-label-large">Números Vendidos</div>
              </div>
            </div>
            <div class="stat-details">
              <div class="progress-section">
                <div class="progress-info">
                  <span class="progress-label">Progresso</span>
                  <span class="progress-percent">{{ Math.round(rifa.progress || 0) }}%</span>
                </div>
                <div class="progress-bar-large">
                  <div 
                    class="progress-fill-large" 
                    :style="{ width: `${rifa.progress || 0}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="stat-card-large faturamento">
            <div class="stat-header">
              <div class="stat-icon-large">💰</div>
              <div class="stat-info">
                <div class="stat-number-large">{{ formatCurrency(rifa.revenue || 0) }}</div>
                <div class="stat-label-large">Faturamento</div>
              </div>
            </div>
            <div class="stat-details">
              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">Meta:</span>
                  <span class="meta-value">{{ formatCurrency(faturamentoMaximo) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="stat-card-large participantes">
            <div class="stat-header">
              <div class="stat-icon-large">👥</div>
              <div class="stat-info">
                <div class="stat-number-large">{{ compradores.length }}</div>
                <div class="stat-label-large">Participantes</div>
              </div>
            </div>
            <div class="stat-details">
              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">{{ vendas.length }} compra{{ vendas.length !== 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ NOVO: Informações detalhadas da rifa -->
        <div class="rifa-details-card">
          <div class="card-header">
            <h2>📋 Detalhes da Rifa</h2>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Valor por número:</span>
              <span class="detail-value">{{ formatCurrency(rifa.ticketPrice) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Total de números:</span>
              <span class="detail-value">{{ rifa.totalTickets || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Data de término:</span>
              <span class="detail-value">{{ formatDate(rifa.endDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tempo restante:</span>
              <span class="detail-value" :class="{ 'text-warning': tempoRestante.includes('h'), 'text-danger': tempoRestante === 'Encerrada' }">
                {{ tempoRestante || 'Não definido' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Criada em:</span>
              <span class="detail-value">{{ formatDate(rifa.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ID da rifa:</span>
              <span class="detail-value mono">#{{ rifa.id }}</span>
            </div>
          </div>
        </div>

        <!-- ✅ MELHORADO: Vendas Recentes -->
        <div class="content-card">
          <div class="card-header">
            <h2>💳 Vendas Recentes</h2>
            <div class="filters">
              <select v-model="filtroStatus" @change="aplicarFiltros">
                <option value="">Todos os status</option>
                <option value="pending">Pendentes</option>
                <option value="confirmed">Confirmados</option>
                <option value="paid">Pagos</option>
                <option value="cancelled">Cancelados</option>
              </select>
              <input 
                v-model="termoBusca" 
                @input="aplicarFiltros"
                type="text" 
                placeholder="Buscar por nome, telefone..."
                class="search-input"
              />
            </div>
          </div>

          <!-- Lista de Vendas -->
          <div v-if="vendasFiltradas.length > 0" class="vendas-list">
            <div 
              v-for="venda in vendasFiltradas" 
              :key="venda.id"
              class="venda-item-enhanced"
              @click="verDetalhesVenda(venda)"
            >
              <div class="venda-info">
                <div class="comprador-avatar">
                  {{ (venda.buyerName || 'A').charAt(0).toUpperCase() }}
                </div>
                <div class="comprador-dados">
                  <h4>{{ venda.buyerName }}</h4>
                  <p>{{ venda.buyerPhone }}</p>
                  <div class="venda-meta">
                    <span class="numeros-count">
                      {{ venda.tickets.length }} número{{ venda.tickets.length > 1 ? 's' : '' }}
                    </span>
                    <span class="venda-date">{{ formatDate(venda.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="venda-numeros">
                <div class="numeros-container">
                  <span 
                    v-for="numero in venda.tickets.slice(0, 6)" 
                    :key="numero"
                    class="numero-badge-small"
                  >
                    {{ numero.toString().padStart(3, '0') }}
                  </span>
                  <span v-if="venda.tickets.length > 6" class="mais-numeros-small">
                    +{{ venda.tickets.length - 6 }}
                  </span>
                </div>
              </div>

              <div class="venda-valor">
                <div class="valor-principal">{{ formatCurrency(venda.totalAmount) }}</div>
                <span :class="['status-venda-badge', venda.status]">
                  {{ getStatusVenda(venda.status) }}
                </span>
              </div>

              <div class="venda-actions">
                <button 
                  v-if="venda.status === 'pending'"
                  @click.stop="confirmarVenda(venda.id)"
                  class="btn btn-success btn-sm"
                  title="Confirmar pagamento"
                >
                  ✅
                </button>
                <button 
                  v-if="['pending', 'confirmed'].includes(venda.status)"
                  @click.stop="cancelarVenda(venda.id)"
                  class="btn btn-danger btn-sm"
                  title="Cancelar venda"
                >
                  ❌
                </button>
                <button 
                  @click.stop="verDetalhesVenda(venda)"
                  class="btn btn-outline btn-sm"
                  title="Ver detalhes"
                >
                  👁️
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Nenhuma venda encontrada</h3>
            <p v-if="temFiltros">Tente ajustar os filtros para encontrar vendas</p>
            <p v-else>Esta rifa ainda não possui vendas</p>
            <button v-if="temFiltros" @click="limparFiltros" class="btn btn-outline">
              🗑️ Limpar Filtros
            </button>
          </div>
        </div>

        <!-- ✅ MELHORADO: Mapa de Números -->
        <div class="content-card">
          <div class="card-header">
            <h2>🎯 Mapa de Números</h2>
            <div class="legenda-enhanced">
              <div class="legenda-item">
                <div class="legenda-color disponivel"></div>
                <span>{{ numerosDisponiveis }} Disponível{{ numerosDisponiveis !== 1 ? 'eis' : '' }}</span>
              </div>
              <div class="legenda-item">
                <div class="legenda-color vendido"></div>
                <span>{{ numerosVendidos }} Vendido{{ numerosVendidos !== 1 ? 's' : '' }}</span>
              </div>
              <div class="legenda-item">
                <div class="legenda-color reservado"></div>
                <span>{{ numerosReservados }} Reservado{{ numerosReservados !== 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>

          <div class="numeros-container-enhanced">
            <div class="numeros-grid-enhanced">
              <div 
                v-for="numero in numerosGrid" 
                :key="numero.numero"
                :class="['numero-cell-enhanced', numero.status]"
                :title="`Número ${numero.numero.toString().padStart(3, '0')} - ${numero.status}`"
              >
                {{ numero.numero.toString().padStart(3, '0') }}
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ MELHORADO: Ações Rápidas -->
        <div class="content-card">
          <div class="card-header">
            <h2>⚡ Ações Rápidas</h2>
          </div>
          <div class="actions-grid-enhanced">
            <button @click="gerarRelatorio" class="action-card-enhanced">
              <div class="action-icon-enhanced">📊</div>
              <div class="action-content">
                <h3>Gerar Relatório</h3>
                <p>Baixar relatório completo de vendas em formato JSON</p>
              </div>
            </button>
            
            <button @click="enviarLink" class="action-card-enhanced">
              <div class="action-icon-enhanced">📤</div>
              <div class="action-content">
                <h3>Compartilhar Link</h3>
                <p>Copiar link da rifa para compartilhar com clientes</p>
              </div>
            </button>
            
            <button 
              @click="realizarSorteio" 
              class="action-card-enhanced"
              :class="{ 'disabled': !podeRealizarSorteio }"
              :disabled="!podeRealizarSorteio"
            >
              <div class="action-icon-enhanced">🎲</div>
              <div class="action-content">
                <h3>Realizar Sorteio</h3>
                <p v-if="podeRealizarSorteio">Sortear o número ganhador agora</p>
                <p v-else class="text-muted">Aguardando data de término ou vendas</p>
              </div>
            </button>
            
            <button @click="$router.push(`/rifas/${rifa.id}`)" class="action-card-enhanced">
              <div class="action-icon-enhanced">⚙️</div>
              <div class="action-content">
                <h3>Configurações</h3>
                <p>Editar dados e configurações da rifa</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- ✅ CORRIGIDO: Modal de Rifa Indisponível -->
      <div v-if="showUnavailableModal" class="modal-overlay" @click="handleModalOverlayClick">
        <div class="modal-container unavailable-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-icon unavailable">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,9H14V4H19V9Z"/>
              </svg>
            </div>
            <div class="modal-title">
              <h3>Rifa indisponível para gerenciamento</h3>
              <p>Esta rifa não pode ser gerenciada no momento</p>
            </div>
            <!-- ✅ CORRIGIDO: Botão de fechar com redirecionamento -->
            <button @click="closeUnavailableModal" class="modal-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="unavailable-details">
              <!-- Status da rifa -->
              <div class="status-info-card">
                <div class="status-icon">🚫</div>
                <div class="status-content">
                  <h4>Status atual da rifa</h4>
                  <span :class="['status-badge-modal', unavailableReason?.status || 'cancelled']">
                    {{ getStatusText(unavailableReason?.status || 'cancelled') }}
                  </span>
                </div>
              </div>

              <!-- Motivo da indisponibilidade -->
              <div class="reason-card">
                <div class="reason-icon">💡</div>
                <div class="reason-content">
                  <h4>Por que não posso gerenciar?</h4>
                  <div class="reason-list">
                    <div class="reason-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                      </svg>
                      <span v-if="unavailableReason?.status === 'cancelled'">
                        Rifas canceladas não podem ser gerenciadas
                      </span>
                      <span v-else-if="unavailableReason?.status === 'deleted'">
                        Esta rifa foi removida do sistema
                      </span>
                      <span v-else>
                        Rifa não está disponível para visualização
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ações disponíveis -->
              <div class="available-actions-card">
                <div class="actions-icon">⚡</div>
                <div class="actions-content">
                  <h4>O que você pode fazer</h4>
                  <div class="actions-list">
                    <div class="action-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10,4H14V6H10V4M4,6V8H20V6H4M5,10V21H9V14H15V21H19V10H5Z"/>
                      </svg>
                      <span>Voltar à lista de rifas</span>
                    </div>
                    <div v-if="unavailableReason?.status === 'cancelled'" class="action-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                      </svg>
                      <span>Criar uma nova rifa</span>
                    </div>
                    <div class="action-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20,18C20.5,18 21,17.5 21,17C21,16.5 20.5,16 20,16C19.5,16 19,16.5 19,17C19,17.5 19.5,18 20,18M20,10V15L18.5,13.5C17.3,14.7 15.7,15.3 14,15.3C10.1,15.3 7,12.2 7,8.3C7,4.4 10.1,1.3 14,1.3C17.9,1.3 21,4.4 21,8.3H19C19,5.5 16.8,3.3 14,3.3C11.2,3.3 9,5.5 9,8.3C9,11.1 11.2,13.3 14,13.3C15.4,13.3 16.6,12.7 17.5,11.8L16,10.3L20,10.3V10Z"/>
                      </svg>
                      <span>Atualizar lista e tentar novamente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <!-- ✅ CORRIGIDO: Botão Voltar à Lista agora usa closeUnavailableModal -->
            <button @click="closeUnavailableModal" class="btn btn-outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              Voltar à Lista
            </button>
            <button v-if="unavailableReason?.status === 'cancelled'" @click="criarNovaRifa" class="btn btn-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Criar Nova Rifa
            </button>
            <button v-else @click="atualizarEVoltar" class="btn btn-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
              Atualizar e Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { rifasAPI, reportsAPI } from '@/service/api'
import { useMessage } from '@/composables/message'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const { showMessage } = useMessage()

// ✅ Estados existentes
const isLoading = ref(true)
const isUpdatingStatus = ref(false)

// ✅ NOVO: Estados para modal de indisponibilidade
const showUnavailableModal = ref(false)
const unavailableReason = ref(null)

// ✅ Dados da rifa (existente)
const rifa = ref({
  id: '',
  title: '',
  description: '',
  ticketPrice: 0,
  totalTickets: 0,
  soldTickets: 0,
  progress: 0,
  revenue: 0,
  status: 'draft',
  endDate: null,
  createdAt: null,
  updatedAt: null,
  drawType: '',
  prizes: [],
  settings: {},
  owner: '',
  platformFee: 0,
  estimatedRevenue: 0,
  availableTickets: 0
})

const vendas = ref([])
const filtroStatus = ref('')
const termoBusca = ref('')

// ✅ Computeds existentes (mantidos)
const faturamentoMaximo = computed(() => {
  return (rifa.value.totalTickets || 0) * (rifa.value.ticketPrice || 0)
})

const compradores = computed(() => {
  const uniqueCompradores = new Set()
  vendas.value.forEach(venda => {
    if (venda.status !== 'cancelled') {
      uniqueCompradores.add(venda.buyerPhone)
    }
  })
  return Array.from(uniqueCompradores)
})

const vendasFiltradas = computed(() => {
  let resultado = [...vendas.value]

  if (filtroStatus.value) {
    resultado = resultado.filter(venda => venda.status === filtroStatus.value)
  }

  if (termoBusca.value) {
    const termo = termoBusca.value.toLowerCase()
    resultado = resultado.filter(venda => {
      const nome = (venda.buyerName || '').toLowerCase()
      const telefone = (venda.buyerPhone || '').toLowerCase()
      return nome.includes(termo) || telefone.includes(termo)
    })
  }

  return resultado.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const temFiltros = computed(() => {
  return filtroStatus.value || termoBusca.value
})

// ✅ SIMPLIFICADO: Grid de números mais simples
const numerosGrid = computed(() => {
  const grid = []
  const numerosVendidos = new Set()

  vendas.value.forEach(venda => {
    if (venda.status === 'confirmed' || venda.status === 'paid') {
      venda.tickets?.forEach(numero => numerosVendidos.add(numero))
    }
  })

  for (let i = 1; i <= (rifa.value.totalTickets || 0); i++) {
    grid.push({
      numero: i,
      status: numerosVendidos.has(i) ? 'vendido' : 'disponivel'
    })
  }

  return grid
})

const numerosVendidos = computed(() => {
  return numerosGrid.value.filter(n => n.status === 'vendido').length
})

const numerosDisponiveis = computed(() => {
  return numerosGrid.value.filter(n => n.status === 'disponivel').length
})

const numerosReservados = computed(() => {
  return vendas.value.filter(venda => 
    venda.status === 'pending'
  ).reduce((total, venda) => total + (venda.tickets?.length || 0), 0)
})

const tempoRestante = computed(() => {
  // ✅ Usar drawDate da API ou endDate como fallback
  const dataFim = rifa.value.endDate || rifa.value.drawDate
  
  if (!dataFim) return 'Não definido'
  
  try {
    const agora = new Date()
    const fim = new Date(dataFim)
    const diff = fim - agora

    if (diff <= 0) return 'Encerrada'

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (dias > 0) {
      return `${dias} dia${dias > 1 ? 's' : ''} restante${dias > 1 ? 's' : ''}`
    } else {
      const horas = Math.floor(diff / (1000 * 60 * 60))
      return `${horas}h restantes`
    }
  } catch (error) {
    return 'Erro no cálculo'
  }
})

const podeRealizarSorteio = computed(() => {
  return rifa.value.status === 'active' && 
         (rifa.value.soldTickets || 0) > 0 &&
         rifa.value.endDate && 
         new Date(rifa.value.endDate) <= new Date()
})

// ✅ SIMPLIFICADO: Funções utilitárias
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
    cancelled: 'Cancelada',
    deleted: 'Removida',
    not_found: 'Não encontrada'
  }
  return statusMap[status] || status
}

const getStatusVenda = (status) => {
  const statusMap = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    paid: 'Pago',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

// ✅ CORRIGIDO: Função de carregamento com mapeamento correto da API
const carregarDados = async () => {
  try {
    isLoading.value = true
    const rifaId = route.params.id
    
    console.log('🎯 Carregando dados da rifa:', rifaId)
    
    if (!rifaId) {
      throw new Error('ID da rifa não encontrado na URL')
    }
    
    // Fazer requisição para carregar dados
    const rifaResponse = await rifasAPI.get(rifaId)
    console.log('📥 Resposta da API:', rifaResponse.data)
    
    // ✅ NOVO: Verificar se a resposta indica rifa indisponível
    if (!rifaResponse.data.success && rifaResponse.data.message) {
      const message = rifaResponse.data.message.toLowerCase()
      
      // Detectar diferentes tipos de indisponibilidade
      if (message.includes('não está disponível') || 
          message.includes('cancelada') || 
          message.includes('removida') ||
          message.includes('não encontrada')) {
        
        // Determinar o status provável baseado na mensagem
        let status = 'cancelled'
        if (message.includes('removida') || message.includes('deletada')) {
          status = 'deleted'
        } else if (message.includes('não encontrada')) {
          status = 'not_found'
        }
        
        // Configurar dados para o modal
        unavailableReason.value = {
          status: status,
          message: rifaResponse.data.message,
          rifaId: rifaId
        }
        
        // Mostrar modal de indisponibilidade
        showUnavailableModal.value = true
        isLoading.value = false
        return
      }
    }
    
    // ✅ Continuar com o processamento normal se a rifa estiver disponível
    let rifaData = null
    
    if (rifaResponse.data && rifaResponse.data.success === true) {
      rifaData = rifaResponse.data.data?.raffle || rifaResponse.data.data
      console.log('✅ Dados da rifa extraídos:', rifaData)
    } else if (rifaResponse.data?.data) {
      rifaData = rifaResponse.data.data
      console.log('✅ Dados extraídos de data:', rifaData)
    } else if (rifaResponse.data?.id) {
      rifaData = rifaResponse.data
      console.log('✅ Dados diretos:', rifaData)
    }
    
    if (!rifaData?.id) {
      console.error('❌ Dados da rifa inválidos:', rifaData)
      throw new Error('Dados da rifa não encontrados')
    }
    
    console.log('🎯 Dados processados da rifa:', rifaData)
    
    // ✅ MAPEAR dados (código existente mantido)
    Object.assign(rifa.value, {
      id: rifaData.id,
      title: rifaData.title || 'Rifa sem nome',
      description: rifaData.description || '',
      ticketPrice: parseFloat(rifaData.ticketPrice || 0),
      totalTickets: parseInt(rifaData.totalTickets || 0),
      soldTickets: parseInt(rifaData.soldTickets || 0),
      progress: parseFloat(rifaData.progress || 0),
      revenue: parseFloat(rifaData.revenue || 0),
      status: rifaData.status || 'draft',
      endDate: rifaData.drawDate || rifaData.endDate,
      createdAt: rifaData.createdAt,
      updatedAt: rifaData.updatedAt,
      drawType: rifaData.drawType,
      prizes: rifaData.prizes || [],
      settings: rifaData.settings || {},
      owner: rifaData.owner,
      platformFee: rifaData.platformFee || 0,
      estimatedRevenue: rifaData.estimatedRevenue || 0,
      availableTickets: rifaData.availableTickets || 0
    })
    
    // ✅ CALCULAR campos derivados (código existente)
    if (!rifa.value.progress && rifa.value.totalTickets > 0) {
      rifa.value.progress = (rifa.value.soldTickets / rifa.value.totalTickets) * 100
    }
    
    if (!rifa.value.revenue && rifa.value.soldTickets > 0) {
      rifa.value.revenue = rifa.value.soldTickets * rifa.value.ticketPrice
    }
    
    console.log('✅ Dados da rifa mapeados:', rifa.value)
    
    // ✅ CARREGAR vendas (código existente mantido)
    try {
      console.log('💳 Carregando vendas...')
      const vendasResponse = await reportsAPI.getSales({ raffleId: rifaId })
      console.log('📥 Resposta vendas:', vendasResponse.data)
      
      let vendasData = []
      
      if (vendasResponse.data?.success === true) {
        vendasData = vendasResponse.data.data || vendasResponse.data.sales || []
      } else if (Array.isArray(vendasResponse.data?.data)) {
        vendasData = vendasResponse.data.data
      } else if (Array.isArray(vendasResponse.data)) {
        vendasData = vendasResponse.data
      }
      
      vendas.value.splice(0, vendas.value.length, ...vendasData.map(venda => ({
        id: venda.id || venda._id,
        buyerName: venda.buyerName || venda.buyer?.name || venda.customerName || 'N/A',
        buyerPhone: venda.buyerPhone || venda.buyer?.phone || venda.customerPhone || 'N/A',
        buyerEmail: venda.buyerEmail || venda.buyer?.email || venda.customerEmail || '',
        tickets: venda.tickets || venda.numbers || venda.selectedNumbers || [],
        totalAmount: parseFloat(venda.totalAmount || venda.amount || venda.total || 0),
        status: venda.status || 'pending',
        createdAt: venda.createdAt || venda.purchaseDate,
        paymentMethod: venda.paymentMethod || 'PIX'
      })))
      
      console.log(`✅ ${vendas.value.length} vendas processadas`)
      
    } catch (vendasError) {
      console.warn('⚠️ Erro ao carregar vendas (continuando):', vendasError)
      vendas.value.splice(0)
    }
    
    console.log('🎉 Carregamento concluído com sucesso!')
    await nextTick()
    
  } catch (error) {
    console.error('💥 Erro ao carregar dados:', error)
    
    let errorMessage = 'Erro ao carregar dados da rifa'
    let shouldShowUnavailable = false
    
    // ✅ NOVO: Verificar se é erro de rifa indisponível
    if (error.response?.status === 403 || error.response?.status === 404) {
      const message = error.response?.data?.message || ''
      
      if (message.includes('não está disponível') || 
          message.includes('cancelada') || 
          message.includes('removida')) {
        
        unavailableReason.value = {
          status: 'cancelled',
          message: message,
          rifaId: route.params.id
        }
        
        shouldShowUnavailable = true
      } else if (error.response?.status === 404) {
        unavailableReason.value = {
          status: 'not_found',
          message: 'Rifa não encontrada no sistema',
          rifaId: route.params.id
        }
        
        shouldShowUnavailable = true
      }
    }
    
    if (shouldShowUnavailable) {
      showUnavailableModal.value = true
    } else {
      // Erro técnico/genérico - manter comportamento original
      if (error.response?.status === 404) {
        errorMessage = 'Rifa não encontrada'
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para visualizar esta rifa'  
      } else if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada, faça login novamente'
      }
      
      showMessage(errorMessage, 'error')
      
      // Redirecionamento apenas para erros técnicos críticos
      if (error.response?.status === 404 || error.response?.status === 403) {
        setTimeout(() => {
          router.push('/rifas')
        }, 2000)
      }
    }
    
  } finally {
    isLoading.value = false
  }
}

// ✅ NOVAS FUNÇÕES: Modal de indisponibilidade
const closeUnavailableModal = () => {
  showUnavailableModal.value = false
  unavailableReason.value = null
  
  // ✅ SEMPRE redirecionar para a lista de rifas ao fechar o modal
  router.push('/rifas')
}

const voltarParaLista = () => {
  closeUnavailableModal()
  router.push('/rifas')
}

const criarNovaRifa = () => {
  closeUnavailableModal()
  router.push('/rifas/criar')
}

const atualizarEVoltar = async () => {
  closeUnavailableModal()
  showMessage('Atualizando lista de rifas...', 'info')
  router.push('/rifas')
}

// ✅ FUNÇÕES básicas
const confirmarVenda = async (vendaId) => {
  try {
    await reportsAPI.updateSaleStatus(vendaId, 'confirmed')
    const venda = vendas.value.find(v => v.id === vendaId)
    if (venda) venda.status = 'confirmed'
    showMessage('Venda confirmada!', 'success')
  } catch (error) {
    showMessage('Erro ao confirmar venda', 'error')
  }
}

const cancelarVenda = async (vendaId) => {
  if (confirm('Cancelar esta venda?')) {
    try {
      await reportsAPI.updateSaleStatus(vendaId, 'cancelled')
      const venda = vendas.value.find(v => v.id === vendaId)
      if (venda) venda.status = 'cancelled'
      showMessage('Venda cancelada', 'warning')
    } catch (error) {
      showMessage('Erro ao cancelar venda', 'error')
    }
  }
}

const limparFiltros = () => {
  filtroStatus.value = ''
  termoBusca.value = ''
}

const aplicarFiltros = () => {
  // Os filtros são reativos através do computed
}

const verDetalhesVenda = (venda) => {
  console.log('Ver detalhes da venda:', venda)
  showMessage('Funcionalidade de detalhes em desenvolvimento', 'info')
}

const gerarRelatorio = async () => {
  try {
    showMessage('Gerando relatório...', 'info')
    
    const response = await reportsAPI.getSales({
      raffleId: rifa.value.id,
      format: 'json'
    })
    
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
      type: 'application/json' 
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-rifa-${rifa.value.id}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showMessage('Relatório exportado com sucesso!', 'success')
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    showMessage('Erro ao gerar relatório', 'error')
  }
}

const enviarLink = () => {
  const link = `${window.location.origin}/rifa/${rifa.value.id}`
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      showMessage('Link copiado para a área de transferência!', 'success')
    }).catch(() => {
      showMessage(`Link: ${link}`, 'info')
    })
  } else {
    showMessage(`Link: ${link}`, 'info')
  }
}

const realizarSorteio = () => {
  if (!podeRealizarSorteio.value) {
    showMessage('Não é possível realizar o sorteio ainda', 'warning')
    return
  }
  
  showMessage('Funcionalidade de sorteio em desenvolvimento', 'info')
}

// ✅ ADICIONAR função para atualizar status
const atualizarStatus = async (novoStatus) => {
  try {
    // ✅ Validações específicas por status
    if (novoStatus === 'active') {
      if (!rifa.value.totalTickets || rifa.value.totalTickets <= 0) {
        showMessage('Configure a quantidade de números antes de ativar a rifa', 'error')
        return
      }
      if (!rifa.value.ticketPrice || rifa.value.ticketPrice <= 0) {
        showMessage('Defina o preço dos números antes de ativar a rifa', 'error')
        return
      }
    }

    // Confirmações específicas
    let mensagemConfirmacao = ''
    let tipoConfirmacao = 'info'

    switch (novoStatus) {
      case 'active':
        mensagemConfirmacao = 'Tem certeza que deseja ATIVAR esta rifa?\n\nEla ficará disponível para vendas imediatamente.'
        break
      case 'paused':
        mensagemConfirmacao = 'Tem certeza que deseja PAUSAR esta rifa?\n\nAs vendas serão interrompidas temporariamente.'
        tipoConfirmacao = 'warning'
        break
      case 'finished':
        mensagemConfirmacao = `Tem certeza que deseja FINALIZAR esta rifa?\n\n${rifa.value.soldTickets} números foram vendidos.\nApós finalizar, você poderá realizar o sorteio.`
        tipoConfirmacao = 'info'
        break
      case 'cancelled':
        mensagemConfirmacao = 'ATENÇÃO! Tem certeza que deseja CANCELAR esta rifa?\n\n⚠️ Esta ação NÃO PODE ser desfeita!\n⚠️ Todos os dados de venda serão mantidos para histórico.'
        tipoConfirmacao = 'danger'
        break
      case 'draft':
        mensagemConfirmacao = 'Reativar esta rifa como rascunho?\n\nEla voltará ao estado de edição.'
        break
      default:
        mensagemConfirmacao = `Alterar status para "${getStatusText(novoStatus)}"?`
    }

    const confirmacao = confirm(mensagemConfirmacao)
    if (!confirmacao) {
      return
    }

    isUpdatingStatus.value = true

    console.log('🔄 Atualizando status da rifa:', {
      rifaId: rifa.value.id,
      statusAtual: rifa.value.status,
      novoStatus: novoStatus
    })

    // ✅ Fazer requisição para API
    const response = await rifasAPI.updateStatus(rifa.value.id, novoStatus)

    if (response.data.success) {
      // ✅ Atualizar status local
      rifa.value.status = novoStatus
      
      // ✅ Mensagens de sucesso específicas
      let mensagemSucesso = ''
      switch (novoStatus) {
        case 'active':
          mensagemSucesso = '🚀 Rifa ativada com sucesso! Agora está disponível para vendas.'
          break
        case 'paused':
          mensagemSucesso = '⏸️ Rifa pausada. As vendas foram interrompidas.'
          break
        case 'finished':
          mensagemSucesso = '🏁 Rifa finalizada! Agora você pode realizar o sorteio.'
          break
        case 'cancelled':
          mensagemSucesso = '🗑️ Rifa cancelada permanentemente.'
          break
        case 'draft':
          mensagemSucesso = '📝 Rifa reativada como rascunho.'
          break
        default:
          mensagemSucesso = `Status alterado para "${getStatusText(novoStatus)}" com sucesso!`
      }
      
      showMessage(mensagemSucesso, 'success')

      // ✅ Recarregar dados para garantir sincronização
      await carregarDados()
      
    } else {
      throw new Error(response.data.message || 'Erro ao atualizar status')
    }

  } catch (error) {
    console.error('💥 Erro ao atualizar status:', error)
    
    let mensagemErro = 'Erro ao atualizar status da rifa'
    
    // ✅ Tratamento de erros específicos
    if (error.response?.status === 400) {
      mensagemErro = error.response.data?.message || 'Status inválido para esta rifa'
    } else if (error.response?.status === 403) {
      mensagemErro = 'Você não tem permissão para alterar o status desta rifa'
    } else if (error.response?.status === 404) {
      mensagemErro = 'Rifa não encontrada'
    } else if (error.message) {
      mensagemErro = error.message
    }
    
    showMessage(mensagemErro, 'error')
    
  } finally {
    isUpdatingStatus.value = false
  }
}

// ✅ EXECUTAR quando montar
onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
/* ===== ESTILOS EXISTENTES MANTIDOS ===== */
.gerenciar-rifa {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

/* ===== LOADING STATE ===== */
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

/* ===== HEADER DA RIFA ===== */
.rifa-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2.5rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.rifa-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.rifa-title-section {
  flex: 1;
}

.rifa-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rifa-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.rifa-header-status {
  margin-left: 2rem;
}

.status-badge-large {
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.status-badge-large.active,
.status-badge-large.ativo {
  background: rgba(220, 252, 231, 0.9);
  color: #166534;
  border-color: #22c55e;
}

.status-badge-large.draft,
.status-badge-large.rascunho {
  background: rgba(243, 244, 246, 0.9);
  color: #374151;
  border-color: #6b7280;
}

.status-badge-large.paused,
.status-badge-large.pausado {
  background: rgba(254, 243, 199, 0.9);
  color: #92400e;
  border-color: #f59e0b;
}

.header-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* ===== CONTROLE DE STATUS ===== */
.status-control-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f3f4;
  margin-bottom: 2rem;
}

.card-header {
  padding: 2rem 2.5rem 0 2.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  color: #1a1d29;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.current-status-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 600;
}

.status-badge-medium {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.status-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 0 2.5rem 2.5rem 2.5rem;
}

.status-action-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px solid #f1f3f4;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  background: #fafbfc;
}

.status-action-card:hover {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.1);
}

.status-action-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.status-action-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.status-requirements {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #374151;
}

.requirement-ok {
  color: #166534;
}

.requirement-error {
  color: #dc2626;
}

.status-warning {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #92400e;
}

/* ===== ESTATÍSTICAS PRINCIPAIS ===== */
.main-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-card-large {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f3f4;
  transition: all 0.3s ease;
}

.stat-card-large:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-icon-large {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-number-large {
  font-size: 3rem;
  font-weight: 800;
  color: #1a1d29;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label-large {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-details {
  margin-top: 1.5rem;
}

.progress-section {
  margin-bottom: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 600;
}

.progress-percent {
  font-size: 1.25rem;
  font-weight: 700;
  color: #667eea;
}

.progress-bar-large {
  height: 12px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill-large {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.8s ease;
  border-radius: 6px;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 1rem;
  color: #1a1d29;
  font-weight: 600;
}

/* ===== DETALHES DA RIFA ===== */
.rifa-details-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f3f4;
  margin-bottom: 2rem;
}

.card-header {
  padding: 2rem 2.5rem 0 2.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  color: #1a1d29;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 0 2.5rem 2.5rem 2.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8faff;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.detail-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 600;
}

.detail-value {
  font-size: 1rem;
  color: #1a1d29;
  font-weight: 700;
  text-align: right;
}

.detail-value.mono {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: 0.9rem;
}

.text-warning {
  color: #f59e0b !important;
}

.text-danger {
  color: #ef4444 !important;
}

.text-muted {
  color: #9ca3af;
  font-style: italic;
}

/* ===== CONTENT CARDS ===== */
.content-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #f1f3f4;
  margin-bottom: 2rem;
}

/* ===== FILTROS ===== */
.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.filters select,
.search-input {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
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
  min-width: 280px;
  flex: 1;
}

/* ===== VENDAS MELHORADAS ===== */
.vendas-list {
  padding: 0 2.5rem 2.5rem;
}

.venda-item-enhanced {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  border: 1px solid #f1f3f4;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
  background: #fafbfc;
}

.venda-item-enhanced:hover {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.1);
}

.comprador-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.comprador-dados h4 {
  color: #1a1d29;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.comprador-dados p {
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.venda-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.numeros-count {
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 700;
  background: rgba(102, 126, 234, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.venda-date {
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 500;
}

.venda-numeros {
  flex: 1.5;
}

.numeros-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.numero-badge-small {
  background: #f1f5f9;
  color: #374151;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  border: 1px solid #e5e7eb;
}

.mais-numeros-small {
  background: #667eea;
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.venda-valor {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.valor-principal {
  font-size: 1.4rem;
  font-weight: 800;
  color: #059669;
}

.status-venda-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-venda-badge.pending,
.status-venda-badge.pendente {
  background: #fef3c7;
  color: #92400e;
}

.status-venda-badge.confirmed,
.status-venda-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.status-venda-badge.cancelled,
.status-venda-badge.cancelado {
  background: #fee2e2;
  color: #dc2626;
}

.venda-actions {
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
}

/* ===== MAPA DE NÚMEROS MELHORADO ===== */
.legenda-enhanced {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.legenda-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 600;
}

.legenda-color {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid;
}

.legenda-color.disponivel {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.legenda-color.vendido {
  background: #dcfce7;
  border-color: #22c55e;
}

.legenda-color.reservado {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.numeros-container-enhanced {
  padding: 0 2.5rem 2.5rem;
}

.numeros-grid-enhanced {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8faff;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
}

.numero-cell-enhanced {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
  border: 2px solid;
  transition: all 0.2s ease;
  cursor: pointer;
}

.numero-cell-enhanced.disponivel {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
}

.numero-cell-enhanced.disponivel:hover {
  border-color: #667eea;
  background: #f8faff;
}

.numero-cell-enhanced.vendido {
  background: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}

.numero-cell-enhanced.reservado {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

/* ===== AÇÕES RÁPIDAS MELHORADAS ===== */
.actions-grid-enhanced {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 0 2.5rem 2.5rem;
}

.action-card-enhanced {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 2rem;
  border: 2px solid #f1f3f4;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  background: white;
}

.action-card-enhanced:hover:not(.disabled) {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-4px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.15);
}

.action-card-enhanced.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.action-icon-enhanced {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.action-card-enhanced.disabled .action-icon-enhanced {
  background: #e5e7eb;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  color: #1a1d29;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.action-content p {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* ===== BOTÕES ===== */
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

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-outline {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover {
  background: #16a34a;
  transform: translateY(-1px);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.empty-state p {
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
}

/* ===== RESPONSIVIDADE ===== */
@media (max-width: 768px) {
  .gerenciar-rifa {
    padding: 0.5rem;
  }
  
  .rifa-header {
    padding: 2rem;
  }
  
  .rifa-header-content {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .rifa-title {
    font-size: 2rem;
  }
  
  .header-actions {
    justify-content: center;
    width: 100%;
  }
  
  .main-stats {
    grid-template-columns: 1fr;
  }
  
  .stat-header {
    gap: 1rem;
  }
  
  .stat-number-large {
    font-size: 2.5rem;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    padding: 1.5rem 2rem 0 2rem;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .vendas-list {
    padding: 0 1.5rem 2rem;
  }
  
   
  .venda-item-enhanced {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .venda-numeros,
  .venda-valor {
    width: 100%;
    text-align: center;
  }
  
  .numeros-container-enhanced {
    padding: 0 1.5rem  2rem;
  }
  
  .numeros-grid-enhanced {
    grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
    gap: 0.5rem;
  }
  
  .actions-grid-enhanced {
    grid-template-columns: 1fr;
    padding: 0 1.5rem 2rem;
  }
  
  .action-card-enhanced {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .legenda-enhanced {
    justify-content: center;
    gap: 1rem;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .rifa-title {
    font-size: 1.75rem;
  }
  
  .stat-number-large {
    font-size: 2rem;
  }
  
  .card-header {
    padding: 1rem 1.5rem 0 1.5rem;
  }
  
  .vendas-list,
  .numeros-container-enhanced,
  .actions-grid-enhanced {
    padding: 0 1rem 1.5rem;
  }
  
  .detail-item {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
}

/* ===== NOVO: Estilos do Modal (copiados da MinhasRifas.vue) ===== */
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

.modal-container.unavailable-modal {
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

/* ===== HEADER DO MODAL ===== */
.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0;
  position: relative;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
  margin: 0;
  border-radius: 16px 16px 0 0;
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

.modal-icon.unavailable {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid #ef4444;
}

.modal-title {
  flex: 1;
}

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

/* ===== CORPO DO MODAL ===== */
.modal-body {
  padding: 1.5rem;
  background: white;
}

.unavailable-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-info-card,
.reason-card,
.available-actions-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.status-info-card {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #f87171;
}

.reason-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  border-color: #fbbf24;
}

.available-actions-card {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0ea5e9;
}

.status-icon,
.reason-icon,
.actions-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.status-content,
.reason-content,
.actions-content {
  flex: 1;
}

.status-content h4,
.reason-content h4,
.actions-content h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
}

.status-badge-modal {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.status-badge-modal.cancelled {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #ef4444;
}

.status-badge-modal.deleted {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #9ca3af;
}

.status-badge-modal.not_found {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.reason-list,
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reason-item,
.action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

.reason-item svg {
  color: #f59e0b;
  flex-shrink: 0;
}

.action-item svg {
  color: #0ea5e9;
  flex-shrink: 0;
}

/* ===== FOOTER DO MODAL ===== */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  margin: 0;
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

/* ===== RESPONSIVIDADE DO MODAL ===== */
@media (max-width: 640px) {
  .unavailable-modal {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .status-info-card,
  .reason-card,
  .available-actions-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modal-footer .btn {
    width: 100%;
    justify-content: center;
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

/* ===== LOADING SPINNER ===== */
.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.status-updating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 8px;
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

/* ===== MELHORIAS VISUAIS ===== */
.modal-header {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
}

.unavailable-details {
  position: relative;
}

.status-info-card::before,
.reason-card::before,
.available-actions-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  pointer-events: none;
}

.status-info-card,
.reason-card,
.available-actions-card {
  position: relative;
  overflow: hidden;
}

.status-info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
</style>