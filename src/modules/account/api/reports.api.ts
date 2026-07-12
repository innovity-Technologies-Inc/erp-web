import { apiClient } from '@/api/client'
import type { DataTablesResponse } from '@/api/types'

export interface CashBookReportListItem {
  v_date: string
  v_no: string
  v_type: string
  head_name: string
  ledger_comment: string
  debit: string | number
  credit: string | number
  current_balance: string | number
}

export interface DayBookReportListItem {
  id: number
  uuid: string
  v_no: string
  v_date: string
  head_name: string
  ledger_comment: string
  name: string
  debit: string | number
  credit: string | number
  reverse_head: string
}

export interface TrialBalanceReportListItem {
  HeadCode: string
  HeadName: string
  opening_balance_debit: string | number
  opening_balance_credit: string | number
  transational_balance_debit: string | number
  transational_balance_credit: string | number
  closing_balance_debit: string | number
  closing_balance_credit: string | number
}

export interface IncomeStatementResponse {
  curentYear: {
    id: number
    year: string
    start_date: string
    end_date: string
  } | null
  incomes: any[]
  costofgoodsolds: any[]
  expenses: any[]
  setting: any
}

export const getCashBookReportDatatable = async (params: {
  start: number
  length: number
  bank_type: string
  fromDate: string
  toDate: string
  voucher_type?: string
  search?: { value: string; regex: boolean }
}): Promise<DataTablesResponse<CashBookReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CashBookReportListItem>>('/account/report/bank-book', {
    params,
  })
  return response.data
}

export const getCashHeads = async (): Promise<{ value: string; label: string }[]> => {
  const response = await apiClient.get<{ value: string; label: string }[]>('/account/report/cash-heads')
  return response.data
}

export const getBankHeads = async (): Promise<{ value: string; label: string }[]> => {
  const response = await apiClient.get<{ value: string; label: string }[]>('/account/report/bank-heads')
  return response.data
}

export const getLedgerHeads = async (): Promise<{ value: string; label: string }[]> => {
  const response = await apiClient.get<{ value: string; label: string }[]>('/account/report/ledger-heads')
  return response.data
}

export const getSubTypes = async (): Promise<{ value: string; label: string }[]> => {
  const response = await apiClient.get<{ value: string; label: string }[]>('/account/report/sub-types')
  return response.data
}

export const getAccTypeWiseHead = async (subTypeId: string): Promise<{ value: string; label: string }[]> => {
  const response = await apiClient.get<{ id: string; text: string }[]>(`/account/get-acc-type-wise-head/${subTypeId}`)
  return response.data.map((item) => ({
    value: item.id,
    label: item.text,
  }))
}

export const getAccHeadWiseTransaction = async (subTypeId: string): Promise<{ value: string; label: string }[]> => {
  const response = await apiClient.get<{ id: string; text: string }[]>(`/account/get-acc-head-wise-transaction/${subTypeId}`)
  return response.data.map((item) => ({
    value: item.id,
    label: item.text,
  }))
}

export const getDayBookReportDatatable = async (params: {
  start: number
  length: number
  fromDate: string
  toDate: string
  search?: { value: string; regex: boolean }
}): Promise<DataTablesResponse<DayBookReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<DayBookReportListItem>>('/account/report/day-book', {
    params,
  })
  return response.data
}

export const getSubLedgerReportDatatable = async (params: {
  start: number
  length: number
  sub_type_id: string
  acc_head_id: string
  tran_head_id: string
  fromDate: string
  toDate: string
  search?: { value: string; regex: boolean }
}): Promise<DataTablesResponse<CashBookReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CashBookReportListItem>>('/account/report/sub-ledger', {
    params,
  })
  return response.data
}

export const getTrialBalanceReportDatatable = async (params: {
  start: number
  length: number
  fromDate: string
  toDate: string
  search?: { value: string; regex: boolean }
}): Promise<DataTablesResponse<TrialBalanceReportListItem>> => {
  const response = await apiClient.get<DataTablesResponse<TrialBalanceReportListItem>>('/account/report/trial-balance', {
    params,
  })
  return response.data
}

export const getFinancialYears = async (): Promise<{ value: string; label: string }[]> => {
  const response = await apiClient.get<{ value: string; label: string }[]>('/account/report/financial-years')
  return response.data
}

