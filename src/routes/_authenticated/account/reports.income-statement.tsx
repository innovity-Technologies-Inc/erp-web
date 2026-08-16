import { createFileRoute } from '@tanstack/react-router'
import { IncomeStatementReportPage } from '@/modules/account/views/reports/IncomeStatementReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/income-statement')({
  component: IncomeStatementReportPage,
})
