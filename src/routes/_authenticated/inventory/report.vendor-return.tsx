import { createFileRoute } from '@tanstack/react-router'
import { VendorReturnReportPage } from '@/modules/inventory/views/reports/VendorReturnReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/vendor-return')({
  component: VendorReturnReportPage,
})
