import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Mail, Loader2 } from 'lucide-react'
import { useMerchantSalesDatatable } from '../../hooks/useReports'
import { useMerchants } from '../../hooks/useSales'
import type { ColDef } from 'ag-grid-community'
import type { MerchantSalesListItem } from '../../api/reports.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import { TabDropdown } from './components/TabDropdown'
import { Link } from '@tanstack/react-router'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { MailPreviewModal } from './components/MailPreviewModal'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'

const salesReportOptions = [
  { name: 'Todays Sales', to: '/inventory/report/sales' as any },
  { name: 'Merchant wise Sales', to: '/inventory/report/merchant-wise-sales' as any },
  { name: 'User wise Sales', to: '/inventory/report/user-wise-sales' as any },
  { name: 'Product wise Sales', to: '/inventory/report/product-wise-sales' as any },
  { name: 'Category wise Sales', to: '/inventory/report/category-wise-sales' as any },
]

export const MerchantWiseSalesReportPage = () => {
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
  const [isMailModalOpen, setIsMailModalOpen] = useState(false)
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false)
  const [isSendingMail, setIsSendingMail] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    invoice: true,
    merchant: true,
    total: true,
    discount: true,
    payable: true,
    paid: true,
    due: true,
    paymentType: true
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    customer_id: merchantId,
    fromDate: fromDate,
    toDate: toDate
  }), [merchantId, fromDate, toDate, currentPage, pageSize])

  const { data: reportData, isFetching: isLoading } = useMerchantSalesDatatable(params)
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
      const response = await apiClient.get('/inventory/reports/sales-export', {
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
      link.setAttribute('download', `merchant_sales_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      const response = await apiClient.get('/inventory/reports/sales-export', {
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

  const handleMailClick = async () => {
    if (!merchantId) {
      showNotificationModal('Error!', 'Please select a Merchant first!', 'error')
      return
    }

    setIsPreviewLoading(true)
    setIsMailModalOpen(true)
    try {
      const response = await apiClient.get('/inventory/reports/sales-mail-preview', {
        params: {
          report_type: 'pdf',
          customer_id: merchantId,
          fromDate: fromDate,
          toDate: toDate,
          is_summary_show: 0
        },
        responseType: 'blob'
      })

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(pdfBlob)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Failed to load mail preview:', error)
      showNotificationModal('Error!', 'Failed to load report preview.', 'error')
      setIsMailModalOpen(false)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleConfirmSendMail = async () => {
    setIsSendingMail(true)
    try {
      const response = await apiClient.post('/inventory/reports/sales-mail', {
        customer_id: merchantId,
        fromDate: fromDate,
        toDate: toDate,
        is_summary_show: 0
      })

      if (response.data.status === 'success') {
        setIsMailModalOpen(false)
        showNotificationModal('Success!', 'Report has been sent to merchant email.', 'success')
      }
    } catch (error: any) {
      showNotificationModal('Error!', error.response?.data?.message || 'Failed to send email.', 'error')
    } finally {
      setIsSendingMail(false)
    }
  }

  const handleCancelPreview = () => {
    setIsConfirmCancelOpen(true)
  }

  const handleConfirmCancel = () => {
    setIsConfirmCancelOpen(false)
    setIsMailModalOpen(false)
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => ({
      total: acc.total + (parseFloat(item.total_amount?.toString().replace(/,/g, '') || '0') || 0),
      discount: acc.discount + (parseFloat(item.total_discount?.toString().replace(/,/g, '') || '0') || 0),
      payable: acc.payable + (parseFloat(item.payable_amount?.toString().replace(/,/g, '') || '0') || 0),
      paid: acc.paid + (parseFloat(item.paid_amount?.toString().replace(/,/g, '') || '0') || 0),
      due: acc.due + (parseFloat(item.due_amount?.toString().replace(/,/g, '') || '0') || 0),
    }), { total: 0, discount: 0, payable: 0, paid: 0, due: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      customer_name: 'Total:',
      total_amount: totals.total.toString(),
      total_discount: totals.discount.toString(),
      payable_amount: totals.payable.toString(),
      paid_amount: totals.paid.toString(),
      due_amount: totals.due.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<MerchantSalesListItem>[]>(() => [
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
        return `font-medium flex items-center ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'total_amount',
      width: 140,
      flex: 1,
      hide: !visibleCols.total,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e293b] flex items-center justify-end pr-4',
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'TOTAL DISCOUNT',
      field: 'total_discount',
      width: 140,
      flex: 1,
      hide: !visibleCols.discount,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `flex items-center justify-end pr-4 ${isSum ? 'font-bold text-[#1e293b]' : 'font-medium text-[#475569]'}`
      },
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'PAYABLE AMOUNT',
      field: 'payable_amount',
      width: 150,
      flex: 1,
      hide: !visibleCols.payable,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e293b] flex items-center justify-end pr-4',
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'PAID AMOUNT',
      field: 'paid_amount',
      width: 140,
      flex: 1,
      hide: !visibleCols.paid,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-bold flex items-center justify-end pr-4 ${isSum ? 'text-[#1e293b]' : 'text-[#059669]'}`
      },
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'DUE AMOUNT',
      field: 'due_amount',
      width: 140,
      flex: 1,
      hide: !visibleCols.due,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-bold flex items-center justify-end pr-4 ${isSum ? 'text-[#1e293b]' : 'text-rose-600'}`
      },
      cellDataType: false,
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'PAYMENT TYPE',
      field: 'payment_type',
      width: 140,
      flex: 1,
      hide: !visibleCols.paymentType,
      cellClass: 'flex items-center justify-center',
      cellRenderer: (params: any) => {
        if ((params.data as any)?.isSummary) return null
        const type = params.value?.toLowerCase()
        let badgeClass = 'bg-gray-100 text-gray-600'
        if (type === 'cash') badgeClass = 'bg-[#dcfce7] text-[#166534]'
        if (type === 'bank') badgeClass = 'bg-[#f0f9ff] text-[#0369a1]'
        if (type === 'mfs') badgeClass = 'bg-[#fefce8] text-[#854d0e]'
        
        return (
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
            {params.value}
          </span>
        )
      }
    },
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Sales Date', field: 'date', visible: visibleCols.date },
    { name: 'Invoice No', field: 'invoice', visible: visibleCols.invoice },
    { name: 'Merchant Name', field: 'merchant', visible: visibleCols.merchant },
    { name: 'Total Amount', field: 'total', visible: visibleCols.total },
    { name: 'Total Discount', field: 'discount', visible: visibleCols.discount },
    { name: 'Payable Amount', field: 'payable', visible: visibleCols.payable },
    { name: 'Paid Amount', field: 'paid', visible: visibleCols.paid },
    { name: 'Due Amount', field: 'due', visible: visibleCols.due },
    { name: 'Payment Type', field: 'paymentType', visible: visibleCols.paymentType },
  ]

  const totalPages = Math.ceil((reportData?.recordsFiltered ?? 0) / pageSize)

  const headerRight = (
    <div className="flex items-center gap-3">
      <TabDropdown label="Merchant wise Sales" options={salesReportOptions} active={true} />
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

      <button 
        onClick={handleMailClick}
        className="bg-[#f1f5f9] border border-gray-200 px-4 py-2 rounded-full text-[11px] font-bold text-[#64748b] h-9 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors group shrink-0"
      >
        <Mail className="h-4 w-4 text-[#64748b] group-hover:text-blue-600 transition-colors" strokeWidth={2.5} />
        MAIL
      </button>
    </div>
  )

  return (
    <>
      <ListPageLayout<MerchantSalesListItem>
        title="Merchant Wise Sales Report"
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

      <MailPreviewModal 
        isOpen={isMailModalOpen}
        onClose={handleCancelPreview}
        onConfirm={handleConfirmSendMail}
        previewUrl={previewUrl}
        isLoading={isPreviewLoading}
        isSending={isSendingMail}
      />

      <ConfirmationModal 
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel?"
        message="Are you sure you want to cancel?"
        confirmText="Yes, Cancel!"
        cancelText="No, Stay"
        variant="danger"
      />
    </>
  )
}
