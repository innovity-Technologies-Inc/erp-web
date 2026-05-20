import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/units.api'
import { useUiStore } from '@/store/useUiStore'

export const useUnitsDatatable = (params: any) => {
  return useQuery({
    queryKey: ['units-datatable', params],
    queryFn: () => api.getUnitsDatatable(params),
  })
}

export const useUnitSelect2 = () => {
  return useQuery({
    queryKey: ['unit-select2'],
    queryFn: () => api.getUnitSelect2(),
  })
}

export const useStoreUnit = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeUnit,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['units-datatable'] })
      showNotificationModal(
        'Unit Created!',
        res.message || 'New unit has been added successfully.',
        'success'
      )
    },
  })
}

export const useUpdateUnit = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.updateUnit,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['units-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['unit-details'] })
      showNotificationModal(
        'Unit Updated!',
        res.message || 'Unit details have been updated successfully.',
        'success'
      )
    },
  })
}

export const useToggleUnitStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: number; status: number }) => 
      api.updateUnit({ id: payload.id, data: { status: payload.status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['unit-details'] })
    },
  })
}

export const useDeleteUnit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-datatable'] })
    },
  })
}

export const useUnitData = (id: number | string | null) => {
  return useQuery({
    queryKey: ['unit-details', id],
    queryFn: () => api.getUnitData(id!),
    enabled: !!id,
  })
}
