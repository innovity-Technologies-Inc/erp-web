export type VendorStatus =
  | 'draft'
  | 'under_review'
  | 'kyc_pending'
  | 'documents_uploaded'
  | 'approved'
  | 'active'
  | 'evaluated'
  | 'monitored'
  | 'blacklisted'

export interface ProcurementResponse<T> {
  status?: string | boolean
  message?: string
  response?: T
  data?: T
}

export type VendorBlacklistType = 'temporary' | 'permanent'

export type VendorType =
  | 'manufacturer'
  | 'distributor'
  | 'retailer'
  | 'service_provider'
  | 'importer'
  | 'contractor'
  | 'subcontractor'

export interface VendorCategory {
  id: number
  uuid: string
  name: string
  vendor_type: VendorType
  vendor_type_label?: string
  parent_id?: number | null
  parent?: VendorCategory | null
  children?: VendorCategory[]
  created_at?: string
  updated_at?: string
}

export interface VendorCategoryFilters {
  name?: string
  parent_id?: number
  vendor_type?: string
  search?: string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateVendorCategoryDto {
  name: string
  vendor_type: VendorType
  parent_id?: number | null
}

export interface UpdateVendorCategoryDto extends CreateVendorCategoryDto {
  uuid: string
}

export interface VendorDocumentType {
  id: number
  uuid: string
  name: string
  code: string
  is_required: boolean
  created_at?: string
  updated_at?: string
}

export interface VendorDocumentTypeFilters {
  name?: string
  code?: string
  is_required?: boolean | string
  search?: string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateVendorDocumentTypeDto {
  name: string
  code: string
  is_required: boolean
}

export interface UpdateVendorDocumentTypeDto extends CreateVendorDocumentTypeDto {
  uuid: string
}

export interface VendorContactPerson {
  id?: number
  vendor_id?: number
  name: string
  designation?: string
  email?: string
  phone: string
  is_primary?: boolean
}

export interface VendorAddress {
  id?: number
  vendor_id?: number
  address_type: 'billing' | 'shipping' | 'factory' | 'registered'
  address_line: string
  city?: string
  district?: string
  division?: string
  state?: string
  country?: string
  postal_code?: string
  post_office?: string
  is_primary?: boolean
}

export interface VendorBankInfo {
  id?: number
  vendor_id?: number
  bank_name: string
  branch_name?: string
  account_name: string
  account_number?: string
  account_no?: string
  routing_number?: string
  routing_no?: string
  swift_code?: string
  bank_address?: string
  is_primary?: boolean
}

export interface VendorDocument {
  id?: number
  vendor_id?: number
  vendor_document_type_id: number
  document_type?: VendorDocumentType
  document_name?: string
  document_url?: string
  file_path?: string
  issue_date?: string
  expire_at?: string
  expiry_date?: string
  is_verified?: boolean
  remarks?: string
}

export interface VendorBlacklist {
  id: number
  uuid: string
  vendor_id: number
  vendor?: Vendor
  blacklist_type: VendorBlacklistType
  blacklist_type_label?: string
  reason: string
  blacklisted_at?: string
  blacklisted_by?: number
  blacklisted_by_user?: {
    id: number
    name: string
    email?: string
  }
  remarks?: string
  created_at?: string
  updated_at?: string
}

export interface VendorBlacklistFilters {
  vendor_id?: number | string
  blacklist_type?: string
  blacklisted_by?: number | string
  search?: string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateVendorBlacklistDto {
  vendor_id: number
  blacklist_type: VendorBlacklistType
  reason: string
}

export interface UpdateVendorBlacklistDto {
  uuid: string
  blacklist_type?: VendorBlacklistType
  reason?: string
}

export interface Vendor {
  id: number
  uuid: string
  code: string
  name: string
  email?: string
  phone?: string
  website?: string
  license_no?: string
  rating?: number | string
  rating_grade?: string
  status: VendorStatus
  status_label?: string
  categories?: VendorCategory[]
  category_ids?: number[]
  contacts?: VendorContactPerson[]
  addresses?: VendorAddress[]
  bank_infos?: VendorBankInfo[]
  documents?: VendorDocument[]
  blacklists?: VendorBlacklist[]
  created_at?: string
  updated_at?: string
}

export interface VendorFilters {
  name?: string
  code?: string
  status?: string
  category_id?: number
  search?: string
  start?: number
  length?: number
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateVendorDto {
  code?: string
  name: string
  email?: string
  phone?: string
  website?: string
  license_no?: string
  status?: VendorStatus
  category_ids?: number[]
  contacts?: VendorContactPerson[]
  addresses?: VendorAddress[]
  bank_infos?: VendorBankInfo[]
  documents?: VendorDocument[]
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {
  uuid: string
}

export type CostCenterStatus = 'active' | 'inactive'

export interface CostCenter {
  id: number
  uuid: string
  code: string
  name: string
  description?: string | null
  status: CostCenterStatus
  status_label?: string
  created_at?: string
  updated_at?: string
}

export interface CostCenterFilters {
  search?: string
  status?: string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateCostCenterDto {
  code: string
  name: string
  description?: string | null
  status?: CostCenterStatus
}

export interface UpdateCostCenterDto extends Partial<CreateCostCenterDto> {
  uuid: string
}

export interface BudgetCategory {
  id: number
  uuid: string
  name: string
  coa_id?: number | null
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface BudgetCategoryFilters {
  search?: string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateBudgetCategoryDto {
  name: string
  description?: string | null
  coa_id?: number | null
}

export interface UpdateBudgetCategoryDto extends Partial<CreateBudgetCategoryDto> {
  uuid: string
}

export interface BudgetHead {
  id: number
  uuid: string
  budget_category_id: number
  category?: BudgetCategory
  name: string
  code: string
  coa_id?: number | null
  created_at?: string
  updated_at?: string
}

export interface BudgetHeadFilters {
  search?: string
  budget_category_id?: number
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateBudgetHeadDto {
  budget_category_id: number
  name: string
  code: string
  coa_id?: number | null
}

export interface UpdateBudgetHeadDto extends Partial<CreateBudgetHeadDto> {
  uuid: string
}

export type BudgetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'closed'

export interface Budget {
  id: number
  uuid: string
  budget_no?: string | null
  financial_year_id: number
  department_id: number
  cost_center_id: number
  budget_head_id: number
  allocated_amount: number | string
  status: BudgetStatus
  status_label?: string
  remarks?: string | null
  financial_year?: {
    id: number
    year: string
  }
  cost_center?: CostCenter
  budget_head?: BudgetHead
  allocated_limit?: number | string
  utilized_amount?: number | string
  committed_amount?: number | string
  available_balance?: number | string
  created_at?: string
  updated_at?: string
}

export interface BudgetFilters {
  cost_center_id?: number
  budget_head_id?: number
  financial_year_id?: number
  department_id?: number
  status?: string
  search?: string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateBudgetDto {
  financial_year_id: number
  department_id: number
  cost_center_id: number
  budget_head_id: number
  allocated_amount: number
  remarks?: string | null
}

export interface UpdateBudgetDto extends Partial<CreateBudgetDto> {
  uuid: string
}

export interface BudgetApprovalDto {
  uuid: string
  action: 'submit' | 'approve' | 'reject' | 'close'
  remarks?: string | null
}

export interface BudgetTransferDto {
  source_budget_uuid: string
  destination_budget_uuid: string
  amount: number
  remarks?: string | null
}

export type VendorInvitationStatus = 'pending' | 'completed' | 'expired' | 'cancelled'

export interface VendorInvitation {
  id: number
  uuid: string
  company_name: string
  email: string
  phone?: string | null
  token: string
  vendor_category_id?: number | null
  category?: VendorCategory | null
  vendor_id?: number | null
  vendor?: Vendor | null
  expires_at: string
  status: VendorInvitationStatus
  completed_at?: string | null
  created_by?: number | null
  created_at?: string
  updated_at?: string
}

export interface VendorInvitationFilters {
  status?: string
  vendor_status?: string
  exclude_approved?: boolean | number
  search?: string
  per_page?: number
  page?: number
}

export interface SendVendorInvitationDto {
  company_name: string
  email: string
  phone?: string
  vendor_category_id?: number | null
  expires_days?: number
}

export interface ValidateTokenResponse {
  valid: boolean
  reason: 'invalid' | 'expired' | 'already_completed' | 'cancelled' | null
  message: string
  invitation?: {
    company_name: string
    email: string
    phone?: string | null
    category_id?: number | null
    category_name?: string | null
    expires_at: string
    categories?: Array<{ id: number; name: string; vendor_type: string }>
    document_types?: Array<{ id: number; name: string; code: string; is_required: boolean }>
  } | null
}

export interface SubmitVendorOnboardingDto {
  token: string
  name: string
  email: string
  phone: string
  website?: string
  tax_identification_number?: string
  business_registration_number?: string
  category_ids?: number[]
  contacts?: Array<{
    name: string
    email?: string
    phone: string
    designation?: string
    is_primary?: boolean
  }>
  addresses?: Array<{
    address_type?: string
    address_line?: string
    address_line_1?: string
    city: string
    district?: string
    country: string
  }>
  bank_infos?: Array<{
    bank_name: string
    account_name: string
    account_no: string
    branch_name?: string
    routing_no?: string
  }>
  documents?: Array<{
    vendor_document_type_id: number
    file: File
    expire_at?: string
  }>
}

export type PRStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type PRPriority = 'low' | 'medium' | 'high' | 'urgent'
export type PRProcurementType = 'normal' | 'emergency'

export interface PurchaseRequisitionItem {
  id?: number
  purchase_requisition_id?: number
  product_id: number
  category_id: number
  unit_id: number
  item_description?: string | null
  budget_head_id?: number | null
  quantity: number
  estimated_rate: number
  estimated_amount?: number
  product?: {
    id: number
    name: string
    product_name?: string
    code?: string
  }
  category?: {
    id: number
    name: string
    category_name?: string
  }
  unit?: {
    id: number
    name: string
    unit_name?: string
  }
  budget_head?: BudgetHead | null
}

export interface PurchaseRequisitionAttachment {
  id?: number
  purchase_requisition_id?: number
  file_name: string
  file_path: string
  file_url?: string
  created_at?: string
}

export interface PurchaseRequisition {
  id: number
  uuid: string
  pr_no: string
  pr_date: string
  department_id: number
  cost_center_id: number
  required_by_date: string
  priority: PRPriority
  procurement_type: PRProcurementType
  requisitioner_name: string
  designation?: string | null
  contact_no?: string | null
  email?: string | null
  purpose_justification?: string | null
  is_emergency: boolean
  total_estimated_amount: number | string
  status: PRStatus
  status_label?: string
  remarks?: string | null
  can_current_user_approve?: boolean
  active_approval_step?: {
    step_request_id?: number
    step_id?: number
    name: string
    step_order: number
    type?: string
    role_id?: number | null
    user_id?: number | null
    required_user_type?: string | null
  } | null
  items?: PurchaseRequisitionItem[]
  attachments?: PurchaseRequisitionAttachment[]
  cost_center?: CostCenter | null
  department?: {
    id: number
    name: string
  } | null
  approval_requests?: any[]
  approvalRequests?: any[]
  creator?: any
  updater?: any
  submitter?: any
  created_at?: string
  updated_at?: string
}

export interface PurchaseRequisitionFilters {
  status?: string
  priority?: string
  search?: string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreatePurchaseRequisitionDto {
  pr_date: string
  department_id: number
  cost_center_id: number
  required_by_date: string
  priority: PRPriority
  procurement_type: PRProcurementType
  requisitioner_name: string
  designation?: string | null
  contact_no?: string | null
  email?: string | null
  purpose_justification?: string | null
  is_emergency: boolean
  remarks?: string | null
  items: Array<{
    product_id: number
    category_id: number
    unit_id: number
    item_description?: string | null
    budget_head_id?: number | null
    quantity: number
    estimated_rate: number
  }>
  attachments?: File[]
}

export interface UpdatePurchaseRequisitionDto extends Partial<CreatePurchaseRequisitionDto> {
  uuid: string
}

export interface PurchaseRequisitionApprovalDto {
  uuid: string
  action: 'submit' | 'approve' | 'reject'
  remarks?: string | null
}

export type TermType = 'commercial' | 'technical' | 'legal' | 'payment' | 'delivery' | 'general'
export type TermResponseType = 'boolean' | 'text' | 'number' | 'select'

export interface TermsLibrary {
  id: number
  uuid: string
  code: string
  title: string
  description?: string | null
  type: TermType | string
  response_type: TermResponseType
  options?: string[] | null
  is_active: boolean
  creator?: any
  updater?: any
  created_at?: string
  updated_at?: string
}

export interface TermsLibraryFilters {
  search?: string
  type?: string
  response_type?: string
  is_active?: boolean | string
  per_page?: number
  page?: number
  start_date?: string
  end_date?: string
}

export interface CreateTermsLibraryDto {
  code: string
  title: string
  description?: string | null
  type?: string
  response_type?: TermResponseType
  options?: string[] | null
  is_active?: boolean
}

export interface UpdateTermsLibraryDto extends CreateTermsLibraryDto {
  uuid: string
}

export interface EvaluationCriterion {
  name: string
  category: 'technical' | 'commercial'
  max_score: number
}

export interface RFQEvaluationTemplate {
  id: number
  uuid: string
  name: string
  technical_weightage: number
  commercial_weightage: number
  criteria: EvaluationCriterion[]
  creator?: any
  updater?: any
  created_at?: string
  updated_at?: string
}

export interface RFQEvaluationTemplateFilters {
  search?: string
  per_page?: number
  page?: number
}

export interface CreateRFQEvaluationTemplateDto {
  name: string
  technical_weightage: number
  commercial_weightage: number
  criteria: EvaluationCriterion[]
}

export interface UpdateRFQEvaluationTemplateDto extends CreateRFQEvaluationTemplateDto {
  uuid: string
}
