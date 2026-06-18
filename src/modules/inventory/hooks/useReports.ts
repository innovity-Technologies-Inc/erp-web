import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/store/useUiStore'
import { getErrorMessage } from '@/utils/errorHandlers'
import { 
  getTodaysSalesDatatable, 
  getMerchantSalesDatatable, 
  getUserWiseSalesDatatable,
  getProductWiseSalesDatatable,
  getCategoryWiseSalesDatatable,
  getInvoiceWiseDueDatatable,
  getShippingCostDatatable,
  getSaleWiseProfitDatatable,
  getCashClosingData,
  saveCashClosing,
  getCashClosingReportDatatable,
  getStockReportDatatable,
  getStockMovementReportDatatable,
  getStockMovementFilterOptions,
  getWarehouseWiseStockReportDatatable,
  getTodaysPurchaseDatatable,
  getVendorWisePurchaseDatatable,
  getCategoryWisePurchaseDatatable,
  getTodaysMerchantReceiptDatatable,
  getSalesReturnReportDatatable,
  getVendorReturnReportDatatable
} from '../api/reports.api'

export const useTodaysSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'todays-sales', params],
    queryFn: () => getTodaysSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useMerchantSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'merchant-sales', params],
    queryFn: () => getMerchantSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useUserWiseSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'user-wise-sales', params],
    queryFn: () => getUserWiseSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useProductWiseSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'product-wise-sales', params],
    queryFn: () => getProductWiseSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useCategoryWiseSalesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'category-wise-sales', params],
    queryFn: () => getCategoryWiseSalesDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useInvoiceWiseDueDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'invoice-wise-due', params],
    queryFn: () => getInvoiceWiseDueDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useShippingCostDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'shipping-cost', params],
    queryFn: () => getShippingCostDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useSaleWiseProfitDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'sale-wise-profit', params],
    queryFn: () => getSaleWiseProfitDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useCashClosingData = () => {
  return useQuery({
    queryKey: ['reports', 'cash-closing'],
    queryFn: () => getCashClosingData(),
  })
}

export const useSaveCashClosing = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore.getState()

  return useMutation({
    mutationFn: saveCashClosing,
    onSuccess: (data: any) => {
      if (data.status === 1 || data.success) {
        showNotificationModal('Success!', data.message || 'Closing balance saved successfully!', 'success')
        // Invalidate both the current closing state and the historical report
        queryClient.invalidateQueries({ queryKey: ['reports', 'cash-closing'] })
        queryClient.invalidateQueries({ queryKey: ['reports', 'cash-closing-report'] })
      } else {
        showNotificationModal('Error!', data.message || 'Failed to save closing balance.', 'error')
      }
    },
    onError: (error: any) => {
      showNotificationModal('Error!', getErrorMessage(error, 'Failed to save closing balance.'), 'error')
    }
  })
}

export const useCashClosingReportDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'cash-closing-report', params],
    queryFn: () => getCashClosingReportDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useStockReportDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'stock-report', params],
    queryFn: () => getStockReportDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useStockMovementReportDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'stock-movement-report', params],
    queryFn: () => getStockMovementReportDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useStockMovementFilterOptions = () => {
  return useQuery({
    queryKey: ['reports', 'stock-movement-filter-options'],
    queryFn: () => getStockMovementFilterOptions(),
  })
}

export const useWarehouseWiseStockReportDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'warehouse-wise-stock-report', params],
    queryFn: () => getWarehouseWiseStockReportDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useTodaysPurchaseDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'todays-purchase', params],
    queryFn: () => getTodaysPurchaseDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useVendorWisePurchaseDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'vendor-wise-purchase', params],
    queryFn: () => getVendorWisePurchaseDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useCategoryWisePurchaseDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'category-wise-purchase', params],
    queryFn: () => getCategoryWisePurchaseDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useTodaysMerchantReceiptDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'todays-merchant-receipt', params],
    queryFn: () => getTodaysMerchantReceiptDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}
export const useSalesReturnReportDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'sales-return', params],
    queryFn: () => getSalesReturnReportDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}

export const useVendorReturnReportDatatable = (params: any) => {
  return useQuery({
    queryKey: ['reports', 'vendor-return', params],
    queryFn: () => getVendorReturnReportDatatable(params),
    placeholderData: (previousData) => previousData,
  })
}
