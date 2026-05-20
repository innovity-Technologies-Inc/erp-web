import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/products.api'
import { useUiStore } from '@/store/useUiStore'

export const useProductsDatatable = (params: any) => {
  return useQuery({
    queryKey: ['products-datatable', params],
    queryFn: () => api.getProductsDatatable(params),
  })
}

export const useStoreProduct = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeProduct,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products-datatable'] })
      showNotificationModal(
        'Product Created!',
        res.message || 'New product has been added successfully.',
        'success'
      )
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.updateProduct,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['product-details'] })
      showNotificationModal(
        'Product Updated!',
        res.message || 'Product details have been updated successfully.',
        'success'
      )
    },
  })
}

export const useToggleProductStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { uuid: string; status: number }) => {
      const formData = new FormData()
      formData.append('uuid', payload.uuid)
      formData.append('status', payload.status.toString())
      return api.updateProduct(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['product-details'] })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-datatable'] })
    },
  })
}

export const useProductData = (id: number | string | null) => {
  return useQuery({
    queryKey: ['product-details', id],
    queryFn: () => api.getProductData(id!),
    enabled: !!id,
  })
}

export const useProductInvoiceInfo = (id: number | string | null, params?: any) => {
  return useQuery({
    queryKey: ['product-invoice-info', id, params],
    queryFn: () => api.getProductInvoiceInfo(id!, params),
    enabled: !!id,
  })
}
