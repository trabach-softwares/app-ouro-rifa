<template>
  <transition name="slide-down">
    <div v-if="message" :class="['alert', type]">
      <div class="alert-icon">
        <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
      </div>
      <div class="alert-content">
        <h4>{{ title }}</h4>
        <p>{{ message }}</p>
      </div>
      <button class="alert-close" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'error'
  },
  title: String,
  message: String
})

defineEmits(['close'])
</script>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border-left: 4px solid;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert.success {
  background: #f0fdf4;
  border-left-color: #10b981;
  color: #065f46;
}

.alert.error {
  background: #fef2f2;
  border-left-color: #ef4444;
  color: #991b1b;
}

.alert.warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
  color: #92400e;
}

.alert-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
}

.alert-icon svg {
  width: 100%;
  height: 100%;
}

.alert-content h4 {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0 0 0.25rem 0;
}

.alert-content p {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.alert-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.alert-close:hover {
  opacity: 1;
}

.alert-close svg {
  width: 16px;
  height: 16px;
}

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>