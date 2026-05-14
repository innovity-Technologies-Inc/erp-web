import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface ContactUsListItem {
  id: number
  created_at: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export interface ContactUsDetails extends ContactUsListItem {
  status: string
  replay_at?: string
  replay_message?: string
}

export interface ContactUsReplyData {
  replay_message: string
}

export const getContactUsDatatable = async (params: any): Promise<DataTablesResponse<ContactUsListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ContactUsListItem>>('/inventory/datatable/contact_us', { params })
  return response.data
}

export const getContactUsDetails = async (id: number): Promise<ApiResponse<ContactUsDetails>> => {
  const response = await apiClient.get<ApiResponse<ContactUsDetails>>(`/inventory/contact_us/details/${id}`)
  return response.data
}

export const replyContactUs = async (id: number, data: ContactUsReplyData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>(`/inventory/contact_us/replay/${id}`, data)
  return response.data
}
