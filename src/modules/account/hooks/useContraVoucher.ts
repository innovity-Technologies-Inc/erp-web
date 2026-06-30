import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contraVoucherApi } from '../api/contra-voucher.api'
import { useUiStore } from '@/store/useUiStore'

export const useContraVouchersDatatable = (params: any) => {
  return useQuery({
    queryKey: ['contra-vouchers-datatable', params],
    queryFn: () => contraVoucherApi.getDatatable(params),
  })
}

export const useStoreContraVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: contraVoucherApi.store,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contra-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Contra Voucher saved successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Contra Voucher.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateContraVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: contraVoucherApi.update,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contra-vouchers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['contra-voucher-details'] })
      showNotificationModal(
        'Success!',
        res.message || 'Contra Voucher updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update Contra Voucher.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useDeleteContraVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: contraVoucherApi.delete,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contra-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Contra Voucher deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete Contra Voucher.'
      showNotificationModal('Deletion Failed', message, 'error')
    }
  })
}

export const useContraVoucherDetails = (id: number | string | null) => {
  return useQuery({
    queryKey: ['contra-voucher-details', id],
    queryFn: async () => {
      const res = await contraVoucherApi.show(id!)
      return res.data
    },
    enabled: !!id,
  })
}

export const useReverseAccountHeadsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'reverse-account-heads'],
    queryFn: async () => {
      const raw = await contraVoucherApi.getReverseAccountHeads()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
      }))
    },
  })
}

export const useTransactionHeadsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'transaction-heads'],
    queryFn: async () => {
      const raw = await contraVoucherApi.getTransactionHeads()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
      }))
    },
  })
}
