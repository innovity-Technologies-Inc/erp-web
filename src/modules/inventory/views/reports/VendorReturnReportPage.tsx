import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useVendorReturnReportDatatable } from '../../hooks/useReports'
import { useVendorSelect2 } from '../../hooks/useSuppliers'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { returnReportOptions, reportCategoryTabs } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import type { VendorReturnReportListItem } from '../../api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const VendorReturnReportPage = () => {
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

  const { data: suppliersResponse } = useVendorSelect2()
  
  const supplierOptions = useMemo(() => {
    const rawData = suppliersResponse as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    return data.map((c: any) => ({ value: c.id.toString(), label: c.supplier_name || c.text || c.name }))
  }, [suppliersResponse])

  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    purchase_id: true,
    supplier_name: true,
    date: true,
    ret_qty: true,
    net_total_amount: true,
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

  const { data: reportData, isFetching: isLoading } = useVendorReturnReportDatatable(params)

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => ({
      ret_qty: acc.ret_qty + (parseFloat(String(item.ret_qty).replace(/,/g, '')) || 0),
      net_total_amount: acc.net_total_amount + (parseFloat(String(item.net_total_amount).replace(/,/g, '')) || 0),
    }), { ret_qty: 0, net_total_amount: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      supplier_name: 'Total:',
      ret_qty: totals.ret_qty.toString(),
      net_total_amount: totals.net_total_amount.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<VendorReturnReportListItem>[]>(() => [
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
      headerName: 'INVOICE NO', 
      field: 'purchase_id',
      minWidth: 150,
      flex: 1,
      hide: !visibleCols.purchase_id,
      cellClass: 'text-center flex items-center justify-center font-bold text-[#1e4ba1]'
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
      headerName: 'DATE', 
      field: 'date',
      minWidth: 120,
      flex: 1,
      hide: !visibleCols.date,
      cellClass: 'text-center flex items-center justify-center font-medium text-[#475569]',
      valueFormatter: (params: any) => params.value ? formatDate(params.value) : ''
    },
    { 
      headerName: 'RETURN QTY', 
      field: 'ret_qty',
      minWidth: 120,
      flex: 1,
      hide: !visibleCols.ret_qty,
      cellClass: (params) => `font-black flex items-center justify-center ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#1e4ba1]'}`,
      valueFormatter: (params: any) => params.value ? parseFloat(params.value).toLocaleString() : '0'
    },
    { 
      headerName: 'TOTAL AMOUNT', 
      field: 'net_total_amount',
      minWidth: 150,
      flex: 1,
      hide: !visibleCols.net_total_amount,
      cellClass: (params) => `font-bold flex items-center justify-end pr-8 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#1e4ba1]'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Invoice No', field: 'purchase_id', visible: visibleCols.purchase_id },
    { name: 'Vendor Name', field: 'supplier_name', visible: visibleCols.supplier_name },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Return Qty', field: 'ret_qty', visible: visibleCols.ret_qty },
    { name: 'Total Amount', field: 'net_total_amount', visible: visibleCols.net_total_amount },
  ]

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.get('/inventory/reports/supplier-return-export', {
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
      const response = await apiClient.get('/inventory/reports/supplier-return-export', {
        params: { report_type: 'excel', supplier_id: supplierId, fromDate, toDate },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `vendor_return_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
        <div className="w-[200px]">
            <Select2
                options={supplierOptions}
                value={supplierId}
                onChange={(val) => { setSupplierId(val as string); setCurrentPage(1) }}
                rounded="full"
                variant="solid"
                placeholder="Select Vendor"
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

  const tabs = reportCategoryTabs.map(t => ({ ...t, active: t.name === 'Return' }))

  return (
    <ListPageLayout<VendorReturnReportListItem>
      title="Vendor Return Report"
      titleOptions={returnReportOptions}
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
