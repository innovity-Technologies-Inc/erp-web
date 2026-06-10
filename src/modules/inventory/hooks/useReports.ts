import { useQuery } from '@tanstack/react-query'
import { getTodaysSalesDatatable, getMerchantSalesDatatable, getUserWiseSalesDatatable } from '../api/reports.api'

export const useTodaysSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'todays-sales', params],
    queryFn: () => getTodaysSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useMerchantSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'merchant-sales', params],
    queryFn: () => getMerchantSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useUserWiseSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'user-wise-sales', params],
    queryFn: () => getUserWiseSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}
