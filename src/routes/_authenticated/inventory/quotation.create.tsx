import { createFileRoute } from '@tanstack/react-router'
import { CreateQuotationPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/quotation/create')({
  component: CreateQuotationPage,
})
