import { useSearch } from '@tanstack/react-router'
import { AttendanceListPage } from './AttendanceListPage'
import { AttendanceReportPage } from './AttendanceReportPage'

export const AttendanceView = () => {
  const search = useSearch({ from: '/_authenticated/hrm/attendance' }) as { type?: string }
  const type = search.type || 'list'

  if (type === 'report') {
    return <AttendanceReportPage />
  }
  return <AttendanceListPage />
}
