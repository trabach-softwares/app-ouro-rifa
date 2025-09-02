<template>
  <div class="branding-panel">
    <div class="branding-content">
      <!-- Logo Principal -->
      <div class="brand-logo">
        <div class="logo-container">
          <img src="@/assets/logo.png" alt="Ouro Rifa" class="logo-image" />
          <div class="logo-text">
            <h1>Ouro Rifa</h1>
            <p class="tagline">Sistema completo para suas campanhas</p>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="feature.icon" />
            </svg>
          </div>
          <div class="feature-content">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const features = [
  {
    title: 'Criação Rápida',
    description: 'Configure sua Campanha em poucos minutos',
    icon: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z'
  },
  {
    title: 'Pagamentos Seguros', 
    description: 'Transações protegidas e dados criptografados',
    icon: 'M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V14.5C14.8,16.4 13.2,18 11.3,18H8.5C6.6,18 5,16.4 5,14.5V10C5,8.6 6.6,7 8,7H12M9,10V14H11V10H9Z'
  },
  {
    title: 'Relatórios Completos',
    description: 'Acompanhe suas vendas em tempo real',
    icon: 'M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z'
  }
]

const stats = [
  { number: '10K+', label: 'Campanhas Criadas' },
  { number: '50K+', label: 'Usuários Ativos' },
  { number: 'R$ 2M+', label: 'Arrecadados' }
]
</script>

<style scoped>
.branding-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.branding-content {
  max-width: 500px;
  width: 100%;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 3rem;
}

.logo-image {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  margin-bottom: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.logo-text h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: white;
}

.tagline {
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0;
}

.features-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.feature-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.9);
}

.feature-content h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: white;
}

.feature-content p {
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: white;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .branding-panel {
    display: none;
  }
}
</style>