export const salaryAdvanceKeys = {
  all: () => ['salary-advance'] as const,
  lists: () => [...salaryAdvanceKeys.all(), 'list'] as const,
  list: (filters: any) => [...salaryAdvanceKeys.lists(), { filters }] as const,
  details: () => [...salaryAdvanceKeys.all(), 'detail'] as const,
  detail: (id: number) => [...salaryAdvanceKeys.details(), id] as const,
}
