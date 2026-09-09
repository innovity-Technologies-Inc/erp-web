import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  RFQEvaluationTemplate,
  RFQEvaluationTemplateFilters,
  CreateRFQEvaluationTemplateDto,
  UpdateRFQEvaluationTemplateDto,
} from './types'

export interface PaginatedRFQEvaluationTemplatesResponse {
  status: string
  message: string
  response: RFQEvaluationTemplate[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getRFQEvaluationTemplates = async (
  filters?: RFQEvaluationTemplateFilters
): Promise<PaginatedRFQEvaluationTemplatesResponse> => {
  const response = await apiClient.get<PaginatedRFQEvaluationTemplatesResponse>(
    '/procurement/rfq-evaluation-templates',
    { params: filters }
  )
  return response.data
}

export const getRFQEvaluationTemplate = async (
  uuid: string
): Promise<ApiResponse<RFQEvaluationTemplate>> => {
  const response = await apiClient.get<ApiResponse<RFQEvaluationTemplate>>(
    `/procurement/rfq-evaluation-templates/${uuid}`
  )
  return response.data
}

export const createRFQEvaluationTemplate = async (
  dto: CreateRFQEvaluationTemplateDto
): Promise<ApiResponse<RFQEvaluationTemplate>> => {
  const response = await apiClient.post<ApiResponse<RFQEvaluationTemplate>>(
    '/procurement/rfq-evaluation-templates',
    dto
  )
  return response.data
}

export const updateRFQEvaluationTemplate = async ({
  uuid,
  ...dto
}: UpdateRFQEvaluationTemplateDto): Promise<ApiResponse<RFQEvaluationTemplate>> => {
  const response = await apiClient.put<ApiResponse<RFQEvaluationTemplate>>(
    `/procurement/rfq-evaluation-templates/${uuid}`,
    dto
  )
  return response.data
}

export const deleteRFQEvaluationTemplate = async (
  uuid: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/procurement/rfq-evaluation-templates/${uuid}`
  )
  return response.data
}
