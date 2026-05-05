import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useUiStore } from '@/store/useUiStore'
import { resetPassword } from '../api/auth.api'
import type { ResetPasswordFormValues } from './validation'

export const useResetPassword = () => {
  const navigate = useNavigate()
  const notify = useUiStore((state) => state.notify)

  return useMutation({
    mutationFn: (values: ResetPasswordFormValues) => resetPassword(values),
    onSuccess: (response) => {
      if (response.success) {
        notify('Password reset successful! You can now log in with your new password.', 'success')
        navigate({ to: '/login' })
      } else {
        notify(response.message || 'Failed to reset password.', 'error')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.'
      notify(message, 'error')
    },
  })
}
