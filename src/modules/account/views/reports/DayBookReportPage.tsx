import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useDayBookReportDatatable } from '@/modules/account/hooks/useReports'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { cashReportOptions } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import type { DayBookReportListItem } from '@/modules/account/api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const DayBookReportPage = () => {
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
    v_no: true,
    v_date: true,
    head_name: true,
    ledger_comment: true,
    name: true,
    debit: true,
    credit: true,
    reverse_head: true,
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

  const { data: reportData, isFetching: isLoading } = useDayBookReportDatatable(params)

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc: any, item: any) => ({
      debit: acc.debit + (parseFloat(String(item.debit).replace(/,/g, '')) || 0),
      credit: acc.credit + (parseFloat(String(item.credit).replace(/,/g, '')) || 0),
    }), { debit: 0, credit: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      ledger_comment: 'Total:',
      debit: totals.debit.toString(),
      credit: totals.credit.toString(),
      reverse_head: '',
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<DayBookReportListItem>[]>(() => [
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
      headerName: 'VNO', 
      field: 'v_no',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.v_no,
      cellClass: 'text-center flex items-center justify-center text-gray-600 font-bold'
    },
    { 
      headerName: 'DATE', 
      field: 'v_date',
      minWidth: 110,
      flex: 1,
      hide: !visibleCols.v_date,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-medium flex items-center ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    { 
      headerName: 'ACCOUNT NAME', 
      field: 'head_name',
      minWidth: 160,
      flex: 1.8,
      hide: !visibleCols.head_name,
      cellClass: 'flex items-center text-gray-600 font-medium'
    },
    { 
      headerName: 'LEDGER COMMENT', 
      field: 'ledger_comment',
      minWidth: 200,
      flex: 2,
      hide: !visibleCols.ledger_comment,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `flex items-center text-gray-500 font-medium ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : ''}`
      }
    },
    { 
      headerName: 'SUB TYPE', 
      field: 'name',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.name,
      cellClass: 'flex items-center text-gray-500 font-medium'
    },
    { 
      headerName: 'DEBIT', 
      field: 'debit',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.debit,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-emerald-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'CREDIT', 
      field: 'credit',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.credit,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-rose-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'REVERSE ACCOUNT NAME', 
      field: 'reverse_head',
      minWidth: 180,
      flex: 1.8,
      hide: !visibleCols.reverse_head,
      cellClass: 'flex items-center text-gray-600 font-medium'
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'VNo', field: 'v_no', visible: visibleCols.v_no },
    { name: 'Date', field: 'v_date', visible: visibleCols.v_date },
    { name: 'Account Name', field: 'head_name', visible: visibleCols.head_name },
    { name: 'Ledger Comment', field: 'ledger_comment', visible: visibleCols.ledger_comment },
    { name: 'Sub Type', field: 'name', visible: visibleCols.name },
    { name: 'Debit', field: 'debit', visible: visibleCols.debit },
    { name: 'Credit', field: 'credit', visible: visibleCols.credit },
    { name: 'Reverse Account Name', field: 'reverse_head', visible: visibleCols.reverse_head },
  ]

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/day-book-export', {
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
      const response = await apiClient.post('/account/report/day-book-export', {
        report_type: 'excel',
        fromDate,
        toDate,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `day_book_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
    <ListPageLayout<DayBookReportListItem>
      title="Day Book Report"
      titleOptions={cashReportOptions}
      tabs={tabs}
      backTo="/"
      showSearch={true}
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
