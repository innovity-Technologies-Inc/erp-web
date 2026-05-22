import { createFileRoute } from '@tanstack/react-router'
import { PurchaseListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/purchase/')({
  component: PurchaseListPage,
})
