<template>
  <div class="auth-tabs">
    <button 
      :class="['tab-button', { active: isLogin }]"
      :disabled="isSubmitting"
      @click="$emit('switch-mode', true)"
    >
      Entrar
    </button>
    <button 
      :class="['tab-button', { active: !isLogin }]"
      :disabled="isSubmitting"
      @click="$emit('switch-mode', false)"
    >
      Criar conta
    </button>
  </div>
</template>

<script setup>
defineProps({
  isLogin: Boolean,
  isSubmitting: Boolean
})

defineEmits(['switch-mode'])
</script>

<style scoped>
.auth-tabs {
  display: flex;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 2rem;
}

.tab-button {
  flex: 1;
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.tab-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tab-button.active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.tab-button:not(.active):not(:disabled):hover {
  color: #374151;
}
</style>