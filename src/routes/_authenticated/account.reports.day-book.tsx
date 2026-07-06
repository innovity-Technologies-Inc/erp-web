import { createFileRoute } from '@tanstack/react-router'
import { DayBookReportPage } from '@/modules/account/views/reports/DayBookReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/day-book')({
  component: DayBookReportPage,
})