export const getIncomeStatementReport = async (fYearId?: string): Promise<IncomeStatementResponse> => {
  const response = await apiClient.get<IncomeStatementResponse>('/account/report/income-statement', {
    params: { f_year: fYearId },
  })
  return response.data
}

export interface ExpenditureStatementResponse {
  expenses: any[]
  fromDate: string
  toDate: string
  setting: any
  company_info: any
}

export const getExpenditureStatementReport = async (params: {
  fromDate?: string
  toDate?: string
}): Promise<ExpenditureStatementResponse> => {
  const response = await apiClient.get<ExpenditureStatementResponse>('/account/report/expenditure-statement', {
    params,
  })
  return response.data
}

export interface ProfitLossResponse {
  incomes: any[]
  expenses: any[]
  fromDate: string
  toDate: string
  setting: any
  company_info: any
}

export const getProfitLossReport = async (params: {
  fromDate?: string
  toDate?: string
}): Promise<ProfitLossResponse> => {
  const response = await apiClient.get<ProfitLossResponse>('/account/report/profit-loss', {
    params,
  })
  return response.data
}

export interface BalanceSheetResponse {
  assets: any[]
  liabilities: any[]
  equitys: any[]
  financialyears: string[]
  fromDate: string
  toDate: string
  setting: any
  company_info: any
  running_f_year: {
    id: number
    year: string
    [key: string]: any
  }
}

export const getBalanceSheetReport = async (params: {
  fromDate?: string
  toDate?: string
}): Promise<BalanceSheetResponse> => {
  const response = await apiClient.get<BalanceSheetResponse>('/account/report/balance-sheet', {
    params,
  })
  return response.data
}

export interface FixedAssetResponse {
  fyear: number | string | null
  fixedAssets: any[]
  fyears: {
    id: number
    year: string
    [key: string]: any
  }[]
  curentYear: {
    id: number
    year: string
    [key: string]: any
  } | null
  setting: any
  company_info: any
}

export const getFixedAssetReport = async (params: {
  f_year?: string | number | null
}): Promise<FixedAssetResponse> => {
  const response = await apiClient.get<FixedAssetResponse>('/account/report/fixed-assets', {
    params,
  })
  return response.data
}

export interface ReceiptPaymentInnerHead {
  code: string
  headName: string
  debit: number
  credit: number
}

export interface ReceiptPaymentItem {
  hcode: string
  headName: string
  innerHead: ReceiptPaymentInnerHead[]
  subtotal: number
}

export interface ReceiptPaymentResponse {
  dtpFromDate: string
  dtpToDate: string
  reportType: 'Accrual Basis' | 'Cash Basis'
  cashOpening: number
  bankOpening: number
  advOpening: number
  cashClosing: number
  bankClosing: number
  advClosing: number
  receiptitems: ReceiptPaymentItem[]
  paymentitems: ReceiptPaymentItem[]
  setting: any
  company_info: any
}

export const getReceiptPaymentReport = async (params: {
  fromDate?: string
  toDate?: string
  reportType?: string
}): Promise<ReceiptPaymentResponse> => {
  const response = await apiClient.get<ReceiptPaymentResponse>('/account/report/receipt-payment', {
    params,
  })
  return response.data
}

export interface BankReconciliationVoucher {
  id: number
  v_no: string
  v_No: string
  v_date: string
  cheque_no: string
  cheque_date: string
  debit: number
  credit: number
  is_honour: number
  is_approved: number
  accountName: string
  Bankname: string
  [key: string]: any
}

export interface BankReconciliationResponse {
  dtpFromDate: string
  dtpToDate: string
  bankCode: string
  bank: Array<{ head_code: string; head_name: string }>
  vauchers: BankReconciliationVoucher[]
  setting: any
  company_info: any
}

export const getBankReconciliationReport = async (params: {
  fromDate?: string
  toDate?: string
  bankCode?: string
}): Promise<BankReconciliationResponse> => {
  const response = await apiClient.get<BankReconciliationResponse>('/account/report/bank-reconciliation', {
    params,
  })
  return response.data
}

export interface CoaPrintItem {
  id: number
  head_code: string
  head_name: string
  head_level: number
  p_head_code: string
  is_active: number
  [key: string]: any
}

export interface CoaPrintResponse {
  acc_coas: CoaPrintItem[]
  maxLevel: number
  setting: any
  company_info: any
}

export const getCoaPrintReport = async (): Promise<CoaPrintResponse> => {
  const response = await apiClient.get<CoaPrintResponse>('/account/report/coa-print')
  return response.data
}


