import { useQuery, useMutation } from '@tanstack/react-query'
import * as api from '../api/service-payment.api'
import { useUiStore } from '@/store/useUiStore'

export const usePaymentMethodsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'payment-methods-service'],
    queryFn: api.getPaymentMethodsSelect2,
  })
}

export const useMerchantsSelect2 = () => {
  return useQuery({
    queryKey: ['merchants', 'select2'],
    queryFn: api.getMerchantsSelect2,
  })
}

export const useServiceVouchersSelect2 = (merchantId: string | number | null) => {
  return useQuery({
    queryKey: ['select2', 'service-vouchers', merchantId],
    queryFn: () => api.getServiceVouchersSelect2(merchantId!),
    enabled: !!merchantId,
  })
}

export const useStoreServicePayment = () => {
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeServicePayment,
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Service Payment.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}
