import type { AttendanceFilters } from './types'

export const attendanceKeys = {
  all: () => ['hrm', 'attendances'] as const,
  lists: () => [...attendanceKeys.all(), 'list'] as const,
  list: (filters: AttendanceFilters) => [...attendanceKeys.lists(), filters] as const,
  reports: () => [...attendanceKeys.all(), 'reports'] as const,
  report: (filters: AttendanceFilters) => [...attendanceKeys.reports(), filters] as const,
  details: () => [...attendanceKeys.all(), 'detail'] as const,
  detail: (id: number | null) => [...attendanceKeys.details(), id] as const,
  serverTime: () => [...attendanceKeys.all(), 'server-time'] as const,
  selfStatus: () => [...attendanceKeys.all(), 'self-status'] as const,
}
