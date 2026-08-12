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
