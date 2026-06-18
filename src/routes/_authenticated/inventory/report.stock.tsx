import { createFileRoute } from '@tanstack/react-router'
import { StockReportPage } from '@/modules/inventory/views/reports/StockReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/stock')({
  component: StockReportPage,
})
