<!-- filepath: src/views/GerenciarRifa.vue -->
<template>
  <AdminLayout>
    <div class="gerenciar-rifa">
      <!-- Header da página -->
      <div class="page-header">
        <div class="header-content">
          <h1>{{ rifa.titulo || 'Gerenciar Rifa' }}</h1>
          <p>Acompanhe vendas e gerencie sua rifa</p>
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

      <!-- Loading -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>Carregando dados da rifa...</p>
      </div>

      <div v-else>
        <!-- Cards de Estatísticas -->
        <div class="stats-grid">
          <div class="stat-card vendas">
            <div class="stat-content">
              <div class="stat-number">{{ rifa.numerosVendidos || 0 }}</div>
              <div class="stat-label">Números Vendidos</div>
              <div class="stat-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${rifa.percentualVendido || 0}%` }"
                  ></div>
                </div>
                <span class="progress-text">{{ Math.round(rifa.percentualVendido || 0) }}%</span>
              </div>
            </div>
            <div class="stat-icon">🎯</div>
          </div>

          <div class="stat-card faturamento">
            <div class="stat-content">
              <div class="stat-number">{{ formatCurrency(rifa.faturamento || 0) }}</div>
              <div class="stat-label">Faturamento</div>
              <div class="stat-meta">
                Meta: {{ formatCurrency(faturamentoMaximo) }}
              </div>
            </div>
            <div class="stat-icon">💰</div>
          </div>

          <div class="stat-card participantes">
            <div class="stat-content">
              <div class="stat-number">{{ compradores.length }}</div>
              <div class="stat-label">Participantes</div>
              <div class="stat-meta">
                {{ vendas.length }} compras
              </div>
            </div>
            <div class="stat-icon">👥</div>
          </div>

          <div class="stat-card status">
            <div class="stat-content">
              <div class="stat-status">
                <span :class="['status-badge', rifa.status]">
                  {{ getStatusText(rifa.status) }}
                </span>
              </div>
              <div class="stat-label">Status da Rifa</div>
              <div class="stat-meta">
                {{ tempoRestante }}
              </div>
            </div>
            <div class="stat-icon">📊</div>
          </div>
        </div>

        <!-- Filtros das Vendas -->
        <div class="content-card">
          <div class="card-header">
            <h2>Vendas Recentes</h2>
            <div class="filters">
              <select v-model="filtroStatus" @change="aplicarFiltros">
                <option value="">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="confirmado">Confirmados</option>
                <option value="cancelado">Cancelados</option>
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
              class="venda-item"
              @click="verDetalhesVenda(venda)"
            >
              <div class="venda-info">
                <div class="comprador-avatar">
                  {{ venda.nomeComprador.charAt(0).toUpperCase() }}
                </div>
                <div class="comprador-dados">
                  <h4>{{ venda.nomeComprador }}</h4>
                  <p>{{ venda.telefone }}</p>
                  <span class="numeros-comprados">
                    {{ venda.numeros.length }} número{{ venda.numeros.length > 1 ? 's' : '' }}
                  </span>
                </div>
              </div>

              <div class="venda-numeros">
                <div class="numeros-container">
                  <span 
                    v-for="numero in venda.numeros.slice(0, 5)" 
                    :key="numero"
                    class="numero-badge"
                  >
                    {{ numero.toString().padStart(3, '0') }}
                  </span>
                  <span v-if="venda.numeros.length > 5" class="mais-numeros">
                    +{{ venda.numeros.length - 5 }}
                  </span>
                </div>
              </div>

              <div class="venda-valor">
                <span class="valor">{{ formatCurrency(venda.valor) }}</span>
                <span :class="['status-badge', venda.status]">
                  {{ getStatusVenda(venda.status) }}
                </span>
                <span class="data">{{ formatDate(venda.dataCompra) }}</span>
              </div>

              <div class="venda-actions">
                <button 
                  v-if="venda.status === 'pendente'"
                  @click.stop="confirmarVenda(venda.id)"
                  class="action-btn confirm"
                  title="Confirmar pagamento"
                >
                  ✅
                </button>
                <button 
                  v-if="venda.status === 'pendente'"
                  @click.stop="cancelarVenda(venda.id)"
                  class="action-btn cancel"
                  title="Cancelar venda"
                >
                  ❌
                </button>
                <button 
                  @click.stop="verDetalhesVenda(venda)"
                  class="action-btn details"
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
            <p v-if="temFiltros">Tente ajustar os filtros</p>
            <p v-else>Ainda não houve vendas para esta rifa</p>
          </div>
        </div>

        <!-- Números Disponíveis -->
        <div class="content-card">
          <div class="card-header">
            <h2>Mapa de Números</h2>
            <div class="legenda">
              <span class="legenda-item disponivel">⚪ Disponível</span>
              <span class="legenda-item vendido">🟢 Vendido</span>
              <span class="legenda-item reservado">🟡 Reservado</span>
            </div>
          </div>

          <div class="numeros-grid">
            <div 
              v-for="numero in numerosGrid" 
              :key="numero.numero"
              :class="['numero-cell', numero.status]"
              :title="`Número ${numero.numero.toString().padStart(3, '0')} - ${numero.status}`"
            >
              {{ numero.numero.toString().padStart(3, '0') }}
            </div>
          </div>
        </div>

        <!-- Ações Rápidas -->
        <div class="content-card">
          <div class="card-header">
            <h2>Ações Rápidas</h2>
          </div>
          <div class="actions-grid">
            <button @click="gerarRelatorio" class="action-card">
              <div class="action-icon">📊</div>
              <h3>Gerar Relatório</h3>
              <p>Baixar relatório completo de vendas</p>
            </button>
            <button @click="enviarLink" class="action-card">
              <div class="action-icon">📤</div>
              <h3>Compartilhar Link</h3>
              <p>Enviar link da rifa para clientes</p>
            </button>
            <button @click="realizarSorteio" class="action-card" :disabled="!podeRealizarSorteio">
              <div class="action-icon">🎲</div>
              <h3>Realizar Sorteio</h3>
              <p>Sortear o número ganhador</p>
            </button>
            <button @click="$router.push(`/rifas/${rifa.id}`)" class="action-card">
              <div class="action-icon">⚙️</div>
              <h3>Configurações</h3>
              <p>Editar dados da rifa</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// ✅ CORRIGIDO: Importar apenas as APIs que existem
