import { createFileRoute } from '@tanstack/react-router'
import { BankReconciliationPage } from '@/modules/account/views/bank-reconciliation/BankReconciliationPage'

export const Route = createFileRoute('/_authenticated/account/bank-reconciliation')({
  component: BankReconciliationPage,
})
