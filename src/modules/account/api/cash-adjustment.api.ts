import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export interface NextVoucherResponse {
  status: boolean
  voucher_no: string
}

export const getNextVoucherNo = async (): Promise<NextVoucherResponse> => {
  const response = await apiClient.get<NextVoucherResponse>('/account/cash-adjustment/next-voucher-no')
  return response.data
}

export const storeCashAdjustment = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/account/cash-adjustment/store', data)
  return response.data
}
