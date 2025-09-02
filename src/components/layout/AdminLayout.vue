<!-- filepath: src/components/layout/AdminLayout.vue -->
<template>
  <div class="admin-layout">
    <!-- Mobile Header -->
    <header class="mobile-header mobile-only">
      <div class="mobile-header-content">
        <button @click="toggleMobileSidebar" class="mobile-menu-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
          </svg>
        </button>
        
        <div class="mobile-logo">
          <img src="@/assets/logo.png" alt="Ouro Rifa" class="logo-img" />
          <span class="logo-text">Ouro Rifa</span>
        </div>
        
        <button @click="toggleUserMenu" class="mobile-user-btn">
          <div class="mobile-avatar">{{ userInitials }}</div>
        </button>
      </div>
    </header>

    <!-- Mobile User Menu -->
    <Transition name="slide-down">
      <div v-if="showMobileUserMenu" class="mobile-user-menu mobile-only">
        <div class="mobile-user-info">
          <div class="mobile-user-avatar">{{ userInitials }}</div>
          <div class="mobile-user-details">
            <h4>{{ userName }}</h4>
            <p>{{ userEmail }}</p>
          </div>
        </div>
        <div class="mobile-user-actions">
          <router-link to="/profile" class="mobile-action-btn" @click="closeMobileUserMenu">
            👤 Meu Perfil
          </router-link>
          <button @click="handleLogout" class="mobile-action-btn logout">
            🚪 Sair
          </button>
        </div>
      </div>
    </Transition>

    <!-- Sidebar Overlay -->
    <Transition name="fade">
      <div v-if="showMobileSidebar" class="sidebar-overlay mobile-only" @click="closeMobileSidebar"></div>
    </Transition>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'mobile-open': showMobileSidebar }">
      <!-- Header fixo -->
      <div class="sidebar-header desktop-only">
        <div class="logo">
          <img src="@/assets/logo.png" alt="Ouro Rifa" class="logo-img" />
          <span class="logo-text">Ouro Rifa</span>
        </div>
      </div>

      <div class="mobile-sidebar-header mobile-only">
        <div class="logo">
          <img src="@/assets/logo.png" alt="Ouro Rifa" class="logo-img" />
          <span class="logo-text">Ouro Rifa</span>
        </div>
      </div>

      <!-- Container com scroll para navegação -->
      <div class="sidebar-content">
        <!-- Navigation com scroll -->
        <nav class="sidebar-nav">
          <router-link 
            to="/dashboard" 
            class="nav-item" 
            @click="closeMobileSidebar"
            active-class="active"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
          </router-link>
          
          <router-link 
            to="/rifas" 
            class="nav-item" 
            @click="closeMobileSidebar"
            active-class="active"
          >
            <span class="nav-icon">🎯</span>
            <span class="nav-text">Minhas Campanhas</span>
          </router-link>
          
          <router-link 
            to="/rifas/criar" 
            class="nav-item" 
            @click="closeMobileSidebar"
            active-class="active"
          >
            <span class="nav-icon">➕</span>
            <span class="nav-text">Criar Campanha</span>
          </router-link>
          
          <router-link 
            to="/vendas" 
            class="nav-item" 
            @click="closeMobileSidebar"
            active-class="active"
          >
            <span class="nav-icon">💰</span>
            <span class="nav-text">Vendas</span>
          </router-link>
        </nav>

        <!-- User section fixo no final -->
        <div class="sidebar-user">
          <div class="user-info">
            <div class="user-avatar">{{ userInitials }}</div>
            <div class="user-details">
              <h4>{{ userName }}</h4>
              <p>{{ userEmail }}</p>
            </div>
          </div>
          <div class="user-actions">
            <router-link to="/profile" class="profile-btn" @click="closeMobileSidebar">
              <span class="profile-icon">👤</span>
              <span class="profile-text">Meu Perfil</span>
            </router-link>
            <button @click="handleLogout" class="logout-btn">
              <span class="logout-icon">🚪</span>
              <span class="logout-text">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showMobileSidebar = ref(false)
const showMobileUserMenu = ref(false)

const userName = computed(() => {
  return authStore.userName || 
         authStore.user?.name || 
         authStore.user?.userName ||
         'Usuário'
})

