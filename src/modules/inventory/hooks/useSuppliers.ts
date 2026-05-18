import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getSuppliersDatatable, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  getSupplierData 
} from '../api/suppliers.api'
import { useUiStore } from '@/store/useUiStore'

export const useSuppliersDatatable = (params: any) => {
  return useQuery({
    queryKey: ['suppliers', 'datatable', params],
    queryFn: () => getSuppliersDatatable(params),
  })
}

export const useSupplierData = (id: number | null) => {
  return useQuery({
    queryKey: ['suppliers', 'data', id],
    queryFn: () => getSupplierData(id!),
    enabled: !!id,
  })
}

export const useCreateSupplier = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: any) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      showNotificationModal(
        'Vendor Created!',
        'The vendor has been created successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Creation Failed',
        error.response?.data?.message || 'Failed to create vendor. Please try again.',
        'error'
      )
    }
  })
}

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: any }) => updateSupplier(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      showNotificationModal(
        'Vendor Updated!',
        'The vendor information has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        error.response?.data?.message || 'Failed to update vendor. Please try again.',
        'error'
      )
    }
  })
}

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, uuid }: { id: number; uuid: string }) => deleteSupplier(id, uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      showNotificationModal(
        'Vendor Deleted!',
        'The vendor has been removed successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Delete Failed',
        error.response?.data?.message || 'Failed to delete vendor. Please try again.',
        'error'
      )
    }
  })
}
