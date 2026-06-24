import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coaApi } from '../api/coa.api'
import { useUiStore } from '@/store/useUiStore'

export const useGetAccountList = () => {
  return useQuery({
    queryKey: ['coa', 'list'],
    queryFn: coaApi.getAccountList,
  })
}

export const useGetCoaNewFormDefaults = (parentId: string) => {
  return useQuery({
    queryKey: ['coa', 'new-form', parentId],
    queryFn: () => coaApi.getNewFormDefaults(parentId),
    enabled: !!parentId,
  })
}

export const useGetSubTypes = () => {
  return useQuery({
    queryKey: ['coa', 'sub-types'],
    queryFn: coaApi.getSubTypes,
  })
}

export const useSaveCoa = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: coaApi.saveCoa,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['coa'] })
      showNotificationModal('Success!', data.message || 'Account saved successfully.', 'success')
    },
    onError: (error: any) => {
      console.error('Failed to save COA:', error)
      showNotificationModal('Error!', 'Failed to save account details.', 'error')
    }
  })
}

export const useDeleteCoa = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: coaApi.deleteCoa,
    onSuccess: (data: any) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['coa'] })
        showNotificationModal('Success!', 'Account deleted successfully.', 'success')
      } else {
        showNotificationModal('Warning!', data.message || 'Cannot delete this account.', 'error')
      }
    },
    onError: (error: any) => {
      console.error('Failed to delete COA:', error)
      showNotificationModal('Error!', 'Failed to delete account.', 'error')
    }
  })
}

export const useMainCoaCreate = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: coaApi.mainCoaCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coa'] })
      showNotificationModal('Success!', 'Main COA initialized successfully.', 'success')
    },
    onError: (error: any) => {
      console.error('Failed to create main COA:', error)
      showNotificationModal('Error!', 'Failed to initialize main COA.', 'error')
    }
  })
}
