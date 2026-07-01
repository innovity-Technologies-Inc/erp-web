import { createFileRoute } from '@tanstack/react-router'
import { PaymentMethodListPage } from '@/modules/account/views/payment-method/PaymentMethodListPage'

export const Route = createFileRoute('/_authenticated/account/payment-method')({
  component: PaymentMethodListPage,
})
