import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface OpeningBalanceListItem {
  id: number
  uuid: string
  year: string
  open_date: string
  account_name: string
  sub_type_name: string | null
  debit: string | number
  credit: string | number
}

export interface OpeningBalanceItemPayload {
  account_id: string | number
  is_sub_type: number
  sub_type_id: string | number | null
  debit: string | number
  credit: string | number
}

export interface OpeningBalanceStorePayload {
  financial_year_id: string | number
  date: string
  items: OpeningBalanceItemPayload[]
}

export interface OpeningBalanceUpdatePayload extends OpeningBalanceStorePayload {
  uuid: string
}

export interface Select2OptionRaw {
  id: string | number
  text: string
}

export interface AccountSubTypeFlagResponse {
  subType: number
}

export const openingBalanceApi = {
  getDatatable: async (params: any): Promise<DataTablesResponse<OpeningBalanceListItem>> => {
    const response = await apiClient.get<DataTablesResponse<OpeningBalanceListItem>>('/account/datatable/opening-balance', { params })
    return response.data
  },

  store: async (data: OpeningBalanceStorePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/acc_opening_balance/store', data)
    return response.data
  },

  update: async (data: OpeningBalanceUpdatePayload): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>('/account/acc_opening_balance/update', data)
    return response.data
  },

  delete: async (payload: { uuid: string; id: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>('/account/acc_opening_balance/delete', {
      data: payload,
    })
    return response.data
  },

  show: async (uuid: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/account/acc_opening_balance/show/${uuid}`)
    return response.data
  },

  getFinancialYears: async (): Promise<Select2OptionRaw[]> => {
    const response = await apiClient.get<Select2OptionRaw[]>('/select2/get-old-financial-year-select2')
    return response.data
  },

  getAccounts: async (): Promise<Select2OptionRaw[]> => {
    const response = await apiClient.get<Select2OptionRaw[]>('/select2/assetLiabilities-select2')
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
