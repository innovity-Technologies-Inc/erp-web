import { useMutation } from '@tanstack/react-query'
import { useUiStore } from '@/store/useUiStore'
import { forgotPassword } from '../api/auth.api'
import type { ForgotPasswordFormValues } from './validation'

export const useForgotPassword = () => {
  const notify = useUiStore((state) => state.notify)

  return useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => forgotPassword(values.email),
    onSuccess: (response) => {
      if (response.success) {
        notify(response.message || 'Password reset link sent to your email.', 'success')
      } else {
        notify(response.message || 'Failed to send reset link.', 'error')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.'
      notify(message, 'error')
    },
  })
}
