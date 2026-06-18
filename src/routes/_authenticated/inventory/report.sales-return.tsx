import { createFileRoute } from '@tanstack/react-router'
import { SalesReturnReportPage } from '@/modules/inventory/views/reports/SalesReturnReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/sales-return')({
  component: SalesReturnReportPage,
})
