import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export const useProductSelect2 = (params?: any) => {
  return useQuery({
    queryKey: ['product-select2', params],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/select2/get-product-select2', { params })
      return response.data
    },
  })
}

export const useCategorySelect2 = () => {
  return useQuery({
    queryKey: ['category-select2'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/select2/get-category-select2')
      return response.data
    },
  })
}
