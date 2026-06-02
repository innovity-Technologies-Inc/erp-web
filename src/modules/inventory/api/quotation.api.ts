import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface QuotationListItem {
  id: number
  uuid: string
  quot_no: string
  quotdate: string
  expire_date: string
  item_total_amount: number
  service_total_amount: number
  customer_name: string
  add_to_invoice: string
}

export const getQuotationDatatable = async (params: any): Promise<DataTablesResponse<QuotationListItem>> => {
  const response = await apiClient.get<DataTablesResponse<QuotationListItem>>('/inventory/quotation/datatable', { params })
  return response.data
}

export const getQuotationDetails = async (id: string | number): Promise<{ data: any }> => {
  const response = await apiClient.get<{ data: any }>(`/inventory/quotation/details/${id}`)
  return response.data
}

export const createQuotation = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/quotation/store', data)
  return response.data
}

export const updateQuotation = async (id: string | number, data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/inventory/quotation/update/${id}`, data)
  return response.data
}

export const deleteQuotation = async (id: string | number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/quotation/delete', { data: { id } })
  return response.data
}

export const addToInvoice = async (id: string | number, data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/inventory/quotation/add-to-invoice/${id}`, data)
  return response.data
}

export const getServiceSelect2 = async (search: string = ''): Promise<any> => {
  const response = await apiClient.get<any>('/select2/get-service-select2', { params: { service_name: search } })
  return response.data
}

export const getServiceDetails = async (id: number): Promise<{ data: any }> => {
  const response = await apiClient.get<{ data: any }>(`/inventory/service/${id}`)
  return response.data
}
