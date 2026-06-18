import { apiClient } from '@/api/client'
import type { DataTablesResponse } from '@/api/types'

export interface TodaySalesListItem {
  date: string
  invoice_id: string
  customer_name: string
  total_amount: string
}

export interface MerchantSalesListItem {
  date: string
  invoice_id: string
  customer_name: string
  total_amount: string
  total_discount: string
  payable_amount: string
  paid_amount: string
  due_amount: string
  payment_type: string
  voucher_type: string
  voucher_no: string
}

export interface UserWiseSalesListItem {
  name: string
  total_invoice: string
  amount: string
}

export interface ProductWiseSalesListItem {
  date: string
  product_name: string
  product_model: string
  invoice: string
  customer_name: string
  rate: string
  total_price: string
}

export interface CategoryWiseSalesListItem {
  category_name: string
  product_name: string
  product_model: string
  date: string
  quantity: string
  total_price: string
}

export interface InvoiceWiseDueListItem {
  date: string
  invoice_id: string
  customer_name: string
  total_amount: string
  paid_amount: string
  due_amount: string
}

export interface ShippingCostListItem {
  date: string
  invoice: string
  shipping_cost: string
}

export interface SaleWiseProfitListItem {
  date: string
  invoice: string
  total_supplier_rate: string
  total_sale: string
  total_profit: string
}

export interface CashClosingReportListItem {
  date: string
  amount_in: string
  amount_out: string
  cash_in_hand: string
}

export interface StockReportListItem {
  product_name: string
  product_model: string
  sales_price: string
  purchase_price: string
  total_purchase_qnty: string
  total_purchase_return_qnty: string
  total_sales_qnty: string
  total_sales_return_qnty: string
  stock_quantity: string
  total_sale_price: string
  purchase_total: string
}

export interface StockMovementReportListItem {
  batch_no: string
  product_name: string
  movement_type: string
  quantity: string
  source_warehouse: string
  destination_warehouse: string
  reference: string
}

export interface WarehouseWiseStockReportListItem {
  warehouse_name: string
  product_name: string
  sales_price: string
  purchase_price: string
  total_purchase_qnty: string
  total_purchase_return_qnty: string
  total_sales_qnty: string
  total_sale_return_qnty: string
  stok_quantity: string
  total_sale_price: string
  purchase_total: string
}

export interface TodayPurchaseListItem {
  date: string
  invoice_id: string
  supplier_name: string
  total_amount: string
}

export interface VendorWisePurchaseListItem {
  purchase_date: string
  purchase_id: string
  chalan_no: string
  supplier_name: string
  total_amount: string
  paid_amount: string
  due_amount: string
  payment_type: string
}

export interface CategoryWisePurchaseListItem {
  category_name: string
  product_name: string
  product_model: string
  date: string
  quantity: string
  total_amount: string
}

export interface TodayMerchantReceiptListItem {
  name: string
  narration: string
  credit: string
}

export interface SalesReturnReportListItem {
  invoice_id: string
  customer_name: string
  date: string
  ret_qty: string
  net_total_amount: string
}

export interface VendorReturnReportListItem {
  purchase_id: string
  supplier_name: string
  date: string
  ret_qty: string
  net_total_amount: string
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const getTodaysSalesDatatable = async (params: any): Promise<DataTablesResponse<TodaySalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<TodaySalesListItem>>('/inventory/reports/todays-sales-datatable', { params })
  return response.data
}

export const getMerchantSalesDatatable = async (params: any): Promise<DataTablesResponse<MerchantSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<MerchantSalesListItem>>('/inventory/reports/sales-datatable', { params })
  return response.data
}

export const getUserWiseSalesDatatable = async (params: any): Promise<DataTablesResponse<UserWiseSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<UserWiseSalesListItem>>('/inventory/reports/user-wise-sales-datatable', { params })
  return response.data
}

export const getProductWiseSalesDatatable = async (params: any): Promise<DataTablesResponse<ProductWiseSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ProductWiseSalesListItem>>('/inventory/reports/product-wise-sales-datatable', { params })
  return response.data
}

