import { apiClient } from '@/api/client'
import type { DataTablesResponse } from '@/api/types'

export interface TodaySalesListItem {
  date: string
  invoice_id: string
  customer_name: string
  total_amount: string
}

export const getTodaysSalesDatatable = async (params: any): Promise<DataTablesResponse<TodaySalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<TodaySalesListItem>>('/inventory/reports/todays-sales-datatable', { params })
  return response.data
}
