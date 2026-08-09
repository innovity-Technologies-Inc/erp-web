import { createFileRoute } from '@tanstack/react-router'
import { AttendanceReportPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/attendance-report')({
  component: AttendanceReportPage,
})
