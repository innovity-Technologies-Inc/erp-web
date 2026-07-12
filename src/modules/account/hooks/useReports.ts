import { useQuery } from '@tanstack/react-query'
import {
  getCashBookReportDatatable,
  getCashHeads,
  getBankHeads,
  getLedgerHeads,
  getSubTypes,
  getAccTypeWiseHead,
  getAccHeadWiseTransaction,
  getDayBookReportDatatable,
  getSubLedgerReportDatatable,
  getTrialBalanceReportDatatable,
  getFinancialYears,
  getIncomeStatementReport,
  getExpenditureStatementReport,
  getProfitLossReport,
  getBalanceSheetReport,
  getFixedAssetReport,
  getReceiptPaymentReport,
  getBankReconciliationReport,
  getCoaPrintReport,
} from '../api/reports.api'

export const useCashBookReportDatatable = (params: {
  start: number
  length: number
  bank_type: string
  fromDate: string
  toDate: string
  voucher_type?: string
  search?: { value: string; regex: boolean }
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'cash-book', params],
    queryFn: () => getCashBookReportDatatable(params),
    enabled: !!params.bank_type, // Only query if an account head is selected
  })
}

export const useCashHeads = () => {
  return useQuery({
    queryKey: ['account', 'reports', 'cash-heads'],
    queryFn: getCashHeads,
  })
}

export const useBankHeads = () => {
  return useQuery({
    queryKey: ['account', 'reports', 'bank-heads'],
    queryFn: getBankHeads,
  })
}

export const useLedgerHeads = () => {
  return useQuery({
    queryKey: ['account', 'reports', 'ledger-heads'],
    queryFn: getLedgerHeads,
  })
}

export const useSubTypes = () => {
  return useQuery({
    queryKey: ['account', 'reports', 'sub-types'],
    queryFn: async () => {
      const data = await getSubTypes()
      return data.map((item) => ({
        value: String(item.value),
        label: item.label,
      }))
    },
  })
}

export const useAccTypeWiseHead = (subTypeId: string) => {
  return useQuery({
    queryKey: ['account', 'reports', 'acc-type-wise-head', subTypeId],
    queryFn: () => getAccTypeWiseHead(subTypeId),
    enabled: !!subTypeId,
  })
}

export const useAccHeadWiseTransaction = (subTypeId: string) => {
  return useQuery({
    queryKey: ['account', 'reports', 'acc-head-wise-transaction', subTypeId],
    queryFn: () => getAccHeadWiseTransaction(subTypeId),
    enabled: !!subTypeId,
  })
}

export const useDayBookReportDatatable = (params: {
  start: number
  length: number
  fromDate: string
  toDate: string
  search?: { value: string; regex: boolean }
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'day-book', params],
    queryFn: () => getDayBookReportDatatable(params),
  })
}

export const useSubLedgerReportDatatable = (params: {
  start: number
  length: number
  sub_type_id: string
  acc_head_id: string
  tran_head_id: string
  fromDate: string
  toDate: string
  search?: { value: string; regex: boolean }
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'sub-ledger', params],
    queryFn: () => getSubLedgerReportDatatable(params),
    enabled: !!(params.sub_type_id && params.acc_head_id && params.tran_head_id), // Only query if all filters are selected
  })
}

export const useTrialBalanceReportDatatable = (params: {
  start: number
  length: number
  fromDate: string
  toDate: string
  search?: { value: string; regex: boolean }
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'trial-balance', params],
    queryFn: () => getTrialBalanceReportDatatable(params),
  })
}

export const useFinancialYears = () => {
  return useQuery({
    queryKey: ['account', 'reports', 'financial-years'],
    queryFn: getFinancialYears,
  })
}

export const useIncomeStatementReport = (fYearId?: string) => {
  return useQuery({
    queryKey: ['account', 'reports', 'income-statement', fYearId],
    queryFn: () => getIncomeStatementReport(fYearId),
  })
}

export const useExpenditureStatementReport = (params: {
  fromDate?: string
  toDate?: string
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'expenditure-statement', params],
    queryFn: () => getExpenditureStatementReport(params),
  })
}

export const useProfitLossReport = (params: {
  fromDate?: string
  toDate?: string
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'profit-loss', params],
    queryFn: () => getProfitLossReport(params),
  })
}

export const useBalanceSheetReport = (params: {
  fromDate?: string
  toDate?: string
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'balance-sheet', params],
    queryFn: () => getBalanceSheetReport(params),
  })
}

export const useFixedAssetReport = (params: {
  f_year?: string | number | null
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'fixed-assets', params],
    queryFn: () => getFixedAssetReport(params),
  })
}

export const useReceiptPaymentReport = (params: {
  fromDate?: string
  toDate?: string
  reportType?: string
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'receipt-payment', params],
    queryFn: () => getReceiptPaymentReport(params),
  })
}

export const useBankReconciliationReport = (params: {
  fromDate?: string
  toDate?: string
  bankCode?: string
}) => {
  return useQuery({
    queryKey: ['account', 'reports', 'bank-reconciliation', params],
    queryFn: () => getBankReconciliationReport(params),
  })
}

export const useCoaPrintReport = () => {
  return useQuery({
    queryKey: ['account', 'reports', 'coa-print'],
    queryFn: () => getCoaPrintReport(),
  })
}
