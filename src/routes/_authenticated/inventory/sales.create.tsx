import { createFileRoute } from '@tanstack/react-router'
import { SaleCreatePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/sales/create')({
  component: SaleCreatePage,
})
