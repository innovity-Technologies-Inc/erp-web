import { createFileRoute } from '@tanstack/react-router'
import { ExpenditureStatementReportPage } from '@/modules/account/views/reports/ExpenditureStatementReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/expenditure-statement')({
  component: ExpenditureStatementReportPage,
})
