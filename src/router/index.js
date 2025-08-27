import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Importar views
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import MinhasRifas from '@/views/MinhasRifas.vue'
import CriarRifa from '@/views/CriarRifa.vue'
import EditarRifa from '@/views/EditarRifa.vue'
import GerenciarRifa from '@/views/GerenciarRifa.vue'
import RifaDetalhes from '@/views/RifaDetalhes.vue'
import Profile from '@/views/Profile.vue'
import Vendas from '@/views/Vendas.vue' // ✅ ADICIONADO
import Unauthorized from '@/views/Unauthorized.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas',
    name: 'MinhasRifas',
    component: MinhasRifas,
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas/criar',
    name: 'CriarRifa',
    component: CriarRifa,
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas/:id/editar',
    name: 'EditarRifa',
    component: EditarRifa,
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas/:id/gerenciar',
    name: 'GerenciarRifa',
    component: GerenciarRifa,
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas/:id',
    name: 'RifaDetalhes',
    component: RifaDetalhes,
    meta: { requiresAuth: true }
  },
  // ✅ ADICIONADO: Rota para Vendas
  {
    path: '/vendas',
    name: 'Vendas',
    component: Vendas,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: Unauthorized,
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de autenticação
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Aguardar verificação de autenticação se ainda estiver carregando
  if (authStore.isLoading) {
    await new Promise(resolve => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.isLoading) {
          unwatch()
          resolve()
        }
      })
    })
  }
  
  const requiresAuth = to.meta.requiresAuth !== false
  
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('🔐 Redirecionando para login - usuário não autenticado')
    next('/login')
  } else if (!requiresAuth && authStore.isAuthenticated && to.path === '/login') {
    console.log('✅ Usuário já autenticado, redirecionando para dashboard')
    next('/dashboard')
  } else {
    next()
  }
})

export default router