import { apiClient } from '@/api/client'
import type { DataTablesResponse } from '@/api/types'

export interface TodaySalesListItem {
  date: string
  invoice_id: string
  customer_name: string
  total_amount: string
}

export interface MerchantSalesListItem {
  date: string
  invoice_id: string
  customer_name: string
  total_amount: string
  total_discount: string
  payable_amount: string
  paid_amount: string
  due_amount: string
  payment_type: string
  voucher_type: string
  voucher_no: string
}

export interface UserWiseSalesListItem {
  name: string
  total_invoice: string
  amount: string
}

export interface ProductWiseSalesListItem {
  date: string
  product_name: string
  product_model: string
  invoice: string
  customer_name: string
  rate: string
  total_price: string
}

export interface CategoryWiseSalesListItem {
  category_name: string
  product_name: string
  product_model: string
  date: string
  quantity: string
  total_price: string
}

export const getTodaysSalesDatatable = async (params: any): Promise<DataTablesResponse<TodaySalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<TodaySalesListItem>>('/inventory/reports/todays-sales-datatable', { params })
  return response.data
}

export const getMerchantSalesDatatable = async (params: any): Promise<DataTablesResponse<MerchantSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<MerchantSalesListItem>>('/inventory/reports/sales-datatable', { params })
  return response.data
}

export const getUserWiseSalesDatatable = async (params: any): Promise<DataTablesResponse<UserWiseSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<UserWiseSalesListItem>>('/inventory/reports/user-wise-sales-datatable', { params })
  return response.data
}

export const getProductWiseSalesDatatable = async (params: any): Promise<DataTablesResponse<ProductWiseSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ProductWiseSalesListItem>>('/inventory/reports/product-wise-sales-datatable', { params })
  return response.data
}

export const getCategoryWiseSalesDatatable = async (params: any): Promise<DataTablesResponse<CategoryWiseSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CategoryWiseSalesListItem>>('/inventory/reports/category-wise-sales-datatable', { params })
  return response.data
}
