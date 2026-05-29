import { createFileRoute } from '@tanstack/react-router'
import { ServiceInvoiceCreatePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/service-invoice/create')({
  component: ServiceInvoiceCreatePage,
})
