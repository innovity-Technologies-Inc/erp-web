import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getTermsDatatable, 
  createTerm, 
  updateTerm, 
  deleteTerm, 
  getTerm,
} from '../api/terms.api'
import type { TermFormData } from '../api/terms.api'
import { useUiStore } from '@/store/useUiStore'

export const useTermsDatatable = (params: any) => {
  return useQuery({
    queryKey: [
      'terms', 
      'datatable', 
      params.start, 
      params.length, 
      params.search?.value, 
      params.status, 
      params.start_date, 
      params.end_date
    ],
    queryFn: () => getTermsDatatable(params),
  })
}

export const useTerm = (id: number | null) => {
  return useQuery({
    queryKey: ['terms', id],
    queryFn: () => getTerm(id!),
    enabled: !!id,
  })
}

export const useCreateTerm = () => {
  const queryClient = useQueryClient()
  const { notify } = useUiStore()

  return useMutation({
    mutationFn: createTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] })
    },
    onError: (error: any) => {
      notify(error.response?.data?.message || 'Failed to create term', 'error')
    }
  })
}

export const useUpdateTerm = () => {
  const queryClient = useQueryClient()
  const { notify } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TermFormData }) => updateTerm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] })
    },
    onError: (error: any) => {
      notify(error.response?.data?.message || 'Failed to update term', 'error')
    }
  })
}

export const useDeleteTerm = () => {
  const queryClient = useQueryClient()
  const { notify } = useUiStore()

  return useMutation({
    mutationFn: deleteTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] })
    },
    onError: (error: any) => {
      notify(error.response?.data?.message || 'Failed to delete term', 'error')
    }
  })
}
