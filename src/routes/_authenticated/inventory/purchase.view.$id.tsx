import { createFileRoute } from '@tanstack/react-router'
import { PurchaseViewPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/purchase/view/$id')({
  component: PurchaseViewPage,
})
