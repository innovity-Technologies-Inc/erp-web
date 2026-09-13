import { createFileRoute } from '@tanstack/react-router'
import { PurchaseOrderEditPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/purchase-orders/edit/$id')({
  component: PurchaseOrderEditPage,
})
