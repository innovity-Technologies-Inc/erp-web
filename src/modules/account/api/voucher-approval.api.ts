import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface VoucherApprovalListItem {
  id: number
  uuid: string
  reference_no: string | null
  v_no: string
  v_type: string
  narration: string
  debit: string | number
  credit: string | number
}

export interface VoucherApprovalDetailsResponse {
  id: number
  uuid: string
  v_no: string
  v_date: string
  v_type: string
  reference_no: string | null
  narration: string
  items: Array<{
    id: number
    coa_id: string
    debit: string
    credit: string
    sub_type: number | null
    sub_code: string | number | null
    ledger_comment: string | null
    acc_coa?: {
      head_code: string
      head_name: string
    }
    acc_sub_code?: {
      id: number
      name: string
    }
  }>
}

export const voucherApprovalApi = {
  getDatatable: async (params: any): Promise<DataTablesResponse<VoucherApprovalListItem>> => {
    const response = await apiClient.get<DataTablesResponse<VoucherApprovalListItem>>('/account/vouchar-approval/datatable', { params })
    return response.data
  },

  getDetails: async (id: number): Promise<{ data: VoucherApprovalDetailsResponse; webSetting: any; company: any }> => {
    const response = await apiClient.get<{ data: VoucherApprovalDetailsResponse; webSetting: any; company: any }>(`/account/vouchar-approval/show/${id}`)
    return response.data
  },

  approve: async (uuid: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/vouchar-approval/approved', { uuid })
    return response.data
  }
}
