import { createFileRoute } from '@tanstack/react-router'
import { MerchantReturnCreatePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/return/merchant/create')({
  component: MerchantReturnCreatePage,
})
