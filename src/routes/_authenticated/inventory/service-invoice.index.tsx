import { createFileRoute } from '@tanstack/react-router'
import { ServiceInvoiceListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/service-invoice/')({
  component: ServiceInvoiceListPage,
})
