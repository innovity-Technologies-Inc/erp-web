import { createFileRoute } from '@tanstack/react-router'
import { SubLedgerReportPage } from '@/modules/account/views/reports/SubLedgerReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/sub-ledger')({
  component: SubLedgerReportPage,
})
