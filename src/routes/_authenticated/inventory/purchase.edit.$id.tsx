import { createFileRoute } from '@tanstack/react-router'
import { PurchaseEditPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/purchase/edit/$id')({
  component: PurchaseEditPage,
})
