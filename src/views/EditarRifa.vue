<!-- filepath: src/views/EditarRifa.vue -->
<template>
  <AdminLayout>
    <div class="editar-rifa">
      <!-- Header da página -->
      <div class="page-header">
        <div class="header-content">
          <h1>Editar Rifa</h1>
          <p>Modifique os dados da sua rifa</p>
        </div>
        <div class="header-actions">
          <router-link :to="`/rifas/${$route.params.id}/gerenciar`" class="btn btn-outline">
            📊 Gerenciar
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

      <!-- Formulário -->
      <form v-else @submit.prevent="salvarRifa" class="rifa-form">
        <!-- Informações Básicas -->
        <div class="content-card">
          <div class="card-header">
            <h2>Informações Básicas</h2>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="titulo">Título da Rifa *</label>
              <input
                id="titulo"
                v-model="form.titulo"
                type="text"
                placeholder="Ex: iPhone 15 Pro Max"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="descricao">Descrição *</label>
              <textarea
                id="descricao"
                v-model="form.descricao"
                placeholder="Descreva o prêmio e detalhes importantes..."
                required
                rows="4"
                class="form-input"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="imagem">Imagem do Prêmio</label>
              <div class="image-upload">
                <input
                  id="imagem"
                  @change="handleImageUpload"
                  type="file"
                  accept="image/*"
                  class="file-input"
                />
                <div class="upload-area" @click="$refs.fileInput?.click()">
                  <div v-if="form.imagemPreview" class="image-preview">
                    <img :src="form.imagemPreview" alt="Preview" />
                    <button @click.stop="removeImage" class="remove-image">❌</button>
                  </div>
                  <div v-else class="upload-placeholder">
                    <div class="upload-icon">📷</div>
                    <p>Clique para alterar a imagem</p>
                    <small>PNG, JPG até 5MB</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status da Rifa -->
        <div class="content-card">
          <div class="card-header">
            <h2>Status da Rifa</h2>
          </div>
          <div class="status-section">
            <div class="current-status">
              <span class="status-label">Status Atual:</span>
              <span :class="['status-badge', form.status]">
                {{ getStatusText(form.status) }}
              </span>
            </div>
            <div class="status-actions">
              <button 
                v-if="form.status === 'rascunho'"
                @click="publicarRifa"
                type="button"
                class="btn btn-success"
              >
                🚀 Publicar Rifa
              </button>
              <button 
                v-if="form.status === 'ativo'"
                @click="pausarRifa"
                type="button"
                class="btn btn-warning"
              >
                ⏸️ Pausar Rifa
              </button>
              <button 
                v-if="form.status === 'pausado'"
                @click="ativarRifa"
                type="button"
                class="btn btn-success"
              >
                ▶️ Ativar Rifa
              </button>
              <button 
                v-if="['rascunho', 'pausado'].includes(form.status)"
                @click="cancelarRifa"
                type="button"
                class="btn btn-danger"
              >
                🗑️ Cancelar Rifa
              </button>
            </div>
          </div>
        </div>

        <!-- Configurações do Sorteio -->
        <div class="content-card">
          <div class="card-header">
            <h2>Configurações do Sorteio</h2>
            <span v-if="temVendas" class="warning-text">
              ⚠️ Alguns campos não podem ser alterados pois já existem vendas
            </span>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="valorPremio">Valor do Prêmio *</label>
              <div class="input-with-prefix">
                <span class="prefix">R$</span>
                <input
                  id="valorPremio"
                  v-model="form.valorPremio"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  required
                  class="form-input"
                  :disabled="temVendas"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="valorNumero">Valor por Número *</label>
              <div class="input-with-prefix">
                <span class="prefix">R$</span>
                <input
                  id="valorNumero"
                  v-model="form.valorNumero"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  required
                  class="form-input"
                  :disabled="temVendas"
                />
              </div>
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
                :disabled="temVendas"
              />
            </div>

            <div class="form-group">
              <label for="dataFim">Data de Encerramento *</label>
              <input
                id="dataFim"
                v-model="form.dataFim"
                type="datetime-local"
                required
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- Estatísticas -->
        <div class="content-card stats-card">
          <div class="card-header">
            <h2>Estatísticas</h2>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">{{ form.numerosVendidos || 0 }}</span>
              <span class="stat-label">Números Vendidos</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ Math.round(form.percentualVendido || 0) }}%</span>
              <span class="stat-label">Progresso</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ formatCurrency(form.faturamento || 0) }}</span>
              <span class="stat-label">Faturamento</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ formatCurrency(lucroAtual) }}</span>
              <span class="stat-label">Lucro Atual</span>
            </div>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="form-actions">
          <button type="button" @click="$router.go(-1)" class="btn btn-outline">
            ← Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <span v-if="isSaving">⏳ Salvando...</span>
            <span v-else>💾 Salvar Alterações</span>
          </button>
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

const isLoading = ref(true)
const isSaving = ref(false)
const temVendas = ref(false)

const form = ref({
  id: null,
  titulo: '',
  descricao: '',
  imagem: null,
  imagemPreview: null,
  valorPremio: '',
  valorNumero: '',
  totalNumeros: '',
  dataFim: '',
  status: 'rascunho',
  numerosVendidos: 0,
  percentualVendido: 0,
  faturamento: 0
})

