import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  TermsLibrary,
  TermsLibraryFilters,
  CreateTermsLibraryDto,
  UpdateTermsLibraryDto,
} from './types'

export interface PaginatedTermsLibraryResponse {
  status: string
  message: string
  response: TermsLibrary[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getTermsLibraryList = async (
  filters?: TermsLibraryFilters
): Promise<PaginatedTermsLibraryResponse> => {
  const response = await apiClient.get<PaginatedTermsLibraryResponse>('/procurement/terms-library', {
    params: filters,
  })
  return response.data
}

export const getTermsLibraryItem = async (uuid: string): Promise<ApiResponse<TermsLibrary>> => {
  const response = await apiClient.get<ApiResponse<TermsLibrary>>(`/procurement/terms-library/${uuid}`)
  return response.data
}

export const createTermsLibrary = async (
  dto: CreateTermsLibraryDto
): Promise<ApiResponse<TermsLibrary>> => {
  const response = await apiClient.post<ApiResponse<TermsLibrary>>('/procurement/terms-library', dto)
  return response.data
}

export const updateTermsLibrary = async ({
  uuid,
  ...dto
}: UpdateTermsLibraryDto): Promise<ApiResponse<TermsLibrary>> => {
  const response = await apiClient.put<ApiResponse<TermsLibrary>>(
    `/procurement/terms-library/${uuid}`,
    dto
  )
  return response.data
}

export const deleteTermsLibrary = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/terms-library/${uuid}`)
  return response.data
}
