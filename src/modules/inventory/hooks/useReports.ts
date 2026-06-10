import { useQuery } from '@tanstack/react-query'
import { getTodaysSalesDatatable } from '../api/reports.api'

export const useTodaysSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'todays-sales', params],
    queryFn: () => getTodaysSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}
