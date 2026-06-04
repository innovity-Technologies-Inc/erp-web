import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface ReturnListItem {
  id: number
  uuid: string
  invoice_id: string
  purchase_id: string
  customer_name: string
  supplier_name: string
  date_return: string
  return_quantity: number | string
  total_amount: number | string
}

// ---------------------------------------------------------
// Supplier Return (Vendor Return)
// ---------------------------------------------------------

export const getSupplierReturnDatatable = async (params: any): Promise<DataTablesResponse<ReturnListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ReturnListItem>>('/inventory/datatable/supplier-return', { params })
  return response.data
}

export const deleteSupplierReturn = async (uuid: string, id: number): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>('/inventory/supplier-return/delete', {
    data: { uuid, id }
  })
  return response.data
}

export const storeSupplierReturn = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/supplier-return', data)
  return response.data
}

export const getSupplierReturnDetails = async (purchaseId: number | string): Promise<ApiResponse<any[]>> => {
  const response = await apiClient.get<ApiResponse<any[]>>(`/inventory/supplier-return/details/${purchaseId}`)
  return response.data
}

// ---------------------------------------------------------
// Invoice Return (Merchant Return)
// ---------------------------------------------------------

export const getInvoiceReturnDatatable = async (params: any): Promise<DataTablesResponse<ReturnListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ReturnListItem>>('/inventory/datatable/invoice-return', { params })
  return response.data
}

export const getInvoiceReturnDetails = async (invoiceId: number | string): Promise<ApiResponse<any[]>> => {
  const response = await apiClient.get<ApiResponse<any[]>>(`/inventory/invoice-return/details/${invoiceId}`)
  return response.data
}

// ---------------------------------------------------------
// Wastage
// ---------------------------------------------------------

export const getWastageDatatable = async (params: any): Promise<DataTablesResponse<ReturnListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ReturnListItem>>('/inventory/datatable/wastage', { params })
  return response.data
}
