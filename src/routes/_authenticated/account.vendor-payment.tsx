import { createFileRoute } from '@tanstack/react-router'
import { VendorPaymentPage } from '@/modules/account/views/vendor-payment/VendorPaymentPage'

export const Route = createFileRoute('/_authenticated/account/vendor-payment')({
  component: VendorPaymentPage,
})
