<!-- filepath: src/views/RifaDetalhes.vue -->
<template>
  <div class="rifa-detalhes" v-if="rifa">
    <div class="container">
      <div class="rifa-header">
        <button @click="$router.go(-1)" class="btn-back">
          ← Voltar
        </button>
        <div class="rifa-status">
          <span :class="['status-badge', rifa.status]">
            {{ getStatusText(rifa.status) }}
          </span>
        </div>
      </div>

      <div class="rifa-content">
        <div class="rifa-image-section">
          <img :src="rifa.imagem" :alt="rifa.titulo" class="rifa-image" />
        </div>

        <div class="rifa-info-section">
          <h1>{{ rifa.titulo }}</h1>
          <p class="rifa-descricao">{{ rifa.descricao }}</p>
          
          <div class="rifa-valores">
            <div class="valor-item">
              <span class="label">Prêmio:</span>
              <span class="value premio">{{ formatCurrency(rifa.valorPremio) }}</span>
            </div>
            <div class="valor-item">
              <span class="label">Valor por número:</span>
              <span class="value">{{ formatCurrency(rifa.valorNumero) }}</span>
            </div>
          </div>

          <div class="rifa-progresso">
            <div class="progresso-header">
              <span>Progresso da Rifa</span>
              <span>{{ rifa.numerosVendidos }} / {{ rifa.totalNumeros }}</span>
            </div>
            <div class="progresso-bar">
              <div 
                class="progresso-fill" 
                :style="{ width: `${rifa.percentualVendido}%` }"
              ></div>
            </div>
            <div class="progresso-percent">
              {{ Math.round(rifa.percentualVendido) }}% vendido
            </div>
          </div>

          <div v-if="rifa.status === 'ativo'" class="participar-section">
            <h3>Escolha seus números</h3>
            <div class="numeros-selection">
              <div class="quick-actions">
                <button @click="selecionarAleatorio(1)" class="btn btn-outline">
                  1 Aleatório
                </button>
                <button @click="selecionarAleatorio(5)" class="btn btn-outline">
                  5 Aleatórios
                </button>
                <button @click="selecionarAleatorio(10)" class="btn btn-outline">
                  10 Aleatórios
                </button>
                <button @click="limparSelecao" class="btn btn-outline">
                  Limpar
                </button>
              </div>

              <div class="numeros-grid">
                <button
                  v-for="numero in rifa.totalNumeros"
                  :key="numero"
                  :class="[
                    'numero-btn',
                    { 
                      'vendido': rifa.numerosVendidos.includes(numero),
                      'selecionado': numerosSelecionados.includes(numero)
                    }
                  ]"
                  :disabled="rifa.numerosVendidos.includes(numero)"
                  @click="toggleNumero(numero)"
                >
                  {{ String(numero).padStart(2, '0') }}
                </button>
              </div>
            </div>

            <div v-if="numerosSelecionados.length > 0" class="resumo-compra">
              <div class="resumo-info">
                <p><strong>Números selecionados:</strong> {{ numerosSelecionados.length }}</p>
                <p><strong>Total:</strong> {{ formatCurrency(totalCompra) }}</p>
              </div>
              <button @click="finalizarCompra" class="btn btn-primary btn-large">
                Finalizar Compra
              </button>
            </div>
          </div>

          <div v-else-if="rifa.status === 'finalizado'" class="resultado-section">
            <h3>Resultado da Rifa</h3>
            <div class="numero-sorteado">
              <span>Número sorteado:</span>
              <strong>{{ String(rifa.numeroSorteado || 0).padStart(2, '0') }}</strong>
            </div>
            <div v-if="rifa.ganhador" class="ganhador-info">
              <p><strong>Ganhador:</strong> {{ rifa.ganhador.nome }}</p>
              <p><strong>Data do sorteio:</strong> {{ formatDate(rifa.dataSorteio) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="loading" class="loading">
    <p>Carregando detalhes da rifa...</p>
  </div>

  <div v-else class="error">
    <p>Rifa não encontrada.</p>
    <router-link to="/rifas" class="btn btn-primary">Ver Outras Rifas</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { rifasAPI } from '@/service/api'
import { useAuthStore } from '@/stores/auth'
import { useMessage } from '@/composables/message'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showMessage } = useMessage()

const rifa = ref(null)
const loading = ref(true)
const numerosSelecionados = ref([])

const totalCompra = computed(() => {
  if (!rifa.value) return 0
  return numerosSelecionados.value.length * rifa.value.valorNumero
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

const getStatusText = (status) => {
  const statusMap = {
    ativo: 'Ativa',
    finalizado: 'Finalizada',
    cancelado: 'Cancelada'
  }
  return statusMap[status] || status
}

const toggleNumero = (numero) => {
  const index = numerosSelecionados.value.indexOf(numero)
  if (index === -1) {
    numerosSelecionados.value.push(numero)
  } else {
    numerosSelecionados.value.splice(index, 1)
  }
}

const selecionarAleatorio = (quantidade) => {
  const numerosDisponiveis = []
  for (let i = 1; i <= rifa.value.totalNumeros; i++) {
    if (!rifa.value.numerosVendidos.includes(i) && !numerosSelecionados.value.includes(i)) {
      numerosDisponiveis.push(i)
    }
  }

  const numerosParaAdicionar = numerosDisponiveis
    .sort(() => Math.random() - 0.5)
    .slice(0, quantidade)

  numerosSelecionados.value.push(...numerosParaAdicionar)
}

const limparSelecao = () => {
  numerosSelecionados.value = []
}

const finalizarCompra = async () => {
  if (!authStore.isAuthenticated) {
    showMessage('Você precisa fazer login para participar', 'warning')
    router.push('/login')
    return
  }

  if (numerosSelecionados.value.length === 0) {
    showMessage('Selecione pelo menos um número', 'warning')
    return
  }

  try {
    const response = await rifasAPI.comprarNumeros(rifa.value.id, numerosSelecionados.value)
    
    if (response.data.success) {
      showMessage('Compra realizada com sucesso!', 'success')
      // Atualizar dados da rifa
      await carregarRifa()
      numerosSelecionados.value = []
    } else {
      throw new Error(response.data.message || 'Erro na compra')
    }
  } catch (error) {
    showMessage(error.message || 'Erro ao finalizar compra', 'error')
  }
}

const carregarRifa = async () => {
  try {
    loading.value = true
    const response = await rifasAPI.getById(route.params.id)
    
    if (response.data.success) {
      rifa.value = response.data.rifa
    } else {
      throw new Error('Rifa não encontrada')
    }
  } catch (error) {
    console.error('Erro ao carregar rifa:', error)
    showMessage('Erro ao carregar detalhes da rifa', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregarRifa()
})
</script>

<style scoped>
.rifa-detalhes {
  padding: 2rem 0;
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.rifa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-back:hover {
  background: #f8f9fa;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge.ativo {
  background: #d4edda;
  color: #155724;
}

.status-badge.finalizado {
  background: #cce5ff;
  color: #004085;
}

.status-badge.cancelado {
  background: #f8d7da;
  color: #721c24;
}

.rifa-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rifa-image {
  width: 100%;
  border-radius: 12px;
}

.rifa-info-section h1 {
  color: #333;
  margin-bottom: 1rem;
}

.rifa-descricao {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.rifa-valores {
  margin-bottom: 2rem;
}

.valor-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.label {
  color: #666;
}

.value {
  font-weight: 600;
  color: #333;
}

.value.premio {
  color: #ff6b6b;
  font-size: 1.2rem;
}

.rifa-progresso {
  margin-bottom: 2rem;
}

.progresso-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.progresso-bar {
  height: 12px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progresso-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ff8e53);
  transition: width 0.3s ease;
}

.progresso-percent {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.participar-section h3 {
  color: #333;
  margin-bottom: 1rem;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.btn-primary {
  background: #ff6b6b;
  color: white;
}

.btn-primary:hover {
  background: #ff5252;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.numeros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 0.5rem;
  margin-bottom: 2rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
}

.numero-btn {
  aspect-ratio: 1;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.numero-btn:hover:not(:disabled) {
  border-color: #667eea;
  transform: scale(1.05);
}

.numero-btn.selecionado {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.numero-btn.vendido {
  background: #f8d7da;
  color: #721c24;
  cursor: not-allowed;
  opacity: 0.6;
}

.resumo-compra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 2rem;
}

.resumo-info p {
  margin-bottom: 0.5rem;
  color: #333;
}

.resultado-section {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.numero-sorteado {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.numero-sorteado strong {
  color: #ff6b6b;
  font-size: 2rem;
}

.ganhador-info p {
  margin-bottom: 0.5rem;
  color: #333;
}

.loading, .error {
  text-align: center;
  padding: 3rem 0;
  color: #666;
}

@media (max-width: 768px) {
  .rifa-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .resumo-compra {
    flex-direction: column;
    text-align: center;
  }
  
  .quick-actions {
    justify-content: center;
  }
}
</style>