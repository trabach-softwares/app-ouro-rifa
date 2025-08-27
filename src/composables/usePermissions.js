import { computed } from 'vue'
import { authService } from '../services/authService.js'

export const usePermissions = () => {
  const currentUser = computed(() => {
    try {
      return authService.getCurrentUser()
    } catch (error) {
      console.error('Erro ao obter usuário atual no composable:', error)
      return null
    }
  })

  const userRole = computed(() => {
    try {
      return authService.getUserRole()
    } catch (error) {
      console.error('Erro ao obter papel do usuário:', error)
      return 'user'
    }
  })

  const userPermissions = computed(() => {
    try {
      return authService.getUserPermissions()
    } catch (error) {
      console.error('Erro ao obter permissões do usuário:', error)
      return []
    }
  })

  // Verificar permissões
  const hasPermission = (permission) => {
    try {
      return authService.hasPermission(permission)
    } catch (error) {
      console.error('Erro ao verificar permissão:', error)
      return false
    }
  }

  const hasRole = (role) => {
    try {
      return authService.hasRole(role)
    } catch (error) {
      console.error('Erro ao verificar papel:', error)
      return false
    }
  }

  const hasAnyPermission = (permissions) => {
    try {
      if (!Array.isArray(permissions)) {
        return false
      }
      return permissions.some(permission => hasPermission(permission))
    } catch (error) {
      console.error('Erro ao verificar permissões múltiplas:', error)
      return false
    }
  }

  const hasAllPermissions = (permissions) => {
    try {
      if (!Array.isArray(permissions)) {
        return false
      }
      return permissions.every(permission => hasPermission(permission))
    } catch (error) {
      console.error('Erro ao verificar todas as permissões:', error)
      return false
    }
  }

  // Verificações de papel específicas - usando computed para reatividade
  const isSuperAdmin = computed(() => {
    try {
      return authService.isSuperAdmin()
    } catch (error) {
      console.error('Erro ao verificar se é super admin:', error)
      return false
    }
  })

  const isAdmin = computed(() => {
    try {
      return authService.isAdmin()
    } catch (error) {
      console.error('Erro ao verificar se é admin:', error)
      return false
    }
  })

  const isUser = computed(() => {
    try {
      return authService.isUser()
    } catch (error) {
      console.error('Erro ao verificar se é usuário:', error)
      return true
    }
  })

  // Constantes de permissões
  const PERMISSIONS = {
    // Rifas
    RAFFLES_CREATE: 'raffles:create',
    RAFFLES_READ: 'raffles:read',
    RAFFLES_UPDATE: 'raffles:update',
    RAFFLES_DELETE: 'raffles:delete',
    RAFFLES_DRAW: 'raffles:draw',
    
    // Usuários
    USERS_CREATE: 'users:create',
    USERS_READ: 'users:read',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',
    
    // Relatórios
    REPORTS_VIEW: 'reports:view',
    REPORTS_EXPORT: 'reports:export',
    
    // Configurações
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_UPDATE: 'settings:update',
    
    // Pagamentos
    PAYMENTS_VIEW: 'payments:view',
    PAYMENTS_APPROVE: 'payments:approve',
    
    // Admin
    ADMIN_PANEL: 'admin:panel',
    ADMIN_USERS: 'admin:users',
    ADMIN_SYSTEM: 'admin:system'
  }

  const ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    USER: 'user'
  }

  return {
    // Estado
    currentUser,
    userRole,
    userPermissions,
    
    // Métodos
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    
    // Verificações
    isSuperAdmin,
    isAdmin,
    isUser,
    
    // Constantes
    PERMISSIONS,
    ROLES
  }
}