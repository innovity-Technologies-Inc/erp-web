import { apiClient } from '@/api/client'
import type { ApiResponse, DataTablesResponse } from '@/api/types'
import type { Attendance, AttendanceFilters, CreateAttendanceDto, UpdateAttendanceDto } from './types'

export const getAttendancesDatatable = async (filters: AttendanceFilters): Promise<DataTablesResponse<Attendance>> => {
  const response = await apiClient.get<DataTablesResponse<Attendance>>('/hrm/datatable/attendance', {
    params: filters,
  })
  return response.data
}

export const getAttendanceReportDatatable = async (filters: AttendanceFilters): Promise<DataTablesResponse<Attendance>> => {
  const response = await apiClient.get<DataTablesResponse<Attendance>>('/hrm/report-datatable/attendance', {
    params: filters,
  })
  return response.data
}

export const getAttendance = async (id: number): Promise<{ status: boolean; data: Attendance; current_time: string }> => {
  const response = await apiClient.get<{ status: boolean; data: Attendance; current_time: string }>(`/hrm/attendance/${id}`)
  return response.data
}

export const createAttendance = async (dto: CreateAttendanceDto): Promise<ApiResponse<Attendance>> => {
  const response = await apiClient.post<ApiResponse<Attendance>>('/hrm/attendance', dto)
  return response.data
}

export const updateAttendance = async ({ id, ...dto }: UpdateAttendanceDto): Promise<ApiResponse<Attendance>> => {
  const response = await apiClient.put<ApiResponse<Attendance>>(`/hrm/attendance/${id}`, dto)
  return response.data
}

export const deleteAttendance = async (id: number): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/hrm/attendance/${id}`)
  return response.data
}

export const getServerTime = async (): Promise<{ current_date: string; current_time: string }> => {
  const response = await apiClient.get<{ current_date: string; current_time: string }>('/hrm/attendance/server-time')
  return response.data
}

export const getEmployeeSelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-employee-select2')
  return response.data
}

export const getSelfStatus = async (): Promise<any> => {
  const response = await apiClient.get<any>('/hrm/attendance-self-status')
  return response.data
}

export const selfCheckIn = async (): Promise<any> => {
  const response = await apiClient.post<any>('/hrm/attendance-self-check-in')
  return response.data
}
