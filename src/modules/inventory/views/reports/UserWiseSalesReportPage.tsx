import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useUserWiseSalesDatatable } from '../../hooks/useReports'
import { useUsers } from '@/hooks/useUsers'
import type { ColDef } from 'ag-grid-community'
import type { UserWiseSalesListItem } from '../../api/reports.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import { TabDropdown } from './components/TabDropdown'
import { Link } from '@tanstack/react-router'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'

const salesReportOptions = [
  { name: 'Todays Sales', to: '/inventory/report/sales' as any },
  { name: 'Merchant wise Sales', to: '/inventory/report/merchant-wise-sales' as any },
  { name: 'User wise Sales', to: '/inventory/report/user-wise-sales' as any },
  { name: 'Product wise Sales', to: '/inventory/report/product-wise-sales' as any },
  { name: 'Category wise Sales', to: '/inventory/report/category-wise-sales' as any },
]

export const UserWiseSalesReportPage = () => {
  const [userId, setUserId] = useState('')
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
    name: true,
    totalInvoice: true,
    amount: true,
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    user_id: userId,
    fromDate: fromDate,
    toDate: toDate
  }), [userId, fromDate, toDate, currentPage, pageSize])

  const { data: reportData, isFetching: isLoading } = useUserWiseSalesDatatable(params)
  const { data: usersResponse } = useUsers()

  const userOptions = useMemo(() => {
    return (usersResponse?.data || []).map((u: any) => ({
      label: u.name,
      value: u.id.toString()
    }))
  }, [usersResponse])

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExcelExport = async () => {
    setIsExportingExcel(true)
    try {
      const response = await apiClient.get('/inventory/reports/user-wise-sales-export', {
        params: {
          report_type: 'excel',
          user_id: userId,
          fromDate: fromDate,
          toDate: toDate
        },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `user_wise_sales_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      const response = await apiClient.get('/inventory/reports/user-wise-sales-export', {
        params: {
          report_type: 'pdf',
          user_id: userId,
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

  // Calculate totals from the current page data with robust parsing
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => {
      const invStr = String(item.total_invoice || '0').replace(/[^0-9.-]+/g, '')
      const amtStr = String(item.amount || '0').replace(/[^0-9.-]+/g, '')
      
      return {
        totalInvoice: acc.totalInvoice + (parseInt(invStr) || 0),
        amount: acc.amount + (parseFloat(amtStr) || 0),
      }
    }, { totalInvoice: 0, amount: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      name: 'Total:',
      total_invoice: String(totals.totalInvoice),
      amount: String(totals.amount),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<UserWiseSalesListItem>[]>(() => [
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
      headerName: 'USER NAME',
      field: 'name',
      flex: 2,
      minWidth: 200,
      hide: !visibleCols.name,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-medium flex items-center ${isSum ? 'justify-end pr-6 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    {
      headerName: 'TOTAL SALE',
      field: 'total_invoice',
      width: 150,
      flex: 1,
      hide: !visibleCols.totalInvoice,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `flex items-center justify-end pr-4 ${isSum ? 'font-bold text-[#1e293b]' : 'font-medium text-[#475569]'}`
      },
      // Ensure it renders as a plain number string even in summary row
      valueFormatter: (params) => {
        const val = String(params.value || '0').replace(/[^0-9.-]+/g, '')
        return isNaN(parseInt(val)) ? '0' : parseInt(val).toString()
      }
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'amount',
      width: 150,
      flex: 1,
      hide: !visibleCols.amount,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e293b] flex items-center justify-end pr-4',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'User Name', field: 'name', visible: visibleCols.name },
    { name: 'Total Sale', field: 'totalInvoice', visible: visibleCols.totalInvoice },
    { name: 'Total Amount', field: 'amount', visible: visibleCols.amount },
  ]

  const totalPages = Math.ceil((reportData?.recordsFiltered ?? 0) / pageSize)

  const headerRight = (
    <div className="flex items-center gap-3">
      <TabDropdown label="User wise Sales" options={salesReportOptions} active={true} />
      <Link
        to={"/inventory/report/due" as any}
        className="px-4 py-2 text-[12px] font-medium rounded-lg bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm"
      >
        Due
      </Link>
      <Link
        to={"/inventory/report/shipping-cost" as any}
        className="px-4 py-2 text-[12px] font-medium rounded-lg bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm"
      >
        Shipping Cost
      </Link>
      <Link
        to={"/inventory/report/sale-wise-profit" as any}
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
    <ListPageLayout<UserWiseSalesListItem>
      title="User Wise Sales Report"
      backTo="/"
      customHeaderRight={headerRight}
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
              { value: '', label: 'Select User' },
              ...userOptions
            ]}
            value={userId}
            onChange={(val) => { setUserId(val as string); setCurrentPage(1) }}
            rounded="full"
            variant="solid"
            placeholder="Select User"
          />
        </div>
      }
      toolbarRightExtra={toolbarRight}
    />
  )
}
