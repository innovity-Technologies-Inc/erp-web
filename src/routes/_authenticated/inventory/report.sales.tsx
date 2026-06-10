import { createFileRoute } from '@tanstack/react-router'
import { SalesReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/sales')({
  component: SalesReportPage,
})
