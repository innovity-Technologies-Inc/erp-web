import { createFileRoute } from '@tanstack/react-router'
import { ShippingCostReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/shipping-cost')({
  component: ShippingCostReportPage,
})
