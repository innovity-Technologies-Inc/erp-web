import { createFileRoute } from '@tanstack/react-router'
import { MerchantCreatePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/merchant/create')({
  component: MerchantCreatePage,
})
