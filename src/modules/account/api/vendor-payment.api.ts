import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export interface SelectOption {
  id: string | number
  text: string
  due_amount?: number
}

export const getPaymentMethodsSelect2 = async (): Promise<SelectOption[]> => {
  const response = await apiClient.get<SelectOption[]>('/select2/get-payment-methods-select2')
  return response.data
}

export const getVendorsSelect2 = async (): Promise<SelectOption[]> => {
  const response = await apiClient.get<SelectOption[]>('/select2/get-vendor-select2')
  return response.data
}

export const getVouchersSelect2 = async (vendorId: string | number): Promise<SelectOption[]> => {
  const response = await apiClient.get<SelectOption[]>(`/select2/get-voucher-select2/${vendorId}`)
  return response.data
}

export const storeVendorPayment = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/account/supplier-payment/store', data)
  return response.data
}
