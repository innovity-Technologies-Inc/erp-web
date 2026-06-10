import { createFileRoute } from '@tanstack/react-router'
import { ProductWiseSalesReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/product-wise-sales')({
  component: ProductWiseSalesReportPage,
})
