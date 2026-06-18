import { createFileRoute } from '@tanstack/react-router'
import { CategoryWisePurchaseReportPage } from '@/modules/inventory/views/reports/CategoryWisePurchaseReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/category-wise-purchase')({
  component: CategoryWisePurchaseReportPage,
})
