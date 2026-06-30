import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { journalVoucherApi } from '../api/journal-voucher.api'
import { useUiStore } from '@/store/useUiStore'

export const useJournalVouchersDatatable = (params: any) => {
  return useQuery({
    queryKey: ['journal-vouchers-datatable', params],
    queryFn: () => journalVoucherApi.getDatatable(params),
  })
}

export const useStoreJournalVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: journalVoucherApi.store,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['journal-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Journal Voucher saved successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Journal Voucher.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateJournalVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: journalVoucherApi.update,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['journal-vouchers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['journal-voucher-details'] })
      showNotificationModal(
        'Success!',
        res.message || 'Journal Voucher updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update Journal Voucher.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useDeleteJournalVoucher = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: journalVoucherApi.delete,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['journal-vouchers-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Journal Voucher deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete Journal Voucher.'
      showNotificationModal('Deletion Failed', message, 'error')
    }
  })
}

export const useJournalVoucherDetails = (id: number | string | null) => {
  return useQuery({
    queryKey: ['journal-voucher-details', id],
    queryFn: async () => {
      const res = await journalVoucherApi.show(id!)
      return res.data
    },
    enabled: !!id,
  })
}

export const useLevelFourAccountHeadsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'level-four-account-heads'],
    queryFn: async () => {
      const raw = await journalVoucherApi.getLevelFourAccountHeads()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
      }))
    },
  })
}
