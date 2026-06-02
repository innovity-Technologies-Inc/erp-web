import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuotationDatatable,
  getQuotationDetails,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  addToInvoice,
  getServiceSelect2,
  getServiceDetails,
} from '../api/quotation.api'
import { useUiStore } from '@/store/useUiStore'

export const useQuotationDatatable = (params: any) => {
  return useQuery({
    queryKey: ['quotations', 'datatable', params],
    queryFn: () => getQuotationDatatable(params),
  })
}

export const useQuotationDetails = (id: string | number | null) => {
  return useQuery({
    queryKey: ['quotations', 'details', id],
    queryFn: () => getQuotationDetails(id!),
    enabled: !!id,
  })
}

export const useCreateQuotation = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: any) => createQuotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      showNotificationModal(
        'Quotation Created!',
        'The quotation has been created successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Creation Failed',
        error.response?.data?.message || 'Failed to create quotation. Please try again.',
        'error'
      )
    }
  })
}

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => updateQuotation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      showNotificationModal(
        'Quotation Updated!',
        'The quotation has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        error.response?.data?.message || 'Failed to update quotation. Please try again.',
        'error'
      )
    }
  })
}

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient()
  const { notify } = useUiStore()

  return useMutation({
    mutationFn: deleteQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
    onError: (error: any) => {
      notify(error.response?.data?.message || 'Failed to delete quotation', 'error')
    }
  })
}

export const useAddToInvoice = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => addToInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      showNotificationModal(
        'Added to Invoice!',
        'The quotation has been converted to an invoice successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Conversion Failed',
        error.response?.data?.message || 'Failed to convert to invoice. Please try again.',
        'error'
      )
    }
  })
}

export const useServiceSelect2 = (search: string = '') => {
  return useQuery({
    queryKey: ['services', 'select2', search],
    queryFn: () => getServiceSelect2(search),
  })
}

export const useServiceDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['services', 'details', id],
    queryFn: () => getServiceDetails(id!),
    enabled: !!id,
  })
}
