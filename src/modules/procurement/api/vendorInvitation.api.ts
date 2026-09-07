import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  Vendor,
  VendorInvitation,
  VendorInvitationFilters,
  SendVendorInvitationDto,
  ValidateTokenResponse,
  SubmitVendorOnboardingDto,
  ProcurementResponse,
} from './types'

export interface PaginatedVendorInvitationsResponse {
  status: string
  message: string
  response: VendorInvitation[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

// ---------------- Admin Endpoints ----------------

export const getVendorInvitations = async (
  filters: VendorInvitationFilters
): Promise<PaginatedVendorInvitationsResponse> => {
  const response = await apiClient.get<PaginatedVendorInvitationsResponse>(
    '/procurement/vendor-invitations',
    { params: filters }
  )
  return response.data
}

export const getVendorInvitation = async (
  uuid: string
): Promise<ProcurementResponse<VendorInvitation>> => {
  const response = await apiClient.get<ProcurementResponse<VendorInvitation>>(
    `/procurement/vendor-invitations/${uuid}`
  )
  return response.data
}

export const sendVendorInvitation = async (
  dto: SendVendorInvitationDto
): Promise<ProcurementResponse<VendorInvitation>> => {
  const response = await apiClient.post<ProcurementResponse<VendorInvitation>>(
    '/procurement/vendor-invitations',
    dto
  )
  return response.data
}

export const cancelVendorInvitation = async (
  uuid: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/procurement/vendor-invitations/${uuid}`
  )
  return response.data
}

// ---------------- Public Onboarding Endpoints (Token-based) ----------------

export const validateVendorOnboardingToken = async (
  token: string
): Promise<ValidateTokenResponse> => {
  const response = await apiClient.get<ValidateTokenResponse>(
    `/procurement/vendor-onboarding/validate/${token}`
  )
  return response.data
}

export const submitVendorOnboarding = async (
  dto: SubmitVendorOnboardingDto
): Promise<ProcurementResponse<Vendor>> => {
  const formData = new FormData()
  formData.append('token', dto.token)
  formData.append('name', dto.name)
  formData.append('email', dto.email)
  formData.append('phone', dto.phone)

  if (dto.website) formData.append('website', dto.website)
  if (dto.tax_identification_number) {
    formData.append('tax_identification_number', dto.tax_identification_number)
  }
  if (dto.business_registration_number) {
    formData.append('business_registration_number', dto.business_registration_number)
  }

  if (dto.category_ids && dto.category_ids.length > 0) {
    dto.category_ids.forEach((id, idx) => {
      formData.append(`category_ids[${idx}]`, String(id))
    })
  }

  if (dto.contacts && dto.contacts.length > 0) {
    dto.contacts.forEach((contact, idx) => {
      formData.append(`contacts[${idx}][name]`, contact.name)
      formData.append(`contacts[${idx}][phone]`, contact.phone)
      if (contact.email) formData.append(`contacts[${idx}][email]`, contact.email)
      if (contact.designation) {
        formData.append(`contacts[${idx}][designation]`, contact.designation)
      }
      formData.append(`contacts[${idx}][is_primary]`, contact.is_primary ? '1' : '0')
    })
  }

  if (dto.addresses && dto.addresses.length > 0) {
    dto.addresses.forEach((addr, idx) => {
      formData.append(`addresses[${idx}][address_type]`, addr.address_type || 'office')
      formData.append(`addresses[${idx}][address_line]`, addr.address_line || addr.address_line_1 || '')
      formData.append(`addresses[${idx}][city]`, addr.city)
      if (addr.district) formData.append(`addresses[${idx}][district]`, addr.district)
      formData.append(`addresses[${idx}][country]`, addr.country)
    })
  }

  if (dto.bank_infos && dto.bank_infos.length > 0) {
    dto.bank_infos.forEach((bank, idx) => {
      formData.append(`bank_infos[${idx}][bank_name]`, bank.bank_name)
      formData.append(`bank_infos[${idx}][account_name]`, bank.account_name)
      formData.append(`bank_infos[${idx}][account_no]`, bank.account_no)
      if (bank.branch_name) formData.append(`bank_infos[${idx}][branch_name]`, bank.branch_name)
      if (bank.routing_no) formData.append(`bank_infos[${idx}][routing_no]`, bank.routing_no)
    })
  }

  if (dto.documents && dto.documents.length > 0) {
    dto.documents.forEach((doc, idx) => {
      formData.append(`documents[${idx}][vendor_document_type_id]`, String(doc.vendor_document_type_id))
      formData.append(`documents[${idx}][file]`, doc.file)
      if (doc.expire_at) {
        formData.append(`documents[${idx}][expire_at]`, doc.expire_at)
      }
    })
  }

  const response = await apiClient.post<ProcurementResponse<Vendor>>(
    '/procurement/vendor-onboarding/submit',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}
