import { createFileRoute } from '@tanstack/react-router'
import { WarehouseWiseStockReportPage } from '@/modules/inventory/views/reports/WarehouseWiseStockReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/warehouse-wise-stock')({
  component: WarehouseWiseStockReportPage,
})
