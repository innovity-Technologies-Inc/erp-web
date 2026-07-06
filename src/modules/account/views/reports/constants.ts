export const cashReportOptions = [
  { name: 'Cash Book Report', to: '/account/reports' as any },
  { name: 'Bank Book Report', to: '/account/reports/bank-book' as any },
  { name: 'Day Book Report', to: '/account/reports/day-book' as any },
  { name: 'General Ledger Report', to: '/account/reports/general-ledger' as any },
  { name: 'Sub Ledger Report', to: '/account/reports/sub-ledger' as any },
  { name: 'Trial Balance Report', to: '/account/reports/trial-balance' as any },
  { name: 'Income Statement Report', to: '/account/reports/income-statement' as any },
  { name: 'Expenditure Statement Report', to: '/account/reports/expenditure-statement' as any },
]

export const reportCategoryTabs = [
  { name: 'Cash Book', to: '/account/reports', active: true },
]
