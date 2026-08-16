import { createFileRoute } from '@tanstack/react-router'
import { BalanceSheetReportPage } from '@/modules/account/views/reports/BalanceSheetReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/balance-sheet')({
  component: BalanceSheetReportPage,
})
