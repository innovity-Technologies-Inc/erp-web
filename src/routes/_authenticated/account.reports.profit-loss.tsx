import { createFileRoute } from '@tanstack/react-router'
import { ProfitLossReportPage } from '@/modules/account/views/reports/ProfitLossReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/profit-loss')({
  component: ProfitLossReportPage,
})
