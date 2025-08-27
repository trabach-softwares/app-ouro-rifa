<template>
  <div class="social-login">
    <div class="divider">
      <span>ou continue com</span>
    </div>
    
    <div class="social-buttons">
      <button class="social-button google" @click="loginWith('google')" :disabled="isLoading">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>
      
      <button class="social-button facebook" @click="loginWith('facebook')" :disabled="isLoading">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isLoading = ref(false)

const loginWith = (provider) => {
  isLoading.value = true
  
  // Simular login social
  setTimeout(() => {
    console.log(`Login with ${provider}`)
    isLoading.value = false
    // TODO: Implementar login social real
  }, 1000)
}
</script>

<style scoped>
.social-login {
  margin-top: 1.5rem;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  position: relative;
}

.social-buttons {
  display: flex;
  gap: 1rem;
}

.social-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.social-button:hover:not(:disabled) {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.social-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.social-button svg {
  width: 20px;
  height: 20px;
}

.social-button.google:hover:not(:disabled) {
  border-color: #4285f4;
}

.social-button.facebook:hover:not(:disabled) {
  border-color: #1877f2;
}

@media (max-width: 480px) {
  .social-buttons {
    flex-direction: column;
  }
}
</style>