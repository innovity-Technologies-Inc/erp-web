import { useQuery, useMutation } from '@tanstack/react-query'
import * as api from '../api/cash-adjustment.api'
import { useUiStore } from '@/store/useUiStore'

export const useNextVoucherNo = () => {
  return useQuery({
    queryKey: ['cash-adjustment', 'next-voucher-no'],
    queryFn: api.getNextVoucherNo,
  })
}

export const useStoreCashAdjustment = () => {
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeCashAdjustment,
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Cash Adjustment.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}
