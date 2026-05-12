import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export interface WebSetting {
  id: number
  site_name: string
  logo: string | null
  logo_url: string | null
  favicon: string | null
  favicon_url: string | null
  login_sidebar_image: string | null
  login_sidebar_image_url: string | null
  footer_text: string | null
  currency: string | null
  currency_position: string | null
  color_primary: string
  color_info: string
  color_success: string
  color_warning: string
  color_danger: string
  navbar_color: string
  sidebar_color: string
}

export interface CompanyInformation {
  id: number
  company_name: string
  email: string
  mobile: string
  address: string
  website: string | null
  logo: string | null
  logo_url: string | null
}

export interface GlobalSettings {
  webSetting: WebSetting | null
  companyInformation: CompanyInformation | null
}

export const getGlobalSettings = async (): Promise<ApiResponse<GlobalSettings>> => {
  const response = await apiClient.get<ApiResponse<GlobalSettings>>('/global-settings')
  return response.data
}
