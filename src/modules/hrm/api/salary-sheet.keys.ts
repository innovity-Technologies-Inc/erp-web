import type { SalarySheetFilters } from './types'

export const salarySheetKeys = {
  all: () => ['salary-sheets'] as const,
  lists: () => [...salarySheetKeys.all(), 'list'] as const,
  list: (filters: SalarySheetFilters) => [...salarySheetKeys.lists(), { filters }] as const,
  details: () => [...salarySheetKeys.all(), 'detail'] as const,
  detail: (id: number) => [...salarySheetKeys.details(), id] as const,
}
