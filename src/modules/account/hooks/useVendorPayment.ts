import { useQuery, useMutation } from '@tanstack/react-query'
import * as api from '../api/vendor-payment.api'
import { useUiStore } from '@/store/useUiStore'

export const usePaymentMethodsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'payment-methods-vendor'],
    queryFn: api.getPaymentMethodsSelect2,
  })
}

export const useVendorsSelect2 = () => {
  return useQuery({
    queryKey: ['vendors', 'select2'],
    queryFn: api.getVendorsSelect2,
  })
}

export const useVendorVouchersSelect2 = (vendorId: string | number | null) => {
  return useQuery({
    queryKey: ['select2', 'vendor-vouchers', vendorId],
    queryFn: () => api.getVouchersSelect2(vendorId!),
    enabled: !!vendorId,
  })
}

export const useStoreVendorPayment = () => {
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeVendorPayment,
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save Vendor Payment.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}
