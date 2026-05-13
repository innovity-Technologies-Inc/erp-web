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

export const getSalesDatatable = async (params: any): Promise<DataTablesResponse<SaleListItem>> => {
  const response = await apiClient.get<DataTablesResponse<SaleListItem>>('/inventory/sales/datatable', { params })
  return response.data
}

export const deleteSale = async (id: number): Promise<ApiResponse<any>> => {
  // The API route for delete in sales is 'sales.delete' which maps to /inventory/sales/delete
  // Based on the api.php: Route::delete('/delete', [SaleApiController::class, 'delete'])
  // It usually takes an ID in the request or as a param. Let's assume it's like others.
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/sales/delete', { params: { id } })
  return response.data
}
