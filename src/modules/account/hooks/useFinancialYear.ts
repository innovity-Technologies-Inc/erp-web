import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/financial-year.api'
import { useUiStore } from '@/store/useUiStore'

export const useFinancialYearsDatatable = (params: any) => {
  return useQuery({
    queryKey: ['financial-years-datatable', params],
    queryFn: () => api.getFinancialYearsDatatable(params),
  })
}

export const useStoreFinancialYear = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeFinancialYear,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['financial-years-datatable'] })
      showNotificationModal(
        'Financial Year Created!',
        res.message || 'New financial year has been added successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to add financial year.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateFinancialYear = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.updateFinancialYear,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['financial-years-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['financial-year-details'] })
      showNotificationModal(
        'Financial Year Updated!',
        res.message || 'Financial year details have been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update financial year.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useToggleFinancialYearStatus = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.updateFinancialYearStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['financial-years-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['financial-year-details'] })
      showNotificationModal(
        'Success!',
        res.message || 'Financial year status has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update status.'
      showNotificationModal('Failed', message, 'error')
    }
  })
}

export const useDeleteFinancialYear = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.deleteFinancialYear,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['financial-years-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Financial year has been deleted.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete financial year.'
      showNotificationModal('Failed', message, 'error')
    }
  })
}

export const useFinancialYearData = (id: number | string | null) => {
  return useQuery({
    queryKey: ['financial-year-details', id],
    queryFn: () => api.getFinancialYearData(id!),
    enabled: !!id,
  })
}
