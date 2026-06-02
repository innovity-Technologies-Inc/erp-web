import { Navigate, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

export const AuthGuard = ({ children }: { children?: ReactNode }) => {
  const { token, expiresAt, clearUser } = useAuthStore()

  const isExpired = expiresAt ? Date.now() > expiresAt : false

  useEffect(() => {
    if (isExpired) {
      console.log('[AuthGuard] Token expired, clearing user data.')
      clearUser()
    }
  }, [isExpired, clearUser])

  // Diagnostic logging
  if (!token || isExpired) {
    console.log('[AuthGuard] Redirecting to login:', {
      hasToken: !!token,
      isExpired,
      expiresAt: expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A',
      now: new Date().toLocaleString()
    })
    
    return <Navigate to="/login" />
  }

  return children ? <>{children}</> : <Outlet />
}
