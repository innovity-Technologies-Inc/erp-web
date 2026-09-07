import type { DepartmentFilters } from './types'

export const departmentKeys = {
  all: () => ['hrm', 'departments'] as const,
  lists: () => [...departmentKeys.all(), 'list'] as const,
  list: (filters?: DepartmentFilters) => [...departmentKeys.lists(), filters] as const,
  options: (params?: { status?: number | string; search?: string }) =>
    [...departmentKeys.all(), 'options', params] as const,
  details: () => [...departmentKeys.all(), 'detail'] as const,
  detail: (id: number | null) => [...departmentKeys.details(), id] as const,
}
