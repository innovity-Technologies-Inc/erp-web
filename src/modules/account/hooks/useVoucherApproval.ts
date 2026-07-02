import { useQuery, useMutation } from '@tanstack/react-query'
import { voucherApprovalApi } from '../api/voucher-approval.api'
import { useUiStore } from '@/store/useUiStore'

export const useVoucherApprovalDatatable = (params: any) => {
  return useQuery({
    queryKey: ['voucher-approval', 'datatable', params],
    queryFn: () => voucherApprovalApi.getDatatable(params),
  })
}

export const useVoucherApprovalDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['voucher-approval', 'details', id],
    queryFn: () => voucherApprovalApi.getDetails(id!),
    enabled: !!id,
  })
}

export const useApproveVoucher = () => {
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: voucherApprovalApi.approve,
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to approve voucher.'
      showNotificationModal('Approval Failed', message, 'error')
    }
  })
}
