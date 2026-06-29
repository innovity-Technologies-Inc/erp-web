import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { debitVoucherApi } from '../api/debit-voucher.api'
import { useUiStore } from '@/store/useUiStore'

export const useDebitVouchersDatatable = (params: any) => {
  return useQuery({
    queryKey: ['debit-vouchers-datatable', params],
    queryFn: () => debitVoucherApi.getDatatable(params),
  })
}

export const useStoreDebitVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: debitVoucherApi.store,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['debit-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Debit Voucher saved successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Debit Voucher.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateDebitVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: debitVoucherApi.update,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['debit-vouchers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['debit-voucher-details'] })
      showNotificationModal(
        'Success!',
        res.message || 'Debit Voucher updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update Debit Voucher.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useDeleteDebitVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: debitVoucherApi.delete,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['debit-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Debit Voucher deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete Debit Voucher.'
      showNotificationModal('Deletion Failed', message, 'error')
    }
  })
}

export const useDebitVoucherDetails = (id: number | string | null) => {
  return useQuery({
    queryKey: ['debit-voucher-details', id],
    queryFn: async () => {
      const res = await debitVoucherApi.show(id!)
      return res.data
    },
    enabled: !!id,
  })
}

export const useCreditAccountHeadsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'credit-account-heads'],
    queryFn: async () => {
      const raw = await debitVoucherApi.getCreditAccountHeads()
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
      const raw = await debitVoucherApi.getTransactionHeads()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
      }))
    },
  })
}
