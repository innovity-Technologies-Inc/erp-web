import { createFileRoute } from '@tanstack/react-router'
import { ResetPasswordPage } from '@/modules/auth'

export const Route = createFileRoute('/_auth/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
      email: (search.email as string) || '',
    }
  },
})
