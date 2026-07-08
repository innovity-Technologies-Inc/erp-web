import { useState, useMemo, useRef, Fragment } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useBalanceSheetReport } from '@/modules/account/hooks/useReports'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { cashReportOptions } from './constants'

export const BalanceSheetReportPage = () => {
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

  const { data: reportData, isFetching: isLoading } = useBalanceSheetReport(params)

  const assets = reportData?.assets || []
  const liabilities = reportData?.liabilities || []
  const equitys = reportData?.equitys || []
  const financialyears = reportData?.financialyears || []
  const runningFYear = reportData?.running_f_year
  const companyInfo = reportData?.company_info

  // Compute KPI totals
  const totals = useMemo(() => {
    let totalAssets = 0
    let totalLiabilities = 0
    let totalEquity = 0

    if (assets[0]) {
      totalAssets = parseFloat(String(assets[0].gtotal || 0))
    }
    if (liabilities[0]) {
      totalLiabilities = parseFloat(String(liabilities[0].gtotal || 0))
    }
    if (equitys[0]) {
      totalEquity = parseFloat(String(equitys[0].gtotal || 0))
    }

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
    }
  }, [assets, liabilities, equitys])

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/balance-sheet-export', {
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
      const response = await apiClient.post('/account/report/balance-sheet-export', {
        report_type: 'excel',
        fromDate,
        toDate,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `balance_sheet_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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

  const totalCols = financialyears.length + 2

  return (
    <ListPageLayout<any>
      title="Balance Sheet"
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
          {/* Card 1: Total Assets */}
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
              Total Assets
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 1 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.totalAssets), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 1 ? 'rgba(255,255,255,0.2)' : '#ecfdf5',
                  color: hoveredCard === 1 ? '#ffffff' : '#059669',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Assets
              </span>
            </div>
          </div>

          {/* Card 2: Total Liabilities */}
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
              Total Liabilities
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 2 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.totalLiabilities), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 2 ? 'rgba(255,255,255,0.2)' : '#fdf2f2',
                  color: hoveredCard === 2 ? '#ffffff' : '#dc2626',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Liabilities
              </span>
            </div>
          </div>

          {/* Card 3: Total Equity */}
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
              Total Equity
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 3 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.totalEquity), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 3 ? 'rgba(255,255,255,0.2)' : '#f0fdf4',
                  color: hoveredCard === 3 ? '#ffffff' : '#15803d',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Equity
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
                Balance Sheet Report
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
                  <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider w-[15%] border-r border-[#003671]/20">
                    {runningFYear?.year || 'Current Year'}
                  </th>
                  {financialyears.map((year: string, yearIdx: number) => (
                    <th 
                      key={yearIdx} 
                      className={`px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider w-[15%] ${
                        yearIdx < financialyears.length - 1 ? 'border-r border-[#003671]/20' : ''
                      }`}
                    >
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={totalCols} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        <span className="text-[12px] font-bold uppercase tracking-wider">Loading Data...</span>
                      </div>
                    </td>
                  </tr>
                ) : (assets.length === 0 && liabilities.length === 0 && equitys.length === 0) ? (
                  <tr>
                    <td colSpan={totalCols} className="py-12 text-center text-slate-400 text-[12px] font-bold uppercase tracking-wider">
                      No Records Found
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* --- ASSETS SECTION --- */}
                    {assets.map((asset: any, idx: number) => (
                      <Fragment key={`asset-${idx}`}>
                        <tr className="bg-[#003671]/5">
                          <td colSpan={totalCols} className="px-6 py-3 font-bold text-[#003671] text-left text-[12px] uppercase tracking-wider">
                            {asset.head}
                          </td>
                        </tr>

                        {asset.nextlevel?.map((value: any, valIdx: number) => (
                          <Fragment key={`asset-val-${valIdx}`}>
                            <tr className="bg-slate-50/50">
                              <td className="px-10 py-2.5 font-bold text-slate-800 text-left text-[12px] border-r border-slate-100">
                                {value.headName}
                              </td>
                              <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                {formatCurrency(value.subtotal || 0, currency, currencyPosition)}
                              </td>
                              {financialyears.length >= 1 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                  {formatCurrency(value.ssubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                              {financialyears.length >= 2 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                  {formatCurrency(value.tsubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                              {financialyears.length >= 3 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px]">
                                  {formatCurrency(value.fsubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                            </tr>

                            {value.innerHead?.map((inner: any, innerIdx: number) => (
                              <tr key={`asset-inner-${innerIdx}`} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-2 text-left text-slate-500 font-semibold pl-20 text-[12px] border-r border-slate-100">
                                  {inner.headName}
                                </td>
                                <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(inner.amount || 0, currency, currencyPosition)}
                                </td>
                                {financialyears.length >= 1 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                    {formatCurrency(inner.secondyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                                {financialyears.length >= 2 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                    {formatCurrency(inner.thirdyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                                {financialyears.length >= 3 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px]">
                                    {formatCurrency(inner.fourthyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}

                    {/* Total Assets Row */}
                    {assets.length > 0 && (
                      <tr className="bg-[#003671] border-t-2 border-slate-200 font-bold">
                        <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                          Total Assets
                        </td>
                        <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                          {formatCurrency(assets[0].gtotal || 0, currency, currencyPosition)}
                        </td>
                        {financialyears.length >= 1 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency(assets[0].sgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 2 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency(assets[0].tgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 3 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                            {formatCurrency(assets[0].fgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                      </tr>
                    )}

                    {/* Separator */}
                    <tr className="bg-[#F2F4F6] border-t-2 border-b-2 border-slate-200">
                      <td colSpan={totalCols} className="py-2"></td>
                    </tr>

                    {/* --- LIABILITIES SECTION --- */}
                    {liabilities.map((liability: any, idx: number) => (
                      <Fragment key={`liability-${idx}`}>
                        <tr className="bg-[#FBF3F3]/69">
                          <td colSpan={totalCols} className="px-6 py-3 font-bold text-[#BA1A1A] text-left text-[12px] uppercase tracking-wider">
                            {liability.head}
                          </td>
                        </tr>

                        {liability.nextlevel?.map((value: any, valIdx: number) => (
                          <Fragment key={`liability-val-${valIdx}`}>
                            <tr className="bg-slate-50/50">
                              <td className="px-10 py-2.5 font-bold text-slate-800 text-left text-[12px] border-r border-slate-100">
                                {value.headName}
                              </td>
                              <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                {formatCurrency(value.subtotal || 0, currency, currencyPosition)}
                              </td>
                              {financialyears.length >= 1 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                  {formatCurrency(value.ssubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                              {financialyears.length >= 2 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                  {formatCurrency(value.tsubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                              {financialyears.length >= 3 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px]">
                                  {formatCurrency(value.fsubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                            </tr>

                            {value.innerHead?.map((inner: any, innerIdx: number) => (
                              <tr key={`liability-inner-${innerIdx}`} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-2 text-left text-slate-500 font-semibold pl-20 text-[12px] border-r border-slate-100">
                                  {inner.headName}
                                </td>
                                <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(inner.amount || 0, currency, currencyPosition)}
                                </td>
                                {financialyears.length >= 1 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                    {formatCurrency(inner.secondyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                                {financialyears.length >= 2 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                    {formatCurrency(inner.thirdyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                                {financialyears.length >= 3 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px]">
                                    {formatCurrency(inner.fourthyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}

                    {/* Total Liabilities Row */}
                    {liabilities.length > 0 && (
                      <tr className="bg-[#003671] border-t-2 border-slate-200 font-bold">
                        <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                          Total Liabilities
                        </td>
                        <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                          {formatCurrency(liabilities[0].gtotal || 0, currency, currencyPosition)}
                        </td>
                        {financialyears.length >= 1 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency(liabilities[0].sgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 2 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency(liabilities[0].tgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 3 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                            {formatCurrency(liabilities[0].fgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                      </tr>
                    )}

                    {/* Separator */}
                    <tr className="bg-[#F2F4F6] border-t-2 border-b-2 border-slate-200">
                      <td colSpan={totalCols} className="py-2"></td>
                    </tr>

                    {/* --- EQUITY SECTION --- */}
                    {equitys.map((equity: any, idx: number) => (
                      <Fragment key={`equity-${idx}`}>
                        <tr className="bg-[#003671]/5">
                          <td colSpan={totalCols} className="px-6 py-3 font-bold text-[#003671] text-left text-[12px] uppercase tracking-wider">
                            {equity.head}
                          </td>
                        </tr>

                        {equity.nextlevel?.map((value: any, valIdx: number) => (
                          <Fragment key={`equity-val-${valIdx}`}>
                            <tr className="bg-slate-50/50">
                              <td className="px-10 py-2.5 font-bold text-slate-800 text-left text-[12px] border-r border-slate-100">
                                {value.headName}
                              </td>
                              <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                {formatCurrency(value.subtotal || 0, currency, currencyPosition)}
                              </td>
                              {financialyears.length >= 1 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                  {formatCurrency(value.ssubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                              {financialyears.length >= 2 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px] border-r border-slate-100">
                                  {formatCurrency(value.tsubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                              {financialyears.length >= 3 && (
                                <td className="px-6 py-2.5 text-right font-extrabold text-slate-800 text-[12px]">
                                  {formatCurrency(value.fsubtotal || 0, currency, currencyPosition)}
                                </td>
                              )}
                            </tr>

                            {value.innerHead?.map((inner: any, innerIdx: number) => (
                              <tr key={`equity-inner-${innerIdx}`} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-2 text-left text-slate-500 font-semibold pl-20 text-[12px] border-r border-slate-100">
                                  {inner.headName}
                                </td>
                                <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(inner.amount || 0, currency, currencyPosition)}
                                </td>
                                {financialyears.length >= 1 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                    {formatCurrency(inner.secondyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                                {financialyears.length >= 2 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                    {formatCurrency(inner.thirdyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                                {financialyears.length >= 3 && (
                                  <td className="px-6 py-2 text-right font-semibold text-slate-600 text-[12px]">
                                    {formatCurrency(inner.fourthyear || 0, currency, currencyPosition)}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}

                    {/* Total Equity Row */}
                    {equitys.length > 0 && (
                      <tr className="bg-[#003671] border-t-2 border-slate-200 font-bold">
                        <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                          Total Equity
                        </td>
                        <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                          {formatCurrency(equitys[0].gtotal || 0, currency, currencyPosition)}
                        </td>
                        {financialyears.length >= 1 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency(equitys[0].sgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 2 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency(equitys[0].tgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 3 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                            {formatCurrency(equitys[0].fgtotal || 0, currency, currencyPosition)}
                          </td>
                        )}
                      </tr>
                    )}

                    {/* Separator */}
                    <tr className="bg-[#F2F4F6] border-t-2 border-b-2 border-slate-200">
                      <td colSpan={totalCols} className="py-2"></td>
                    </tr>

                    {/* Grand Total Row (Total Liabilities & Equity) */}
                    {liabilities.length > 0 && equitys.length > 0 && (
                      <tr className="bg-[#003671] border-t-2 border-b-2 border-slate-300 font-black">
                        <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-slate-200">
                          Total Liabilities & Equity
                        </td>
                        <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                          {formatCurrency((liabilities[0].gtotal || 0) + (equitys[0].gtotal || 0), currency, currencyPosition)}
                        </td>
                        {financialyears.length >= 1 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency((liabilities[0].sgtotal || 0) + (equitys[0].sgtotal || 0), currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 2 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px] border-r border-slate-200">
                            {formatCurrency((liabilities[0].tgtotal || 0) + (equitys[0].tgtotal || 0), currency, currencyPosition)}
                          </td>
                        )}
                        {financialyears.length >= 3 && (
                          <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[13px]">
                            {formatCurrency((liabilities[0].fgtotal || 0) + (equitys[0].fgtotal || 0), currency, currencyPosition)}
                          </td>
                        )}
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Verification Trail Banner */}
          {!isLoading && assets.length > 0 && liabilities.length > 0 && equitys.length > 0 && (
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
