import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  getSupplierReturnDatatable,
  deleteSupplierReturn,
  getInvoiceReturnDatatable,
  getWastageDatatable,
  storeSupplierReturn,
  getSupplierReturnDetails,
  getInvoiceReturnDetails,
  storeInvoiceReturn,
  getInvoiceSelect2
} from '../api/return.api'
import { useUiStore } from '@/store/useUiStore'
import { type ApiResponse } from '@/api/types'

// ---------------------------------------------------------
// Supplier Return (Vendor Return)
// ---------------------------------------------------------

export const useSupplierReturnDatatable = (params: any) => {
  return useQuery({
    queryKey: ['supplier-returns', 'datatable', params],
    queryFn: () => getSupplierReturnDatatable(params),
  })
}

export const useSupplierReturnDetails = (purchaseId: number | string | null) => {
  return useQuery({
    queryKey: ['supplier-return', 'details', purchaseId],
    queryFn: () => getSupplierReturnDetails(purchaseId!),
    enabled: !!purchaseId,
  })
}

export const useDeleteSupplierReturn = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore.getState()

  return useMutation({
    mutationFn: ({ uuid, id }: { uuid: string; id: number }) => deleteSupplierReturn(uuid, id),
    onSuccess: (data) => {
      showNotificationModal('Success', data.message || 'Vendor return deleted successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] })
    },
    onError: (error: any) => {
      showNotificationModal('Error', error.response?.data?.message || 'Failed to delete vendor return', 'error')
    }
  })
}

export const useStoreSupplierReturn = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore.getState()

  return useMutation({
    mutationFn: storeSupplierReturn,
    onSuccess: (data) => {
      showNotificationModal('Success', data.message || 'Vendor return successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] })
      navigate({ to: '/inventory/return/vendor' })
    },
    onError: (error: any) => {
      showNotificationModal('Error', error.response?.data?.message || 'Failed to save vendor return', 'error')
    }
  })
}

// ---------------------------------------------------------
// Invoice Return (Merchant Return)
// ---------------------------------------------------------

export const useInvoiceReturnDatatable = (params: any) => {
  return useQuery({
    queryKey: ['invoice-returns', 'datatable', params],
    queryFn: () => getInvoiceReturnDatatable(params),
  })
}

export const useInvoiceReturnDetails = (invoiceId: number | string | null) => {
  return useQuery({
    queryKey: ['invoice-return', 'details', invoiceId],
    queryFn: () => getInvoiceReturnDetails(invoiceId!),
    enabled: !!invoiceId,
  })
}

export const useStoreInvoiceReturn = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore.getState()

  return useMutation({
    mutationFn: (payload: any) => storeInvoiceReturn(payload),
    onSuccess: (data: ApiResponse<any>) => {
      showNotificationModal('Success', data.message || 'Return/Exchange Successful!', 'success')
      queryClient.invalidateQueries({ queryKey: ['invoice-returns'] })
      navigate({ to: '/inventory/return/merchant' })
    },
    onError: (error: any) => {
      showNotificationModal('Error', error.response?.data?.message || 'Failed to save return', 'error')
    }
  })
}

export const useInvoiceSelect2 = (term: string = '') => {
  return useQuery({
    queryKey: ['invoice-select2', term],
    queryFn: () => getInvoiceSelect2(term),
  })
}

// ---------------------------------------------------------
// Wastage
// ---------------------------------------------------------

export const useWastageDatatable = (params: any) => {
  return useQuery({
    queryKey: ['wastage', 'datatable', params],
    queryFn: () => getWastageDatatable(params),
  })
}
