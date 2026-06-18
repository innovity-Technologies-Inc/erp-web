import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// Utility to safely extract error message as string
const extractErrorMessage = (error: any): string => {
  const data = error?.response?.data;
  if (!data) return 'An unexpected error occurred';

  // Check 'errors' field (common in validation responses)
  const errors = data.errors;
  if (typeof errors === 'string') return errors;
  if (typeof errors === 'object' && errors !== null) {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      const firstVal = errors[firstKey];
      return Array.isArray(firstVal) ? String(firstVal[0]) : String(firstVal);
    }
  }

  // Check 'message' field
  const message = data.message;
  if (typeof message === 'string') return message;
  if (typeof message === 'object' && message !== null) {
    const firstKey = Object.keys(message)[0];
    if (firstKey) {
      const firstVal = message[firstKey];
      return Array.isArray(firstVal) ? String(firstVal[0]) : String(firstVal);
    }
    return JSON.stringify(message);
  }

  return 'An unexpected error occurred';
};

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
      showNotificationModal('Error', extractErrorMessage(error), 'error')
    }
  })
}

export const useStoreSupplierReturn = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore.getState()

  return useMutation({
    mutationFn: storeSupplierReturn,
    onSuccess: (data, variables) => {
      showNotificationModal('Success', data.message || 'Vendor return successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['supplier-returns'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] }) // Invalidate reports to ensure sync
      
      // Target specific purchase details for invalidation
      if (variables?.purchase_id) {
        queryClient.invalidateQueries({ queryKey: ['purchase-details', variables.purchase_id] })
        // Also invalidate with string/number variety if needed, but usually one is enough if consistent
        queryClient.invalidateQueries({ queryKey: ['purchase-details', String(variables.purchase_id)] })
        queryClient.invalidateQueries({ queryKey: ['purchase-details', Number(variables.purchase_id)] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['purchase-details'] })
      }
    },
    onError: (error: any) => {
      showNotificationModal('Error', extractErrorMessage(error), 'error')
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
  const { showNotificationModal } = useUiStore.getState()

  return useMutation({
    mutationFn: (payload: any) => storeInvoiceReturn(payload),
    onSuccess: (data: ApiResponse<any>, variables) => {
      showNotificationModal('Success', data.message || 'Return/Exchange Successful!', 'success')
      queryClient.invalidateQueries({ queryKey: ['invoice-returns'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] }) // Invalidate reports to ensure sync
      
      // Target specific sale details for invalidation to update available quantities
      if (variables?.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ['sales', 'details', variables.invoice_id] })
        queryClient.invalidateQueries({ queryKey: ['sales', 'details', Number(variables.invoice_id)] })
        queryClient.invalidateQueries({ queryKey: ['sales', 'details', String(variables.invoice_id)] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['sales', 'details'] })
      }
    },
    onError: (error: any) => {
      showNotificationModal('Error', extractErrorMessage(error), 'error')
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
