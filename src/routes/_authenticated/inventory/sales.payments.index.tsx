import { createFileRoute } from '@tanstack/react-router'
import { InvoicePaymentListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/sales/payments/')({
  component: InvoicePaymentListPage,
})
