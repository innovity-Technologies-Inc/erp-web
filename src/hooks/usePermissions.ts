import { useAuthStore } from '@/store/useAuthStore'

export const usePermissions = () => {
  const { user, permissions } = useAuthStore()

  // Support multiple variations of the super admin role name
  const isSuperAdmin = user?.roles?.some(role => {
    const name = role.name.toLowerCase()
    return name === 'super-admin' || name === 'super admin'
  }) ?? false

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true
    const has = permissions.includes(permission)
    if (!has) {
      console.warn(`[PermissionGuard] Missing permission: ${permission}`, { roles: user?.roles, permissions })
    }
    return has
  }

  const hasAnyPermission = (requiredPermissions: string[]) => {
    if (isSuperAdmin) return true
    return requiredPermissions.some(p => permissions.includes(p))
  }

  return {
    user,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    permissions
  }
}
