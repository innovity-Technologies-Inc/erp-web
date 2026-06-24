import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export interface CoaItem {
  head_code: string
  head_name: string
  p_head_code: string
  p_head_name?: string
  head_level: number
  head_type: 'A' | 'L' | 'I' | 'E'
  is_active: number
  is_transaction: number
  is_gl: number
  is_cash_nature: number
  is_bank_nature: number
  is_budget: number
  is_depreciation: number
  is_sub_type: number
  sub_type: number
  is_stock: number
  is_fixed_asset_sch: number
  asset_code?: string
  dep_code?: string
  depreciation_rate: number
  note_no?: string
}

export interface TreeItem {
  id: string
  name: string
  level: number
  children?: TreeItem[]
  is_active: number
}

export const coaApi = {
  getAccountList: async () => {
    const response = await apiClient.get<any[]>('/account/chart-of-account/list')
    return response.data
  },

  getForm: async (id: string) => {
    const response = await apiClient.get<any>(`/account/chart-of-account/details/${id}`)
    return response.data
  },

  getNewFormDefaults: async (parentId: string) => {
    const response = await apiClient.get<any>(`/account/chart-of-account/new-form/${parentId}`)
    return response.data
  },

  saveCoa: async (data: any) => {
    const response = await apiClient.post<ApiResponse<any>>('/account/chart-of-account/insert-coa', data)
    return response.data
  },

  deleteCoa: async (id: string) => {
    const response = await apiClient.get<any>(`/account/chart-of-account/delete-account/${id}`)
    return response.data
  },

  mainCoaCreate: async () => {
    const response = await apiClient.post<any>('/account/chart-of-account/main-coa-create')
    return response.data
  },

  getSubTypes: async () => {
    const response = await apiClient.get<any[]>('/account/chart-of-account/sub-type-list')
    return response.data
  }
}
