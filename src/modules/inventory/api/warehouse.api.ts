import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface WarehouseListItem {
  id: number
  uuid: string
  warehouse_code: string
  name: string
  employee_name: string
  city: string
  phone: string
  email: string
  status: 'Active' | 'Inactive'
}

export interface WarehouseFormData {
  warehouse_code: string
  name: string
  contact_person?: string | number
  phone?: string
  email?: string
  address_line1?: string
  city?: string
  country?: string
  location?: string
  description?: string
  status: number | string
}

export interface StockMovementItem {
  batch_master_id: string | number
  product_id: string | number
  quantity: number
}

export interface StockMovementFormData {
  from_warehouse_id: string | number
  to_warehouse_id: string | number
  movement_category: string
  movement_type: string | number
  reference_no?: string
  remark?: string
  items: StockMovementItem[]
}

export interface StockMovementListItem {
  batch_no: string
  product_name: string
  movement_type: string
  quantity: string
  source_warehouse: string
  destination_warehouse: string
  reference: string
}

export const getWarehouseDatatable = async (params: any): Promise<DataTablesResponse<WarehouseListItem>> => {
  const response = await apiClient.get<DataTablesResponse<WarehouseListItem>>('/inventory/warehouse/datatable', { params })
  return response.data
}

export const getStockMovementDatatable = async (params: any): Promise<DataTablesResponse<StockMovementListItem>> => {
  const response = await apiClient.get<DataTablesResponse<StockMovementListItem>>('/inventory/reports/stock-movement/datatable', { params })
  return response.data
}

export const createWarehouse = async (data: WarehouseFormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/warehouse/store', data)
  return response.data
}

export const updateWarehouse = async (data: WarehouseFormData & { uuid: string }): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/warehouse/update', data)
  return response.data
}

export const deleteWarehouse = async (uuid: string, id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/warehouse/delete', { params: { uuid, id } })
  return response.data
}

export const getWarehouseDetails = async (id: string | number): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/warehouse/get-data/${id}`)
  return response.data
}

export const storeStockMovement = async (data: StockMovementFormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/warehouse/stock-movement-store', data)
  return response.data
}

export const getWarehouses = async (): Promise<any> => {
  const response = await apiClient.get<any>('/select2/get-warehouse-select2')
  return response.data
}

// Select2 / Helper APIs
export const getEmployeeSelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-employee-select2')
  return response.data
}

export const getMovementTypeSelect2 = async (category: string): Promise<any[]> => {
  const response = await apiClient.get<any[]>(`/select2/get-movement-type-select2/${category}`)
  return response.data
}

export const getBatchSelect2 = async (warehouseId: string | number): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-batch-select2', { params: { warehouse_id: warehouseId } })
  return response.data
}

export const getBatchWiseProductSelect2 = async (batchId: string | number): Promise<any[]> => {
  const response = await apiClient.get<any[]>(`/select2/get-batch-wise-product-select2/${batchId}`)
  return response.data
}

export const getBatchProductAvailableQty = async (batchId: string | number, productId: string | number, warehouseId: string | number): Promise<{ available_qty: number }> => {
  const response = await apiClient.get<{ available_qty: number }>('/select2/get-batch-product-available-qty', {
    params: { batch_id: batchId, product_id: productId, warehouse_id: warehouseId }
  })
  return response.data
}
