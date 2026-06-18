import { createFileRoute } from '@tanstack/react-router'
import { SaleWiseProfitReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/sale-wise-profit')({
  component: SaleWiseProfitReportPage,
})
