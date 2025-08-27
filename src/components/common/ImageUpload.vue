<!-- filepath: src/components/common/ImageUpload.vue -->
<template>
  <div class="image-upload">
    <!-- Input de arquivo oculto -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      style="display: none"
    />
    
    <!-- Área de upload -->
    <div 
      class="upload-area"
      :class="{ 
        'drag-over': isDragOver,
        'has-image': currentImage || selectedFile,
        'uploading': isUploading
      }"
      @click="openFileDialog"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <!-- Loading durante upload -->
      <div v-if="isUploading" class="upload-loading">
        <div class="loading-spinner">⏳</div>
        <p>Enviando imagem...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
      </div>
      
      <!-- Preview da imagem selecionada (arquivo local) -->
      <div v-else-if="selectedFile && previewUrl" class="image-preview">
        <img :src="previewUrl" :alt="description || 'Imagem selecionada'" />
        <div class="image-overlay">
          <button @click.stop="removeImage" class="remove-btn">
            🗑️ Remover
          </button>
          <button @click.stop="openFileDialog" class="change-btn">
            📷 Alterar
          </button>
        </div>
        <div class="file-info">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
      </div>
      
      <!-- Preview da imagem já enviada -->
      <div v-else-if="currentImage" class="image-preview">
        <img :src="currentImage" :alt="description || 'Imagem da rifa'" />
        <div class="image-overlay">
          <button @click.stop="removeImage" class="remove-btn">
            🗑️ Remover
          </button>
          <button @click.stop="openFileDialog" class="change-btn">
            📷 Alterar
          </button>
        </div>
      </div>
      
      <!-- Estado inicial de upload -->
      <div v-else class="upload-placeholder">
        <div class="upload-icon">📷</div>
        <h3>Adicionar Imagem</h3>
        <p>Clique para selecionar ou arraste uma imagem aqui</p>
        <small>PNG, JPG, JPEG até 5MB</small>
      </div>
    </div>
    
    <!-- Galeria de uploads anteriores -->
    <div v-if="showGallery && uploads.length > 0" class="uploads-gallery">
      <h4>Imagens anteriores</h4>
      <div class="gallery-grid">
        <div 
          v-for="upload in uploads" 
          :key="upload.id"
          class="gallery-item"
          :class="{ active: selectedUpload?.id === upload.id }"
          @click="selectExistingUpload(upload)"
        >
          <img :src="upload.url" :alt="upload.description || 'Upload'" />
          <div class="gallery-overlay">
            <span class="gallery-title">{{ upload.description || 'Sem título' }}</span>
          </div>
        </div>
      </div>
      
      <div class="gallery-actions">
        <button @click="loadMoreUploads" class="btn btn-outline" :disabled="isLoadingUploads">
          {{ isLoadingUploads ? 'Carregando...' : 'Carregar mais' }}
        </button>
        <button @click="showGallery = false" class="btn btn-secondary">
          Fechar galeria
        </button>
      </div>
    </div>
    
    <!-- Botão para abrir galeria -->
    <div v-else class="gallery-toggle">
      <button @click="toggleGallery" class="btn btn-outline btn-sm">
        📂 Escolher de uploads anteriores
      </button>
    </div>
    
    <!-- Erro -->
    <div v-if="error" class="upload-error">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { uploadAPI } from '@/service/api'
import { useMessage } from '@/composables/message'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'raffle_images'
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  }
})

const emit = defineEmits(['update:modelValue', 'fileSelected', 'uploaded', 'error'])

const { showMessage } = useMessage()

const fileInput = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const isDragOver = ref(false)
const error = ref('')
const currentImage = ref(props.modelValue)

// ✅ NOVO: Estados para arquivo selecionado (não enviado)
const selectedFile = ref(null)
const previewUrl = ref('')

// Galeria
const showGallery = ref(false)
const uploads = ref([])
const selectedUpload = ref(null)
const isLoadingUploads = ref(false)
const currentPage = ref(1)

const openFileDialog = () => {
  fileInput.value?.click()
}

const validateFile = (file) => {
  error.value = ''
  
  if (!file.type.startsWith('image/')) {
    error.value = 'Por favor, selecione apenas arquivos de imagem'
    return false
  }
  
  if (file.size > props.maxSize) {
    const maxSizeMB = props.maxSize / (1024 * 1024)
    error.value = `Arquivo muito grande. Máximo ${maxSizeMB}MB`
    return false
  }
  
  return true
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ✅ ATUALIZADO: Apenas selecionar arquivo, não fazer upload
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && validateFile(file)) {
    selectFile(file)
  }
}

const handleDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file && validateFile(file)) {
    selectFile(file)
  }
}

