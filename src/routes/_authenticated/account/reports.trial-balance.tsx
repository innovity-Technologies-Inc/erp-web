import { createFileRoute } from '@tanstack/react-router'
import { TrialBalanceReportPage } from '@/modules/account/views/reports/TrialBalanceReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/trial-balance')({
  component: TrialBalanceReportPage,
})
