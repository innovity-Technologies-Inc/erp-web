import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAttendancesDatatable,
  getAttendanceReportDatatable,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getServerTime,
  getEmployeeSelect2,
  getSelfStatus,
  selfCheckIn,
} from '../api/attendance.api'
import { attendanceKeys } from '../api/attendance.keys'
import type { AttendanceFilters, CreateAttendanceDto, UpdateAttendanceDto } from '../api/types'

export const useAttendancesDatatable = (filters: AttendanceFilters) => {
  return useQuery({
    queryKey: attendanceKeys.list(filters),
    queryFn: () => getAttendancesDatatable(filters),
    staleTime: 30_000,
  })
}

export const useAttendanceReportsDatatable = (filters: AttendanceFilters) => {
  return useQuery({
    queryKey: attendanceKeys.report(filters),
    queryFn: () => getAttendanceReportDatatable(filters),
    staleTime: 30_000,
  })
}

export const useAttendanceData = (id: number | null) => {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => getAttendance(id!),
    enabled: id !== null && id !== undefined && !isNaN(id),
  })
}

export const useCreateAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAttendanceDto) => createAttendance(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all() })
    },
  })
}

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateAttendanceDto) => updateAttendance(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all() })
    },
  })
}

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all() })
    },
  })
}

export const useServerTime = () => {
  return useQuery({
    queryKey: attendanceKeys.serverTime(),
    queryFn: () => getServerTime(),
    staleTime: 5000, // short stale time for clock sync
  })
}

export const useEmployeeSelect2 = () => {
  return useQuery({
    queryKey: ['employee-select2'],
    queryFn: () => getEmployeeSelect2(),
    staleTime: 60_000,
  })
}

export const useSelfStatus = () => {
  return useQuery({
    queryKey: attendanceKeys.selfStatus(),
    queryFn: () => getSelfStatus(),
  })
}

export const useSelfCheckIn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => selfCheckIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all() })
    },
  })
}
