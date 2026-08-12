import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCompaniesDatatable,
  showCompany,
  storeCompany,
  deleteCompany,
  type CompanyDTO,
} from '../api/settings.api'

export const useCompaniesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => getCompaniesDatatable(params),
  })
}

export const useCompanyDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: ['company', uuid],
    queryFn: () => showCompany(uuid!),
    enabled: !!uuid,
  })
}

export const useStoreCompany = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CompanyDTO) => storeCompany(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company'] })
    },
  })
}

export const useDeleteCompany = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteCompany(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company'] })
    },
  })
}
