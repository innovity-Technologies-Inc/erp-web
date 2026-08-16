import { createFileRoute } from '@tanstack/react-router'
import { BankReconciliationReportPage } from '@/modules/account/views/reports/BankReconciliationReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/bank-reconciliation')({
  component: BankReconciliationReportPage,
})
