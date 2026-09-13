import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  SinglePurchaseOrderResponse,
  ReceivePOGoodsDto,
  SavePOSchedulesDto,
  AmendPODto,
  PurchaseOrderSchedule,
} from './types'

export interface PaginatedPurchaseOrdersResponse {
  status: string
  message: string
  response: PurchaseOrder[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page?: number
  }
}

export const getPurchaseOrders = async (
  params?: PurchaseOrderFilters
): Promise<PaginatedPurchaseOrdersResponse> => {
  const response = await apiClient.get<PaginatedPurchaseOrdersResponse>('/procurement/purchase-orders', {
    params,
  })
  return response.data
}

export const getPurchaseOrder = async (uuid: string): Promise<SinglePurchaseOrderResponse> => {
  const response = await apiClient.get<SinglePurchaseOrderResponse>(
    `/procurement/purchase-orders/${uuid}`
  )
  return response.data
}

export const createPurchaseOrder = async (
  dto: CreatePurchaseOrderDto
): Promise<SinglePurchaseOrderResponse> => {
  if (dto.attachments && dto.attachments.length > 0) {
    const formData = new FormData()
    if (dto.rfq_id) formData.append('rfq_id', String(dto.rfq_id))
    formData.append('vendor_id', String(dto.vendor_id))
    formData.append('department_id', String(dto.department_id))
    formData.append('cost_center_id', String(dto.cost_center_id))
    formData.append('po_date', dto.po_date)
    if (dto.po_validity_date) formData.append('po_validity_date', dto.po_validity_date)
    if (dto.currency) formData.append('currency', dto.currency)
    if (dto.payment_terms) formData.append('payment_terms', dto.payment_terms)
    if (dto.delivery_terms) formData.append('delivery_terms', dto.delivery_terms)
    if (dto.vat_percentage !== undefined) formData.append('vat_percentage', String(dto.vat_percentage))

    if (dto.items && dto.items.length > 0) {
      dto.items.forEach((item, index) => {
        formData.append(`items[${index}][product_id]`, String(item.product_id))
        formData.append(`items[${index}][category_id]`, String(item.category_id))
        formData.append(`items[${index}][unit_id]`, String(item.unit_id))
        if (item.item_description) formData.append(`items[${index}][item_description]`, item.item_description)
        if (item.hs_code) formData.append(`items[${index}][hs_code]`, item.hs_code)
        formData.append(`items[${index}][quantity]`, String(item.quantity))
        formData.append(`items[${index}][rate]`, String(item.rate))
        if (item.vat_percentage !== undefined) {
          formData.append(`items[${index}][vat_percentage]`, String(item.vat_percentage))
        }
      })
    }

    dto.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })

    const response = await apiClient.post<SinglePurchaseOrderResponse>(
      '/procurement/purchase-orders',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return response.data
  }

  const response = await apiClient.post<SinglePurchaseOrderResponse>(
    '/procurement/purchase-orders',
    dto
  )
  return response.data
}

export const updatePurchaseOrder = async ({
  uuid,
  ...dto
}: UpdatePurchaseOrderDto): Promise<SinglePurchaseOrderResponse> => {
  if (dto.attachments && dto.attachments.length > 0) {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    if (dto.vendor_id) formData.append('vendor_id', String(dto.vendor_id))
    if (dto.department_id) formData.append('department_id', String(dto.department_id))
    if (dto.cost_center_id) formData.append('cost_center_id', String(dto.cost_center_id))
    if (dto.po_date) formData.append('po_date', dto.po_date)
    if (dto.po_validity_date) formData.append('po_validity_date', dto.po_validity_date)
    if (dto.currency) formData.append('currency', dto.currency)
    if (dto.payment_terms) formData.append('payment_terms', dto.payment_terms)
    if (dto.delivery_terms) formData.append('delivery_terms', dto.delivery_terms)
    if (dto.vat_percentage !== undefined) formData.append('vat_percentage', String(dto.vat_percentage))

    if (dto.items && dto.items.length > 0) {
      dto.items.forEach((item, index) => {
        formData.append(`items[${index}][product_id]`, String(item.product_id))
        formData.append(`items[${index}][category_id]`, String(item.category_id))
        formData.append(`items[${index}][unit_id]`, String(item.unit_id))
        if (item.item_description) formData.append(`items[${index}][item_description]`, item.item_description)
        if (item.hs_code) formData.append(`items[${index}][hs_code]`, item.hs_code)
        formData.append(`items[${index}][quantity]`, String(item.quantity))
        formData.append(`items[${index}][rate]`, String(item.rate))
        if (item.vat_percentage !== undefined) {
          formData.append(`items[${index}][vat_percentage]`, String(item.vat_percentage))
        }
      })
    }

    dto.attachments.forEach((file) => {
      formData.append('attachments[]', file)
    })

    const response = await apiClient.post<SinglePurchaseOrderResponse>(
      `/procurement/purchase-orders/${uuid}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return response.data
  }

  const response = await apiClient.put<SinglePurchaseOrderResponse>(
    `/procurement/purchase-orders/${uuid}`,
    dto
  )
  return response.data
}

export const deletePurchaseOrder = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/purchase-orders/${uuid}`)
  return response.data
}

export const dispatchPurchaseOrder = async (uuid: string): Promise<SinglePurchaseOrderResponse> => {
  const response = await apiClient.post<SinglePurchaseOrderResponse>(
    `/procurement/purchase-orders/${uuid}/dispatches`
  )
  return response.data
}

export const savePOSchedules = async (
  uuid: string,
  data: SavePOSchedulesDto
): Promise<ApiResponse<PurchaseOrderSchedule[]>> => {
  const response = await apiClient.post<ApiResponse<PurchaseOrderSchedule[]>>(
    `/procurement/purchase-orders/${uuid}/schedules`,
    data
  )
  return response.data
}

export const receivePOGoods = async (
  uuid: string,
  data: ReceivePOGoodsDto
): Promise<SinglePurchaseOrderResponse> => {
  const response = await apiClient.post<SinglePurchaseOrderResponse>(
    `/procurement/purchase-orders/${uuid}/receive-goods`,
    data
  )
  return response.data
}

export const approvePurchaseOrder = async (
  uuid: string,
  data: { action: 'submit' | 'approve' | 'reject'; remarks?: string }
): Promise<SinglePurchaseOrderResponse> => {
  const response = await apiClient.post<SinglePurchaseOrderResponse>(
    `/procurement/purchase-orders/${uuid}/approvals`,
    data
  )
  return response.data
}

export const amendPurchaseOrder = async (
  uuid: string,
  data: AmendPODto
): Promise<SinglePurchaseOrderResponse> => {
  const response = await apiClient.post<SinglePurchaseOrderResponse>(
    `/procurement/purchase-orders/${uuid}/amendments`,
    data
  )
  return response.data
}
