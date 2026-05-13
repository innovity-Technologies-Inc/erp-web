import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSalesDatatable, deleteSale } from '../api/sales.api'
import { useUiStore } from '@/store/useUiStore'

export const useSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['sales', 'datatable', params],
    queryFn: () => getSalesDatatable(params),
  })
}

export const useDeleteSale = () => {
  const queryClient = useQueryClient()
  const { notify } = useUiStore()

  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (error: any) => {
      notify(error.response?.data?.message || 'Failed to delete sale', 'error')
    }
  })
}
