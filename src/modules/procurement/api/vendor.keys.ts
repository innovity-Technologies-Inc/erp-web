import type { VendorFilters } from './types'

export const vendorKeys = {
  all: () => ['procurement', 'vendors'] as const,
  lists: () => [...vendorKeys.all(), 'list'] as const,
  list: (filters: VendorFilters) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...vendorKeys.details(), uuid] as const,
  categories: () => ['procurement', 'vendor-categories'] as const,
  documentTypes: () => ['procurement', 'vendor-document-types'] as const,
  blacklists: () => ['procurement', 'vendor-blacklists'] as const,
}

export const vendorBlacklistKeys = {
  all: () => ['procurement', 'vendor-blacklists'] as const,
  lists: () => [...vendorBlacklistKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...vendorBlacklistKeys.lists(), filters] as const,
  details: () => [...vendorBlacklistKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...vendorBlacklistKeys.details(), uuid] as const,
}

export const costCenterKeys = {
  all: () => ['procurement', 'cost-centers'] as const,
  lists: () => [...costCenterKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...costCenterKeys.lists(), filters] as const,
  details: () => [...costCenterKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...costCenterKeys.details(), uuid] as const,
}

export const budgetCategoryKeys = {
  all: () => ['procurement', 'budget-categories'] as const,
  lists: () => [...budgetCategoryKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...budgetCategoryKeys.lists(), filters] as const,
  details: () => [...budgetCategoryKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...budgetCategoryKeys.details(), uuid] as const,
}

export const budgetHeadKeys = {
  all: () => ['procurement', 'budget-heads'] as const,
  lists: () => [...budgetHeadKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...budgetHeadKeys.lists(), filters] as const,
  details: () => [...budgetHeadKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...budgetHeadKeys.details(), uuid] as const,
}

export const budgetKeys = {
  all: () => ['procurement', 'budgets'] as const,
  lists: () => [...budgetKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...budgetKeys.lists(), filters] as const,
  details: () => [...budgetKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...budgetKeys.details(), uuid] as const,
}

export const vendorInvitationKeys = {
  all: () => ['procurement', 'vendor-invitations'] as const,
  lists: () => [...vendorInvitationKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...vendorInvitationKeys.lists(), filters] as const,
  details: () => [...vendorInvitationKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...vendorInvitationKeys.details(), uuid] as const,
}

export const purchaseRequisitionKeys = {
  all: () => ['procurement', 'purchase-requisitions'] as const,
  lists: () => [...purchaseRequisitionKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...purchaseRequisitionKeys.lists(), filters] as const,
  details: () => [...purchaseRequisitionKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...purchaseRequisitionKeys.details(), uuid] as const,
}

export const termsLibraryKeys = {
  all: () => ['procurement', 'terms-library'] as const,
  lists: () => [...termsLibraryKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...termsLibraryKeys.lists(), filters] as const,
  details: () => [...termsLibraryKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...termsLibraryKeys.details(), uuid] as const,
}

export const rfqEvaluationTemplateKeys = {
  all: () => ['procurement', 'rfq-evaluation-templates'] as const,
  lists: () => [...rfqEvaluationTemplateKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...rfqEvaluationTemplateKeys.lists(), filters] as const,
  details: () => [...rfqEvaluationTemplateKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...rfqEvaluationTemplateKeys.details(), uuid] as const,
}

export const rfqKeys = {
  all: () => ['procurement', 'rfqs'] as const,
  lists: () => [...rfqKeys.all(), 'list'] as const,
  list: (filters?: Record<string, any>) => [...rfqKeys.lists(), filters] as const,
  details: () => [...rfqKeys.all(), 'detail'] as const,
  detail: (uuid: string | null) => [...rfqKeys.details(), uuid] as const,
  comparativeStatement: (uuid: string | null) => [...rfqKeys.details(), uuid, 'cs'] as const,
}






