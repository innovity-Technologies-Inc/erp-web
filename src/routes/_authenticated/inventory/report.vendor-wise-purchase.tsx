import { createFileRoute } from '@tanstack/react-router'
import { VendorWisePurchaseReportPage } from '@/modules/inventory/views/reports/VendorWisePurchaseReportPage'

export const Route = createFileRoute('/_authenticated/inventory/report/vendor-wise-purchase')({
  component: VendorWisePurchaseReportPage,
})
