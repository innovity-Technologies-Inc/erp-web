import { createFileRoute } from '@tanstack/react-router'
import { CashClosingPage } from '@/modules/inventory/views/reports/CashClosingPage'

export const Route = createFileRoute('/_authenticated/inventory/report/cash-closing')({
  component: CashClosingPage,
})
