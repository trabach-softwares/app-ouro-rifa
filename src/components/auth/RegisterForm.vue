<template>
  <form @submit.prevent="handleSubmit" class="register-form" novalidate>
    <div class="form-row">
      <div class="form-group">
        <label for="name">Nome completo *</label>
        <input
          id="name"
          name="name"
          v-model="localForm.name"
          type="text"
          required
          :disabled="isSubmitting"
          :class="{ 'error': errors.name }"
          @input="clearFieldError('name')"
          @blur="validateName"
          placeholder="Seu nome completo"
        />
        <div v-if="errors.name" class="field-error">
          {{ errors.name }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="phone">Telefone *</label>
        <input
          id="phone"
          name="phone"
          v-model="localForm.phone"
          type="tel"
          required
          :disabled="isSubmitting"
          :class="{ 'error': errors.phone }"
          @input="handlePhoneInput"
          @blur="validatePhone"
          placeholder="(11) 99999-9999"
          maxlength="15"
        />
        <div v-if="errors.phone" class="field-error">
          {{ errors.phone }}
        </div>
        <small v-else class="field-hint">Formato: (xx) xxxxx-xxxx</small>
      </div>
    </div>

    <div class="form-group">
      <label for="email">E-mail *</label>
      <input
        id="email"
        name="email"
        v-model="localForm.email"
        type="email"
        required
        :disabled="isSubmitting"
        :class="{ 'error': errors.email }"
        @input="clearFieldError('email')"
        @blur="validateEmail"
        placeholder="seu@email.com"
      />
      <div v-if="errors.email" class="field-error">
        {{ errors.email }}
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="password">Senha *</label>
        <div class="password-input">
          <input
            id="password"
            name="password"
            v-model="localForm.password"
            :type="showPassword ? 'text' : 'password'"
            required
            :disabled="isSubmitting"
            :class="{ 'error': errors.password }"
            @input="clearFieldError('password')"
            @blur="validatePassword"
            placeholder="Mínimo 6 caracteres"
            minlength="6"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
            :disabled="isSubmitting"
          >
            <svg v-if="showPassword" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z"/>
            </svg>
          </button>
        </div>
        <div v-if="errors.password" class="field-error">
          {{ errors.password }}
        </div>
        <small v-else class="field-hint">Mínimo 6 caracteres</small>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirmar Senha *</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          v-model="localForm.confirmPassword"
          type="password"
          required
          :disabled="isSubmitting"
          :class="{ 'error': errors.confirmPassword }"
          @input="clearFieldError('confirmPassword')"
          @blur="validateConfirmPassword"
          placeholder="Confirme sua senha"
        />
        <div v-if="errors.confirmPassword" class="field-error">
          {{ errors.confirmPassword }}
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="company">Empresa (opcional)</label>
      <input
        id="company"
        name="company"
        v-model="localForm.company"
        type="text"
        :disabled="isSubmitting"
        @input="$emit('input')"
        placeholder="Nome da sua empresa"
      />
    </div>

    <div class="form-group checkbox-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          name="acceptTerms"
          v-model="localForm.acceptTerms"
          required
          :disabled="isSubmitting"
          :class="{ 'error': errors.acceptTerms }"
          @change="clearFieldError('acceptTerms')"
        />
        <span class="checkbox-text">
          Aceito os <a href="#" class="terms-link">termos de uso</a> e <a href="#" class="terms-link">política de privacidade</a> *
        </span>
      </label>
      <div v-if="errors.acceptTerms" class="field-error">
        {{ errors.acceptTerms }}
      </div>
    </div>

    <!-- ✅ NOVO: Resumo dos erros -->
    <div v-if="Object.keys(errors).length > 0" class="errors-summary">
      <div class="errors-header">
        <span class="error-icon">⚠️</span>
        <span>Por favor, corrija os seguintes erros:</span>
      </div>
      <ul class="errors-list">
        <li v-for="(error, field) in errors" :key="field" class="error-item">
          {{ getFieldLabel(field) }}: {{ error }}
        </li>
      </ul>
    </div>

    <button
      type="submit"
      class="submit-button"
      :disabled="isSubmitting || !isFormValid"
    >
      <span v-if="!isSubmitting">Criar conta</span>
      <span v-else class="loading">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
        </svg>
        Criando conta...
      </span>
    </button>
  </form>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'

const props = defineProps({
  form: Object,
  isSubmitting: Boolean
})

const emit = defineEmits(['submit', 'input'])

const showPassword = ref(false)
const errors = reactive({})

// ✅ NOVO: Formulário local para validação
const localForm = computed({
  get: () => props.form,
  set: (value) => emit('input', value)
})

// ✅ NOVO: Validação em tempo real
const isFormValid = computed(() => {
  return localForm.value.name?.trim() &&
         localForm.value.email?.trim() &&
         localForm.value.phone?.trim() &&
         localForm.value.password &&
         localForm.value.confirmPassword &&
         localForm.value.acceptTerms &&
         Object.keys(errors).length === 0
})

// ✅ NOVO: Labels dos campos para mensagens de erro
const getFieldLabel = (field) => {
  const labels = {
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone',
    password: 'Senha',
    confirmPassword: 'Confirmação de senha',
    acceptTerms: 'Termos de uso'
  }
  return labels[field] || field
}

// ✅ NOVO: Máscara para telefone
const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 2) {
    return `(${numbers}`
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  } else if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }
}

