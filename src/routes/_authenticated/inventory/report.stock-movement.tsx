import { createFileRoute } from '@tanstack/react-router'
import { StockMovementReportPage } from '@/modules/inventory/views/reports/StockMovementReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/stock-movement')({
  component: StockMovementReportPage,
})
