<!-- filepath: src/views/Dashboard.vue -->
<template>
  <AdminLayout>
    <div class="dashboard">
      <!-- Header responsivo - Ajustado -->
      <div class="dashboard-header desktop-only">
        <div class="header-content">
          <h1>Dashboard</h1>
          <p>Visão geral das suas rifas e vendas</p>
        </div>
      </div>

      <!-- ✅ NOVO: Quick Actions Mobile - No topo -->
      <div class="mobile-quick-actions mobile-only">
        <router-link to="/rifas/criar" class="quick-action-btn primary">
          <span class="action-icon">➕</span>
          <span class="action-text">Nova Campanha</span>
        </router-link>
        <router-link to="/rifas" class="quick-action-btn secondary">
          <span class="action-icon">🎯</span>
          <span class="action-text">Minhas Campanhas</span>
        </router-link>
        <router-link to="/vendas" class="quick-action-btn secondary">
          <span class="action-icon">💰</span>
          <span class="action-text">Vendas</span>
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar dados</h3>
        <p>{{ error }}</p>
        <button @click="carregarDashboard" class="btn btn-primary">
          🔄 Tentar Novamente
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="dashboard-content">
        <!-- ✅ CORRIGIDO: Stats Cards sem duplicação de texto -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-content">
              <div class="stat-number">{{ dashboardStats.totalActiveRaffles }}</div>
              <div class="stat-label">Campanhas Ativas</div>
            </div>
            <div class="stat-icon">🎯</div>
          </div>

          <div class="stat-card success">
            <div class="stat-content">
              <div class="stat-number">{{ formatCurrency(dashboardStats.monthlyRevenue) }}</div>
              <div class="stat-label">Receita do Mês</div>
            </div>
            <div class="stat-icon">💰</div>
          </div>

          <div class="stat-card info">
            <div class="stat-content">
              <div class="stat-number">{{ dashboardStats.totalTicketsSold }}</div>
              <div class="stat-label">Números Vendidos</div>
            </div>
            <div class="stat-icon">🎫</div>
          </div>

          <div class="stat-card warning">
            <div class="stat-content">
              <div class="stat-number">{{ Math.round(dashboardStats.conversionRate) }}%</div>
              <div class="stat-label">Taxa de Conversão</div>
            </div>
            <div class="stat-icon">📈</div>
          </div>
        </div>

        <!-- ✅ CORRIGIDO: Rifas Recentes com navegação funcional -->
        <div class="content-card">
          <div class="card-header">
            <h2>Rifas Recentes</h2>
            <router-link to="/rifas" class="btn btn-outline btn-sm">
              Ver Todas
            </router-link>
          </div>

          <div v-if="rifasRecentes.length > 0" class="rifas-list">
            <div 
              v-for="rifa in rifasRecentes" 
              :key="rifa.id"
              class="rifa-item"
              @click="navegarParaRifa(rifa)"
            >
              <!-- Mobile Layout -->
              <div class="rifa-mobile mobile-only">
                <div class="rifa-header">
                  <h4>{{ rifa.title || rifa.name }}</h4>
                  <span :class="['status-badge', rifa.status]">
                    {{ getStatusText(rifa.status) }}
                  </span>
                </div>
                <div class="rifa-stats">
                  <div class="stat">
                    <span class="label">Progresso:</span>
                    <span class="value">{{ Math.round(calculateProgress(rifa)) }}%</span>
                  </div>
                  <div class="stat">
                    <span class="label">Receita:</span>
                    <span class="value success">{{ formatCurrency(calculateRevenue(rifa)) }}</span>
                  </div>
                </div>
                <div class="rifa-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${calculateProgress(rifa)}%` }"
                    ></div>
                  </div>
                  <div class="progress-text">
                    {{ rifa.soldTickets || rifa.tickets_sold || 0 }}/{{ rifa.totalTickets || rifa.total_tickets || 0 }}
                  </div>
                </div>
              </div>

              <!-- Desktop Layout -->
              <div class="rifa-desktop desktop-only">
                <div class="rifa-image">
                  <div class="image-placeholder">
                    <div class="placeholder-icon">🎯</div>
                    <div class="placeholder-text">{{ rifa.title || rifa.name || 'Rifa' }}</div>
                  </div>
                </div>
                
                <div class="rifa-info">
                  <h4>{{ rifa.title || rifa.name }}</h4>
                  <p class="rifa-premio">Prêmio: {{ formatCurrency(calculateTotalPrize(rifa)) }}</p>
                  <div class="rifa-progress">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: `${calculateProgress(rifa)}%` }"
                      ></div>
                    </div>
                    <span class="progress-text">
                      {{ rifa.soldTickets || rifa.tickets_sold || 0 }}/{{ rifa.totalTickets || rifa.total_tickets || 0 }} 
                      ({{ Math.round(calculateProgress(rifa)) }}%)
                    </span>
                  </div>
                </div>
                <div class="rifa-status">
                  <span :class="['status-badge', rifa.status]">
                    {{ getStatusText(rifa.status) }}
                  </span>
                  <span class="rifa-revenue">{{ formatCurrency(calculateRevenue(rifa)) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>Nenhuma rifa criada ainda</h3>
            <p>Crie sua primeira rifa para começar a vender</p>
            <router-link to="/rifas/criar" class="btn btn-primary">
              ➕ Criar Primeira Rifa
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { reportsAPI, rifasAPI } from '@/service/api'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const dashboardStats = ref({
  totalActiveRaffles: 0,
  monthlyRevenue: 0,
  totalTicketsSold: 0,
  conversionRate: 0,
  totalRaffles: 0,
  totalRevenue: 0
})

const rifasRecentes = ref([])
const isLoading = ref(true)
const error = ref('')

// ✅ CORRIGIDO: Função para navegar para a rifa
const navegarParaRifa = (rifa) => {
  console.log('🔗 Navegando para rifa:', rifa)
  
  if (!rifa || !rifa.id) {
    console.warn('⚠️ Rifa inválida:', rifa)
    return
  }
  
  try {
    // ✅ CORREÇÃO: Usar a rota correta sem "/gerenciar"
    router.push(`/rifas/${rifa.id}`)
  } catch (error) {
    console.error('💥 Erro ao navegar:', error)
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatPercentage = (value) => {
  return `${(value || 0).toFixed(1)}%`
}

const getStatusText = (status) => {
  const statusMap = {
    active: 'Ativa',
    ativo: 'Ativa',
    pending: 'Pendente',
    paused: 'Pausada',
    pausado: 'Pausada',
    finished: 'Finalizada',
    finalizado: 'Finalizada',
    cancelled: 'Cancelada',
    cancelado: 'Cancelada',
    draft: 'Rascunho'
  }
  return statusMap[status] || status
}

const calculateProgress = (rifa) => {
  const sold = rifa.soldTickets || rifa.tickets_sold || 0
  const total = rifa.totalTickets || rifa.total_tickets || 1
  return Math.min((sold / total) * 100, 100)
}

const calculateRevenue = (rifa) => {
  const sold = rifa.soldTickets || rifa.tickets_sold || 0
  const price = rifa.ticketPrice || rifa.ticket_price || 0
  return sold * price
}

const calculateTotalPrize = (rifa) => {
  return (rifa.ticketPrice || rifa.ticket_price || 0) * (rifa.totalTickets || rifa.total_tickets || 0)
}

const carregarDashboard = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    console.log('📊 Carregando dashboard...')
    
    // Carregar dados do dashboard
    const [dashboardResponse, rifasResponse] = await Promise.all([
      reportsAPI.getDashboard(),
      rifasAPI.listMyRaffles({ limit: 5, sort: 'createdAt', order: 'desc' })
    ])
    
    console.log('📥 Respostas recebidas:', {
      dashboard: dashboardResponse.data,
      rifas: rifasResponse.data
    })
    
    // Processar dados do dashboard
    if (dashboardResponse.data && dashboardResponse.data.success) {
      dashboardStats.value = {
        totalActiveRaffles: dashboardResponse.data.data.totalActiveRaffles || 0,
        monthlyRevenue: dashboardResponse.data.data.monthlyRevenue || 0,
        totalTicketsSold: dashboardResponse.data.data.totalTicketsSold || 0,
        conversionRate: dashboardResponse.data.data.conversionRate || 0,
        totalRaffles: dashboardResponse.data.data.totalRaffles || 0,
        totalRevenue: dashboardResponse.data.data.totalRevenue || 0
      }
    } else {
      // Fallback se a estrutura for diferente
      const data = dashboardResponse.data.data || dashboardResponse.data
      dashboardStats.value = {
        totalActiveRaffles: data.totalActiveRaffles || data.total_active_raffles || 0,
        monthlyRevenue: data.monthlyRevenue || data.monthly_revenue || 0,
        totalTicketsSold: data.totalTicketsSold || data.total_tickets_sold || 0,
        conversionRate: data.conversionRate || data.conversion_rate || 0,
        totalRaffles: data.totalRaffles || data.total_raffles || 0,
        totalRevenue: data.totalRevenue || data.total_revenue || 0
      }
    }
    
    // ✅ CORRIGIDO: Processar rifas recentes garantindo que tenham ID
    let rifasData = []
    if (rifasResponse.data && rifasResponse.data.success) {
      rifasData = rifasResponse.data.data || rifasResponse.data.raffles || []
    } else {
      rifasData = rifasResponse.data.data || rifasResponse.data || []
    }
    
    // ✅ GARANTIR que todas as rifas tenham ID válido
    rifasRecentes.value = rifasData
      .filter(rifa => rifa && (rifa.id || rifa._id))
      .map(rifa => ({
        ...rifa,
        id: rifa.id || rifa._id, // Garantir que sempre tenha ID
        title: rifa.title || rifa.name || 'Rifa sem nome'
      }))
    
    console.log('✅ Rifas processadas:', rifasRecentes.value)
    
  } catch (err) {
    console.error('💥 Erro ao carregar dashboard:', err)
    error.value = err.message || 'Erro ao carregar dados do dashboard'
    
    // Em caso de erro, manter dados vazios em vez de dados mockados
    dashboardStats.value = {
      totalActiveRaffles: 0,
      monthlyRevenue: 0,
      totalTicketsSold: 0,
      conversionRate: 0,
      totalRaffles: 0,
      totalRevenue: 0
    }
    rifasRecentes.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  carregarDashboard()
})
</script>

<style scoped>
/* ===== MANTER TODOS OS ESTILOS EXISTENTES ===== */
.dashboard {
  width: 100%;
  max-width: 100%;
}

.dashboard-header {
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

/* ✅ CORRIGIDO: Stats Grid sem diferenciação mobile/desktop nos textos */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
    border-radius: 12px;
  }
  
  .stat-number {
    font-size: 1.25rem;
  }
  
  .stat-label {
    font-size: 0.7rem;
  }
  
  .stat-icon {
    font-size: 1.5rem;
  }
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  cursor: pointer;
}

@media (max-width: 768px) {
  .stat-card {
    padding: 1.5rem;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .stat-card {
    padding: 1rem;
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1;
  margin-bottom: 0.25rem;
}

@media (max-width: 768px) {
  .stat-number {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .stat-number {
    font-size: 1.5rem;
  }
}

/* ✅ CORRIGIDO: Label único para todas as telas */
.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

@media (max-width: 480px) {
  .stat-label {
    font-size: 0.7rem;
  }
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.7;
}

@media (max-width: 480px) {
  .stat-icon {
    font-size: 2rem;
  }
}

/* ✅ CORRIGIDO: Rifas List - Garantir clicabilidade */
.rifas-list {
  space-y: 1rem;
}

.rifa-item {
  background: white;
  border-radius: 12px;
  border: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 1rem;
  position: relative;
  user-select: none; /* Evitar seleção de texto */
}

.rifa-item:hover {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.rifa-item:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

/* Mobile Layout */
.rifa-mobile {
  padding: 1rem;
  pointer-events: auto; /* Garantir eventos de clique */
}

.rifa-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.rifa-header h4 {
  margin: 0;
  color: #1a1d29;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
}

.rifa-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.rifa-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rifa-stats .label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.rifa-stats .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1d29;
}

.rifa-stats .value.success {
  color: #059669;
}

.rifa-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

/* Desktop Layout */
.rifa-desktop {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  pointer-events: auto; /* Garantir eventos de clique */
}

.rifa-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

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
  padding: 0.5rem;
  border-radius: 8px;
}

.placeholder-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  opacity: 0.7;
}

.placeholder-text {
  font-weight: 600;
  font-size: 0.65rem;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rifa-info {
  flex: 1;
  min-width: 0;
}

.rifa-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1a1d29;
  font-size: 1rem;
  font-weight: 600;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.rifa-premio {
  margin: 0 0 0.75rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.rifa-desktop .progress-bar {
  height: 4px;
  margin-bottom: 0.25rem;
}

.rifa-desktop .progress-text {
  font-size: 0.75rem;
  text-align: left;
}

.rifa-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  text-align: right;
}

.rifa-revenue {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .status-badge {
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
    border-radius: 16px;
  }
}

.status-badge.active,
.status-badge.ativo {
  background: #dcfce7;
  color: #166534;
}

.status-badge.pending,
.status-badge.pendente {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.paused,
.status-badge.pausado {
  background: #fee2e2;
  color: #dc2626;
}

/* Content Cards */
.content-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .content-card {
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #f1f3f4;
}

@media (max-width: 768px) {
  .card-header {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: 1rem;
  }
}

.card-header h2 {
  margin: 0;
  color: #1a1d29;
  font-size: 1.5rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .card-header h2 {
    font-size: 1.25rem;
  }
}

/* Loading & Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 300px;
}

@media (max-width: 768px) {
  .loading-state,
  .error-state {
    padding: 3rem 1rem;
    min-height: 250px;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 768px) {
  .empty-state {
    padding: 3rem 1rem;
  }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
}

.empty-state h3 {
  color: #1a1d29;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .empty-state h3 {
    font-size: 1.25rem;
  }
}

.empty-state p {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .empty-state p {
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ✅ NOVO: Mobile Quick Actions */
.mobile-quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
  min-height: 80px;
  justify-content: center;
}

.quick-action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.quick-action-btn.secondary {
  background: white;
  color: #667eea;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.quick-action-btn:active {
  transform: scale(0.95);
}

.quick-action-btn .action-icon {
  font-size: 1.5rem;
}

.quick-action-btn .action-text {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

/* ✅ CORRIGIDO: Esconder header desktop no mobile */
@media (max-width: 768px) {
  .dashboard-header {
    display: none;
  }
}

/* ✅ CORREÇÃO FINAL: Garantir que classes mobile/desktop funcionem corretamente */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .mobile-only {
    display: block;
  }
  
  .quick-action-btn.mobile-only {
    display: flex;
  }
}

/* Botões padrão */
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
  border: 1px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}
</style>