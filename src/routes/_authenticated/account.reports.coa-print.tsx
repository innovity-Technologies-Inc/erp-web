import { createFileRoute } from '@tanstack/react-router'
import { CoaPrintReportPage } from '@/modules/account/views/reports/CoaPrintReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/coa-print')({
  component: CoaPrintReportPage,
})
