import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  RFQ,
  RFQFilters,
  CreateRFQDto,
  UpdateRFQDto,
  VendorQuotation,
} from './types'

export interface PaginatedRFQsResponse {
  status: string
  message: string
  response: RFQ[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page?: number
  }
}

export interface SingleRFQResponse {
  status: string
  message: string
  response: RFQ
  data?: RFQ
}

export interface ComparativeStatementResponse {
  status: string
  message: string
  response: {
    rfq_id: number
    rfq_uuid: string
    rfq_no: string
    total_vendors_submitted: number
    recommended_l1_vendor?: any
    vendors: any[]
    items_matrix: any[]
    terms_compliance_matrix: any[]
  }
}

export const getRFQs = async (filters?: RFQFilters): Promise<PaginatedRFQsResponse> => {
  const response = await apiClient.get<PaginatedRFQsResponse>('/procurement/rfqs', {
    params: filters,
  })
  return response.data
}

export const getRFQ = async (uuid: string): Promise<SingleRFQResponse> => {
  const response = await apiClient.get<SingleRFQResponse>(`/procurement/rfqs/${uuid}`)
  return response.data
}

export const createRFQ = async (dto: CreateRFQDto): Promise<SingleRFQResponse> => {
  if (dto.attachments && dto.attachments.length > 0) {
    const formData = new FormData()
    if (dto.purchase_requisition_id) formData.append('purchase_requisition_id', String(dto.purchase_requisition_id))
    formData.append('rfq_date', dto.rfq_date)
    formData.append('department_id', String(dto.department_id))
    formData.append('cost_center_id', String(dto.cost_center_id))
    if (dto.evaluation_template_id) formData.append('evaluation_template_id', String(dto.evaluation_template_id))
    if (dto.purpose_justification) formData.append('purpose_justification', dto.purpose_justification)
    formData.append('rfq_expiry_date', dto.rfq_expiry_date)
    if (dto.expected_delivery_date) formData.append('expected_delivery_date', dto.expected_delivery_date)
    if (dto.currency) formData.append('currency', dto.currency)
    if (dto.payment_terms) formData.append('payment_terms', dto.payment_terms)
    if (dto.delivery_terms) formData.append('delivery_terms', dto.delivery_terms)

    dto.target_vendor_ids.forEach((vId, idx) => {
      formData.append(`target_vendor_ids[${idx}]`, String(vId))
    })

    if (dto.terms) {
      dto.terms.forEach((term, idx) => {
        formData.append(`terms[${idx}][term_library_id]`, String(term.term_library_id))
        formData.append(`terms[${idx}][is_mandatory]`, term.is_mandatory ? '1' : '0')
      })
    }

    dto.items.forEach((item, index) => {
      if (item.purchase_requisition_item_id) {
        formData.append(`items[${index}][purchase_requisition_item_id]`, String(item.purchase_requisition_item_id))
      }
      formData.append(`items[${index}][product_id]`, String(item.product_id))
      formData.append(`items[${index}][category_id]`, String(item.category_id))
      formData.append(`items[${index}][unit_id]`, String(item.unit_id))
      if (item.item_description) formData.append(`items[${index}][item_description]`, item.item_description)
      formData.append(`items[${index}][quantity]`, String(item.quantity))
      if (item.remarks) formData.append(`items[${index}][remarks]`, item.remarks)
    })

    dto.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })

    const response = await apiClient.post<SingleRFQResponse>('/procurement/rfqs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  const response = await apiClient.post<SingleRFQResponse>('/procurement/rfqs', dto)
  return response.data
}

export const updateRFQ = async ({ uuid, ...dto }: UpdateRFQDto): Promise<SingleRFQResponse> => {
  if (dto.attachments && dto.attachments.length > 0) {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    if (dto.purchase_requisition_id) formData.append('purchase_requisition_id', String(dto.purchase_requisition_id))
    if (dto.rfq_date) formData.append('rfq_date', dto.rfq_date)
    if (dto.department_id) formData.append('department_id', String(dto.department_id))
    if (dto.cost_center_id) formData.append('cost_center_id', String(dto.cost_center_id))
    if (dto.evaluation_template_id) formData.append('evaluation_template_id', String(dto.evaluation_template_id))
    if (dto.purpose_justification) formData.append('purpose_justification', dto.purpose_justification)
    if (dto.rfq_expiry_date) formData.append('rfq_expiry_date', dto.rfq_expiry_date)
    if (dto.expected_delivery_date) formData.append('expected_delivery_date', dto.expected_delivery_date)
    if (dto.currency) formData.append('currency', dto.currency)
    if (dto.payment_terms) formData.append('payment_terms', dto.payment_terms)
    if (dto.delivery_terms) formData.append('delivery_terms', dto.delivery_terms)

    if (dto.target_vendor_ids) {
      dto.target_vendor_ids.forEach((vId, idx) => {
        formData.append(`target_vendor_ids[${idx}]`, String(vId))
      })
    }

    if (dto.terms) {
      dto.terms.forEach((term, idx) => {
        formData.append(`terms[${idx}][term_library_id]`, String(term.term_library_id))
        formData.append(`terms[${idx}][is_mandatory]`, term.is_mandatory ? '1' : '0')
      })
    }

    if (dto.items) {
      dto.items.forEach((item, index) => {
        if (item.purchase_requisition_item_id) {
          formData.append(`items[${index}][purchase_requisition_item_id]`, String(item.purchase_requisition_item_id))
        }
        formData.append(`items[${index}][product_id]`, String(item.product_id))
        formData.append(`items[${index}][category_id]`, String(item.category_id))
        formData.append(`items[${index}][unit_id]`, String(item.unit_id))
        if (item.item_description) formData.append(`items[${index}][item_description]`, item.item_description)
        formData.append(`items[${index}][quantity]`, String(item.quantity))
        if (item.remarks) formData.append(`items[${index}][remarks]`, item.remarks)
      })
    }

    dto.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })

    const response = await apiClient.post<SingleRFQResponse>(`/procurement/rfqs/${uuid}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  const response = await apiClient.put<SingleRFQResponse>(`/procurement/rfqs/${uuid}`, dto)
  return response.data
}

export const deleteRFQ = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/rfqs/${uuid}`)
  return response.data
}

export const dispatchRFQ = async (uuid: string): Promise<SingleRFQResponse> => {
  const response = await apiClient.post<SingleRFQResponse>(`/procurement/rfqs/${uuid}/dispatches`)
  return response.data
}

export const getComparativeStatement = async (uuid: string): Promise<ComparativeStatementResponse> => {
  const response = await apiClient.get<ComparativeStatementResponse>(
    `/procurement/rfqs/${uuid}/comparative-statements`
  )
  return response.data
}

export const evaluateQuotation = async (
  uuid: string,
  data: {
    vendor_quotation_id: number
    technical_score: number
    commercial_score: number
    technical_weightage?: number
    commercial_weightage?: number
    scores?: any
  }
): Promise<ApiResponse<VendorQuotation>> => {
  const response = await apiClient.post<ApiResponse<VendorQuotation>>(
    `/procurement/rfqs/${uuid}/evaluations`,
    data
  )
  return response.data
}

export const awardRFQ = async (
  uuid: string,
  vendorId: number
): Promise<SingleRFQResponse> => {
  const response = await apiClient.post<SingleRFQResponse>(`/procurement/rfqs/${uuid}/awards`, {
    vendor_id: vendorId,
  })
  return response.data
}
