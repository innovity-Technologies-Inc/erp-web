import { createFileRoute } from '@tanstack/react-router'
import { SaleEditPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/sales/edit/$id')({
  component: SaleEditPage,
})
