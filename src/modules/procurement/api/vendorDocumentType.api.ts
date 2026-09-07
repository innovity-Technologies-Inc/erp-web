import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  VendorDocumentType,
  VendorDocumentTypeFilters,
  CreateVendorDocumentTypeDto,
  UpdateVendorDocumentTypeDto,
} from './types'

export interface PaginatedVendorDocumentTypesResponse {
  status: string
  message: string
  response: VendorDocumentType[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getVendorDocumentTypes = async (
  filters?: VendorDocumentTypeFilters
): Promise<PaginatedVendorDocumentTypesResponse> => {
  const response = await apiClient.get<PaginatedVendorDocumentTypesResponse>(
    '/procurement/vendor-document-types',
    {
      params: filters,
    }
  )
  return response.data
}

export const getVendorDocumentType = async (
  uuid: string
): Promise<ApiResponse<VendorDocumentType>> => {
  const response = await apiClient.get<ApiResponse<VendorDocumentType>>(
    `/procurement/vendor-document-types/${uuid}`
  )
  return response.data
}

export const createVendorDocumentType = async (
  dto: CreateVendorDocumentTypeDto
): Promise<ApiResponse<VendorDocumentType>> => {
  const response = await apiClient.post<ApiResponse<VendorDocumentType>>(
    '/procurement/vendor-document-types',
    dto
  )
  return response.data
}

export const updateVendorDocumentType = async ({
  uuid,
  ...dto
}: UpdateVendorDocumentTypeDto): Promise<ApiResponse<VendorDocumentType>> => {
  const response = await apiClient.put<ApiResponse<VendorDocumentType>>(
    `/procurement/vendor-document-types/${uuid}`,
    dto
  )
  return response.data
}

export const deleteVendorDocumentType = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/vendor-document-types/${uuid}`)
  return response.data
}
