import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useTrialBalanceReportDatatable } from '@/modules/account/hooks/useReports'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { cashReportOptions } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import type { TrialBalanceReportListItem } from '@/modules/account/api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const TrialBalanceReportPage = () => {
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { showNotificationModal } = useUiStore()
  const [searchTerm, setSearchTerm] = useState('')

  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    HeadCode: true,
    HeadName: true,
    opening_balance_debit: true,
    opening_balance_credit: true,
    transational_balance_debit: true,
    transational_balance_credit: true,
    closing_balance_debit: true,
    closing_balance_credit: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const params = useMemo(() => ({
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    fromDate,
    toDate,
    search: { value: searchTerm, regex: false },
  }), [currentPage, pageSize, fromDate, toDate, searchTerm])

  const { data: reportData, isFetching: isLoading } = useTrialBalanceReportDatatable(params)

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc: any, item: any) => ({
      opening_balance_debit: acc.opening_balance_debit + (parseFloat(String(item.opening_balance_debit).replace(/,/g, '')) || 0),
      opening_balance_credit: acc.opening_balance_credit + (parseFloat(String(item.opening_balance_credit).replace(/,/g, '')) || 0),
      transational_balance_debit: acc.transational_balance_debit + (parseFloat(String(item.transational_balance_debit).replace(/,/g, '')) || 0),
      transational_balance_credit: acc.transational_balance_credit + (parseFloat(String(item.transational_balance_credit).replace(/,/g, '')) || 0),
      closing_balance_debit: acc.closing_balance_debit + (parseFloat(String(item.closing_balance_debit).replace(/,/g, '')) || 0),
      closing_balance_credit: acc.closing_balance_credit + (parseFloat(String(item.closing_balance_credit).replace(/,/g, '')) || 0),
    }), {
      opening_balance_debit: 0,
      opening_balance_credit: 0,
      transational_balance_debit: 0,
      transational_balance_credit: 0,
      closing_balance_debit: 0,
      closing_balance_credit: 0
    })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      HeadName: 'Total:',
      opening_balance_debit: totals.opening_balance_debit.toString(),
      opening_balance_credit: totals.opening_balance_credit.toString(),
      transational_balance_debit: totals.transational_balance_debit.toString(),
      transational_balance_credit: totals.transational_balance_credit.toString(),
      closing_balance_debit: totals.closing_balance_debit.toString(),
      closing_balance_credit: totals.closing_balance_credit.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<TrialBalanceReportListItem>[]>(() => [
    { 
      headerName: 'SL', 
      valueGetter: (params: any) => {
        if ((params.data as any)?.isSummary) return ''
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 60,
      flex: 0,
      pinned: 'left' as const,
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    { 
      headerName: 'CODE', 
      field: 'HeadCode',
      minWidth: 100,
      flex: 1,
      hide: !visibleCols.HeadCode,
      cellClass: 'text-center flex items-center justify-center text-gray-500 font-semibold'
    },
    { 
      headerName: 'ACCOUNT NAME', 
      field: 'HeadName',
      minWidth: 180,
      flex: 2,
      hide: !visibleCols.HeadName,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `flex items-center text-gray-600 font-bold ${isSum ? 'justify-end pr-4 text-[#1e293b]' : ''}`
      }
    },
    { 
      headerName: 'OPENING DEBIT', 
      field: 'opening_balance_debit',
      minWidth: 130,
      flex: 1.3,
      hide: !visibleCols.opening_balance_debit,
      cellClass: (params) => `font-medium flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b] font-bold' : 'text-gray-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'OPENING CREDIT', 
      field: 'opening_balance_credit',
      minWidth: 130,
      flex: 1.3,
      hide: !visibleCols.opening_balance_credit,
      cellClass: (params) => `font-medium flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b] font-bold' : 'text-gray-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'TRANS. DEBIT', 
      field: 'transational_balance_debit',
      minWidth: 130,
      flex: 1.3,
      hide: !visibleCols.transational_balance_debit,
      cellClass: (params) => `font-medium flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b] font-bold' : 'text-gray-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'TRANS. CREDIT', 
      field: 'transational_balance_credit',
      minWidth: 130,
      flex: 1.3,
      hide: !visibleCols.transational_balance_credit,
      cellClass: (params) => `font-medium flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b] font-bold' : 'text-gray-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'CLOSING DEBIT', 
      field: 'closing_balance_debit',
      minWidth: 130,
      flex: 1.3,
      hide: !visibleCols.closing_balance_debit,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-emerald-600'} bg-[#f0fdf4]/10`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'CLOSING CREDIT', 
      field: 'closing_balance_credit',
      minWidth: 130,
      flex: 1.3,
      hide: !visibleCols.closing_balance_credit,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-rose-600'} bg-[#fdf2f2]/10`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Code', field: 'HeadCode', visible: visibleCols.HeadCode },
    { name: 'Account Name', field: 'HeadName', visible: visibleCols.HeadName },
    { name: 'Opening Debit', field: 'opening_balance_debit', visible: visibleCols.opening_balance_debit },
    { name: 'Opening Credit', field: 'opening_balance_credit', visible: visibleCols.opening_balance_credit },
    { name: 'Trans. Debit', field: 'transational_balance_debit', visible: visibleCols.transational_balance_debit },
    { name: 'Trans. Credit', field: 'transational_balance_credit', visible: visibleCols.transational_balance_credit },
    { name: 'Closing Debit', field: 'closing_balance_debit', visible: visibleCols.closing_balance_debit },
    { name: 'Closing Credit', field: 'closing_balance_credit', visible: visibleCols.closing_balance_credit },
  ]

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/trial-balance-export', {
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
      const response = await apiClient.post('/account/report/trial-balance-export', {
        report_type: 'excel',
        fromDate,
        toDate,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `trial_balance_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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

  const totalPages = Math.ceil((reportData?.recordsFiltered ?? 0) / pageSize)

  const toolbarRight = (
    <div className="flex items-center gap-3">
      <DateRangePicker
        from={fromDate}
        to={toDate}
        onChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
      />

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
    <ListPageLayout<TrialBalanceReportListItem>
      title="Trial Balance Report"
      titleOptions={cashReportOptions}
      tabs={tabs}
      backTo="/"
      showSearch={true}
      searchWidth="max-w-[220px]"
      searchValue={searchTerm}
      onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
      showStatusFilter={false}
      showColumnFilter={false}
      columns={filterColumns}
      onColumnToggle={toggleColumn}
      rowData={gridData}
      columnDefs={columnDefs}
      isLoading={isLoading}
      recordsTotal={reportData?.recordsFiltered ?? 0}
      currentPage={currentPage}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      toolbarRightExtra={toolbarRight}
      gridOptions={{
        postSortRows: (params: any) => {
          const rowNodes = params.nodes;
          const summaryIndex = rowNodes.findIndex((node: any) => node.data?.isSummary);
          if (summaryIndex !== -1) {
            const summaryNode = rowNodes.splice(summaryIndex, 1)[0];
            rowNodes.push(summaryNode);
          }
        },
        getRowStyle: (params: any) => {
          if (params.data?.isSummary) {
            return { 
              backgroundColor: '#f8fafc',
              fontWeight: 'bold',
              borderTop: '2px solid #e2e8f0'
            }
          }
        }
      }}
    />
  )
}
