import { createFileRoute } from '@tanstack/react-router'
import { SaleViewPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/sales/view/$id')({
  component: SaleViewPage,
})
