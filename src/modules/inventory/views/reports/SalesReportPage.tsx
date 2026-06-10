import { useMemo, useState } from 'react'
import { FileText, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useTodaysSalesDatatable } from '../../hooks/useReports'
import { useMerchants } from '../../hooks/useSales'
import type { ColDef } from 'ag-grid-community'
import type { TodaySalesListItem } from '../../api/reports.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import { exportToExcel } from '@/utils/exportUtils'
import { TabDropdown } from './components/TabDropdown'
import { Link } from '@tanstack/react-router'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { clsx } from 'clsx'

import { apiClient } from '@/api/client'

const salesReportOptions = [
  { name: 'Todays Sales', to: '/inventory/report/sales' },
  { name: 'Merchant wise Sales', to: '/inventory/report/merchant-wise-sales' },
  { name: 'User wise Sales', to: '/inventory/report/user-wise-sales' },
  { name: 'Product wise Sales', to: '/inventory/report/product-wise-sales' },
  { name: 'Category wise Sales', to: '/inventory/report/category-wise-sales' },
]

export const SalesReportPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const { currency, currencyPosition } = useSettings()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    invoice: true,
    merchant: true,
    total: true,
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    customer_id: merchantId,
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, merchantId, fromDate, toDate, currentPage, pageSize])

  const { data: reportData, isLoading } = useTodaysSalesDatatable(params)
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
      const response = await apiClient.get('/inventory/reports/todays-sales-export', {
        params: {
          report_type: 'excel',
          customer_id: merchantId,
          start_date: fromDate,
          end_date: toDate
        },
        responseType: 'blob' // Important: this tells axios to handle binary data
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `todays_sales_report_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export Excel:', error)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handlePdfExport = async () => {
    setIsExportingPdf(true)
    try {
      const response = await apiClient.get('/inventory/reports/todays-sales-export', {
        params: {
          report_type: 'pdf',
          customer_id: merchantId,
          start_date: fromDate,
          end_date: toDate
        },
        responseType: 'blob' // Important: this tells axios to handle binary data
      })
      
      // Create a Blob with explicit PDF MIME type
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(pdfBlob)
      
      // Open the PDF in a new tab instead of forcing download
      window.open(url, '_blank')
      
      // Clean up the URL object after a short delay to ensure the new tab loads it
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

    } catch (error) {
      console.error('Failed to export PDF:', error)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const columnDefs = useMemo<ColDef<TodaySalesListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        if (params.data?.isSummary) return ''
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 80,
      flex: 0,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: (params) => clsx(
        'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
        params.data?.isSummary && 'border-none'
      ),
    },
    {
      headerName: 'SALES DATE',
      field: 'date',
      width: 150,
      flex: 1,
      hide: !visibleCols.date,
      cellClass: 'text-[#475569] font-medium flex items-center',
    },
    {
      headerName: 'INVOICE NO',
      field: 'invoice_id',
      width: 150,
      flex: 1,
      hide: !visibleCols.invoice,
      cellClass: 'text-[#1e4ba1] font-bold flex items-center',
      cellRenderer: (params: any) => (
        params.data?.isSummary ? null : <span>#{params.value}</span>
      )
    },
    {
      headerName: 'MERCHANT NAME',
      field: 'customer_name',
      flex: 2,
      hide: !visibleCols.merchant,
      cellClass: (params) => clsx(
        'font-medium flex items-center',
        params.data?.isSummary ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569]'
      ),
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'total_amount',
      width: 150,
      flex: 1,
      hide: !visibleCols.total,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e293b] flex items-center justify-end',
      valueFormatter: (params) => {
        const val = typeof params.value === 'string' ? params.value.replace(/,/g, '') : params.value
        return formatCurrency(val, currency, currencyPosition)
      }
    },
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Sales Date', field: 'date', visible: visibleCols.date },
    { name: 'Invoice No', field: 'invoice', visible: visibleCols.invoice },
    { name: 'Merchant Name', field: 'merchant', visible: visibleCols.merchant },
    { name: 'Total Amount', field: 'total', visible: visibleCols.total },
  ]

  const totalPages = Math.ceil((reportData?.recordsFiltered ?? 0) / pageSize)

  // Calculate total from the current page data
  const pageTotal = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((sum, item) => {
      const amountStr = typeof item.total_amount === 'string' 
        ? item.total_amount.replace(/,/g, '') 
        : item.total_amount
      return sum + (parseFloat(amountStr as string) || 0)
    }, 0)
  }, [reportData?.data])

  const summaryFooter = useMemo(() => {
    if (!reportData?.data?.length) return null
    return (
      <div className="flex w-full justify-between items-center text-[13px] text-[#1e293b] font-bold">
        <div className="flex-1"></div>
        <div className="flex-1"></div>
        <div className="flex-[2] text-right pr-4">Total:</div>
        <div className="flex-1 text-right">
          {formatCurrency(pageTotal, currency, currencyPosition)}
        </div>
      </div>
    )
  }, [pageTotal, reportData?.data?.length, currency, currencyPosition])

  const headerRight = (
    <div className="flex items-center gap-3">
      <TabDropdown label="Todays Sales" options={salesReportOptions} active={true} />
      <Link
        to="/inventory/report/due"
        className="px-4 py-2 text-[12px] font-medium rounded-lg bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm"
      >
        Due
      </Link>
      <Link
        to="/inventory/report/shipping-cost"
        className="px-4 py-2 text-[12px] font-medium rounded-lg bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm"
      >
        Shipping Cost
      </Link>
      <Link
        to="/inventory/report/sale-wise-profit"
        className="px-4 py-2 text-[12px] font-medium rounded-lg bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm"
      >
        Sale Wise Profit
      </Link>
    </div>
  )

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
    <ListPageLayout<TodaySalesListItem>
      title="Todays Sales Report"
      backTo="/"
      customHeaderRight={headerRight}
      showSearch={false}
      showStatusFilter={false}
      showColumnFilter={true}
      columns={filterColumns}
      onColumnToggle={toggleColumn}
      rowData={reportData?.data}
      columnDefs={columnDefs}
      isLoading={isLoading}
      recordsTotal={reportData?.recordsFiltered ?? 0}
      currentPage={currentPage}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      searchValue={searchTerm}
      onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
      summaryFooter={summaryFooter}
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
