import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  PurchaseRequisition,
  PurchaseRequisitionFilters,
  CreatePurchaseRequisitionDto,
  UpdatePurchaseRequisitionDto,
  PurchaseRequisitionApprovalDto,
} from './types'

export interface PaginatedPurchaseRequisitionsResponse {
  status: string
  message: string
  response: PurchaseRequisition[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page?: number
  }
}

export interface SinglePurchaseRequisitionResponse {
  status: string
  message: string
  response: PurchaseRequisition
  data?: PurchaseRequisition
}

export const getPurchaseRequisitions = async (
  filters?: PurchaseRequisitionFilters
): Promise<PaginatedPurchaseRequisitionsResponse> => {
  const response = await apiClient.get<PaginatedPurchaseRequisitionsResponse>(
    '/procurement/purchase-requisitions',
    { params: filters }
  )
  return response.data
}

export const getPurchaseRequisition = async (
  uuid: string
): Promise<SinglePurchaseRequisitionResponse> => {
  const response = await apiClient.get<SinglePurchaseRequisitionResponse>(
    `/procurement/purchase-requisitions/${uuid}`
  )
  return response.data
}

export const createPurchaseRequisition = async (
  dto: CreatePurchaseRequisitionDto
): Promise<SinglePurchaseRequisitionResponse> => {
  // If attachments are present, use FormData
  if (dto.attachments && dto.attachments.length > 0) {
    const formData = new FormData()
    formData.append('pr_date', dto.pr_date)
    formData.append('department_id', String(dto.department_id))
    formData.append('cost_center_id', String(dto.cost_center_id))
    formData.append('required_by_date', dto.required_by_date)
    formData.append('priority', dto.priority)
    formData.append('procurement_type', dto.procurement_type)
    formData.append('requisitioner_name', dto.requisitioner_name)
    if (dto.designation) formData.append('designation', dto.designation)
    if (dto.contact_no) formData.append('contact_no', dto.contact_no)
    if (dto.email) formData.append('email', dto.email)
    if (dto.purpose_justification) formData.append('purpose_justification', dto.purpose_justification)
    formData.append('is_emergency', dto.is_emergency ? '1' : '0')
    if (dto.remarks) formData.append('remarks', dto.remarks)

    dto.items.forEach((item, index) => {
      formData.append(`items[${index}][product_id]`, String(item.product_id))
      formData.append(`items[${index}][category_id]`, String(item.category_id))
      formData.append(`items[${index}][unit_id]`, String(item.unit_id))
      if (item.item_description) formData.append(`items[${index}][item_description]`, item.item_description)
      if (item.budget_head_id) formData.append(`items[${index}][budget_head_id]`, String(item.budget_head_id))
      formData.append(`items[${index}][quantity]`, String(item.quantity))
      formData.append(`items[${index}][estimated_rate]`, String(item.estimated_rate))
    })

    dto.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })

    const response = await apiClient.post<SinglePurchaseRequisitionResponse>(
      '/procurement/purchase-requisitions',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  }

  const response = await apiClient.post<SinglePurchaseRequisitionResponse>(
    '/procurement/purchase-requisitions',
    dto
  )
  return response.data
}

export const updatePurchaseRequisition = async ({
  uuid,
  ...dto
}: UpdatePurchaseRequisitionDto): Promise<SinglePurchaseRequisitionResponse> => {
  if (dto.attachments && dto.attachments.length > 0) {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    if (dto.pr_date) formData.append('pr_date', dto.pr_date)
    if (dto.department_id) formData.append('department_id', String(dto.department_id))
    if (dto.cost_center_id) formData.append('cost_center_id', String(dto.cost_center_id))
    if (dto.required_by_date) formData.append('required_by_date', dto.required_by_date)
    if (dto.priority) formData.append('priority', dto.priority)
    if (dto.procurement_type) formData.append('procurement_type', dto.procurement_type)
    if (dto.requisitioner_name) formData.append('requisitioner_name', dto.requisitioner_name)
    if (dto.designation) formData.append('designation', dto.designation)
    if (dto.contact_no) formData.append('contact_no', dto.contact_no)
    if (dto.email) formData.append('email', dto.email)
    if (dto.purpose_justification) formData.append('purpose_justification', dto.purpose_justification)
    formData.append('is_emergency', dto.is_emergency ? '1' : '0')
    if (dto.remarks) formData.append('remarks', dto.remarks)

    if (dto.items) {
      dto.items.forEach((item, index) => {
        formData.append(`items[${index}][product_id]`, String(item.product_id))
        formData.append(`items[${index}][category_id]`, String(item.category_id))
        formData.append(`items[${index}][unit_id]`, String(item.unit_id))
        if (item.item_description) formData.append(`items[${index}][item_description]`, item.item_description)
        if (item.budget_head_id) formData.append(`items[${index}][budget_head_id]`, String(item.budget_head_id))
        formData.append(`items[${index}][quantity]`, String(item.quantity))
        formData.append(`items[${index}][estimated_rate]`, String(item.estimated_rate))
      })
    }

    dto.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })

    const response = await apiClient.post<SinglePurchaseRequisitionResponse>(
      `/procurement/purchase-requisitions/${uuid}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  }

  const response = await apiClient.put<SinglePurchaseRequisitionResponse>(
    `/procurement/purchase-requisitions/${uuid}`,
    dto
  )
  return response.data
}

export const deletePurchaseRequisition = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/procurement/purchase-requisitions/${uuid}`
  )
  return response.data
}

export const approvePurchaseRequisition = async ({
  uuid,
  ...dto
}: PurchaseRequisitionApprovalDto): Promise<SinglePurchaseRequisitionResponse> => {
  const response = await apiClient.post<SinglePurchaseRequisitionResponse>(
    `/procurement/purchase-requisitions/${uuid}/approvals`,
    dto
  )
  return response.data
}
