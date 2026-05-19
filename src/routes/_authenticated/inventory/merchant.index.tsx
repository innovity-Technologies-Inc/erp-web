import { createFileRoute } from '@tanstack/react-router'
import { MerchantListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/merchant/')({
  component: MerchantListPage,
})
