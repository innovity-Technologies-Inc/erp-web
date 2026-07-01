import { useQuery, useMutation } from '@tanstack/react-query'
import * as api from '../api/merchant-receive.api'
import { useUiStore } from '@/store/useUiStore'

export const usePaymentMethodsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'payment-methods-merchant'],
    queryFn: api.getPaymentMethodsSelect2,
  })
}

export const useMerchantsSelect2 = () => {
  return useQuery({
    queryKey: ['merchants', 'select2'],
    queryFn: api.getMerchantsSelect2,
  })
}

export const useMerchantVouchersSelect2 = (merchantId: string | number | null) => {
  return useQuery({
    queryKey: ['select2', 'merchant-vouchers', merchantId],
    queryFn: () => api.getMerchantVouchersSelect2(merchantId!),
    enabled: !!merchantId,
  })
}

export const useStoreMerchantReceive = () => {
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeMerchantReceive,
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Merchant Receive.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}