const lucroAtual = computed(() => {
  const faturamento = parseFloat(form.value.faturamento || 0)
  const premio = parseFloat(form.value.valorPremio || 0)
  return faturamento - premio
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
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

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.value.imagem = file
    
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.imagemPreview = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  form.value.imagem = null
  form.value.imagemPreview = null
}

const carregarRifa = async () => {
  try {
    isLoading.value = true
    const rifaId = route.params.id
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data
    const rifaData = {
      id: rifaId,
      titulo: 'iPhone 15 Pro Max',
      descricao: 'Smartphone Apple iPhone 15 Pro Max 256GB Titânio Natural',
      imagemPreview: 'https://via.placeholder.com/400x300?text=iPhone+15',
      valorPremio: 8000,
      valorNumero: 50,
      totalNumeros: 200,
      dataFim: '2024-02-15T20:00',
      status: 'ativo',
      numerosVendidos: 85,
      percentualVendido: 42.5,
      faturamento: 4250.00
    }
    
    form.value = { ...form.value, ...rifaData }
    temVendas.value = rifaData.numerosVendidos > 0
    
  } catch (error) {
    showMessage('Erro ao carregar rifa', 'error')
    router.push('/rifas')
  } finally {
    isLoading.value = false
  }
}

const salvarRifa = async () => {
  try {
    isSaving.value = true
    
    await rifasAPI.atualizar(form.value.id, form.value)
    showMessage('Rifa atualizada com sucesso!', 'success')
    
  } catch (error) {
    showMessage('Erro ao salvar rifa', 'error')
  } finally {
    isSaving.value = false
  }
}

const publicarRifa = async () => {
  const confirmacao = confirm('Tem certeza que deseja publicar esta rifa? Ela ficará disponível para vendas.')
  if (confirmacao) {
    try {
      await rifasAPI.alterarStatus(form.value.id, 'ativo')
      form.value.status = 'ativo'
      showMessage('Rifa publicada com sucesso!', 'success')
    } catch (error) {
      showMessage('Erro ao publicar rifa', 'error')
    }
  }
}

const pausarRifa = async () => {
  const confirmacao = confirm('Tem certeza que deseja pausar esta rifa? As vendas serão interrompidas.')
  if (confirmacao) {
    try {
      await rifasAPI.alterarStatus(form.value.id, 'pausado')
      form.value.status = 'pausado'
      showMessage('Rifa pausada com sucesso!', 'success')
    } catch (error) {
      showMessage('Erro ao pausar rifa', 'error')
    }
  }
}

const ativarRifa = async () => {
  try {
    await rifasAPI.alterarStatus(form.value.id, 'ativo')
    form.value.status = 'ativo'
    showMessage('Rifa ativada com sucesso!', 'success')
  } catch (error) {
    showMessage('Erro ao ativar rifa', 'error')
  }
}

const cancelarRifa = async () => {
  const confirmacao = confirm('ATENÇÃO: Tem certeza que deseja CANCELAR esta rifa? Esta ação não pode ser desfeita!')
  if (confirmacao) {
    try {
      await rifasAPI.alterarStatus(form.value.id, 'cancelado')
      form.value.status = 'cancelado'
      showMessage('Rifa cancelada', 'warning')
    } catch (error) {
      showMessage('Erro ao cancelar rifa', 'error')
    }
  }
}

onMounted(() => {
  carregarRifa()
})
</script>

<style scoped>
.editar-rifa {
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

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
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

.warning-text {
  color: #f59e0b;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 0 2rem 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #374151;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
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
  color: #6b7280;
  cursor: not-allowed;
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.prefix {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  z-index: 1;
}

.input-with-prefix .form-input {
  padding-left: 2.5rem;
}

.image-upload {
  width: 100%;
}

.file-input {
  display: none;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8faff;
}

.image-preview {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.8rem;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.upload-placeholder p {
  color: #374151;
  font-weight: 600;
  margin: 0;
}

.upload-placeholder small {
  color: #6b7280;
}

.status-section {
  padding: 0 2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-label {
  font-weight: 600;
  color: #374151;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.rascunho {
  background: #f3f4f6;
  color: #374151;
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

.status-badge.cancelado {
  background: #fee2e2;
  color: #dc2626;
}

.status-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stats-card {
  background: linear-gradient(135deg, #f8faff 0%, #f0f7ff 100%);
  border: 1px solid #e0e7ff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 0 2rem 2rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e7ff;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1a1d29;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f3f4;
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
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    padding: 0 1.5rem 1.5rem;
  }
  
  .card-header {
    padding: 1.5rem 1.5rem 0 1.5rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .status-section {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 1.5rem 1.5rem;
  }
  
  .status-actions {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 0 1.5rem 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }
  
  .form-grid {
    padding: 0 1rem 1rem;
  }
  
  .card-header {
    padding: 1rem 1rem 0 1rem;
  }
  
  .status-section {
    padding: 0 1rem 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    padding: 0 1rem 1rem;
  }
  
  .form-actions {
    padding: 1rem;
  }
  
  .status-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>