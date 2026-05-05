import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const PermissionGuard = ({ permission, fallback, children }: PermissionGuardProps) => {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission)) {
    return <>{fallback || <div className="p-8 text-center text-gray-500">You don't have permission to view this content.</div>}</>
  }

  return <>{children}</>
}
