import { useState, useRef } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useCoaPrintReport } from '@/modules/account/hooks/useReports'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'
import { cashReportOptions } from './constants'

export const CoaPrintReportPage = () => {
  const { showNotificationModal } = useUiStore()
  const printRef = useRef<HTMLDivElement>(null)

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const { data: reportData, isFetching: isLoading } = useCoaPrintReport()

  const accCoas = reportData?.acc_coas || []
  const maxLevel = reportData?.maxLevel || 4
  const colsCount = maxLevel + 1

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/coa-print-export', {
        report_type: 'pdf',
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
      const response = await apiClient.post('/account/report/coa-print-export', {
        report_type: 'excel',
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `chart-of-accounts-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
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
        Chart of Accounts Report
      </h2>
      <p className="text-[11px] font-bold text-slate-400">
        Detailed hierarchical tree structure of the general ledger chart of accounts.
      </p>
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
      title="Chart of Accounts"
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
        
        {/* Report Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-100 rounded-[16px] shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#003671]" />
            <span className="text-xs font-bold text-slate-500">Loading Chart of Accounts Data...</span>
          </div>
        ) : (
          <div ref={printRef} className="flex flex-col gap-6">
            
            {/* Hierarchical Table */}
            <div className="overflow-hidden border border-slate-100 rounded-[16px] shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#003671] text-white">
                      <th className="px-6 py-4 text-left font-extrabold uppercase tracking-wider text-[11px]" colSpan={colsCount}>
                        Account Details
                      </th>
                      <th className="px-6 py-4 text-center font-extrabold uppercase tracking-wider text-[11px] w-[10%]">
                        Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accCoas.map((coa: any, idx: number) => {
                      const HL = coa.head_level
                      const HL1 = colsCount - HL
                      return (
                        <tr key={`coa-${idx}`} className="hover:bg-slate-50/40 transition-colors">
                          {Array.from({ length: HL }).map((_, j) => (
                            <td key={j} className="px-6 py-2.5 border-r border-slate-100 text-slate-400 font-medium text-[11px] w-[12%] select-none">
                              {coa.head_code}
                            </td>
                          ))}
                          <td 
                            colSpan={HL1} 
                            className={`px-6 py-2.5 border-r border-slate-100 font-semibold text-[12px] ${
                              HL === 1 
                                ? 'text-[#003671] font-black uppercase tracking-wider' 
                                : HL === 2 
                                  ? 'text-slate-800 font-bold' 
                                  : HL === 3 
                                    ? 'text-slate-600 font-bold pl-8' 
                                    : 'text-slate-500 font-medium pl-14'
                            }`}
                          >
                            {coa.head_name}
                          </td>
                          <td className="px-6 py-2.5 text-center text-slate-400 text-[11px] w-[10%] font-bold">
                            {HL}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </ListPageLayout>
  )
}
