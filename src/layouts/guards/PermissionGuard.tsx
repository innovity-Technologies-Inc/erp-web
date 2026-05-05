import React from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface PermissionGuardProps {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const PermissionGuard = ({ permission, fallback, children }: PermissionGuardProps) => {
  const permissions = useAuthStore((state) => state.permissions)
  const hasPermission = permissions.includes(permission)

  if (!hasPermission) {
    return <>{fallback || <div className="p-8 text-center text-gray-500">You don't have permission to view this content.</div>}</>
  }

  return <>{children}</>
}
