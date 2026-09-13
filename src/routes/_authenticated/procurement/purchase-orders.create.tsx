import { createFileRoute } from '@tanstack/react-router'
import { PurchaseOrderCreatePage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/purchase-orders/create')({
  component: PurchaseOrderCreatePage,
})
