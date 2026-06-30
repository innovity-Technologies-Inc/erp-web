import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface JournalVoucherListItem {
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

export interface JournalVoucherItemPayload {
  account_id: string | number
  is_sub_type: number | null
  sub_type_id: string | number | null
  ledger_comment: string | null
  debit: string | number
  credit: string | number
}

export interface JournalVoucherStorePayload {
  date: string
  remark: string
  items: JournalVoucherItemPayload[]
}

export interface JournalVoucherUpdatePayload extends JournalVoucherStorePayload {
  uuid: string
}

export interface Select2OptionRaw {
  id: string | number
  text: string
}

export interface AccountSubTypeFlagResponse {
  subType: number
}

export interface JournalVoucherDetailsResponse {
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

export const journalVoucherApi = {
  getDatatable: async (params: any): Promise<DataTablesResponse<JournalVoucherListItem>> => {
    const response = await apiClient.get<DataTablesResponse<JournalVoucherListItem>>('/account/journal-voucher/datatable', { params })
    return response.data
  },

  store: async (data: JournalVoucherStorePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/journal-voucher/store', data)
    return response.data
  },

  update: async (data: JournalVoucherUpdatePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/journal-voucher/update', data)
    return response.data
  },

  delete: async (payload: { uuid: string; id: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>('/account/journal-voucher/delete', {
      data: payload,
    })
    return response.data
  },

  show: async (id: number | string): Promise<ApiResponse<JournalVoucherDetailsResponse>> => {
    const response = await apiClient.get<ApiResponse<JournalVoucherDetailsResponse>>(`/account/voucher/show/${id}`)
    return response.data
  },

  getLevelFourAccountHeads: async (): Promise<Select2OptionRaw[]> => {
    const response = await apiClient.get<Select2OptionRaw[]>('/select2/all-level-four-head-select2')
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
