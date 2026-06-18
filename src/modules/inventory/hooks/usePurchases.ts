import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/purchase.api'
import { useUiStore } from '@/store/useUiStore'
import { getErrorMessage } from '@/utils/errorHandlers'

export const usePurchasesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['purchases-datatable', params],
    queryFn: () => api.getPurchasesDatatable(params),
  })
}

export const useStorePurchase = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storePurchase,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchases-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['check-chalan-no'] })
      queryClient.invalidateQueries({ queryKey: ['check-batch-no'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] }) // Invalidate all reports to ensure sync
      showNotificationModal(
        'Purchase Created!',
        res.message || 'New purchase has been recorded successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Submission Failed',
        getErrorMessage(error, 'Failed to record purchase. Please try again.'),
        'error'
      )
    }
  })
}

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: FormData }) => api.updatePurchase(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchases-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-details'] })
      queryClient.invalidateQueries({ queryKey: ['check-chalan-no'] })
      queryClient.invalidateQueries({ queryKey: ['check-batch-no'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] }) // Invalidate all reports to ensure sync
      showNotificationModal(
        'Purchase Updated!',
        res.message || 'Purchase details have been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        getErrorMessage(error, 'Failed to update purchase. Please try again.'),
        'error'
      )
    }
  })
}

export const useDeletePurchase = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()
  
  return useMutation({
    mutationFn: api.deletePurchase,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchases-datatable'] })
      showNotificationModal(
        'Purchase Deleted!',
        res.message || 'The purchase has been removed successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Delete Failed',
        getErrorMessage(error, 'Failed to delete purchase.'),
        'error'
      )
    }
  })
}

export const usePurchaseData = (id: number | string | null) => {
  return useQuery({
    queryKey: ['purchase-details', id],
    queryFn: () => api.getPurchaseData(id!),
    enabled: !!id,
  })
}

export const useRetrieveProductData = (supplierId: number | null, productId: number | null, purchaseId: number | null = null) => {
  return useQuery({
    queryKey: ['retrieve-product-data', supplierId, productId, purchaseId],
    queryFn: () => api.getRetrieveProductData(supplierId!, productId!, purchaseId),
    enabled: !!supplierId && !!productId,
  })
}

export const useWarehouseStock = (productId: number | null, warehouseId: number | null) => {
  return useQuery({
    queryKey: ['warehouse-stock', productId, warehouseId],
    queryFn: () => api.getWarehouseStock(productId!, warehouseId!),
    enabled: !!productId && !!warehouseId,
  })
}

export const useCheckChalanNo = (chalanNo: string) => {
  return useQuery({
    queryKey: ['check-chalan-no', chalanNo],
    queryFn: () => api.checkChalanNo(chalanNo),
    enabled: !!chalanNo && chalanNo.length > 0,
    staleTime: 0,
    gcTime: 0,
  })
}

export const useCheckBatchNo = (batchNo: string) => {
  return useQuery({
    queryKey: ['check-batch-no', batchNo],
    queryFn: () => api.checkBatchNo(batchNo),
    enabled: !!batchNo && batchNo.length > 0,
    staleTime: 0,
    gcTime: 0,
  })
}

export const usePurchaseSelect2 = (term: string = '', supplierId: number | string | null = null) => {
  return useQuery({
    queryKey: ['purchase-select2', term, supplierId],
    queryFn: () => api.getPurchaseSelect2(term, supplierId || ''),
    enabled: true,
  })
}

export const useVendorProductsSelect2 = (supplierId: number | string | null) => {
  return useQuery({
    queryKey: ['vendor-products-select2', supplierId],
    queryFn: () => api.getVendorProductsSelect2(supplierId!),
    enabled: !!supplierId,
  })
}

export const usePaymentMethodsSelect2 = () => {
  return useQuery({
    queryKey: ['payment-methods-select2'],
    queryFn: () => api.getPaymentMethodsSelect2(),
  })
}
