import { useState, useMemo, useRef, Fragment } from 'react'
import { FileDown, FileSpreadsheet, Loader2, Search } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { Select2 } from '@/components/Select/Select2'
import { useFixedAssetReport, useFinancialYears } from '@/modules/account/hooks/useReports'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { cashReportOptions } from './constants'

export const FixedAssetReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const printRef = useRef<HTMLDivElement>(null)

  const { data: fyears = [], isLoading: isFyearsLoading } = useFinancialYears()

  const [fYearId, setFYearId] = useState<string>('')
  
  // Set default financial year once loaded
  useMemo(() => {
    if (!fYearId && fyears.length > 0) {
      setFYearId(fyears[0].value)
    }
  }, [fyears, fYearId])

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const params = useMemo(() => ({
    f_year: fYearId || undefined,
  }), [fYearId])

  const { data: reportData, isFetching: isLoading } = useFixedAssetReport(params)

  const fixedAssets = reportData?.fixedAssets || []

  // Compute summary totals
  const totals = useMemo(() => {
    if (fixedAssets && fixedAssets[0]) {
      const asset = fixedAssets[0]
      return {
        closingFA: parseFloat(String(asset.subtotal4 || 0)),
        accumDep: parseFloat(String(asset.subtotal9 || 0)),
        wdv: parseFloat(String(asset.subtotal10 || 0)),
      }
    }
    return {
      closingFA: 0,
      accumDep: 0,
      wdv: 0,
    }
  }, [fixedAssets])

  const handlePdfExport = async () => {
    if (!fYearId) {
      showNotificationModal('Warning!', 'Please select a financial year first.', 'warning')
      return
    }
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/fixed-assets-export', {
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
      const response = await apiClient.post('/account/report/fixed-assets-export', {
        report_type: 'excel',
        f_year: fYearId,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fixed-assets-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export Excel:', error)
      showNotificationModal('Error!', 'Failed to export Excel report.', 'error')
    } finally {
      setIsExportingExcel(false)
    }
  }

  const toolbarLeft = (
    <div className="flex flex-col gap-1">
      <h2 className="text-[16px] font-black text-[#003671] tracking-tight uppercase">
        Fixed Assets Report
      </h2>
      <p className="text-[11px] font-bold text-slate-400">
        Comprehensive analysis of corporate physical assets and valuation.
      </p>
    </div>
  )

  const toolbarRight = (
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
      title="Fixed Assets"
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
          {/* Card 1: Closing FA */}
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
              Closing Fixed Assets
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 1 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.closingFA), currency, currencyPosition).split('.')[0]}
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

          {/* Card 2: Accumulated Depreciation */}
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
              Accumulated Depreciation
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 2 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.accumDep), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 2 ? 'rgba(255,255,255,0.2)' : '#fdf2f2',
                  color: hoveredCard === 2 ? '#ffffff' : '#dc2626',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Depreciation
              </span>
            </div>
          </div>

          {/* Card 3: Written Down Value */}
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
              Written Down Value (WDV)
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 3 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.wdv), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 3 ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                  color: hoveredCard === 3 ? '#ffffff' : '#2563eb',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Net Value
              </span>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-100 rounded-[16px] shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#003671]" />
            <span className="text-xs font-bold text-slate-500">Loading Fixed Assets Report...</span>
          </div>
        ) : fixedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-100 rounded-[16px] shadow-sm">
            <Search className="w-10 h-10 text-slate-300" />
            <span className="text-xs font-bold text-slate-500">No data found. Select a year to query report.</span>
          </div>
        ) : (
          <div ref={printRef} className="flex flex-col gap-6">
            {/* Main Report Table (landscape scrollable) */}
            <div className="overflow-hidden border border-slate-100 rounded-[16px] shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse min-w-[1400px]">
                  <thead>
                    <tr className="bg-[#003671] text-white">
                      <th className="px-6 py-4 text-left font-extrabold uppercase tracking-wider text-[11px] min-w-[240px] border-r border-[#003671]/20">Particulars</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Opening FA</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Additions FA</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Adjustment FA</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Closing FA</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Rate (%)</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Dep Value</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Opening Accum Dep</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Additions Accum Dep</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Adjustment Accum Dep</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px] border-r border-[#003671]/20">Closing Accum Dep</th>
                      <th className="px-4 py-4 text-right font-extrabold text-[11px]">WDV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fixedAssets.map((category: any, catIndex: number) => (
                      <Fragment key={catIndex}>
                        {/* Level 1 Group Header */}
                        <tr className="bg-slate-50/40">
                          <td colSpan={12} className="px-6 py-3.5 text-[#003671] text-left font-extrabold uppercase tracking-widest text-[11px]">
                            {category.headName}
                          </td>
                        </tr>

                        {category.nextlevel?.map((subgroup: any, subIndex: number) => (
                          <Fragment key={subIndex}>
                            {/* Level 2 Subgroup Header */}
                            <tr className="bg-[#F2F4F6]/50">
                              <td className="px-10 py-3 font-bold text-slate-700 text-left text-[12px] border-r border-slate-100">
                                {subgroup.headName}
                              </td>
                              <td colSpan={11}></td>
                            </tr>

                            {subgroup.innerHead?.map((item: any, itemIndex: number) => (
                              <tr key={itemIndex} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">
                                  {item.headName}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.openig, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.curentDebit, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.curentCredit, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.curentValue, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-emerald-600 text-[12px] border-r border-slate-100">
                                  {item.depRate}%
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.depAmount, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.revOpening, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.revCredit, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.revDebit, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600 text-[12px] border-r border-slate-100">
                                  {formatCurrency(item.revBalance, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-700 text-[12px]">
                                  {formatCurrency(item.famount, currency, currencyPosition)}
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}

                    {/* Totals Row */}
                    <tr className="bg-[#003671] border-t-2 border-slate-200 font-bold">
                      <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-[#003671]/20">Total</td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal1 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal2 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal3 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal4 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20"></td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal5 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal6 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal7 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal8 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px] border-r border-[#003671]/20">
                        {formatCurrency(fixedAssets[0]?.subtotal9 || 0, currency, currencyPosition)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#FFFFFF] text-[12px]">
                        {formatCurrency(fixedAssets[0]?.subtotal10 || 0, currency, currencyPosition)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Verification Trail logs info box */}
            <div className="bg-slate-50 border border-slate-200 rounded-[12px] p-4 flex flex-col gap-1.5 mt-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Verification Trail</span>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-4 gap-6 mt-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-300 pt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Prepared By
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-300 pt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Accounts
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-300 pt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Authorized Signature
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-300 pt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chairman
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ListPageLayout>
  )
}
