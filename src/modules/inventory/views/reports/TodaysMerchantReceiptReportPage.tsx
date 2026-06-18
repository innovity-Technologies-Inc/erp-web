import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useTodaysMerchantReceiptDatatable } from '../../hooks/useReports'
import { useMerchantSelect2 } from '../../hooks/useSelect2'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useUiStore } from '@/store/useUiStore'
import { merchantReportOptions, reportCategoryTabs } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import type { TodayMerchantReceiptListItem } from '../../api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const TodaysMerchantReceiptReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { showNotificationModal } = useUiStore()

  // Filters
  const [merchantId, setMerchantId] = useState<string>('')

  const { data: merchantsResponse } = useMerchantSelect2()
  
  const merchantOptions = useMemo(() => {
    const rawData = merchantsResponse as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    return data.map((c: any) => ({ value: c.id.toString(), label: c.customer_name || c.text || c.name }))
  }, [merchantsResponse])

  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    name: true,
    narration: true,
    credit: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const params = useMemo(() => ({
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    customer_id: merchantId,
    fromDate,
  }), [currentPage, pageSize, merchantId, fromDate])

  const { data: reportData, isFetching: isLoading } = useTodaysMerchantReceiptDatatable(params)

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => ({
      credit: acc.credit + (parseFloat(String(item.credit).replace(/,/g, '')) || 0),
    }), { credit: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      narration: 'Total:',
      credit: totals.credit.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<TodayMerchantReceiptListItem>[]>(() => [
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
      headerName: 'MERCHANT NAME', 
      field: 'name',
      minWidth: 250,
      flex: 2,
      hide: !visibleCols.name,
      cellClass: 'px-4 flex items-center font-bold text-[#1e4ba1]'
    },
    { 
      headerName: 'DESCRIPTION', 
      field: 'narration',
      minWidth: 300,
      flex: 3,
      hide: !visibleCols.narration,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `px-4 font-medium flex items-center ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    { 
      headerName: 'RECEIPT', 
      field: 'credit',
      minWidth: 150,
      flex: 1,
      hide: !visibleCols.credit,
      cellClass: (params) => `font-bold flex items-center justify-end pr-8 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#1e4ba1]'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Merchant Name', field: 'name', visible: visibleCols.name },
    { name: 'Description', field: 'narration', visible: visibleCols.narration },
    { name: 'Receipt', field: 'credit', visible: visibleCols.credit },
  ]

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.get('/inventory/reports/todays-customer-received-export', {
        params: { report_type: 'pdf', customer_id: merchantId, fromDate },
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
      const response = await apiClient.get('/inventory/reports/todays-customer-received-export', {
        params: { report_type: 'excel', customer_id: merchantId, fromDate },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `merchant_receipt_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
                options={merchantOptions}
                value={merchantId}
                onChange={(val) => { setMerchantId(val as string); setCurrentPage(1) }}
                rounded="full"
                variant="solid"
                placeholder="Select Merchant"
                isClearable
            />
        </div>
    </div>
  )

  const toolbarRight = (
    <div className="flex items-center gap-3">
      <input 
        type="date"
        value={fromDate}
        onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1) }}
        className="h-9 px-4 bg-[#f1f5f9] border border-gray-200 rounded-full text-[12px] font-medium text-[#64748b] outline-none focus:ring-1 focus:ring-primary/30 transition-all"
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

  const tabs = reportCategoryTabs.map(t => ({ ...t, active: t.name === 'Merchant' }))

  return (
    <ListPageLayout<TodayMerchantReceiptListItem>
      title="Todays Merchant Receipt"
      titleOptions={merchantReportOptions}
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
