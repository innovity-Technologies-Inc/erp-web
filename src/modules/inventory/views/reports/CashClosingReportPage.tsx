import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useCashClosingReportDatatable } from '../../hooks/useReports'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { cashReportOptions, reportCategoryTabs } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import type { CashClosingReportListItem } from '../../api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const CashClosingReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  const [fromDate, setFromDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { showNotificationModal } = useUiStore()

  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    date: true,
    amount_in: true,
    amount_out: true,
    cash_in_hand: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const { data: reportData, isLoading } = useCashClosingReportDatatable({
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    fromDate,
    toDate,
  })

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => ({
      amount_in: acc.amount_in + (parseFloat(String(item.amount_in).replace(/,/g, '')) || 0),
      amount_out: acc.amount_out + (parseFloat(String(item.amount_out).replace(/,/g, '')) || 0),
      cash_in_hand: acc.cash_in_hand + (parseFloat(String(item.cash_in_hand).replace(/,/g, '')) || 0),
    }), { amount_in: 0, amount_out: 0, cash_in_hand: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      date: 'Total:',
      amount_in: totals.amount_in.toString(),
      amount_out: totals.amount_out.toString(),
      cash_in_hand: totals.cash_in_hand.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<CashClosingReportListItem>[]>(() => [
    { 
      headerName: 'SL', 
      valueGetter: (params: any) => {
        if ((params.data as any)?.isSummary) return ''
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 80,
      flex: 0,
      pinned: 'left' as const,
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    { 
      headerName: 'SALES DATE', 
      field: 'date',
      minWidth: 150,
      flex: 1,
      hide: !visibleCols.date,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-medium flex items-center ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    { 
      headerName: 'CASH IN', 
      field: 'amount_in',
      minWidth: 150,
      flex: 1,
      hide: !visibleCols.amount_in,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-bold flex items-center justify-end pr-4 ${isSum ? 'text-[#1e293b]' : 'text-emerald-600'}`
      },
      cellDataType: false,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'CASH OUT', 
      field: 'amount_out',
      minWidth: 150,
      flex: 1,
      hide: !visibleCols.amount_out,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-bold flex items-center justify-end pr-4 ${isSum ? 'text-[#1e293b]' : 'text-rose-600'}`
      },
      cellDataType: false,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'BALANCE', 
      field: 'cash_in_hand',
      minWidth: 150,
      flex: 1,
      hide: !visibleCols.cash_in_hand,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-black flex items-center justify-end pr-4 ${isSum ? 'text-[#1e293b]' : 'text-[#1e4ba1]'}`
      },
      cellDataType: false,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Sales Date', field: 'date', visible: visibleCols.date },
    { name: 'Cash In', field: 'amount_in', visible: visibleCols.amount_in },
    { name: 'Cash Out', field: 'amount_out', visible: visibleCols.amount_out },
    { name: 'Balance', field: 'cash_in_hand', visible: visibleCols.cash_in_hand },
  ]

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.get('/inventory/reports/cash-closing-report-export', {
        params: {
          report_type: 'pdf',
          fromDate,
          toDate
        },
        responseType: 'blob'
      })
      
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

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
      const response = await apiClient.get('/inventory/reports/cash-closing-report-export', {
        params: {
          report_type: 'excel',
          fromDate,
          toDate
        },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cash_closing_report_${fromDate}_to_${toDate}.xlsx`)
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
        disabled={isExportingPdf}
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
        disabled={isExportingExcel}
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

  const tabs = reportCategoryTabs.map(t => ({ ...t, active: t.name === 'Cash' }))

  return (
    <ListPageLayout<CashClosingReportListItem>
      title="Cash Closing Report"
      titleOptions={cashReportOptions}
      tabs={tabs}
      backTo="/"
      showSearch={false}
      showStatusFilter={false}
      showColumnFilter={true}
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
      toolbarRightExtra={toolbarRight}
    />
  )
}
