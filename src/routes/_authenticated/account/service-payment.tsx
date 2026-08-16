import { createFileRoute } from '@tanstack/react-router'
import { ServicePaymentPage } from '@/modules/account/views/service-payment/ServicePaymentPage'

export const Route = createFileRoute('/_authenticated/account/service-payment')({
  component: ServicePaymentPage,
})
