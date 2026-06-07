import { createFileRoute } from '@tanstack/react-router'
import { MerchantReturnDetailsPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/return/merchant/details/$id')({
  component: MerchantReturnDetailsPage,
})
