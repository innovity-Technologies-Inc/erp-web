import { createFileRoute } from '@tanstack/react-router'
import { AttendanceListPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/attendance')({
  component: AttendanceListPage,
})
