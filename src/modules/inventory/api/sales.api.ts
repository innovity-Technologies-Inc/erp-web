import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface SaleListItem {
  id: number
  uuid: string
  invoice_id: string
  channel: string
  sales_by: string
  customer_name: string
  delivery_note: string
  delivery_status_text: string
  delivery_status: number
  date: string
  total_amount: number
  is_voucher_approved: number
  status: string
}

export interface InvoicePaymentListItem {
  id: number
  uuid: string
  invoice_date: string
  payment_ref: string
  payment_ref_doc: string
  transaction_ref: string
  approved_by: string
  invoice_id: string
  customer_name: string
  total_amount: number
  paid_amount: number
  due_amount: number
  status: string
  status_value: number
}

export const getSalesDatatable = async (params: any): Promise<DataTablesResponse<SaleListItem>> => {
  const response = await apiClient.get<DataTablesResponse<SaleListItem>>('/inventory/sales/datatable', { params })
  return response.data
}

export const getInvoicePaymentsDatatable = async (params: any): Promise<DataTablesResponse<InvoicePaymentListItem>> => {
  const response = await apiClient.get<DataTablesResponse<InvoicePaymentListItem>>('/inventory/sales/invoice-payment-list-datatable', { params })
  return response.data
}

export const createSale = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/sales/store', data)
  return response.data
}

export const getWarehouses = async (): Promise<DataTablesResponse<any>> => {
  const response = await apiClient.get<DataTablesResponse<any>>('/inventory/warehouse/datatable', { params: { length: -1 } })
  return response.data
}

export const getMerchants = async (search: string = ''): Promise<DataTablesResponse<any>> => {
  const response = await apiClient.get<DataTablesResponse<any>>('/inventory/merchant/datatable', { params: { 'search[value]': search, length: 10 } })
  return response.data
}

export const getProducts = async (search: string = ''): Promise<DataTablesResponse<any>> => {
  const response = await apiClient.get<DataTablesResponse<any>>('/inventory/products/datatable', { params: { 'search[value]': search, length: 10 } })
  return response.data
}

export const getProductBatchInfo = async (productId: number, warehouseId: number): Promise<{ data: any }> => {
  const response = await apiClient.get<{ data: any }>(`/inventory/products/get-invoice-info/${productId}`, { params: { warehouse_id: warehouseId } })
  return response.data
}

export const getMerchantDetails = async (id: number): Promise<{ data: any }> => {
  const response = await apiClient.get<{ data: any }>(`/inventory/merchant/get-data/${id}`)
  return response.data
}

export const getPaymentMethods = async (): Promise<DataTablesResponse<any>> => {
  const response = await apiClient.get<DataTablesResponse<any>>('/account/payment-method/datatable', { params: { length: -1 } })
  return response.data
}

export const deleteSale = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/sales/delete', { params: { id } })
  return response.data
}

export const updateConfirmStatus = async (uuid: string, value: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/sales/update-confirm-status', { uuid, value })
  return response.data
}
