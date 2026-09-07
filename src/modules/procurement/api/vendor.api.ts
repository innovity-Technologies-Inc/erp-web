import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  Vendor,
  VendorFilters,
  CreateVendorDto,
  UpdateVendorDto,
  ProcurementResponse,
} from './types'

export interface PaginatedVendorsResponse {
  status: string
  message: string
  response: Vendor[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

const buildVendorFormData = (dto: Record<string, any>): FormData => {
  const formData = new FormData()

  Object.entries(dto).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (key === 'category_ids' && Array.isArray(value)) {
      value.forEach((id, idx) => formData.append(`category_ids[${idx}]`, String(id)))
    } else if (key === 'contacts' && Array.isArray(value)) {
      value.forEach((c, idx) => {
        if (c.id) formData.append(`contacts[${idx}][id]`, String(c.id))
        formData.append(`contacts[${idx}][name]`, c.name || '')
        formData.append(`contacts[${idx}][phone]`, c.phone || '')
        if (c.email) formData.append(`contacts[${idx}][email]`, c.email)
        if (c.designation) formData.append(`contacts[${idx}][designation]`, c.designation)
        formData.append(`contacts[${idx}][is_primary]`, c.is_primary ? '1' : '0')
      })
    } else if (key === 'addresses' && Array.isArray(value)) {
      value.forEach((a, idx) => {
        if (a.id) formData.append(`addresses[${idx}][id]`, String(a.id))
        formData.append(`addresses[${idx}][address_type]`, a.address_type || 'office')
        formData.append(`addresses[${idx}][address_line]`, a.address_line || '')
        formData.append(`addresses[${idx}][city]`, a.city || '')
        if (a.district) formData.append(`addresses[${idx}][district]`, a.district)
        if (a.division) formData.append(`addresses[${idx}][division]`, a.division)
        formData.append(`addresses[${idx}][country]`, a.country || 'Bangladesh')
        if (a.post_office) formData.append(`addresses[${idx}][post_office]`, a.post_office)
      })
    } else if (key === 'bank_infos' && Array.isArray(value)) {
      value.forEach((b, idx) => {
        if (b.id) formData.append(`bank_infos[${idx}][id]`, String(b.id))
        formData.append(`bank_infos[${idx}][bank_name]`, b.bank_name || '')
        formData.append(`bank_infos[${idx}][branch_name]`, b.branch_name || '')
        formData.append(`bank_infos[${idx}][account_name]`, b.account_name || '')
        formData.append(`bank_infos[${idx}][account_no]`, b.account_no || '')
        if (b.routing_no) formData.append(`bank_infos[${idx}][routing_no]`, b.routing_no)
        if (b.bank_address) formData.append(`bank_infos[${idx}][bank_address]`, b.bank_address)
      })
    } else if (key === 'documents' && Array.isArray(value)) {
      value.forEach((d, idx) => {
        if (d.id) formData.append(`documents[${idx}][id]`, String(d.id))
        formData.append(`documents[${idx}][vendor_document_type_id]`, String(d.vendor_document_type_id))
        if (d.file instanceof File) {
          formData.append(`documents[${idx}][file]`, d.file)
        } else if (d.document_url) {
          formData.append(`documents[${idx}][document_url]`, d.document_url)
        }
        if (d.expire_at) formData.append(`documents[${idx}][expire_at]`, d.expire_at)
      })
    } else if (typeof value !== 'object') {
      formData.append(key, String(value))
    }
  })

  return formData
}

const hasFileUploads = (dto: Record<string, any>): boolean => {
  if (!dto.documents || !Array.isArray(dto.documents)) return false
  return dto.documents.some((d: any) => d.file instanceof File)
}

export const getVendors = async (filters: VendorFilters): Promise<PaginatedVendorsResponse> => {
  const response = await apiClient.get<PaginatedVendorsResponse>('/procurement/vendors', {
    params: filters,
  })
  return response.data
}

export const getVendor = async (uuid: string): Promise<ProcurementResponse<Vendor>> => {
  const response = await apiClient.get<ProcurementResponse<Vendor>>(`/procurement/vendors/${uuid}`)
  return response.data
}

export const createVendor = async (dto: CreateVendorDto): Promise<ProcurementResponse<Vendor>> => {
  if (hasFileUploads(dto)) {
    const formData = buildVendorFormData(dto)
    const response = await apiClient.post<ProcurementResponse<Vendor>>('/procurement/vendors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  const response = await apiClient.post<ProcurementResponse<Vendor>>('/procurement/vendors', dto)
  return response.data
}

export const updateVendor = async ({
  uuid,
  ...dto
}: UpdateVendorDto): Promise<ProcurementResponse<Vendor>> => {
  if (hasFileUploads(dto)) {
    const formData = buildVendorFormData(dto)
    formData.append('_method', 'PUT')
    const response = await apiClient.post<ProcurementResponse<Vendor>>(`/procurement/vendors/${uuid}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  const response = await apiClient.put<ProcurementResponse<Vendor>>(`/procurement/vendors/${uuid}`, dto)
  return response.data
}

export const deleteVendor = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/vendors/${uuid}`)
  return response.data
}
