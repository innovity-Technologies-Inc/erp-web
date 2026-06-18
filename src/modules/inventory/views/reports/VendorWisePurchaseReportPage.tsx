import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useVendorWisePurchaseDatatable } from '../../hooks/useReports'
import { useVendorSelect2 } from '../../hooks/useSuppliers'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { purchaseReportOptions, reportCategoryTabs } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import type { VendorWisePurchaseListItem } from '../../api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const VendorWisePurchaseReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [toDate, setToDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { showNotificationModal } = useUiStore()

  // Filters
  const [supplierId, setSupplierId] = useState<string>('')

  const { data: vendorsResponse } = useVendorSelect2()
  
  const vendorOptions = useMemo(() => {
    const rawData = vendorsResponse as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    return data.map((v: any) => ({ value: v.id.toString(), label: v.supplier_name || v.text || v.name }))
  }, [vendorsResponse])

  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    purchase_date: true,
    purchase_id: true,
    chalan_no: true,
    supplier_name: true,
    total_amount: true,
    paid_amount: true,
    due_amount: true,
    payment_type: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const params = useMemo(() => ({
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    supplier_id: supplierId,
    fromDate,
    toDate,
  }), [currentPage, pageSize, supplierId, fromDate, toDate])

  const { data: reportData, isFetching: isLoading } = useVendorWisePurchaseDatatable(params)

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => ({
      total_amount: acc.total_amount + (parseFloat(String(item.total_amount).replace(/,/g, '')) || 0),
      paid_amount: acc.paid_amount + (parseFloat(String(item.paid_amount).replace(/,/g, '')) || 0),
      due_amount: acc.due_amount + (parseFloat(String(item.due_amount).replace(/,/g, '')) || 0),
    }), { total_amount: 0, paid_amount: 0, due_amount: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      supplier_name: 'Total:',
      total_amount: totals.total_amount.toString(),
      paid_amount: totals.paid_amount.toString(),
      due_amount: totals.due_amount.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<VendorWisePurchaseListItem>[]>(() => [
    { 
      headerName: 'SL', 
      valueGetter: (params: any) => {
        if ((params.data as any)?.isSummary) return ''
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 70,
      flex: 0,
      pinned: 'left' as const,
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    { 
      headerName: 'DATE', 
      field: 'purchase_date',
      minWidth: 120,
      flex: 1,
      hide: !visibleCols.purchase_date,
      cellClass: 'text-center flex items-center justify-center font-medium text-[#475569]',
      valueFormatter: (params: any) => params.value ? formatDate(params.value) : ''
    },
    { 
      headerName: 'INVOICE NO', 
      field: 'purchase_id',
      minWidth: 130,
      flex: 1,
      hide: !visibleCols.purchase_id,
      cellClass: 'text-center flex items-center justify-center font-bold text-[#1e4ba1]'
    },
    { 
      headerName: 'CHALAN NO', 
      field: 'chalan_no',
      minWidth: 130,
      flex: 1,
      hide: !visibleCols.chalan_no,
      cellClass: 'text-center flex items-center justify-center text-gray-500 font-medium'
    },
    { 
      headerName: 'VENDOR NAME', 
      field: 'supplier_name',
      minWidth: 200,
      flex: 2,
      hide: !visibleCols.supplier_name,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-medium flex items-center ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569] px-4'}`
      },
    },
    { 
      headerName: 'TOTAL AMOUNT', 
      field: 'total_amount',
      minWidth: 140,
      flex: 1,
      hide: !visibleCols.total_amount,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#475569]'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    },
    { 
      headerName: 'PAID AMOUNT', 
      field: 'paid_amount',
      minWidth: 140,
      flex: 1,
      hide: !visibleCols.paid_amount,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-emerald-600'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    },
    { 
      headerName: 'DUE AMOUNT', 
      field: 'due_amount',
      minWidth: 140,
      flex: 1,
      hide: !visibleCols.due_amount,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-rose-600'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    },
    { 
      headerName: 'PAYMENT TYPE', 
      field: 'payment_type',
      minWidth: 130,
      flex: 1,
      hide: !visibleCols.payment_type,
      cellClass: 'text-center flex items-center justify-center font-bold text-[#1e4ba1]'
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Date', field: 'purchase_date', visible: visibleCols.purchase_date },
    { name: 'Invoice No', field: 'purchase_id', visible: visibleCols.purchase_id },
    { name: 'Chalan No', field: 'chalan_no', visible: visibleCols.chalan_no },
    { name: 'Vendor Name', field: 'supplier_name', visible: visibleCols.supplier_name },
    { name: 'Total Amount', field: 'total_amount', visible: visibleCols.total_amount },
    { name: 'Paid Amount', field: 'paid_amount', visible: visibleCols.paid_amount },
    { name: 'Due Amount', field: 'due_amount', visible: visibleCols.due_amount },
    { name: 'Payment Type', field: 'payment_type', visible: visibleCols.payment_type },
  ]

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.get('/inventory/reports/purchase-report-export', {
        params: { report_type: 'pdf', supplier_id: supplierId, fromDate, toDate },
        responseType: 'blob'
      })
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
      const response = await apiClient.get('/inventory/reports/purchase-report-export', {
        params: { report_type: 'excel', supplier_id: supplierId, fromDate, toDate },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `purchase_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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

  const toolbarLeft = (
    <div className="flex items-center gap-3">
        <div className="w-[250px]">
            <Select2
                options={vendorOptions}
                value={supplierId}
                onChange={(val) => { setSupplierId(val as string); setCurrentPage(1) }}
                rounded="full"
                variant="solid"
                placeholder="All Vendors"
                isClearable
            />
        </div>
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

  const tabs = reportCategoryTabs.map(t => ({ ...t, active: t.name === 'Purchase' }))

  return (
    <ListPageLayout<VendorWisePurchaseListItem>
      title="Vendor Wise Purchase Report"
      titleOptions={purchaseReportOptions}
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
      toolbarExtra={toolbarLeft}
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
