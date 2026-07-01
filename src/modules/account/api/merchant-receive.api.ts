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

export const getMerchantsSelect2 = async (): Promise<SelectOption[]> => {
  const response = await apiClient.get<SelectOption[]>('/select2/get-customer-select2')
  return response.data
}

export const getMerchantVouchersSelect2 = async (merchantId: string | number): Promise<SelectOption[]> => {
  const response = await apiClient.get<SelectOption[]>(`/select2/get-merchant-voucher-select2/${merchantId}`)
  return response.data
}

export const storeMerchantReceive = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/account/customer-receive/store', data)
  return response.data
}
