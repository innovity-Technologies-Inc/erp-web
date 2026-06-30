import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface CreditVoucherListItem {
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

export interface CreditVoucherItemPayload {
  account_id: string | number
  is_sub_type: number | null
  sub_type_id: string | number | null
  ledger_comment: string | null
  amount: string | number
}

export interface CreditVoucherStorePayload {
  credit_account_head: string | number
  date: string
  remark: string
  check_no?: string | null
  check_date?: string | null
  is_honours?: number
  items: CreditVoucherItemPayload[]
}

export interface CreditVoucherUpdatePayload extends CreditVoucherStorePayload {
  uuid: string
}

export interface CreditAccountHeadOptionRaw {
  id: string | number
  text: string
  is_bank_nature?: number
}

export interface Select2OptionRaw {
  id: string | number
  text: string
}

export interface AccountSubTypeFlagResponse {
  subType: number
}

export interface CreditVoucherDetailsResponse {
  id: number
  uuid: string
  v_no: string
  v_date: string
  narration: string
  cheque_no: string | null
  cheque_date: string | null
  is_honour: number
  is_approved: number
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

export const creditVoucherApi = {
  getDatatable: async (params: any): Promise<DataTablesResponse<CreditVoucherListItem>> => {
    const response = await apiClient.get<DataTablesResponse<CreditVoucherListItem>>('/account/credit-voucher/datatable', { params })
    return response.data
  },

  store: async (data: CreditVoucherStorePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/credit-voucher/store', data)
    return response.data
  },

  update: async (data: CreditVoucherUpdatePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/credit-voucher/update', data)
    return response.data
  },

  delete: async (payload: { uuid: string; id: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>('/account/credit-voucher/delete', {
      data: payload,
    })
    return response.data
  },

  show: async (id: number | string): Promise<ApiResponse<CreditVoucherDetailsResponse>> => {
    const response = await apiClient.get<ApiResponse<CreditVoucherDetailsResponse>>(`/account/voucher/show/${id}`)
    return response.data
  },

  getCreditAccountHeads: async (): Promise<CreditAccountHeadOptionRaw[]> => {
    const response = await apiClient.get<CreditAccountHeadOptionRaw[]>('/select2/get-credit-account-head-select2')
    return response.data
  },

  getTransactionHeads: async (): Promise<Select2OptionRaw[]> => {
    const response = await apiClient.get<Select2OptionRaw[]>('/select2/transection-head-select2')
    return response.data
  },

  getSubTypeFlag: async (accountId: string | number): Promise<AccountSubTypeFlagResponse> => {
    const response = await apiClient.get<AccountSubTypeFlagResponse>(`/account/chart-of-account/get-sub-type/${accountId}`)
    return response.data
  },

  getSubTypesHtml: async (accountId: string | number): Promise<string> => {
    const response = await apiClient.get<string>(`/account/chart-of-account/get-sub-type-code/${accountId}`)
    return response.data
  }
}
