import { createFileRoute } from '@tanstack/react-router'
import { MerchantEditPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/merchant/edit/$id')({
  component: MerchantEditPage,
})
