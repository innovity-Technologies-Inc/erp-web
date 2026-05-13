import { Navigate, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'
import type { ReactNode } from 'react'

export const AuthGuard = ({ children }: { children?: ReactNode }) => {
  const { token, expiresAt, clearUser } = useAuthStore()

  const isExpired = expiresAt ? Date.now() > expiresAt : false

  // Diagnostic logging
  if (!token || isExpired) {
    console.log('[AuthGuard] Redirecting to login:', {
      hasToken: !!token,
      isExpired,
      expiresAt: expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A',
      now: new Date().toLocaleString()
    })
    
    if (isExpired) clearUser()
    return <Navigate to="/login" />
  }

  return children ? <>{children}</> : <Outlet />
}
