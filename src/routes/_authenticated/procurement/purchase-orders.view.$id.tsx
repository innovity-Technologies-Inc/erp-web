import { createFileRoute } from '@tanstack/react-router'
import { PurchaseOrderViewPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/purchase-orders/view/$id')({
  component: PurchaseOrderViewPage,
})
