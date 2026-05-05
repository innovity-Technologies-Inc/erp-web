import { useAuthStore } from '@/store/useAuthStore'

export const usePermissions = () => {
  const { user, permissions } = useAuthStore()

  const isSuperAdmin = user?.roles?.some(role => role.name === 'super-admin') ?? false

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true
    return permissions.includes(permission)
  }

  const hasAnyPermission = (requiredPermissions: string[]) => {
    if (isSuperAdmin) return true
    return requiredPermissions.some(p => permissions.includes(p))
  }

  return {
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    permissions
  }
}
