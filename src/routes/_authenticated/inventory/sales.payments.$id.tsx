import { createFileRoute } from '@tanstack/react-router'
import { InvoicePaymentViewPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/sales/payments/$id')({
  component: InvoicePaymentViewPage,
})