import { rifasAPI, reportsAPI } from '@/service/api'
import { useMessage } from '@/composables/message'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const { showMessage } = useMessage()

const isLoading = ref(true)
const rifa = ref({})
const vendas = ref([])
const filtroStatus = ref('')
const termoBusca = ref('')

const faturamentoMaximo = computed(() => {
  return (rifa.value.totalNumeros || 0) * (rifa.value.valorNumero || 0)
})

const compradores = computed(() => {
  const uniqueCompradores = new Set()
  vendas.value.forEach(venda => {
    if (venda.status !== 'cancelado') {
      uniqueCompradores.add(venda.telefone)
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
    resultado = resultado.filter(venda => 
      venda.nomeComprador.toLowerCase().includes(termo) ||
      venda.telefone.includes(termo)
    )
  }

  return resultado.sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra))
})

const temFiltros = computed(() => {
  return filtroStatus.value || termoBusca.value
})

const numerosGrid = computed(() => {
  const grid = []
  const numerosVendidos = new Set()
  const numerosReservados = new Set()

  // Marcar números vendidos e reservados
  vendas.value.forEach(venda => {
    venda.numeros.forEach(numero => {
      if (venda.status === 'confirmado') {
        numerosVendidos.add(numero)
      } else if (venda.status === 'pendente') {
        numerosReservados.add(numero)
      }
    })
  })

  // Criar grid
  for (let i = 1; i <= (rifa.value.totalNumeros || 0); i++) {
    let status = 'disponivel'
    if (numerosVendidos.has(i)) {
      status = 'vendido'
    } else if (numerosReservados.has(i)) {
      status = 'reservado'
    }

    grid.push({
      numero: i,
      status
    })
  }

  return grid
})

const tempoRestante = computed(() => {
  if (!rifa.value.dataFim) return ''
  
  const agora = new Date()
  const fim = new Date(rifa.value.dataFim)
  const diff = fim - agora

  if (diff <= 0) return 'Encerrada'

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (dias > 0) {
    return `${dias} dia${dias > 1 ? 's' : ''} restante${dias > 1 ? 's' : ''}`
  } else {
    return `${horas}h restantes`
  }
})