export const getCategoryWiseSalesDatatable = async (params: any): Promise<DataTablesResponse<CategoryWiseSalesListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CategoryWiseSalesListItem>>('/inventory/reports/category-wise-sales-datatable', { params })
  return response.data
}

export const getInvoiceWiseDueDatatable = async (params: any): Promise<DataTablesResponse<InvoiceWiseDueListItem>> => {
  const response = await apiClient.get<DataTablesResponse<InvoiceWiseDueListItem>>('/inventory/reports/invoice-wise-due-datatable', { params })
  return response.data
}

export const getShippingCostDatatable = async (params: any): Promise<DataTablesResponse<ShippingCostListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ShippingCostListItem>>('/inventory/reports/shipping-cost-datatable', { params })
  return response.data
}

export const getSaleWiseProfitDatatable = async (params: any): Promise<DataTablesResponse<SaleWiseProfitListItem>> => {
  const response = await apiClient.get<DataTablesResponse<SaleWiseProfitListItem>>('/inventory/reports/sale-wise-profit-datatable', { params })
  return response.data
}

export const getCashClosingData = async (): Promise<any> => {
  const response = await apiClient.get<any>('/inventory/reports/cash-closing-data')
  return response.data
}

export const saveCashClosing = async (data: any): Promise<any> => {
  const response = await apiClient.post<any>('/inventory/reports/cash-closing', data)
  return response.data
}

export const getStockReportDatatable = async (params: any): Promise<DataTablesResponse<StockReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<StockReportListItem>>('/inventory/reports/stock/datatable', { params })
  return response.data
}

export const getStockMovementReportDatatable = async (params: any): Promise<DataTablesResponse<StockMovementReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<StockMovementReportListItem>>('/inventory/reports/stock-movement/datatable', { params })
  return response.data
}

export const getWarehouseWiseStockReportDatatable = async (params: any): Promise<DataTablesResponse<WarehouseWiseStockReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<WarehouseWiseStockReportListItem>>('/inventory/reports/warehouse-wise-stock/datatable', { params })
  return response.data
}

export const getStockMovementFilterOptions = async (): Promise<any> => {
  const response = await apiClient.get<any>('/inventory/reports/stock-movement-filter-options')
  return response.data
}

export const getCashClosingReportDatatable = async (params: any): Promise<DataTablesResponse<CashClosingReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CashClosingReportListItem>>('/inventory/reports/cash-closing-report-datatable', { params })
  return response.data
}

export const getTodaysPurchaseDatatable = async (params: any): Promise<DataTablesResponse<TodayPurchaseListItem>> => {
  const response = await apiClient.get<DataTablesResponse<TodayPurchaseListItem>>('/inventory/reports/todays-purchase-datatable', { params })
  return response.data
}

export const getVendorWisePurchaseDatatable = async (params: any): Promise<DataTablesResponse<VendorWisePurchaseListItem>> => {
  const response = await apiClient.get<DataTablesResponse<VendorWisePurchaseListItem>>('/inventory/reports/purchase-datatable', { params })
  return response.data
}

export const getCategoryWisePurchaseDatatable = async (params: any): Promise<DataTablesResponse<CategoryWisePurchaseListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CategoryWisePurchaseListItem>>('/inventory/reports/category-wise-purchase-datatable', { params })
  return response.data
}

export const getTodaysMerchantReceiptDatatable = async (params: any): Promise<DataTablesResponse<TodayMerchantReceiptListItem>> => {
  const response = await apiClient.get<DataTablesResponse<TodayMerchantReceiptListItem>>('/inventory/reports/todays-customer-received-datatable', { params })
  return response.data
}

export const getSalesReturnReportDatatable = async (params: any): Promise<DataTablesResponse<SalesReturnReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<SalesReturnReportListItem>>('/inventory/reports/sales-returns-datatable', { params })
  return response.data
}

export const getVendorReturnReportDatatable = async (params: any): Promise<DataTablesResponse<VendorReturnReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<VendorReturnReportListItem>>('/inventory/reports/supplier-returns-datatable', { params })
  return response.data
}
