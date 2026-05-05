import { Navigate, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'
import type { ReactNode } from 'react'

export const AuthGuard = ({ children }: { children?: ReactNode }) => {
  const token = useAuthStore((state) => state.token)

  if (!token) {
    return <Navigate to="/login" />
  }

  return children ? <>{children}</> : <Outlet />
}
