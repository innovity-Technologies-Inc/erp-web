import { createFileRoute } from '@tanstack/react-router'
import { InvoiceWiseDueReportPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/report/due')({
  component: InvoiceWiseDueReportPage,
})
