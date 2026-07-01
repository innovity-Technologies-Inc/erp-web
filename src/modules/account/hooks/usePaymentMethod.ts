import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/payment-method.api'
import { useUiStore } from '@/store/useUiStore'

export const usePaymentMethodsDatatable = (params: any) => {
  return useQuery({
    queryKey: ['payment-methods-datatable', params],
    queryFn: () => api.getPaymentMethodsDatatable(params),
  })
}

export const useStorePaymentMethod = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storePaymentMethod,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods-datatable'] })
      showNotificationModal(
        'Payment Method Created!',
        res.message || 'New payment method has been added successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to add payment method.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.updatePaymentMethod,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['payment-method-details'] })
      showNotificationModal(
        'Payment Method Updated!',
        res.message || 'Payment method details have been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update payment method.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.deletePaymentMethod,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Payment method has been deleted.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete payment method.'
      showNotificationModal('Failed', message, 'error')
    }
  })
}

export const usePaymentMethodData = (id: number | string | null) => {
  return useQuery({
    queryKey: ['payment-method-details', id],
    queryFn: () => api.getPaymentMethodData(id!),
    enabled: !!id,
  })
}
