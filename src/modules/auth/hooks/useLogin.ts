import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { login } from '../api/auth.api'
import { getGlobalSettings } from '@/api/settings.api'
import type { LoginFormValues } from './validation'

export const useLogin = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const notify = useUiStore((state) => state.notify)

  return useMutation({
    mutationFn: (values: LoginFormValues) => login({ email: values.email, password: values.password }),
    onSuccess: async (response) => {
      if (response.success) {
        const { user, token, permissions, expires_in } = response.data
        setUser(user, token, permissions, expires_in)

        // Force refresh global settings after login to ensure fresh branding/config
        try {
          await queryClient.fetchQuery({
            queryKey: ['global-settings', token],
            queryFn: getGlobalSettings,
          })
        } catch (err) {
          console.error('Failed to refresh settings after login', err)
        }

        notify('Login successful!', 'success')
        navigate({ to: '/' })
      } else {
        notify(response.message || 'Login failed', 'error')
      }
    },
    onError: (error: any) => {
      const response = error.response?.data
      const message = response?.message || 'Something went wrong. Please try again.'
      
      // If there are specific validation errors, we can handle them here or in the component
      if (response?.errors) {
        // Detailed validation errors are available in response.errors
        notify('Validation failed. Please check your inputs.', 'error')
      } else {
        notify(message, 'error')
      }
    },
  })
}
