import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface PurchaseListItem {
  id: number
  uuid: string
  chalan_no: string
  purchase_id: string
  supplier_name: string
  purchase_date: string
  expiry_date: string | null
  total_amount: number
  status: string | number
}

export const getPurchasesDatatable = async (params: any): Promise<DataTablesResponse<PurchaseListItem>> => {
  const response = await apiClient.get<DataTablesResponse<PurchaseListItem>>('/inventory/purchase/datatable', { params })
  return response.data
}

export const storePurchase = async (data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/purchase/store', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const updatePurchase = async (id: number | string, data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>(`/inventory/purchase/update/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const deletePurchase = async (uuid: string): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/purchase/delete', {
    data: { uuid },
  })
  return response.data
}

export const getPurchaseData = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/purchase/get-data/${id}`)
  return response.data
}

export const checkChalanNo = async (chalanNo: string): Promise<any> => {
  const response = await apiClient.get<any>('/inventory/purchase/check-chalan-no', {
    params: { chalan_no: chalanNo }
  })
  return response.data
}

export const checkBatchNo = async (batchNo: string): Promise<any> => {
  const response = await apiClient.get<any>('/inventory/purchase/check-batch-no', {
    params: { batch_no: batchNo }
  })
  return response.data
}

export const getRetrieveProductData = async (supplierId: number, productId: number, purchaseId: number | null = null): Promise<any> => {
  const response = await apiClient.get<any>('/inventory/purchase/get-retrieve-product-data', {
    params: {
      supplier_id: supplierId,
      product_id: productId,
      purchase_id: purchaseId
    }
  })
  return response.data
}

export const getWarehouseStock = async (productId: number, warehouseId: number): Promise<any> => {
  const response = await apiClient.get<any>('/inventory/purchase/get-warehouse-stock', {
    params: {
      product_id: productId,
      warehouse_id: warehouseId
    }
  })
  return response.data
}

export const getVendorProductsSelect2 = async (supplierId: number | string): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-product-select2', {
    params: { supplier_id: supplierId }
  })
  return response.data
}

export const getPaymentMethodsSelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-payment-methods-select2')
  return response.data
}

