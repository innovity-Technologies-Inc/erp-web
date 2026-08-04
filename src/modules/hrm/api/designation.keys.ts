import type { DesignationFilters } from './types'

export const designationKeys = {
  all: () => ['hrm', 'designations'] as const,
  lists: () => [...designationKeys.all(), 'list'] as const,
  list: (filters: DesignationFilters) => [...designationKeys.lists(), filters] as const,
  details: () => [...designationKeys.all(), 'detail'] as const,
  detail: (id: number | null) => [...designationKeys.details(), id] as const,
}
