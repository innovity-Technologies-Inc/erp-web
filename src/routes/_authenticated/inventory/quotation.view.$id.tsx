import { createFileRoute } from '@tanstack/react-router'
import { QuotationDetailsPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/quotation/view/$id')({
  component: QuotationDetailsPage,
})
