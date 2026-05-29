import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

// Service Types
export interface ServiceListItem {
  id: number
  service_name: string
  charge: number
  service_vat: number
  description: string
  status: number
  created_at: string
}

export interface ServiceFormValues {
  service_name: string
  charge: number
  service_vat: string | number
  description: string
  status: number
}

// Service Invoice Types
export interface ServiceInvoiceListItem {
  id: number
  uuid: string
  customer_name: string
  date: string
  details: string
  total_amount: number
  paid_amount: number
  due_amount: number
}

export interface ServiceInvoiceDetailItem {
  service_id: number | string
  qty: number
  charge: number
  discount: number
  discount_value: number
  vat: number
  vat_amnt: number
  total: number
}

export interface ServiceInvoiceFormValues {
  customer_id: string
  date: string
  employee_id: string
  items: ServiceInvoiceDetailItem[]
  total_amount: string | number
  invoice_discount: string | number
  total_discount: string | number
  total_vat_amnt: string | number
  shipping_cost: string | number
  grand_total: string | number
  previous: string | number
  net_total: string | number
  paid_amount: string | number
  due_amount: string | number
  payment_type_id: string
  payment_amount: string | number
  details: string
}

// Service API Endpoints
export const getServicesDatatable = async (params: any): Promise<DataTablesResponse<ServiceListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ServiceListItem>>('/inventory/datatable/service', { params })
  return response.data
}

export const getService = async (id: number | string): Promise<ApiResponse<ServiceListItem>> => {
  const response = await apiClient.get<ApiResponse<ServiceListItem>>(`/inventory/service/${id}`)
  return response.data
}

export const storeService = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/service', data)
  return response.data
}

export const updateService = async (id: number | string, data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/inventory/service/${id}`, data)
  return response.data
}

export const deleteService = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/inventory/service/${id}`)
  return response.data
}

// Service Invoice API Endpoints
export const getServiceInvoicesDatatable = async (params: any): Promise<DataTablesResponse<ServiceInvoiceListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ServiceInvoiceListItem>>('/inventory/datatable/service-invoice', { params })
  return response.data
}

export const getServiceInvoice = async (id: string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/service-invoice/show/${id}`)
  return response.data
}

export const storeServiceInvoice = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/service-invoice/store', data)
  return response.data
}

export const updateServiceInvoice = async (id: string, data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/inventory/service-invoice/update/${id}`, data)
  return response.data
}

export const deleteServiceInvoice = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/service-invoice/delete', { data: { id } })
  return response.data
}

// Select2 API Endpoints
export const getCustomerSelect2 = async (params?: any): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-customer-select2', { params })
  return response.data
}

export const getEmployeeSelect2 = async (params?: any): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-employee-select2', { params })
  return response.data
}

export const getPaymentMethodsSelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-payment-methods-select2')
  return response.data
}

export const getServiceSelect2 = async (params?: any): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-service-select2', { params })
  return response.data
}
