import { Navigate, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'
import type { ReactNode } from 'react'

export const AuthGuard = ({ children }: { children?: ReactNode }) => {
  const { token, expiresAt, clearUser } = useAuthStore()

  const isExpired = expiresAt ? Date.now() > expiresAt : false

  if (!token || isExpired) {
    if (isExpired) clearUser()
    return <Navigate to="/login" />
  }

  return children ? <>{children}</> : <Outlet />
}
