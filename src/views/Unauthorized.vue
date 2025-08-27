<!-- filepath: src/views/Unauthorized.vue -->
<template>
  <div class="unauthorized">
    <div class="container">
      <div class="error-content">
        <h1 class="error-code">403</h1>
        <h2 class="error-title">Acesso Negado</h2>
        <p class="error-message">
          Você não tem permissão para acessar esta página.
        </p>
        <div class="error-actions">
          <router-link to="/dashboard" class="btn btn-primary">
            Ir para Dashboard
          </router-link>
          <button @click="$router.go(-1)" class="btn btn-secondary">
            Voltar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Componente simples, não precisa de lógica adicional
</script>

<style scoped>
.unauthorized {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
}

.container {
  max-width: 600px;
  text-align: center;
  padding: 2rem;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.error-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.8rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: white;
  color: #ff6b6b;
}

.btn-primary:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #ff6b6b;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }
  
  .error-title {
    font-size: 2rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
}
</style>