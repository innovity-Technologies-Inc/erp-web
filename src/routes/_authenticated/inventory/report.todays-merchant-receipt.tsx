import { createFileRoute } from '@tanstack/react-router'
import { TodaysMerchantReceiptReportPage } from '@/modules/inventory/views/reports/TodaysMerchantReceiptReportPage'

export const Route = createFileRoute(
  '/_authenticated/inventory/report/todays-merchant-receipt'
)({
  component: TodaysMerchantReceiptReportPage,
})