const podeRealizarSorteio = computed(() => {
  return rifa.value.status === 'ativo' && 
         rifa.value.numerosVendidos > 0 && 
         new Date(rifa.value.dataFim) <= new Date()
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusText = (status) => {
  const statusMap = {
    rascunho: 'Rascunho',
    ativo: 'Ativa',
    pausado: 'Pausada',
    finalizado: 'Finalizada',
    cancelado: 'Cancelada'
  }
  return statusMap[status] || status
}

const getStatusVenda = (status) => {
  const statusMap = {
    pendente: 'Pendente',
    confirmado: 'Pago',
    cancelado: 'Cancelado'
  }
  return statusMap[status] || status
}

const aplicarFiltros = () => {
  // Os filtros são reativos através do computed
}

const carregarDados = async () => {
  try {
    isLoading.value = true
    const rifaId = route.params.id
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data da rifa
    rifa.value = {
      id: rifaId,
      titulo: 'iPhone 15 Pro Max',
      valorPremio: 8000,
      valorNumero: 50,
      totalNumeros: 200,
      numerosVendidos: 85,
      percentualVendido: 42.5,
      faturamento: 4250.00,
      status: 'ativo',
      dataFim: '2024-02-15T20:00:00'
    }

    // Mock data das vendas
    vendas.value = [
      {
        id: 1,
        nomeComprador: 'João Silva',
        telefone: '(11) 99999-9999',
        numeros: [1, 15, 23, 67, 89],
        valor: 250.00,
        status: 'confirmado',
        dataCompra: '2024-01-20T14:30:00'
      },
      {
        id: 2,
        nomeComprador: 'Maria Santos',
        telefone: '(11) 88888-8888',
        numeros: [45, 76],
        valor: 100.00,
        status: 'pendente',
        dataCompra: '2024-01-21T09:15:00'
      },
      {
        id: 3,
        nomeComprador: 'Carlos Oliveira',
        telefone: '(11) 77777-7777',
        numeros: [12, 34, 56],
        valor: 150.00,
        status: 'confirmado',
        dataCompra: '2024-01-19T16:45:00'
      }
    ]
    
  } catch (error) {
    showMessage('Erro ao carregar dados da rifa', 'error')
    router.push('/rifas')
  } finally {
    isLoading.value = false
  }
}

// ✅ CORRIGIDO: Usar reportsAPI em vez de vendasAPI
const confirmarVenda = async (vendaId) => {
  try {
    // Usar a API de relatórios para atualizar status da venda
    await reportsAPI.updateSaleStatus(vendaId, 'confirmed')
    const venda = vendas.value.find(v => v.id === vendaId)
    if (venda) {
      venda.status = 'confirmado'
    }
    showMessage('Venda confirmada com sucesso!', 'success')
    // Atualizar estatísticas
    await carregarDados()
  } catch (error) {
    showMessage('Erro ao confirmar venda', 'error')
  }
}

const cancelarVenda = async (vendaId) => {
  const confirmacao = confirm('Tem certeza que deseja cancelar esta venda?')
  if (confirmacao) {
    try {
      // ✅ CORRIGIDO: Usar reportsAPI em vez de vendasAPI
      await reportsAPI.updateSaleStatus(vendaId, 'cancelled')
      const venda = vendas.value.find(v => v.id === vendaId)
      if (venda) {
        venda.status = 'cancelado'
      }
      showMessage('Venda cancelada', 'warning')
      await carregarDados()
    } catch (error) {
      showMessage('Erro ao cancelar venda', 'error')
    }
  }
}

const verDetalhesVenda = (venda) => {
  // Implementar modal ou página de detalhes
  console.log('Ver detalhes da venda:', venda)
}

const gerarRelatorio = () => {
  showMessage('Gerando relatório...', 'info')
  // Implementar geração de relatório
}

const enviarLink = () => {
  const link = `${window.location.origin}/rifa/${rifa.value.id}`
  navigator.clipboard.writeText(link)
  showMessage('Link copiado para a área de transferência!', 'success')
}

const realizarSorteio = () => {
  if (!podeRealizarSorteio.value) {
    showMessage('Não é possível realizar o sorteio ainda', 'warning')
    return
  }
  
  const confirmacao = confirm('Tem certeza que deseja realizar o sorteio? Esta ação não pode ser desfeita!')
  if (confirmacao) {
    // Implementar lógica do sorteio
    router.push(`/rifas/${rifa.value.id}/sorteio`)
  }
}

onMounted(() => {
  carregarDados()
})
</script>

<style scoped>
.gerenciar-rifa {
  width: 100%;
}

/* Usando o mesmo padrão das outras views */
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
  transform: translateY(-1px);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
  transform: translateY(-1px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.stat-meta {
  font-size: 0.8rem;
  color: #9ca3af;
}

.stat-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
}

.stat-status {
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.ativo {
  background: #dcfce7;
  color: #166534;
}

.status-badge.pausado {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.finalizado {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.pendente {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.confirmado {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelado {
  background: #fee2e2;
  color: #dc2626;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
  margin-bottom: 2rem;
}

.card-header {
  padding: 2rem 2rem 0 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  color: #1a1d29;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
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
}

.legenda {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.legenda-item {
  font-size: 0.85rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vendas-list {
  padding: 0 2rem 2rem;
}

.venda-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #f1f3f4;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.venda-item:hover {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-1px);
}

.venda-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.comprador-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
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
  font-size: 0.9rem;
}

.numeros-comprados {
  color: #667eea;
  font-size: 0.8rem;
  font-weight: 600;
}

.venda-numeros {
  flex: 1.5;
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

.venda-valor {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.valor {
  font-size: 1.1rem;
  font-weight: 700;
  color: #059669;
}

.data {
  font-size: 0.8rem;
  color: #6b7280;
}

.venda-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.action-btn.confirm {
  background: #dcfce7;
  color: #166534;
}

.action-btn.cancel {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.details {
  background: #f1f5f9;
  color: #374151;
}

.action-btn:hover {
  transform: scale(1.1);
}

.numeros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 0.5rem;
  padding: 0 2rem 2rem;
  max-height: 400px;
  overflow-y: auto;
}

.numero-cell {
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: monospace;
  border: 1px solid;
  transition: all 0.2s ease;
}

.numero-cell.disponivel {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
}

.numero-cell.vendido {
  background: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}

.numero-cell.reservado {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 0 2rem 2rem;
}

.action-card {
  padding: 2rem;
  border: 1px solid #f1f3f4;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: white;
}

.action-card:hover:not(:disabled) {
  border-color: #667eea;
  background: #f8faff;
  transform: translateY(-2px);
}

.action-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>