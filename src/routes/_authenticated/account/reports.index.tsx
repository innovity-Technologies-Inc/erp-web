import { createFileRoute } from '@tanstack/react-router'
import { CashBookReportPage } from '@/modules/account/views/reports/CashBookReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/')({
  component: CashBookReportPage,
})
