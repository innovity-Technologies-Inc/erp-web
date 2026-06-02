import { createFileRoute } from '@tanstack/react-router'
import { AddQuotationToInvoicePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/quotation/add-to-invoice/$id')({
  component: AddQuotationToInvoicePage,
})
