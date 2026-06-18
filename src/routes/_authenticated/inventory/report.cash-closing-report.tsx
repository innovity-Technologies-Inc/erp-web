import { createFileRoute } from '@tanstack/react-router'
import { CashClosingReportPage } from '@/modules/inventory/views/reports/CashClosingReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/cash-closing-report')({
  component: CashClosingReportPage,
})