const handlePhoneInput = (event) => {
  const formatted = formatPhone(event.target.value)
  localForm.value.phone = formatted
  clearFieldError('phone')
  emit('input')
}

// ✅ NOVO: Validações específicas
const validateName = () => {
  const name = localForm.value.name?.trim()
  if (!name) {
    errors.name = 'Nome é obrigatório'
    return false
  }
  if (name.length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres'
    return false
  }
  delete errors.name
  return true
}

const validateEmail = () => {
  const email = localForm.value.email?.trim()
  if (!email) {
    errors.email = 'E-mail é obrigatório'
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.email = 'Formato de e-mail inválido'
    return false
  }
  
  delete errors.email
  return true
}

const validatePhone = () => {
  const phone = localForm.value.phone?.trim()
  if (!phone) {
    errors.phone = 'Telefone é obrigatório'
    return false
  }
  
  // Remover formatação para validar
  const numbers = phone.replace(/\D/g, '')
  if (numbers.length !== 11) {
    errors.phone = 'Telefone deve estar no formato (xx) xxxxx-xxxx'
    return false
  }
  
  delete errors.phone
  return true
}

const validatePassword = () => {
  const password = localForm.value.password
  if (!password) {
    errors.password = 'Senha é obrigatória'
    return false
  }
  
  if (password.length < 6) {
    errors.password = 'Senha deve ter pelo menos 6 caracteres'
    return false
  }
  
  delete errors.password
  
  // Revalidar confirmação se já foi preenchida
  if (localForm.value.confirmPassword) {
    validateConfirmPassword()
  }
  
  return true
}

const validateConfirmPassword = () => {
  const password = localForm.value.password
  const confirmPassword = localForm.value.confirmPassword
  
  if (!confirmPassword) {
    errors.confirmPassword = 'Confirmação de senha é obrigatória'
    return false
  }
  
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Senhas não coincidem'
    return false
  }
  
  delete errors.confirmPassword
  return true
}

const validateTerms = () => {
  if (!localForm.value.acceptTerms) {
    errors.acceptTerms = 'É necessário aceitar os termos de uso'
    return false
  }
  
  delete errors.acceptTerms
  return true
}

const clearFieldError = (field) => {
  delete errors[field]
  emit('input')
}

const validateAll = () => {
  const validations = [
    validateName(),
    validateEmail(),
    validatePhone(),
    validatePassword(),
    validateConfirmPassword(),
    validateTerms()
  ]
  
  return validations.every(Boolean)
}

// ✅ NOVO: Processar erros da API
const processApiErrors = (apiErrors) => {
  // Limpar erros anteriores
  Object.keys(errors).forEach(key => delete errors[key])
  
  if (Array.isArray(apiErrors)) {
    apiErrors.forEach(error => {
      // Mapear campos da API para campos do formulário
      const fieldMap = {
        'name': 'name',
        'email': 'email', 
        'phone': 'phone',
        'password': 'password'
      }
      
      const fieldName = fieldMap[error.field] || error.field
      
      // Traduzir mensagens comuns
      let message = error.message
      if (message.includes('formato') && error.field === 'phone') {
        message = 'Telefone deve estar no formato (xx) xxxxx-xxxx'
      } else if (message.includes('required') || message.includes('obrigatório')) {
        message = `${getFieldLabel(fieldName)} é obrigatório`
      } else if (message.includes('invalid') && error.field === 'email') {
        message = 'Formato de e-mail inválido'
      }
      
      errors[fieldName] = message
    })
  }
}

const handleSubmit = () => {
  if (!validateAll()) {
    // Focar no primeiro campo com erro
    const firstErrorField = Object.keys(errors)[0]
    const element = document.querySelector(`[name="${firstErrorField}"]`)
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }
  
  emit('submit', { ...props.form })
}

// ✅ EXPOR método para componente pai processar erros da API
defineExpose({
  processApiErrors,
  validateAll
})

// ✅ Limpar erros quando formulário é resetado
watch(() => props.form, (newForm) => {
  if (!newForm.email && !newForm.password) {
    Object.keys(errors).forEach(key => delete errors[key])
  }
}, { deep: true })
</script>

<style scoped>
.register-form {
  width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="password"] {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.form-group input.error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: #374151;
}

.toggle-password svg {
  width: 20px;
  height: 20px;
}

.checkbox-group {
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.5;
}

.checkbox-label input[type="checkbox"] {
  margin: 0.125rem 0 0 0;
  flex-shrink: 0;
}

.checkbox-text {
  color: #6b7280;
}

.terms-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
}

.terms-link:hover {
  text-decoration: underline;
}

.field-error {
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-error::before {
  content: "⚠️";
  font-size: 0.875rem;
}

.field-hint {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

/* ✅ NOVO: Resumo de erros */
.errors-summary {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.errors-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.error-icon {
  font-size: 1.125rem;
}

.errors-list {
  margin: 0;
  padding-left: 1.5rem;
}

.error-item {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.submit-button {
  width: 100%;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading svg {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .form-group input {
    font-size: 16px; /* Previne zoom no iOS */
  }
}
</style>