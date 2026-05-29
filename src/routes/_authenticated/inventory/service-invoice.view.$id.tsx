import { createFileRoute } from '@tanstack/react-router'
import { ServiceInvoiceViewPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/service-invoice/view/$id')({
  component: ServiceInvoiceViewPage,
})
