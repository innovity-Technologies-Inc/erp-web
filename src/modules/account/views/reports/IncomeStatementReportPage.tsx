import { useState, useEffect, useMemo, Fragment } from 'react'
import { FileDown, FileSpreadsheet, Loader2, TrendingUp } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { Select2 } from '@/components/Select/Select2'
import { useFinancialYears, useIncomeStatementReport } from '@/modules/account/hooks/useReports'
import { useUiStore } from '@/store/useUiStore'
import { cashReportOptions } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'

export const IncomeStatementReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  const [fYearId, setFYearId] = useState<string>('')
  const { showNotificationModal } = useUiStore()
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  // 1. Fetch Financial Years
  const { data: fyears = [], isLoading: isFyearsLoading } = useFinancialYears()

  // Set default financial year once loaded
  useEffect(() => {
    if (fyears.length > 0 && !fYearId) {
      setFYearId(fyears[0].value)
    }
  }, [fyears, fYearId])

  // 2. Fetch Income Statement data
  const { data: reportData, isFetching: isLoading } = useIncomeStatementReport(fYearId || undefined)

  const curentYear = reportData?.curentYear

  // Generate 12 dynamic month headers starting from financial year start_date
  const monthHeaders = useMemo(() => {
    if (!curentYear?.start_date) return []
    const parts = curentYear.start_date.split('-')
    const start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
    const headers = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      headers.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase(),
        index: d.getMonth() + 1, // 1-indexed month index (1 to 12)
      })
    }
    return headers
  }, [curentYear])

  // 3. Compute KPI card totals
  const totals = useMemo(() => {
    let totalIncome = 0
    let totalCogs = 0
    let totalExpenses = 0

    if (reportData?.incomes?.[0]) {
      const inc = reportData.incomes[0]
      for (let i = 1; i <= 12; i++) {
        totalIncome += parseFloat(String(inc[`gtotal${i}`] || 0))
      }
    }

    if (reportData?.costofgoodsolds?.[0]) {
      const cogs = reportData.costofgoodsolds[0]
      for (let i = 1; i <= 12; i++) {
        totalCogs += parseFloat(String(cogs[`subtota${i}`] || 0))
      }
    }

    if (reportData?.expenses?.[0]) {
      const exp = reportData.expenses[0]
      for (let i = 1; i <= 12; i++) {
        totalExpenses += parseFloat(String(exp[`gtotal${i}`] || 0))
      }
    }

    const grossProfit = totalIncome - totalCogs
    const netProfit = grossProfit - totalExpenses
    const profitMargin = totalIncome > 0 ? Math.round((grossProfit / totalIncome) * 100) : 0

    return {
      totalIncome,
      totalCogs,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMargin,
    }
  }, [reportData])

  // Calculate monthly arrays for summary rows (Total Income, Total COGS, Gross Profit, Total Expense, Net Profit)
  const monthlySummaries = useMemo(() => {
    const monthlyIncome = Array(12).fill(0)
    const monthlyCogs = Array(12).fill(0)
    const monthlyGrossProfit = Array(12).fill(0)
    const monthlyExpense = Array(12).fill(0)
    const monthlyNetProfit = Array(12).fill(0)

    if (monthHeaders.length === 0) return { monthlyIncome, monthlyCogs, monthlyGrossProfit, monthlyExpense, monthlyNetProfit }

    monthHeaders.forEach((month, idx) => {
      let inc = 0
      let cogs = 0
      let exp = 0

      if (reportData?.incomes?.[0]) {
        inc = parseFloat(String(reportData.incomes[0][`gtotal${month.index}`] || 0))
      }
      if (reportData?.costofgoodsolds?.[0]) {
        cogs = parseFloat(String(reportData.costofgoodsolds[0][`subtota${month.index}`] || 0))
      }
      if (reportData?.expenses?.[0]) {
        exp = parseFloat(String(reportData.expenses[0][`gtotal${month.index}`] || 0))
      }

      monthlyIncome[idx] = inc
      monthlyCogs[idx] = cogs
      monthlyGrossProfit[idx] = inc - cogs
      monthlyExpense[idx] = exp
      monthlyNetProfit[idx] = (inc - cogs) - exp
    })

    return {
      monthlyIncome,
      monthlyCogs,
      monthlyGrossProfit,
      monthlyExpense,
      monthlyNetProfit,
    }
  }, [reportData, monthHeaders])

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const handlePdfExport = async () => {
    if (!fYearId) {
      showNotificationModal('Warning!', 'Please select a financial year first.', 'warning')
      return
    }
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/income-statement-export', {
        report_type: 'pdf',
        f_year: fYearId,
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
    if (!fYearId) {
      showNotificationModal('Warning!', 'Please select a financial year first.', 'warning')
      return
    }
    try {
      setIsExportingExcel(true)
      const response = await apiClient.post('/account/report/income-statement-export', {
        report_type: 'excel',
        f_year: fYearId,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `income_statement_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      <div className="w-[180px]">
        <Select2
          options={fyears}
          value={fYearId}
          onChange={(val) => setFYearId(val as string)}
          rounded="full"
          variant="solid"
          placeholder="Financial Year"
          isLoading={isFyearsLoading}
        />
      </div>
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
          <FileDown className="h-4 w-4 text-[#64748b] group-hover:text-rose-600 transition-colors" strokeWidth={2.5} />
        )}
        {isExportingPdf ? 'PROCESSING...' : 'PDF'}
      </button>

      <button 
        disabled={isExportingExcel || isLoading}
        onClick={handleExcelExport}
        className="bg-[#f1f5f9] border border-gray-200 px-4 py-2 rounded-full text-[11px] font-bold text-[#64748b] h-9 flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" strokeWidth={2.5} />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-[#64748b] group-hover:text-emerald-600 transition-colors" strokeWidth={2.5} />
        )}
        {isExportingExcel ? 'PROCESSING...' : 'EXCEL'}
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
      title="Income Statement"
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
      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              +12.4%
            </span>
          </div>
        </div>

        {/* Card 2: Total COGS */}
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
            Total COGS
          </div>
          <div className="flex items-baseline justify-between">
            <div 
              style={{ color: hoveredCard === 2 ? '#ffffff' : '#1e293b' }}
              className="text-[18px] font-extrabold tracking-tight transition-colors"
            >
              {formatCurrency(Math.round(totals.totalCogs), currency, currencyPosition).split('.')[0]}
            </div>
            <span 
              style={{
                backgroundColor: hoveredCard === 2 ? 'rgba(255,255,255,0.2)' : '#fdf2f2',
                color: hoveredCard === 2 ? '#ffffff' : '#dc2626',
              }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
            >
              +2.1%
            </span>
          </div>
        </div>

        {/* Card 3: Total Profit (Gross) */}
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
            Total Profit
          </div>
          <div className="flex items-baseline justify-between">
            <div 
              style={{ color: hoveredCard === 3 ? '#ffffff' : '#1e293b' }}
              className="text-[18px] font-extrabold tracking-tight transition-colors"
            >
              {formatCurrency(Math.round(totals.grossProfit), currency, currencyPosition).split('.')[0]}
            </div>
            <span 
              style={{
                backgroundColor: hoveredCard === 3 ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                color: hoveredCard === 3 ? '#ffffff' : '#2563eb',
              }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
            >
              {totals.profitMargin}% Marg
            </span>
          </div>
        </div>

        {/* Card 4: Total Expenses */}
        <div 
          onMouseEnter={() => setHoveredCard(4)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            backgroundColor: hoveredCard === 4 ? '#003671' : '#ffffff',
            color: hoveredCard === 4 ? '#ffffff' : '#1e293b',
            borderColor: hoveredCard === 4 ? '#003671' : '#f1f5f9',
          }}
          className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
        >
          <div 
            style={{ color: hoveredCard === 4 ? '#ffffff' : '#64748b' }}
            className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
          >
            Total Expenses
          </div>
          <div className="flex items-baseline justify-between">
            <div 
              style={{ color: hoveredCard === 4 ? '#ffffff' : '#1e293b' }}
              className="text-[18px] font-extrabold tracking-tight transition-colors"
            >
              {formatCurrency(Math.round(totals.totalExpenses), currency, currencyPosition).split('.')[0]}
            </div>
            <span 
              style={{
                backgroundColor: hoveredCard === 4 ? 'rgba(255,255,255,0.2)' : '#fdf2f2',
                color: hoveredCard === 4 ? '#ffffff' : '#dc2626',
              }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
            >
              -4.5%
            </span>
          </div>
        </div>

        {/* Card 5: Net Profit */}
        <div 
          onMouseEnter={() => setHoveredCard(5)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            backgroundColor: hoveredCard === 5 ? '#003671' : '#ffffff',
            color: hoveredCard === 5 ? '#ffffff' : '#1e293b',
            borderColor: hoveredCard === 5 ? '#003671' : '#f1f5f9',
          }}
          className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
        >
          <div 
            style={{ color: hoveredCard === 5 ? '#ffffff' : '#64748b' }}
            className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
          >
            Net Profit
          </div>
          <div className="flex items-baseline justify-between">
            <div 
              style={{ color: hoveredCard === 5 ? '#ffffff' : '#1e293b' }}
              className="text-[18px] font-extrabold tracking-tight transition-colors"
            >
              {formatCurrency(Math.round(totals.netProfit), currency, currencyPosition).split('.')[0]}
            </div>
            <TrendingUp 
              style={{ color: hoveredCard === 5 ? '#ffffff' : '#94a3b8' }}
              className="h-5 w-5 transition-all duration-300 transform group-hover:scale-110" 
              strokeWidth={2.5} 
            />
          </div>
        </div>
      </div>

      {/* ── Monthly Layout Table (Header + Income Section Only) ── */}
      <div className="overflow-hidden border border-slate-100 rounded-[16px] shadow-sm bg-white mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-[#003671] text-white">
                <th className="px-6 py-4 text-left font-extrabold uppercase tracking-wider text-[11px] min-w-[240px]">
                  Account Particulars
                </th>
                {monthHeaders.map((month) => (
                  <th key={month.label} className="px-4 py-4 text-right font-extrabold text-[11px] min-w-[90px]">
                    {month.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* ── INCOME CATEGORY ── */}
              <tr className="bg-slate-50/40">
                <td colSpan={13} className="px-6 py-3.5 text-[#003671] text-left font-extrabold uppercase tracking-widest text-[11px]">
                  INCOME
                </td>
              </tr>
              {reportData?.incomes?.map((income: any, incIdx: number) => (
                <Fragment key={incIdx}>
                  {income.nextlevel?.map((value: any, valIdx: number) => (
                    <Fragment key={valIdx}>
                      {/* Sub-header row */}
                      <tr className="bg-[#F2F4F6]/50">
                        <td className="px-10 py-3 font-bold text-slate-700 text-left text-[12px]">
                          {value.headName}
                        </td>
                        <td colSpan={12}></td>
                      </tr>
                      {/* Inner child transactions with actual monthly amounts */}
                      {value.innerHead?.map((inner: any, innerIdx: number) => (
                        <tr key={innerIdx} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px]">
                            {inner.headName}
                          </td>
                          {monthHeaders.map((month) => (
                            <td key={month.label} className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px]">
                              {formatCurrency(Math.round(inner[`amount${month.index}`] || 0), currency, currencyPosition).split('.')[0]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
              {/* Total Income Row */}
              <tr className="bg-[#F2F4F6]/50 font-bold border-t border-b border-slate-200">
                <td className="pl-20 py-3.5 bg-[#003671]/5 text-[#003671] text-left font-extrabold italic pr-4 text-[12px]">
                  Total Income
                </td>
                {monthHeaders.map((month, idx) => (
                  <td key={month.label} className="px-4 py-3.5 text-right text-slate-900 font-black text-[12px]">
                    {formatCurrency(Math.round(monthlySummaries.monthlyIncome[idx]), currency, currencyPosition).split('.')[0]}
                  </td>
                ))}
              </tr>

              {/* ── 2. COST OF GOODS SOLD SECTION ── */}
              <tr className="bg-slate-50/40">
                <td colSpan={13} className="px-10 py-3.5 text-[#003671] text-left font-extrabold uppercase tracking-widest text-[11px]">
                  COST OF GOODS SOLD
                </td>
              </tr>
              {reportData?.costofgoodsolds?.map((cogs: any, cogsIdx: number) => (
                <Fragment key={cogsIdx}>
                  <tr className="bg-[#f8fafc]/30">
                    <td className="px-10 py-3 font-bold text-slate-700 text-left text-[12px]">
                      {cogs.headName}
                    </td>
                    <td colSpan={12}></td>
                  </tr>
                  {cogs.innerHead?.map((inner: any, innerIdx: number) => (
                    <tr key={innerIdx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px]">
                        {inner.headName}
                      </td>
                      {monthHeaders.map((month) => (
                        <td key={month.label} className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px]">
                          {formatCurrency(Math.round(inner[`amount${month.index}`] || 0), currency, currencyPosition).split('.')[0]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
              {/* Total COGS Row */}
              <tr className="bg-slate-50/50 font-bold border-t-2 border-b border-slate-200">
                <td className="pl-20 py-3.5 bg-[#003671]/5 text-[#003671] text-left font-extrabold italic pr-4 text-[12px]">
                  Total COGS
                </td>
                {monthHeaders.map((month, idx) => (
                  <td key={month.label} className="px-4 py-3.5 text-right text-slate-900 font-black text-[12px]">
                    {formatCurrency(Math.round(monthlySummaries.monthlyCogs[idx]), currency, currencyPosition).split('.')[0]}
                  </td>
                ))}
              </tr>

              {/* ── 3. GROSS PROFIT ROW ── */}
              <tr className="bg-slate-100/40 border-y-2 border-slate-200 font-black">
                <td className="pl-20 py-3.5 bg-[#003671]/5 text-[#003671] text-left font-extrabold text-[#003671] uppercase tracking-wider text-[12px]">
                  Gross Profit
                </td>
                {monthHeaders.map((month, idx) => (
                  <td key={month.label} className="px-4 py-3.5 text-right text-[#003671] font-black text-[12px]">
                    {formatCurrency(Math.round(monthlySummaries.monthlyGrossProfit[idx]), currency, currencyPosition).split('.')[0]}
                  </td>
                ))}
              </tr>

              {/* ── 4. EXPENSES SECTION ── */}
              <tr className="bg-slate-50/40">
                <td colSpan={13} className="bg-[#FBF3F3]/69 text-[#BA1A1A] px-6 py-3.5 text-left font-extrabold uppercase tracking-widest text-[11px]">
                  Expenses
                </td>
              </tr>
              {reportData?.expenses?.map((expense: any, expIdx: number) => (
                <Fragment key={expIdx}>
                  {expense.nextlevel?.map((value: any, valIdx: number) => (
                    <Fragment key={valIdx}>
                      <tr className="bg-[#FBF3F3]/69">
                        <td className="px-10 py-3 text-[#BA1A1A] font-bold text-left text-[12px]">
                          {value.headName}
                        </td>
                        <td colSpan={12}></td>
                      </tr>
                      {value.innerHead?.map((inner: any, innerIdx: number) => (
                        <tr key={innerIdx} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px]">
                            {inner.headName}
                          </td>
                          {monthHeaders.map((month) => (
                            <td key={month.label} className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px]">
                              {formatCurrency(Math.round(inner[`amount${month.index}`] || 0), currency, currencyPosition).split('.')[0]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
              {/* Total Expenses Row */}
              <tr className="bg-[#FBF3F3]/69 font-bold border-t border-b border-slate-200">
                <td className="px-10 py-3.5 bg-[#BA1A1A]/5 text-[#BA1A1A] text-left font-extrabold italic pr-4 text-[12px]">
                  Total Expense
                </td>
                {monthHeaders.map((month, idx) => (
                  <td key={month.label} className="px-4 py-3.5 text-right text-slate-900 font-black text-[12px]">
                    {formatCurrency(Math.round(monthlySummaries.monthlyExpense[idx]), currency, currencyPosition).split('.')[0]}
                  </td>
                ))}
              </tr>

              {/* ── 5. NET PROFIT ROW ── */}
              <tr className="bg-[#003671] text-white font-black border-t-2 border-slate-300">
                <td className="px-6 py-4 text-left font-extrabold uppercase tracking-wider text-[12px]">
                  Net Amount
                </td>
                {monthHeaders.map((month, idx) => (
                  <td key={month.label} className="px-4 py-4 text-right font-black text-[12px]">
                    {formatCurrency(Math.round(monthlySummaries.monthlyNetProfit[idx]), currency, currencyPosition).split('.')[0]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Verification Trail */}
        <div className="p-3 mt-8 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-bold text-gray-700 uppercase tracking-wider">
          Verification Trail
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-4 gap-8 mt-12 pt-6 text-center text-[10px] font-bold text-gray-400 tracking-wider">
          <div>
            <div className="border-t border-gray-200/80 pt-2 uppercase">Prepared By</div>
          </div>
          <div>
            <div className="border-t border-gray-200/80 pt-2 uppercase">Checked By</div>
          </div>
          <div>
            <div className="border-t border-gray-200/80 pt-2 uppercase">Authorised By</div>
          </div>
          <div>
            <div className="border-t border-gray-200/80 pt-2 uppercase">Pay By</div>
          </div>
        </div>
      </div>
    </ListPageLayout>
  )
}