// ✅ NOVO: Selecionar arquivo e criar preview
const selectFile = (file) => {
  selectedFile.value = file
  
  // Criar preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
  
  // Emitir evento para o componente pai
  emit('fileSelected', file)
  
  // Limpar imagem atual se houver
  currentImage.value = ''
  selectedUpload.value = null
  
  console.log('📁 Arquivo selecionado:', file.name, formatFileSize(file.size))
}

// ✅ NOVO: Método público para fazer upload (chamado pelo componente pai)
const uploadSelectedFile = async () => {
  if (!selectedFile.value) {
    throw new Error('Nenhum arquivo selecionado')
  }
  
  try {
    isUploading.value = true
    uploadProgress.value = 0
    error.value = ''
    
    // Simular progresso
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)
    
    const response = await uploadAPI.uploadImage(selectedFile.value, props.description, props.category)
    
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    if (response.data.success) {
      currentImage.value = response.data.data.url
      emit('update:modelValue', response.data.data.url)
      emit('uploaded', response.data.data)
      
      // Limpar arquivo selecionado após upload
      selectedFile.value = null
      previewUrl.value = ''
      
      console.log('✅ Upload concluído:', response.data.data.url)
      return response.data.data
    } else {
      throw new Error(response.data.message || 'Erro ao fazer upload')
    }
  } catch (err) {
    console.error('Erro no upload:', err)
    error.value = err.message || 'Erro ao fazer upload da imagem'
    emit('error', err)
    throw err
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const removeImage = () => {
  currentImage.value = ''
  selectedFile.value = null
  previewUrl.value = ''
  selectedUpload.value = null
  emit('update:modelValue', '')
  
  // Limpar input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const toggleGallery = async () => {
  showGallery.value = !showGallery.value
  
  if (showGallery.value && uploads.value.length === 0) {
    await loadUploads()
  }
}

const loadUploads = async () => {
  try {
    isLoadingUploads.value = true
    
    const response = await uploadAPI.getMyUploads({
      page: currentPage.value,
      limit: 12,
      category: props.category
    })
    
    if (response.data.success) {
      const newUploads = response.data.data || []
      uploads.value = [...uploads.value, ...newUploads]
    }
  } catch (err) {
    console.error('Erro ao carregar uploads:', err)
    showMessage('Erro ao carregar galeria', 'error')
  } finally {
    isLoadingUploads.value = false
  }
}

const loadMoreUploads = async () => {
  currentPage.value++
  await loadUploads()
}

const selectExistingUpload = (upload) => {
  selectedUpload.value = upload
  currentImage.value = upload.url
  selectedFile.value = null
  previewUrl.value = ''
  emit('update:modelValue', upload.url)
  emit('uploaded', upload)
  showGallery.value = false
}

// ✅ EXPOR métodos para o componente pai
defineExpose({
  uploadSelectedFile,
  hasSelectedFile: computed(() => !!selectedFile.value),
  hasCurrentImage: computed(() => !!currentImage.value)
})

// Watchers
onMounted(() => {
  if (props.modelValue) {
    currentImage.value = props.modelValue
  }
})

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== currentImage.value) {
    currentImage.value = newValue
  }
})
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f8faff;
}

.upload-area.drag-over {
  border-color: #667eea;
  background: #f0f7ff;
  transform: scale(1.02);
}

.upload-area.has-image {
  padding: 0;
  border: 1px solid #e5e7eb;
}

.upload-area.uploading {
  border-color: #667eea;
  background: #f8faff;
}

.upload-loading {
  text-align: center;
  width: 100%;
}

.loading-spinner {
  font-size: 2rem;
  margin-bottom: 1rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.upload-placeholder {
  width: 100%;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.upload-placeholder h3 {
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.upload-placeholder p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.upload-placeholder small {
  color: #9ca3af;
  font-size: 0.8rem;
}

.image-preview {
  width: 100%;
  height: 200px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
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
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.remove-btn,
.change-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
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

/* ✅ NOVO: Estilos para info do arquivo */
.file-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 1rem;
  color: white;
  font-size: 0.8rem;
}

.file-name {
  display: block;
  font-weight: 600;
  margin-bottom: 0.25rem;
  truncate: true;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: rgba(255, 255, 255, 0.8);
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
}

.gallery-toggle {
  margin-top: 1rem;
  text-align: center;
}

.uploads-gallery {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
}

.uploads-gallery h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.gallery-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.gallery-item:hover {
  transform: scale(1.05);
  border-color: #667eea;
}

.gallery-item.active {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 0.5rem;
  transform: translateY(100%);
  transition: transform 0.2s ease;
}

.gallery-item:hover .gallery-overlay {
  transform: translateY(0);
}

.gallery-title {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.gallery-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-outline:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

@media (max-width: 768px) {
  .upload-area {
    padding: 1.5rem 1rem;
    min-height: 150px;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
  }
  
  .gallery-actions {
    flex-direction: column;
  }
}
</style>