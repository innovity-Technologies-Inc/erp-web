import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useInvoiceWiseDueDatatable } from '../../hooks/useReports'
import { useMerchants } from '../../hooks/useSales'
import type { ColDef } from 'ag-grid-community'
import type { InvoiceWiseDueListItem } from '../../api/reports.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'


import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { salesReportOptions, reportCategoryTabs } from './constants'
import { apiClient } from '@/api/client'

export const InvoiceWiseDueReportPage = () => {
  const [merchantId, setMerchantId] = useState('')
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}-01`
  })
  const [toDate, setToDate] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    invoice: true,
    merchant: true,
    total: true,
    paid: true,
    due: true,
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    customer_id: merchantId,
    fromDate: fromDate,
    toDate: toDate
  }), [merchantId, fromDate, toDate, currentPage, pageSize])

  const { data: reportData, isFetching: isLoading } = useInvoiceWiseDueDatatable(params)
  const { data: merchantsData } = useMerchants()

  const merchantOptions = useMemo(() => {
    return (merchantsData?.data || []).map((m: any) => ({
      label: m.customer_name,
      value: m.id.toString()
    }))
  }, [merchantsData])

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExcelExport = async () => {
    setIsExportingExcel(true)
    try {
      const response = await apiClient.get('/inventory/reports/invoice-wise-due-export', {
        params: {
          report_type: 'excel',
          customer_id: merchantId,
          fromDate: fromDate,
          toDate: toDate
        },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice_wise_due_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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

  const handlePdfExport = async () => {
    setIsExportingPdf(true)
    try {
      const response = await apiClient.get('/inventory/reports/invoice-wise-due-export', {
        params: {
          report_type: 'pdf',
          customer_id: merchantId,
          fromDate: fromDate,
          toDate: toDate
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

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => ({
      total: acc.total + (parseFloat(item.total_amount?.toString().replace(/[^0-9.-]+/g, '') || '0') || 0),
      paid: acc.paid + (parseFloat(item.paid_amount?.toString().replace(/[^0-9.-]+/g, '') || '0') || 0),
      due: acc.due + (parseFloat(item.due_amount?.toString().replace(/[^0-9.-]+/g, '') || '0') || 0),
    }), { total: 0, paid: 0, due: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      customer_name: 'Total:',
      total_amount: totals.total.toString(),
      paid_amount: totals.paid.toString(),
      due_amount: totals.due.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<InvoiceWiseDueListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        if ((params.data as any)?.isSummary) return ''
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 80,
      flex: 0,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    {
      headerName: 'SALES DATE',
      field: 'date',
      width: 130,
      flex: 1,
      hide: !visibleCols.date,
      cellClass: 'text-[#475569] font-medium flex items-center',
    },
    {
      headerName: 'INVOICE NO',
      field: 'invoice_id',
      width: 130,
      flex: 1,
      hide: !visibleCols.invoice,
      cellClass: 'text-[#1e4ba1] font-bold flex items-center',
      cellRenderer: (params: any) => (
        (params.data as any)?.isSummary ? null : <span>#{params.value}</span>
      )
    },
    {
      headerName: 'MERCHANT NAME',
      field: 'customer_name',
      flex: 2,
      minWidth: 200,
      hide: !visibleCols.merchant,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-medium flex items-center ${isSum ? 'justify-end pr-6 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'total_amount',
      width: 150,
      flex: 1,
      hide: !visibleCols.total,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e293b] flex items-center justify-end pr-4',
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'PAID AMOUNT',
      field: 'paid_amount',
      width: 150,
      flex: 1,
      hide: !visibleCols.paid,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `flex items-center justify-end pr-4 ${isSum ? 'font-bold text-[#1e293b]' : 'font-medium text-[#059669]'}`
      },
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'DUE AMOUNT',
      field: 'due_amount',
      width: 150,
      flex: 1,
      hide: !visibleCols.due,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `flex items-center justify-end pr-4 ${isSum ? 'font-bold text-[#1e293b]' : 'font-medium text-rose-600'}`
      },
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Sales Date', field: 'date', visible: visibleCols.date },
    { name: 'Invoice No', field: 'invoice', visible: visibleCols.invoice },
    { name: 'Merchant Name', field: 'merchant', visible: visibleCols.merchant },
    { name: 'Total Amount', field: 'total', visible: visibleCols.total },
    { name: 'Paid Amount', field: 'paid', visible: visibleCols.paid },
    { name: 'Due Amount', field: 'due', visible: visibleCols.due },
  ]

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

  return (
    <ListPageLayout<InvoiceWiseDueListItem>
      title="Invoice Wise Due Report"
      backTo="/"
      titleOptions={salesReportOptions}
      tabs={reportCategoryTabs}
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
      toolbarExtra={
        <div className="flex-1 min-w-[300px]">
          <Select2
            options={[
              { value: '', label: 'Select Merchant' },
              ...merchantOptions
            ]}
            value={merchantId}
            onChange={(val) => { setMerchantId(val as string); setCurrentPage(1) }}
            rounded="full"
            variant="solid"
            placeholder="Select Merchant"
          />
        </div>
      }
      toolbarRightExtra={toolbarRight}
    />
  )
}
