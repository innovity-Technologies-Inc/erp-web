import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDesignationsDatatable,
  getDesignation,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  toggleDesignationStatus,
} from '../api/designation.api'
import { designationKeys } from '../api/designation.keys'
import type { DesignationFilters, CreateDesignationDto, UpdateDesignationDto } from '../api/types'

export const useDesignationsDatatable = (filters: DesignationFilters) => {
  return useQuery({
    queryKey: designationKeys.list(filters),
    queryFn: () => getDesignationsDatatable(filters),
    staleTime: 30_000,
  })
}

export const useDesignationData = (id: number | null) => {
  return useQuery({
    queryKey: designationKeys.detail(id),
    queryFn: () => getDesignation(id!),
    enabled: id !== null && id !== undefined && !isNaN(id),
  })
}

export const useCreateDesignation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDesignationDto) => createDesignation(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationKeys.all() })
    },
  })
}

export const useUpdateDesignation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateDesignationDto) => updateDesignation(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationKeys.all() })
    },
  })
}

export const useDeleteDesignation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDesignation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationKeys.all() })
    },
  })
}

export const useToggleDesignationStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, designation, status }: { id: number; designation: string; status: number }) => toggleDesignationStatus({ id, designation, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationKeys.all() })
    },
  })
}
