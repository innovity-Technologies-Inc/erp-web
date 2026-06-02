import { createFileRoute } from '@tanstack/react-router'
import { EditQuotationPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/quotation/edit/$id')({
  component: EditQuotationPage,
})
