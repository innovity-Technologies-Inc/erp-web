import { apiClient } from '@/api/client'

export interface VatTaxSetting {
  id?: number
  organization_id?: number
  company_id?: number
  dynamic_tax: number
  fixed_tax: number
  created_at?: string
  updated_at?: string
}

export interface TaxSettingItem {
  id?: number
  default_value: number
  tax_name: string
  nt: number
  reg_no: string
  is_show: number
}

export interface VatTaxSettingResponse {
  status: boolean
  data: VatTaxSetting | null
}

export interface TaxSettingResponse {
  status: boolean
  data: TaxSettingItem[]
}

export const einApi = {
  getVatTaxSetting: async () => {
    const response = await apiClient.get<VatTaxSettingResponse>('/account/vat-tax-setting/get')
    return response.data
  },

  saveVatTaxSetting: async (is_fixed: number) => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/account/vat-tax-setting/store', {
      is_fixed,
    })
    return response.data
  },

  getTaxSetting: async () => {
    const response = await apiClient.get<TaxSettingResponse>('/account/tax-setting/get')
    return response.data
  },

  updateTaxSetting: async (data: {
    nt: number
    taxfield: string[]
    default_value: number[]
    reg_no: string[]
    is_show: number[]
  }) => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/account/tax-setting/update', data)
    return response.data
  },
}
