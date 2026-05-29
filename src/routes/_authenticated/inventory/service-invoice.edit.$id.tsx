import { createFileRoute } from '@tanstack/react-router'
import { ServiceInvoiceEditPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/service-invoice/edit/$id')({
  component: ServiceInvoiceEditPage,
})
