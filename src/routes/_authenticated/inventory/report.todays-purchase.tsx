import { createFileRoute } from '@tanstack/react-router'
import { TodaysPurchaseReportPage } from '@/modules/inventory/views/reports/TodaysPurchaseReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/todays-purchase')({
  component: TodaysPurchaseReportPage,
})
