import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export interface BankItem {
  id: string
  text: string
}

export interface ReconciliationVoucherItem {
  id: number
  v_no: string
  v_date: string
  v_type: string
  account_name: string
  cheque_no: string | null
  cheque_date: string | null
  narration: string | null
  is_honour: number
  debit: string
  credit: string
}

export interface BankReconciliationData {
  banks: BankItem[]
  vouchers: ReconciliationVoucherItem[]
}

export interface ReconciliationQueryParams {
  fromDate?: string
  toDate?: string
  bankCode?: string
  status?: number
}

export const bankReconciliationApi = {
  getData: async (params: ReconciliationQueryParams) => {
    const response = await apiClient.get<ApiResponse<BankReconciliationData>>('/account/bank-reconciliation/list', { params })
    return response.data
  },
  getBanks: async () => {
    const response = await apiClient.get<BankItem[]>('/select2/get-bank-account-select2')
    return response.data
  },
  saveReconciliation: async (items: { v_no: string }[]) => {
    const response = await apiClient.post<ApiResponse<any>>('/account/bank-reconciliation/store', { items })
    return response.data
  }
}
