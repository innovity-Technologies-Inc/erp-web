import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrganizationsDatatable,
  showOrganization,
  storeOrganization,
  deleteOrganization,
  type OrganizationDTO,
} from '../api/settings.api'

export const useOrganizationsDatatable = (params: any) => {
  return useQuery({
    queryKey: ['organizations', params],
    queryFn: () => getOrganizationsDatatable(params),
  })
}

export const useOrganizationDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: ['organization', uuid],
    queryFn: () => showOrganization(uuid!),
    enabled: !!uuid,
  })
}

export const useStoreOrganization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: OrganizationDTO) => storeOrganization(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
  })
}

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteOrganization(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
  })
}
