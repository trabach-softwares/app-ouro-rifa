<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <div class="spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <h3>{{ isLogin ? 'Fazendo login...' : 'Criando conta...' }}</h3>
      <p>{{ isLogin ? 'Aguarde enquanto verificamos suas credenciais' : 'Configurando sua conta' }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isLogin: Boolean
})
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: inherit;
}

.loading-content {
  text-align: center;
  max-width: 300px;
}

.spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  border-top-color: #7c3aed;
  animation-delay: -0.4s;
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  border-top-color: #06b6d4;
  animation-delay: -0.8s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.loading-content p {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}
</style>