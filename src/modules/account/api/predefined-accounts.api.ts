import { apiClient } from '@/api/client'

export interface PredefinedAccountsResponse {
  fieldNames: string[]
  fieldValues: Record<string, string> | null
  allHeads: Record<string, string>
}

export const predefinedAccountsApi = {
  getPredefinedAccounts: async () => {
    const response = await apiClient.get<PredefinedAccountsResponse>('/account/predefined-accounts')
    return response.data
  },

  savePredefinedAccounts: async (data: Record<string, string>) => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/account/predefined-accounts', data)
    return response.data
  }
}
