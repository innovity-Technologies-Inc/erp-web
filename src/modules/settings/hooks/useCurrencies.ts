import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCurrenciesDatatable,
  showCurrency,
  storeCurrency,
  deleteCurrency,
  type CurrencyDTO,
} from '../api/settings.api'

export const useCurrenciesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['currencies', params],
    queryFn: () => getCurrenciesDatatable(params),
  })
}

export const useCurrencyDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['currency', id],
    queryFn: () => showCurrency(id!),
    enabled: id !== null,
  })
}

export const useStoreCurrency = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CurrencyDTO) => storeCurrency(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      queryClient.invalidateQueries({ queryKey: ['currency'] })
    },
  })
}

export const useDeleteCurrency = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      queryClient.invalidateQueries({ queryKey: ['currency'] })
    },
  })
}
