import { createFileRoute } from '@tanstack/react-router'
import { UserWiseSalesReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/user-wise-sales')({
  component: UserWiseSalesReportPage,
})
