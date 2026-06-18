import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/merchants.api'
import { useUiStore } from '@/store/useUiStore'

export const useMerchantsDatatable = (params: any) => {
  return useQuery({
    queryKey: ['merchants-datatable', params],
    queryFn: () => api.getMerchantsDatatable(params),
  })
}

export const useStoreMerchant = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeMerchant,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['merchants-datatable'] })
      showNotificationModal(
        'Merchant Created!',
        res.message || 'New merchant has been added successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to add merchant.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateMerchant = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.updateMerchant,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['merchants-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-details'] })
      showNotificationModal(
        'Merchant Updated!',
        res.message || 'Merchant details have been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update merchant.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useDeleteMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants-datatable'] })
    },
  })
}

export const useMerchantData = (id: number | string | null) => {
  return useQuery({
    queryKey: ['merchant-details', id],
    queryFn: () => api.getMerchantData(id!),
    enabled: !!id,
  })
}
