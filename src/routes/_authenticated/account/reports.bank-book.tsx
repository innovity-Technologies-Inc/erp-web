import { createFileRoute } from '@tanstack/react-router'
import { BankBookReportPage } from '@/modules/account/views/reports/BankBookReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/bank-book')({
  component: BankBookReportPage,
})
