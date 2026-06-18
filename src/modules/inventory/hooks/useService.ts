import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getServicesDatatable,
  getService,
  storeService,
  updateService,
  deleteService,
  getServiceInvoicesDatatable,
  getServiceInvoice,
  storeServiceInvoice,
  updateServiceInvoice,
  deleteServiceInvoice,
  getCustomerSelect2,
  getEmployeeSelect2,
  getPaymentMethodsSelect2,
  getServiceSelect2
} from '../api/service.api'
import { useUiStore } from '@/store/useUiStore'
import { getErrorMessage } from '@/utils/errorHandlers'

export {
  getService,
  getServiceInvoice
}

// Service Hooks
export const useServicesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['services', 'datatable', params],
    queryFn: () => getServicesDatatable(params),
  })
}

export const useServiceDetails = (id: number | string | null) => {
  return useQuery({
    queryKey: ['services', 'details', id],
    queryFn: () => getService(id!),
    enabled: !!id,
  })
}

// ... existing hooks ...

export const useCustomerSelect2 = (searchTerm: string = '') => {
  return useQuery({
    queryKey: ['customers', 'select2', searchTerm],
    queryFn: () => getCustomerSelect2({ customer_name: searchTerm }),
  })
}

export const useEmployeeSelect2 = (searchTerm: string = '') => {
  return useQuery({
    queryKey: ['employees', 'select2', searchTerm],
    queryFn: () => getEmployeeSelect2({ employee_name: searchTerm }),
  })
}

export const usePaymentMethodsSelect2 = () => {
  return useQuery({
    queryKey: ['payment-methods', 'select2'],
    queryFn: () => getPaymentMethodsSelect2(),
  })
}

export const useServiceSelect2 = (searchTerm: string = '') => {
  return useQuery({
    queryKey: ['services', 'select2', searchTerm],
    queryFn: () => getServiceSelect2({ service_name: searchTerm }),
  })
}

export const useCreateService = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: any) => storeService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      showNotificationModal(
        'Created Successfully!',
        'New service has been added to the catalog.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Creation Failed',
        getErrorMessage(error, 'Failed to add service. Please try again.'),
        'error'
      )
    }
  })
}

export const useUpdateService = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      showNotificationModal(
        'Updated Successfully!',
        'Service information has been updated.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        getErrorMessage(error, 'Failed to update service.'),
        'error'
      )
    }
  })
}

export const useDeleteService = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (id: number | string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      showNotificationModal(
        'Deleted Successfully!',
        'The service has been removed from the catalog.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Delete Failed',
        getErrorMessage(error, 'Failed to delete service. Please try again.'),
        'error'
      )
    }
  })
}

// Service Invoice Hooks
export const useServiceInvoicesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['service-invoices', 'datatable', params],
    queryFn: () => getServiceInvoicesDatatable(params),
  })
}

export const useServiceInvoice = (id: string | null) => {
  return useQuery({
    queryKey: ['service-invoices', 'details', id],
    queryFn: () => getServiceInvoice(id!),
    enabled: !!id,
  })
}

export const useCreateServiceInvoice = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: any) => storeServiceInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-invoices'] })
      showNotificationModal(
        'Invoice Created!',
        'Service invoice has been generated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Creation Failed',
        getErrorMessage(error, 'Failed to create invoice.'),
        'error'
      )
    }
  })
}

export const useUpdateServiceInvoice = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateServiceInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-invoices'] })
      showNotificationModal(
        'Invoice Updated!',
        'Service invoice has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        getErrorMessage(error, 'Failed to update invoice.'),
        'error'
      )
    }
  })
}

export const useDeleteServiceInvoice = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (id: number) => deleteServiceInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-invoices'] })
      showNotificationModal(
        'Deleted Successfully!',
        'The service invoice has been removed.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Delete Failed',
        getErrorMessage(error, 'Failed to delete invoice. Please try again.'),
        'error'
      )
    }
  })
}
