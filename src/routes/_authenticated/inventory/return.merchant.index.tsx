import { createFileRoute } from '@tanstack/react-router'
import { MerchantReturnListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/return/merchant/')({
  component: MerchantReturnListPage,
})
