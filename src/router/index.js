import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/rifas'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/rifas',
    name: 'MinhasRifas',
    component: () => import('@/views/MinhasRifas.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas/criar',
    name: 'CriarRifa',
    component: () => import('@/views/CriarRifa.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas/:id',
    name: 'GerenciarRifa',
    component: () => import('@/views/GerenciarRifa.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rifas/:id/editar',
    name: 'EditarRifa',
    component: () => import('@/views/EditarRifa.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/vendas',
    name: 'Vendas',
    component: () => import('@/views/Vendas.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guards de autenticação
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/rifas')
  } else {
    next()
  }
})

export default router