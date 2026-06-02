import { createFileRoute } from '@tanstack/react-router'
import { QuotationListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/quotation/')({
  component: QuotationListPage,
})
