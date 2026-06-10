import { useQuery } from '@tanstack/react-query'
import { 
  getTodaysSalesDatatable, 
  getMerchantSalesDatatable, 
  getUserWiseSalesDatatable,
  getProductWiseSalesDatatable,
  getCategoryWiseSalesDatatable
} from '../api/reports.api'

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

export const useProductWiseSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'product-wise-sales', params],
    queryFn: () => getProductWiseSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useCategoryWiseSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'category-wise-sales', params],
    queryFn: () => getCategoryWiseSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}
