import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface ContraVoucherListItem {
  id: number
  uuid: string
  v_no: string
  v_date: string
  narration: string
  debit: string | number
  credit: string | number
  status: string
  is_approved: number
}

export interface ContraVoucherItemPayload {
  account_id: string | number
  ledger_comment: string | null
  debit: string | number
  credit: string | number
}

export interface ContraVoucherStorePayload {
  contra_account_head: string | number
  date: string
  remark: string
  items: ContraVoucherItemPayload[]
}

export interface ContraVoucherUpdatePayload extends ContraVoucherStorePayload {
  uuid: string
}

export interface Select2OptionRaw {
  id: string | number
  text: string
}

export interface ContraVoucherDetailsResponse {
  id: number
  uuid: string
  v_no: string
  v_date: string
  narration: string
  is_approved: number
  items: Array<{
    id: number
    coa_id: string
    debit: string
    credit: string
    ledger_comment: string | null
    acc_coa?: {
      head_code: string
      head_name: string
    }
  }>
}

export const contraVoucherApi = {
  getDatatable: async (params: any): Promise<DataTablesResponse<ContraVoucherListItem>> => {
    const response = await apiClient.get<DataTablesResponse<ContraVoucherListItem>>('/account/contra-voucher/datatable', { params })
    return response.data
  },

  store: async (data: ContraVoucherStorePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/contra-voucher/store', data)
    return response.data
  },

  update: async (data: ContraVoucherUpdatePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/contra-voucher/update', data)
    return response.data
  },

  delete: async (payload: { uuid: string; id: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>('/account/contra-voucher/delete', {
      data: payload,
    })
    return response.data
  },

  show: async (id: number | string): Promise<ApiResponse<ContraVoucherDetailsResponse>> => {
    const response = await apiClient.get<ApiResponse<ContraVoucherDetailsResponse>>(`/account/voucher/show/${id}`)
    return response.data
  },

  getReverseAccountHeads: async (): Promise<Select2OptionRaw[]> => {
    const response = await apiClient.get<Select2OptionRaw[]>('/select2/get-credit-account-head-select2')
    return response.data
  },

  getTransactionHeads: async (): Promise<Select2OptionRaw[]> => {
    const response = await apiClient.get<Select2OptionRaw[]>('/select2/transection-head-select2')
    return response.data
  }
}
