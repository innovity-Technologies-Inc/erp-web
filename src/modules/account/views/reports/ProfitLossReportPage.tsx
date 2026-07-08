import { useState, useMemo, useRef, Fragment } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useProfitLossReport } from '@/modules/account/hooks/useReports'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { cashReportOptions } from './constants'

export const ProfitLossReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  
  const getFirstDayOfMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }

  const getTodayDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  const [fromDate, setFromDate] = useState<string>(getFirstDayOfMonth())
  const [toDate, setToDate] = useState<string>(getTodayDate())
  const { showNotificationModal } = useUiStore()
  const printRef = useRef<HTMLDivElement>(null)

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const params = useMemo(() => ({
    fromDate,
    toDate,
  }), [fromDate, toDate])

  const { data: reportData, isFetching: isLoading } = useProfitLossReport(params)

  const incomes = reportData?.incomes || []
  const expenses = reportData?.expenses || []
  const companyInfo = reportData?.company_info

  // Compute KPI card totals
  const totals = useMemo(() => {
    let totalIncome = 0
    let totalExpenses = 0

    if (incomes[0]) {
      totalIncome = parseFloat(String(incomes[0].gtotal || 0))
    }
    if (expenses[0]) {
      totalExpenses = parseFloat(String(expenses[0].gtotal || 0))
    }

    const netResult = totalIncome - totalExpenses

    return {
      totalIncome,
      totalExpenses,
      netResult,
    }
  }, [incomes, expenses])

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/profit-loss-export', {
        report_type: 'pdf',
        fromDate,
        toDate,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      showNotificationModal('Error!', 'Failed to export PDF report.', 'error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleExcelExport = async () => {
    try {
      setIsExportingExcel(true)
      const response = await apiClient.post('/account/report/profit-loss-export', {
        report_type: 'excel',
        fromDate,
        toDate,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `profit_loss_report_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export Excel:', error)
      showNotificationModal('Error!', 'Failed to export Excel report.', 'error')
    } finally {
      setIsExportingExcel(false)
    }
  }

  const toolbarLeft = (
    <div className="flex items-center gap-3">
      <DateRangePicker
        from={fromDate}
        to={toDate}
        onChange={(from, to) => { setFromDate(from); setToDate(to); }}
        align="left"
      />
    </div>
  )

  const toolbarRight = (
    <div className="flex items-center gap-3">
      <button 
        disabled={isExportingPdf || isLoading}
        onClick={handlePdfExport}
        className="bg-[#f1f5f9] border border-gray-200 px-4 py-2 rounded-full text-[11px] font-bold text-[#64748b] h-9 flex items-center gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExportingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-500" strokeWidth={2.5} />
        ) : (
          <FileDown className="h-4 w-4 text-[#BA1A1A] group-hover:scale-110 transition-transform" />
        )}
        PDF
      </button>

      <button 
        disabled={isExportingExcel || isLoading}
        onClick={handleExcelExport}
        className="bg-[#f1f5f9] border border-gray-200 px-4 py-2 rounded-full text-[11px] font-bold text-[#64748b] h-9 flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" strokeWidth={2.5} />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
        )}
        EXCEL
      </button>
    </div>
  )

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts' as any, active: false },
    { name: 'Report', to: '/account/reports' as any, active: true },
    { name: 'EIN', to: '/account/ein' as any, active: false },
  ]

  return (
    <ListPageLayout<any>
      title="Profit Loss"
      titleOptions={cashReportOptions}
      tabs={tabs}
      backTo="/"
      showSearch={false}
      showStatusFilter={false}
      showColumnFilter={false}
      columns={[]}
      onColumnToggle={() => {}}
      rowData={[]}
      columnDefs={[]}
      isLoading={isLoading}
      toolbarExtra={toolbarLeft}
      toolbarRightExtra={toolbarRight}
    >
      <div className="flex flex-col gap-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Income */}
          <div 
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === 1 ? '#003671' : '#ffffff',
              color: hoveredCard === 1 ? '#ffffff' : '#1e293b',
              borderColor: hoveredCard === 1 ? '#003671' : '#f1f5f9',
            }}
            className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
          >
            <div 
              style={{ color: hoveredCard === 1 ? '#ffffff' : '#64748b' }}
              className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
            >
              Total Income
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 1 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.totalIncome), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 1 ? 'rgba(255,255,255,0.2)' : '#ecfdf5',
                  color: hoveredCard === 1 ? '#ffffff' : '#059669',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Incomes
              </span>
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div 
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === 2 ? '#003671' : '#ffffff',
              color: hoveredCard === 2 ? '#ffffff' : '#1e293b',
              borderColor: hoveredCard === 2 ? '#003671' : '#f1f5f9',
            }}
            className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
          >
            <div 
              style={{ color: hoveredCard === 2 ? '#ffffff' : '#64748b' }}
              className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
            >
              Total Expenses
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 2 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.totalExpenses), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 2 ? 'rgba(255,255,255,0.2)' : '#fdf2f2',
                  color: hoveredCard === 2 ? '#ffffff' : '#dc2626',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Expenses
              </span>
            </div>
          </div>

          {/* Card 3: Net Profit / Loss */}
          <div 
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === 3 ? '#003671' : '#ffffff',
              color: hoveredCard === 3 ? '#ffffff' : '#1e293b',
              borderColor: hoveredCard === 3 ? '#003671' : '#f1f5f9',
            }}
            className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
          >
            <div 
              style={{ color: hoveredCard === 3 ? '#ffffff' : '#64748b' }}
              className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
            >
              {totals.netResult >= 0 ? 'Net Profit' : 'Net Loss'}
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 3 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.abs(Math.round(totals.netResult)), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 3 ? 'rgba(255,255,255,0.2)' : (totals.netResult >= 0 ? '#ecfdf5' : '#fdf2f2'),
                  color: hoveredCard === 3 ? '#ffffff' : (totals.netResult >= 0 ? '#059669' : '#dc2626'),
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Balancing
              </span>
            </div>
          </div>
        </div>

        {/* Report Table Card */}
        <div ref={printRef} className="bg-white p-6 shadow-sm rounded-lg border border-slate-100">
          
          {/* Company Details Header for Print */}
          {companyInfo && (
            <div className="hidden print:block text-center border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800">{companyInfo.company_name}</h2>
              <p className="text-[12px] text-slate-500">{companyInfo.address}</p>
              <p className="text-[11px] text-slate-400">
                Email: {companyInfo.email} | Mobile: {companyInfo.mobile}
              </p>
              <h3 className="text-md font-bold text-[#003671] mt-4 uppercase tracking-wider">
                Profit Loss Report
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Period: {fromDate} to {toDate}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#003671] text-white">
                  <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#003671]/20">
                    Account Particulars
                  </th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider w-[20%] border-r border-[#003671]/20">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider w-[20%]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        <span className="text-[12px] font-bold uppercase tracking-wider">Loading Data...</span>
                      </div>
                    </td>
                  </tr>
                ) : (incomes.length === 0 && expenses.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400 text-[12px] font-bold uppercase tracking-wider">
                      No Records Found
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* --- INCOME SECTION --- */}
                    {incomes.map((income: any, idx: number) => (
                      <Fragment key={`inc-${idx}`}>
                        {/* Level 1 Category (Income) */}
                        <tr className="bg-[#003671]/5">
                          <td colSpan={3} className="px-6 py-3 font-bold text-[#003671] text-left text-[12px] uppercase tracking-wider">
                            {income.head}
                          </td>
                        </tr>

                        {income.nextlevel?.map((value: any, valIdx: number) => (
                          <Fragment key={`inc-val-${valIdx}`}>
                            {/* Level 2 Subgroup */}
                            <tr className="bg-slate-50/50">
                              <td className="px-10 py-2.5 font-bold text-slate-800 text-left text-[12px] border-r border-slate-100">
                                {value.headName}
                              </td>
                              <td className="border-r border-slate-100"></td>
                              <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px]">
                                {formatCurrency(value.subtotal || 0, currency, currencyPosition)}
                              </td>
                            </tr>

                            {/* Level 3 Ledger Accounts */}
                            {value.innerHead?.map((inner: any, innerIdx: number) => (
                              <tr key={`inc-inner-${innerIdx}`} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-2 text-left text-slate-500 font-semibold pl-20 text-[12px] border-r border-slate-100">
                                  {inner.headName}
                                </td>
                                <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(inner.amount || 0, currency, currencyPosition)}
                                </td>
                                <td></td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}

                    {/* Profit/Loss Balancing Row for Income Section */}
                    {incomes.length > 0 && expenses.length > 0 && totals.totalIncome < totals.totalExpenses && (
                      <>
                        {/* <tr className="bg-[#FBF3F3]/80 border-t border-slate-100 font-bold">
                          <td className="px-10 py-3.5 text-right font-bold text-[#BA1A1A] text-[12px] border-r border-slate-100">
                            Profit/Loss
                          </td>
                          <td colSpan={2} className="px-6 py-3.5 text-right font-bold text-[#BA1A1A] text-[12px]">
                            {formatCurrency(totals.totalExpenses - totals.totalIncome, currency, currencyPosition)}
                          </td>
                        </tr> */}
                        <tr className="bg-[#003671] border-t border-slate-100 font-bold">
                          <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                            Total
                          </td>
                          <td colSpan={2} className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                            {formatCurrency(totals.totalExpenses, currency, currencyPosition)}
                          </td>
                        </tr>
                      </>
                    )}

                    {incomes.length > 0 && expenses.length > 0 && totals.totalIncome >= totals.totalExpenses && (
                      <tr className="bg-[#003671] border-t border-slate-100 font-bold">
                        <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                          Total
                        </td>
                        <td colSpan={2} className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                          {formatCurrency(totals.totalIncome, currency, currencyPosition)}
                        </td>
                      </tr>
                    )}

                    {/* Section Separator */}
                    <tr className="bg-[#F2F4F6] border-t-2 border-b-2 border-slate-200">
                      <td colSpan={3} className="py-2"></td>
                    </tr>

                    {/* --- EXPENSE SECTION --- */}
                    {expenses.map((expense: any, idx: number) => (
                      <Fragment key={`exp-${idx}`}>
                        {/* Level 1 Category (Expense) */}
                        <tr className="bg-[#FBF3F3]/69">
                          <td colSpan={3} className="px-6 py-3 font-bold text-[#BA1A1A] text-left text-[12px] uppercase tracking-wider">
                            {expense.head}
                          </td>
                        </tr>

                        {expense.nextlevel?.map((value: any, valIdx: number) => (
                          <Fragment key={`exp-val-${valIdx}`}>
                            {/* Level 2 Subgroup */}
                            <tr className="bg-slate-50/50">
                              <td className="px-10 py-2.5 font-bold text-slate-800 text-left text-[12px] border-r border-slate-100">
                                {value.headName}
                              </td>
                              <td className="border-r border-slate-100"></td>
                              <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px]">
                                {formatCurrency(value.subtotal || 0, currency, currencyPosition)}
                              </td>
                            </tr>

                            {/* Level 3 Ledger Accounts */}
                            {value.innerHead?.map((inner: any, innerIdx: number) => (
                              <tr key={`exp-inner-${innerIdx}`} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-2 text-left text-slate-500 font-semibold pl-20 text-[12px] border-r border-slate-100">
                                  {inner.headName}
                                </td>
                                <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(inner.amount || 0, currency, currencyPosition)}
                                </td>
                                <td></td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}

                    {/* Profit/Loss Balancing Row for Expense Section */}
                    {incomes.length > 0 && expenses.length > 0 && totals.totalIncome > totals.totalExpenses && (
                      <>
                        <tr className="bg-[#FBF3F3]/80 border-t border-slate-100 font-bold">
                          <td className="px-10 py-3.5 text-right font-bold text-[#BA1A1A] text-[12px] border-r border-slate-100">
                            Profit/Loss
                          </td>
                          <td colSpan={2} className="px-6 py-3.5 text-right font-bold text-[#BA1A1A] text-[12px]">
                            {formatCurrency(totals.totalIncome - totals.totalExpenses, currency, currencyPosition)}
                          </td>
                        </tr>
                        <tr className="bg-[#003671] border-t border-slate-100 font-bold">
                          <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                            Total
                          </td>
                          <td colSpan={2} className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                            {formatCurrency(totals.totalIncome, currency, currencyPosition)}
                          </td>
                        </tr>
                      </>
                    )}

                    {incomes.length > 0 && expenses.length > 0 && totals.totalIncome <= totals.totalExpenses && (
                      <tr className="bg-[#003671] border-t border-slate-100 font-bold">
                        <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                          Total
                        </td>
                        <td colSpan={2} className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                          {formatCurrency(totals.totalExpenses, currency, currencyPosition)}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Verification Trail Banner */}
          {!isLoading && incomes.length > 0 && expenses.length > 0 && (
            <>
              <div className="p-3 mt-8 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                Verification Trail
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-4 gap-8 mt-12 pt-6 text-center text-[10px] font-bold text-gray-400 tracking-wider">
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Prepared By</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Accounts</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Authorized Signature</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Chairman</div>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </ListPageLayout>
  )
}
