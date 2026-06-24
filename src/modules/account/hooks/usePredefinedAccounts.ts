import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { predefinedAccountsApi } from '../api/predefined-accounts.api'
import { useUiStore } from '@/store/useUiStore'

export const useGetPredefinedAccounts = () => {
  return useQuery({
    queryKey: ['predefined-accounts'],
    queryFn: predefinedAccountsApi.getPredefinedAccounts,
  })
}

export const useSavePredefinedAccounts = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: predefinedAccountsApi.savePredefinedAccounts,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['predefined-accounts'] })
      showNotificationModal('Success!', data.message || 'Predefined accounts updated successfully.', 'success')
    },
    onError: (error: any) => {
      console.error('Failed to save predefined accounts:', error)
      showNotificationModal('Error!', 'Failed to save predefined accounts.', 'error')
    }
  })
}
