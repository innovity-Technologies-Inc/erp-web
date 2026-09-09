import { z } from 'zod'

export const vendorCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255, 'Category name must not exceed 255 characters'),
  vendor_type: z.enum([
    'manufacturer',
    'distributor',
    'retailer',
    'service_provider',
    'importer',
    'contractor',
    'subcontractor',
  ]),
  parent_id: z.number().nullable().optional(),
})

export type VendorCategoryFormValues = z.infer<typeof vendorCategorySchema>

export const vendorDocumentTypeSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255, 'Document name must not exceed 255 characters'),
  code: z
    .string()
    .min(1, 'Document code is required')
    .max(100, 'Document code must not exceed 100 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Document code must contain only letters, numbers, dashes, and underscores'),
  is_required: z.boolean().default(true),
})

export type VendorDocumentTypeFormValues = z.infer<typeof vendorDocumentTypeSchema>

export const vendorContactPersonSchema = z.object({
  id: z.number().optional().nullable(),
  name: z.string().min(1, 'Contact name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional().nullable(),
  designation: z.string().optional().nullable(),
})

export const vendorAddressSchema = z.object({
  id: z.number().optional().nullable(),
  address_type: z.enum(['registered', 'factory', 'billing', 'shipping']).default('registered'),
  address_line: z.string().min(1, 'Address line is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().optional().nullable(),
  division: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().default('Bangladesh'),
  postal_code: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export const vendorBankInfoSchema = z.object({
  id: z.number().optional().nullable(),
  bank_name: z.string().min(1, 'Bank name is required'),
  branch_name: z.string().min(1, 'Branch name is required'),
  account_name: z.string().min(1, 'Account name is required'),
  account_no: z.string().min(1, 'Account number is required'),
  routing_no: z.string().min(1, 'Routing number is required'),
  bank_address: z.string().optional().nullable(),
})

export const vendorDocumentSchema = z.object({
  id: z.number().optional().nullable(),
  vendor_document_type_id: z.number(),
  document_url: z.string().optional().nullable(),
  expire_at: z.string().optional().nullable(),
})

export const vendorFormSchema = z.object({
  code: z.string().min(1, 'Vendor code is required').max(50, 'Code must not exceed 50 characters'),
  name: z.string().min(1, 'Vendor name is required').max(255, 'Name must not exceed 255 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required').max(50, 'Phone must not exceed 50 characters'),
  website: z.string().url('Please enter a valid website URL').or(z.literal('')).optional().nullable(),
  license_no: z.string().max(100).optional().nullable(),
  rating: z.coerce.number().min(0).max(100).optional().nullable(),
  status: z.enum([
    'draft',
    'under_review',
    'kyc_pending',
    'documents_uploaded',
    'approved',
    'active',
    'evaluated',
    'monitored',
    'blacklisted',
  ]).default('draft'),
  category_ids: z.array(z.number()).optional(),

  // Dynamic Multi-Entry Relations
  contacts: z.array(vendorContactPersonSchema).optional(),
  addresses: z.array(vendorAddressSchema).optional(),
  bank_infos: z.array(vendorBankInfoSchema).optional(),
  documents: z.array(vendorDocumentSchema).optional(),
})

export type VendorFormValues = z.infer<typeof vendorFormSchema>

export const costCenterSchema = z.object({
  code: z
    .string()
    .min(1, 'Cost center code is required')
    .max(50, 'Code must not exceed 50 characters')
    .regex(/^[A-Za-z0-9_.-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
  name: z.string().min(1, 'Cost center name is required').max(255, 'Name must not exceed 255 characters'),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
})

export type CostCenterFormValues = z.infer<typeof costCenterSchema>

export const budgetCategorySchema = z.object({
  name: z.string().min(1, 'Budget category name is required').max(255, 'Name must not exceed 255 characters'),
  description: z.string().optional().nullable(),
})

export type BudgetCategoryFormValues = z.infer<typeof budgetCategorySchema>

const requiredId = (message: string) =>
  z.custom<number | string>(
    (val) => val !== undefined && val !== null && val !== '' && val !== 0 && val !== '0' && !isNaN(Number(val)),
    { message }
  )

const requiredPositiveNumber = (message: string) =>
  z.custom<number | string>(
    (val) => val !== undefined && val !== null && val !== '' && !isNaN(Number(val)) && Number(val) > 0,
    { message }
  )

export const budgetHeadSchema = z.object({
  budget_category_id: requiredId('Budget category is required'),
  name: z.string().min(1, 'Budget head name is required').max(255, 'Name must not exceed 255 characters'),
  code: z
    .string()
    .min(1, 'Budget head code is required')
    .max(50, 'Code must not exceed 50 characters')
    .regex(/^[A-Za-z0-9_.-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
})

export type BudgetHeadFormValues = z.infer<typeof budgetHeadSchema>

export const budgetSchema = z.object({
  financial_year_id: requiredId('Financial year is required'),
  department_id: requiredId('Department is required'),
  cost_center_id: requiredId('Cost center is required'),
  budget_head_id: requiredId('Budget head is required'),
  allocated_amount: requiredPositiveNumber('Allocated amount must be greater than 0'),
  remarks: z.string().optional().nullable(),
})

export type BudgetFormValues = z.infer<typeof budgetSchema>

export const budgetApprovalSchema = z.object({
  action: z.enum(['submit', 'approve', 'reject', 'close']),
  remarks: z.string().optional().nullable(),
})

export type BudgetApprovalFormValues = z.infer<typeof budgetApprovalSchema>

export const budgetTransferSchema = z.object({
  source_budget_uuid: z.string().min(1, 'Source budget is required'),
  destination_budget_uuid: z.string().min(1, 'Destination budget is required'),
  amount: requiredPositiveNumber('Transfer amount must be greater than 0'),
  remarks: z.string().optional().nullable(),
})

export type BudgetTransferFormValues = z.infer<typeof budgetTransferSchema>

export const purchaseRequisitionItemSchema = z.object({
  product_id: requiredId('Product is required'),
  category_id: requiredId('Category is required'),
  unit_id: requiredId('Unit is required'),
  item_description: z.string().optional().nullable(),
  budget_head_id: z.custom<number | string>().optional().nullable(),
  quantity: requiredPositiveNumber('Quantity must be greater than 0'),
  estimated_rate: requiredPositiveNumber('Estimated rate must be greater than 0'),
})

export const purchaseRequisitionSchema = z
  .object({
    pr_date: z.string().min(1, 'PR Date is required'),
    required_by_date: z.string().min(1, 'Required By Date is required'),
    department_id: requiredId('Department is required'),
    cost_center_id: requiredId('Cost Center is required'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    procurement_type: z.enum(['normal', 'emergency']).default('normal'),
    is_emergency: z.boolean().default(false),
    requisitioner_name: z.string().min(1, 'Requisitioner name is required'),
    designation: z.string().optional().nullable(),
    contact_no: z.string().optional().nullable(),
    email: z.string().email('Invalid email address').or(z.literal('')).optional().nullable(),
    purpose_justification: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    items: z.array(purchaseRequisitionItemSchema).min(1, 'At least one item is required'),
    attachments: z.array(z.any()).optional().nullable(),
  })
  .refine(
    (data) => {
      const validProductIds = data.items
        .map((i) => Number(i.product_id))
        .filter((id) => !isNaN(id) && id > 0)
      return new Set(validProductIds).size === validProductIds.length
    },
    {
      message: 'Duplicate products are not allowed. Please combine quantities into a single item or choose different products.',
      path: ['items'],
    }
  )

export type PurchaseRequisitionFormValues = z.infer<typeof purchaseRequisitionSchema>
export type PurchaseRequisitionItemFormValues = z.infer<typeof purchaseRequisitionItemSchema>

export const termsLibrarySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(100, 'Code cannot exceed 100 characters')
    .regex(/^[A-Za-z0-9_.-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
  description: z.string().optional().nullable(),
  type: z.enum(['commercial', 'technical', 'legal', 'payment', 'delivery', 'general']).default('general'),
  response_type: z.enum(['boolean', 'text', 'number', 'select']).default('boolean'),
  options: z.array(z.string()).optional().nullable(),
  is_active: z.boolean().default(true),
})

export type TermsLibraryFormValues = z.infer<typeof termsLibrarySchema>

export const evaluationCriterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required').max(255, 'Name must not exceed 255 characters'),
  category: z.enum(['technical', 'commercial']),
  max_score: z.coerce.number().gt(0, 'Max score must be greater than 0'),
})

export const rfqEvaluationTemplateSchema = z
  .object({
    name: z.string().min(1, 'Template name is required').max(255, 'Name must not exceed 255 characters'),
    technical_weightage: z.coerce.number().min(0, 'Min 0%').max(100, 'Max 100%'),
    commercial_weightage: z.coerce.number().min(0, 'Min 0%').max(100, 'Max 100%'),
    criteria: z.array(evaluationCriterionSchema).min(1, 'At least one evaluation criterion is required'),
  })
  .refine(
    (data) => {
      const sum = Number(data.technical_weightage) + Number(data.commercial_weightage)
      return Math.abs(sum - 100) < 0.01
    },
    {
      message: 'The sum of Technical and Commercial weightage must be exactly 100%.',
      path: ['commercial_weightage'],
    }
  )

export type EvaluationCriterionFormValues = z.infer<typeof evaluationCriterionSchema>
export type RFQEvaluationTemplateFormValues = z.infer<typeof rfqEvaluationTemplateSchema>


