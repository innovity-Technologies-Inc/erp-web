import { createFileRoute } from '@tanstack/react-router'
import { TermsListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/terms/')({
  component: TermsListPage,
})
