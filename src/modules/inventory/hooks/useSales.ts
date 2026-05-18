import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getSalesDatatable, 
  deleteSale, 
  getInvoicePaymentsDatatable, 
  updateConfirmStatus,
  createSale,
  getSaleDetails,
  updateSale,
  getWarehouses,
  getMerchants,
  getProducts,
  getProductBatchInfo,
  getMerchantDetails,
  getPaymentMethods
} from '../api/sales.api'
import { useUiStore } from '@/store/useUiStore'

export const useSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['sales', 'datatable', params],
    queryFn: () => getSalesDatatable(params),
  })
}

export const useSaleDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['sales', 'details', id],
    queryFn: () => getSaleDetails(id!),
    enabled: !!id,
  })
}

export const useInvoicePaymentsDatatable = (params: any) => {
  return useQuery({
    queryKey: ['invoice-payments', 'datatable', params],
    queryFn: () => getInvoicePaymentsDatatable(params),
  })
}

export const useUpdateConfirmStatus = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ uuid, value }: { uuid: string; value: number }) => updateConfirmStatus(uuid, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-payments'] })
      showNotificationModal(
        'Status Updated!',
        'The invoice payment status has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        error.response?.data?.message || 'Failed to update status. Please try again.',
        'error'
      )
    }
  })
}

export const useCreateSale = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: any) => createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      showNotificationModal(
        'Sale Created!',
        'The sales invoice has been created successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Creation Failed',
        error.response?.data?.message || 'Failed to create sale. Please try again.',
        'error'
      )
    }
  })
}

export const useUpdateSale = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string, data: any }) => updateSale(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      showNotificationModal(
        'Sale Updated!',
        'The sales invoice has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        error.response?.data?.message || 'Failed to update sale. Please try again.',
        'error'
      )
    }
  })
}

export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses', 'list'],
    queryFn: () => getWarehouses(),
  })
}

export const useMerchants = (search: string = '') => {
  return useQuery({
    queryKey: ['merchants', 'list', search],
    queryFn: () => getMerchants(search),
  })
}

export const useMerchantDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['merchants', 'details', id],
    queryFn: () => getMerchantDetails(id!),
    enabled: !!id,
  })
}

export const useProductsSearch = (search: string = '') => {
  return useQuery({
    queryKey: ['products', 'list', search],
    queryFn: () => getProducts(search),
  })
}

export const useProductBatchInfo = (productId: number | null, warehouseId: number | null) => {
  return useQuery({
    queryKey: ['products', 'batch-info', productId, warehouseId],
    queryFn: () => getProductBatchInfo(productId!, warehouseId!),
    enabled: !!productId && !!warehouseId,
  })
}

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods', 'list'],
    queryFn: () => getPaymentMethods(),
  })
}

export const useDeleteSale = () => {
  const queryClient = useQueryClient()
  const { notify } = useUiStore()

  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (error: any) => {
      notify(error.response?.data?.message || 'Failed to delete sale', 'error')
    }
  })
}
