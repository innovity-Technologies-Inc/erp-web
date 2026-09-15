import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  GRN,
  GRNFilters,
  CreateGRNDto,
  UpdateGRNDto,
  StoreGRNQCPayload,
  SingleGRNResponse,
  PaginatedGRNResponse,
} from './types'

export const getGRNs = async (params?: GRNFilters): Promise<PaginatedGRNResponse> => {
  const response = await apiClient.get<PaginatedGRNResponse>('/procurement/grns', {
    params,
  })
  return response.data
}

export const getGRN = async (uuid: string): Promise<SingleGRNResponse> => {
  const response = await apiClient.get<SingleGRNResponse>(`/procurement/grns/${uuid}`)
  return response.data
}

export const createGRN = async (dto: CreateGRNDto): Promise<SingleGRNResponse> => {
  const response = await apiClient.post<SingleGRNResponse>('/procurement/grns', dto)
  return response.data
}

export const updateGRN = async ({
  uuid,
  ...dto
}: UpdateGRNDto): Promise<SingleGRNResponse> => {
  const response = await apiClient.put<SingleGRNResponse>(`/procurement/grns/${uuid}`, dto)
  return response.data
}

export const deleteGRN = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/grns/${uuid}`)
  return response.data
}

export const submitGRNQC = async (
  uuid: string,
  payload: StoreGRNQCPayload
): Promise<SingleGRNResponse> => {
  const response = await apiClient.post<SingleGRNResponse>(
    `/procurement/grns/${uuid}/qc-inspections`,
    payload
  )
  return response.data
}

export const postGRN = async (
  uuid: string,
  payload?: { items?: Array<{ grn_item_id: number; warehouse_id?: number; location_aisle?: string; bin_shelf?: string }> }
): Promise<SingleGRNResponse> => {
  const response = await apiClient.post<SingleGRNResponse>(`/procurement/grns/${uuid}/posts`, payload)
  return response.data
}
