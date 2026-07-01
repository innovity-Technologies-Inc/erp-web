import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface PaymentMethodListItem {
  id: number
  uuid: string
  head_name: string
}

export const getPaymentMethodsDatatable = async (params: any): Promise<DataTablesResponse<PaymentMethodListItem>> => {
  const response = await apiClient.get<DataTablesResponse<PaymentMethodListItem>>('/account/datatable/payment-method', { params })
  return response.data
}

export const storePaymentMethod = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/account/payment-method', data)
  return response.data
}

export const updatePaymentMethod = async (payload: { id: number; data: any }): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/account/payment-method/${payload.id}`, payload.data)
  return response.data
}

export const deletePaymentMethod = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/account/payment-method/${id}`)
  return response.data
}

export const getPaymentMethodData = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/account/payment-method/${id}`)
  return response.data
}
