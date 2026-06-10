import { createFileRoute } from '@tanstack/react-router'
import { MerchantWiseSalesReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/merchant-wise-sales')({
  component: MerchantWiseSalesReportPage,
})
