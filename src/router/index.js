import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import MinhasRifas from '@/views/MinhasRifas.vue'
import CriarRifa from '@/views/CriarRifa.vue'
import EditarRifa from '@/views/EditarRifa.vue'
import GerenciarRifa from '@/views/GerenciarRifa.vue'
import RifaDetalhes from '@/views/RifaDetalhes.vue'
import Vendas from '@/views/Vendas.vue'
import Profile from '@/views/Profile.vue'
import Unauthorized from '@/views/Unauthorized.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
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
    name: 'NotFound',
    redirect: (to) => {
      const authStore = useAuthStore()
      console.log('🔄 ROUTER: Rota não encontrada:', to.path)
      console.log('🔐 ROUTER: Usuário autenticado:', authStore.isAuthenticated)
      
      return authStore.isAuthenticated ? '/dashboard' : '/login'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  console.log('🛡️ ROUTER GUARD:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading
  })
  
  if (authStore.isLoading) {
    console.log('⏳ ROUTER: Aguardando verificação de autenticação...')
    await new Promise(resolve => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.isLoading) {
          unwatch()
          resolve()
        }
      })
      
      setTimeout(() => {
        unwatch()
        resolve()
      }, 5000)
    })
  }
  
  const requiresAuth = to.meta.requiresAuth !== false
  
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('🔐 ROUTER: Redirecionando para login - usuário não autenticado')
    next('/login')
  } else if (!requiresAuth && authStore.isAuthenticated && to.path === '/login') {
    console.log('✅ ROUTER: Usuário já autenticado, redirecionando para dashboard')
    next('/dashboard')
  } else {
    console.log('✅ ROUTER: Navegação autorizada')
    next()
  }
})

router.afterEach((to, from) => {
  console.log('📍 ROUTER: Navegação concluída:', {
    from: from.path,
    to: to.path,
    timestamp: new Date().toISOString()
  })
})

export default router