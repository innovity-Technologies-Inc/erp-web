import { createFileRoute } from '@tanstack/react-router'
import { GeneralLedgerReportPage } from '@/modules/account/views/reports/GeneralLedgerReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/general-ledger')({
  component: GeneralLedgerReportPage,
})
