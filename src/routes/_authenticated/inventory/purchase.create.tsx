import { createFileRoute } from '@tanstack/react-router'
import { PurchaseCreatePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/purchase/create')({
  component: PurchaseCreatePage,
})
