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

export const getServiceVouchersSelect2 = async (merchantId: string | number): Promise<SelectOption[]> => {
  const response = await apiClient.get<SelectOption[]>(`/select2/get-service-voucher-select2/${merchantId}`)
  return response.data
}

export const storeServicePayment = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/account/service-payment/store', data)
  return response.data
}
