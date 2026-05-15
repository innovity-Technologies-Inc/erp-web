import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  permission: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * A wrapper component that only renders its children if the user has the required permission(s).
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission } = usePermissions()

  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
