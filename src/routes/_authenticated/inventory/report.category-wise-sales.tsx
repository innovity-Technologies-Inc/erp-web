import { createFileRoute } from '@tanstack/react-router'
import { CategoryWiseSalesReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/category-wise-sales')({
  component: CategoryWiseSalesReportPage,
})