const userEmail = computed(() => {
  return authStore.userEmail || 
         authStore.user?.email || 
         authStore.user?.userEmail ||
         'Carregando...'
})

const userInitials = computed(() => {
  const name = userName.value
  if (name === 'Usuário' || name === 'Carregando...') {
    return 'U'
  }
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const debugUserData = () => {
  console.log('🔍 DEBUG USER DATA:', {
    'authStore.userName': authStore.userName,
    'authStore.userEmail': authStore.userEmail,
    'authStore.user': authStore.user,
    'authStore.isAuthenticated': authStore.isAuthenticated,
    'localStorage.user_data': localStorage.getItem('user_data'),
    'computed.userName': userName.value,
    'computed.userEmail': userEmail.value,
    'computed.userInitials': userInitials.value
  })
}

const toggleMobileSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value
  showMobileUserMenu.value = false
  
  if (showMobileSidebar.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileSidebar = () => {
  showMobileSidebar.value = false
  document.body.style.overflow = ''
}

const toggleUserMenu = () => {
  showMobileUserMenu.value = !showMobileUserMenu.value
  showMobileSidebar.value = false
}

const closeMobileUserMenu = () => {
  showMobileUserMenu.value = false
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

const handleResize = () => {
  if (window.innerWidth > 768) {
    closeMobileSidebar()
    closeMobileUserMenu()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  debugUserData()
  
  if (!userName.value || userName.value === 'Usuário' || !userEmail.value || userEmail.value === 'Carregando...') {
    console.log('⚠️ Dados do usuário não encontrados, tentando recarregar...')
    authStore.refreshUserData?.()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.body.style.overflow = ''
})
</script>

<!-- Estilos permanecem os mesmos -->
<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

/* Mobile Header */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.mobile-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1rem;
}

.mobile-menu-btn,
.mobile-user-btn {
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mobile-menu-btn:hover,
.mobile-user-btn:hover {
  background: #f3f4f6;
}

.mobile-menu-btn svg {
  width: 24px;
  height: 24px;
  color: #374151;
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.mobile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

/* Mobile User Menu */
.mobile-user-menu {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  z-index: 40;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.mobile-user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.mobile-user-details h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.mobile-user-details p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.mobile-user-actions {
  padding: 1rem;
}

.mobile-action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: none;
  border: none;
  border-radius: 8px;
  color: #374151;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  text-align: left;
}

.mobile-action-btn:hover {
  background: #f3f4f6;
}

.mobile-action-btn.logout {
  color: #dc2626;
}

.mobile-action-btn.logout:hover {
  background: #fef2f2;
}

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 30;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  height: 100vh; /* Altura fixa */
  position: fixed; /* Fixo na tela */
  top: 0;
  left: 0;
}

.sidebar-header,
.mobile-sidebar-header {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0; /* Não diminui */
}

.mobile-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo .logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

/* Container com scroll */
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px); /* Altura calculada */
}

/* Navegação com flex-grow */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #f8faff;
  color: #667eea;
  border-left-color: #667eea;
}

.nav-item.active {
  background: #f0f7ff;
  color: #667eea;
  border-left-color: #667eea;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 0.9rem;
}

/* User section fixo no final */
.sidebar-user {
  margin-top: auto; /* Push para o final */
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f8faff;
  flex-shrink: 0; /* Não diminui */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-details h4 {
  margin: 0;
  font-size: 0.9rem;
  color: #1f2937;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.user-details p {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

/* Botões de ação do usuário */
.user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f8faff 0%, #f0f7ff 100%);
  color: #2563eb;
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.profile-btn:hover {
  background: linear-gradient(135deg, #f0f7ff 0%, #e0e7ff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.profile-icon,
.logout-icon {
  font-size: 1rem;
}

.profile-text,
.logout-text {
  font-size: 0.875rem;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 40;
  }
  
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    margin-top: 60px;
    padding: 1rem;
  }
  
  .desktop-only {
    display: none;
  }
  
  .mobile-only {
    display: block;
  }
}

@media (min-width: 769px) {
  .mobile-only {
    display: none;
  }
  
  .desktop-only {
    display: block;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>