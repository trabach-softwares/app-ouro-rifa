<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <div class="form-group">
      <label for="email">Endereço de e-mail</label>
      <input
        id="email"
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

    <div class="form-group">
      <label for="password">Senha</label>
      <div class="password-input">
        <input
          id="password"
          v-model="localForm.password"
          :type="showPassword ? 'text' : 'password'"
          required
          :disabled="isSubmitting"
          :class="{ 'error': errors.password }"
          @input="clearFieldError('password')"
          @blur="validatePassword"
          placeholder="Digite sua senha"
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
    </div>

    <div class="form-group">
      <label class="checkbox-label">
        <input
          v-model="localForm.remember"
          type="checkbox"
          :disabled="isSubmitting"
        />
        <span class="checkmark"></span>
        Lembrar de mim
      </label>
    </div>

    <button
      type="submit"
      class="submit-button"
      :disabled="isSubmitting || !isFormValid"
    >
      <span v-if="!isSubmitting">Entrar</span>
      <span v-else class="loading">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
        </svg>
        Entrando...
      </span>
    </button>

    <div class="form-footer">
      <a href="#" class="forgot-link">Esqueceu sua senha?</a>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'

const props = defineProps({
  form: Object,
  isSubmitting: Boolean
})

const emit = defineEmits(['submit', 'input', 'validation-error'])

const showPassword = ref(false)
const errors = reactive({
  email: '',
  password: ''
})

const localForm = computed({
  get: () => props.form,
  set: (value) => {
    Object.assign(props.form, value)
  }
})

const isFormValid = computed(() => {
  return localForm.value.email && 
         localForm.value.password && 
         !errors.email && 
         !errors.password
})

const validateEmail = () => {
  const email = localForm.value.email.trim()
  
  if (!email) {
    errors.email = 'E-mail é obrigatório'
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.email = 'Formato de e-mail inválido'
    return false
  }
  
  errors.email = ''
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
  
  errors.password = ''
  return true
}

const clearFieldError = (field) => {
  errors[field] = ''
  emit('input')
}

const validateForm = () => {
  const emailValid = validateEmail()
  const passwordValid = validatePassword()
  
  return emailValid && passwordValid
}

const handleSubmit = () => {
  if (!validateForm()) {
    emit('validation-error', 'Por favor, corrija os erros antes de continuar.')
    return
  }
  
  emit('submit', { ...props.form })
}

// Limpar erros quando o componente é resetado
watch(() => props.form, (newForm) => {
  if (!newForm.email && !newForm.password) {
    errors.email = ''
    errors.password = ''
  }
}, { deep: true })
</script>

<style scoped>
.login-form {
  width: 100%;
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

.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="text"] {
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
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-group input.error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-group input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.field-error {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #ef4444;
  font-weight: 500;
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

.toggle-password:hover:not(:disabled) {
  color: #374151;
}

.toggle-password:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toggle-password svg {
  width: 20px;
  height: 20px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 400 !important;
  margin-bottom: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #4f46e5;
  border-color: #4f46e5;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.submit-button {
  width: 100%;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading svg {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.form-footer {
  text-align: center;
}

.forgot-link {
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: #3730a3;
}
</style>