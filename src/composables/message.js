import { ref } from 'vue'

const message = ref('')
const type = ref('info')
const isVisible = ref(false)

let messageTimeout = null

export function useMessage() {
  const showMessage = (msg, msgType = 'info', duration = 4000) => {
    // Limpar timeout anterior
    if (messageTimeout) {
      clearTimeout(messageTimeout)
    }
    
    message.value = msg
    type.value = msgType
    isVisible.value = true
    
    console.log(`💬 Mensagem (${msgType}): ${msg}`)
    
    // Auto-esconder após duração especificada
    if (duration > 0) {
      messageTimeout = setTimeout(() => {
        hideMessage()
      }, duration)
    }
  }
  
  const hideMessage = () => {
    isVisible.value = false
    if (messageTimeout) {
      clearTimeout(messageTimeout)
      messageTimeout = null
    }
  }
  
  // Atalhos para tipos específicos
  const showSuccess = (msg, duration = 4000) => showMessage(msg, 'success', duration)
  const showError = (msg, duration = 6000) => showMessage(msg, 'error', duration)
  const showWarning = (msg, duration = 5000) => showMessage(msg, 'warning', duration)
  const showInfo = (msg, duration = 4000) => showMessage(msg, 'info', duration)
  
  return {
    message,
    type,
    isVisible,
    showMessage,
    hideMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}