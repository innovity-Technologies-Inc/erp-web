import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { creditVoucherApi } from '../api/credit-voucher.api'
import { useUiStore } from '@/store/useUiStore'

export const useCreditVouchersDatatable = (params: any) => {
  return useQuery({
    queryKey: ['credit-vouchers-datatable', params],
    queryFn: () => creditVoucherApi.getDatatable(params),
  })
}

export const useStoreCreditVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: creditVoucherApi.store,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['credit-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Credit Voucher saved successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Credit Voucher.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateCreditVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: creditVoucherApi.update,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['credit-vouchers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['credit-voucher-details'] })
      showNotificationModal(
        'Success!',
        res.message || 'Credit Voucher updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update Credit Voucher.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useDeleteCreditVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: creditVoucherApi.delete,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['credit-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Credit Voucher deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete Credit Voucher.'
      showNotificationModal('Deletion Failed', message, 'error')
    }
  })
}

export const useCreditVoucherDetails = (id: number | string | null) => {
  return useQuery({
    queryKey: ['credit-voucher-details', id],
    queryFn: async () => {
      const res = await creditVoucherApi.show(id!)
      return res.data
    },
    enabled: !!id,
  })
}

export const useCreditAccountHeadsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'credit-account-heads'],
    queryFn: async () => {
      const raw = await creditVoucherApi.getCreditAccountHeads()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
        is_bank_nature: item.is_bank_nature
      }))
    },
  })
}

export const useTransactionHeadsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'transaction-heads'],
    queryFn: async () => {
      const raw = await creditVoucherApi.getTransactionHeads()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
      }))
    },
  })
}
