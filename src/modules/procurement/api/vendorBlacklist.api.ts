import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  VendorBlacklist,
  VendorBlacklistFilters,
  CreateVendorBlacklistDto,
  UpdateVendorBlacklistDto,
  ProcurementResponse,
} from './types'

export interface PaginatedVendorBlacklistsResponse {
  status: string
  message: string
  response: VendorBlacklist[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getVendorBlacklists = async (
  filters?: VendorBlacklistFilters
): Promise<PaginatedVendorBlacklistsResponse> => {
  const response = await apiClient.get<PaginatedVendorBlacklistsResponse>(
    '/procurement/vendor-blacklists',
    {
      params: filters,
    }
  )
  return response.data
}

export const getVendorBlacklist = async (
  uuid: string
): Promise<ProcurementResponse<VendorBlacklist>> => {
  const response = await apiClient.get<ProcurementResponse<VendorBlacklist>>(
    `/procurement/vendor-blacklists/${uuid}`
  )
  return response.data
}

export const createVendorBlacklist = async (
  dto: CreateVendorBlacklistDto
): Promise<ProcurementResponse<VendorBlacklist>> => {
  const response = await apiClient.post<ProcurementResponse<VendorBlacklist>>(
    '/procurement/vendor-blacklists',
    dto
  )
  return response.data
}

export const updateVendorBlacklist = async ({
  uuid,
  ...dto
}: UpdateVendorBlacklistDto): Promise<ProcurementResponse<VendorBlacklist>> => {
  const response = await apiClient.put<ProcurementResponse<VendorBlacklist>>(
    `/procurement/vendor-blacklists/${uuid}`,
    dto
  )
  return response.data
}

export const deleteVendorBlacklist = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/procurement/vendor-blacklists/${uuid}`
  )
  return response.data
}
