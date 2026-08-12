import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmailConfig, updateEmailConfig, sendTestEmail } from '../api/settings.api'

export const useEmailConfig = () => {
  return useQuery({
    queryKey: ['email-config'],
    queryFn: getEmailConfig,
  })
}

export const useUpdateEmailConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] })
    },
  })
}

export const useSendTestEmail = () => {
  return useMutation({
    mutationFn: sendTestEmail,
  })
}
