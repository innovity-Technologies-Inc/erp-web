import { apiClient } from '@/api/client'
import type { DataTablesResponse } from '@/api/types'

export interface OrganizationListItem {
  id: number
  name: string
  email: string
  phone: string
  status: string // Contains HTML string from backend
  expire_at: string
  options: string // Contains HTML string from backend with data-uuid
}

export interface OrganizationDetails {
  id: number
  uuid: string
  name: string
  email: string
  phone: string
  address: string
  status: number
  expire_at: string | null
}

export interface OrganizationDTO {
  id?: number
  name: string
  email: string
  phone: string
  address: string
  status?: number
  expire_at?: string | null
}

export interface CompanyListItem {
  id: number
  company_name: string
  organization: string
  email: string
  mobile: string
  status: string // HTML string
  options: string // HTML string with data-uuid
}

export interface CompanyDetails {
  id: number
  uuid: string
  organization_id: number | null
  company_name: string
  mobile: string
  email: string
  website: string | null
  address: string
  vat_no: string | null
  cr_no: string | null
  status: number
}

export interface CompanyDTO {
  id?: number
  organization_id?: number | null
  company_name: string
  mobile: string
  email: string
  website?: string | null
  address: string
  vat_no?: string | null
  cr_no?: string | null
  status?: number
}

export const getOrganizationsDatatable = async (
  params: any
): Promise<DataTablesResponse<OrganizationListItem>> => {
  const response = await apiClient.get<DataTablesResponse<OrganizationListItem>>('/organization/datatable', {
    params,
  })
  return response.data
}

export const showOrganization = async (
  uuid: string
): Promise<{ status: string; response: OrganizationDetails }> => {
  const response = await apiClient.get<{ status: string; response: OrganizationDetails }>(`/organization/show/${uuid}`)
  return response.data
}

export const storeOrganization = async (
  dto: OrganizationDTO
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.post<{ status: string; message: string }>('/organization/store', dto)
  return response.data
}

export const deleteOrganization = async (
  uuid: string
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.delete<{ status: string; message: string }>(`/organization/delete/${uuid}`)
  return response.data
}

export const getCompaniesDatatable = async (
  params: any
): Promise<DataTablesResponse<CompanyListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CompanyListItem>>('/company/datatable', {
    params,
  })
  return response.data
}

export const showCompany = async (
  uuid: string
): Promise<{ status: string; response: CompanyDetails }> => {
  const response = await apiClient.get<{ status: string; response: CompanyDetails }>(`/company/show/${uuid}`)
  return response.data
}

export const storeCompany = async (
  dto: CompanyDTO
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.post<{ status: string; message: string }>('/company/store', dto)
  return response.data
}

export const deleteCompany = async (
  uuid: string
): Promise<{ status: string; message: string }> => {
  const response = await apiClient.delete<{ status: string; message: string }>(`/company/delete/${uuid}`)
  return response.data
}

export interface CurrencyListItem {
  id: number
  uuid: string
  currency_name: string
  icon: string
}

export interface CurrencyDetails {
  id: number
  uuid: string
  currency_name: string
  icon: string
}

export interface CurrencyDTO {
  id?: number
  currency_name: string
  icon: string
}

export const getCurrenciesDatatable = async (
  params: any
): Promise<DataTablesResponse<CurrencyListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CurrencyListItem>>('/datatable/currency', {
    params,
  })
  return response.data
}

export const showCurrency = async (
  id: number | string
): Promise<{ status: boolean; data: CurrencyDetails }> => {
  const response = await apiClient.get<{ status: boolean; data: CurrencyDetails }>(`/currency/${id}`)
  return response.data
}

export const storeCurrency = async (
  dto: CurrencyDTO
): Promise<{ status: boolean; message: string }> => {
  if (dto.id) {
    const response = await apiClient.put<{ status: boolean; message: string }>(`/currency/${dto.id}`, dto)
    return response.data
  } else {
    const response = await apiClient.post<{ status: boolean; message: string }>('/currency', dto)
    return response.data
  }
}

export const deleteCurrency = async (
  id: number | string
): Promise<{ status: boolean; message: string }> => {
  const response = await apiClient.delete<{ status: boolean; message: string }>(`/currency/${id}`)
  return response.data
}

export interface PrintSetting {
  id: number
  header: string
  footer: string
}

export const getPrintSetting = async (): Promise<{ status: boolean; data: PrintSetting }> => {
  const response = await apiClient.get<{ status: boolean; data: PrintSetting }>('/print-setting')
  return response.data
}

export const updatePrintSetting = async (
  dto: { header: string; footer: string }
): Promise<{ status: boolean; message: string }> => {
  const response = await apiClient.post<{ status: boolean; message: string }>('/print-setting/update', dto)
  return response.data
}

export interface EmailConfig {
  id: number
  protocol: string
  smtp_host: string
  smtp_port: number | string
  smtp_user: string
  smtp_pass: string
  mailtype: string
  isinvoice: boolean | number
  isservice: boolean | number
  isquotation: boolean | number
}

export const getEmailConfig = async (): Promise<{ status: boolean; data: EmailConfig }> => {
  const response = await apiClient.get<{ status: boolean; data: EmailConfig }>('/email-config')
  return response.data
}

export const updateEmailConfig = async (
  dto: Omit<EmailConfig, 'id'>
): Promise<{ status: boolean; message: string }> => {
  const response = await apiClient.post<{ status: boolean; message: string }>('/email-config/update', dto)
  return response.data
}

export const sendTestEmail = async (
  testEmail: string
): Promise<{ status: boolean; message: string }> => {
  const response = await apiClient.post<{ status: boolean; message: string }>('/email-config/test-api', {
    test_email: testEmail,
  })
  return response.data
}

export interface WebSetting {
  site_name: string
  logo?: string
  logo_url?: string
  invoice_logo?: string
  invoice_logo_url?: string
  favicon?: string
  favicon_url?: string
  login_sidebar_image?: string
  login_sidebar_image_url?: string
  currency: string
  timezone: string
  currency_position: string | number
  footer_text: string
  language: string
  rtr: string | number
  discount_type: string | number
  color_primary: string
  color_info: string
  color_success: string
  color_warning: string
  color_danger: string
  navbar_color: string
  sidebar_color: string
  is_qr: boolean | number
  is_autoapprove_v: boolean | number
}

export interface WebSettingResponse {
  setting: WebSetting
  languages: { value: string; label: string }[]
  timezones: { value: string; label: string }[]
  currencies: { value: string; label: string }[]
}

export const getWebSetting = async (): Promise<{ status: boolean; data: WebSettingResponse }> => {
  const response = await apiClient.get<{ status: boolean; data: WebSettingResponse }>('/web-setting')
  return response.data
}

export const updateWebSetting = async (
  formData: FormData
): Promise<{ status: boolean; message: string }> => {
  const response = await apiClient.post<{ status: boolean; message: string }>('/web-setting/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
