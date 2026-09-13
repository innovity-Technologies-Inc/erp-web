import { createFileRoute } from '@tanstack/react-router'
import { PurchaseOrderListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/purchase-orders/')({
  component: PurchaseOrderListPage,
})
