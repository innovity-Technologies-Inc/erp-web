import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useStockReportDatatable } from '../../hooks/useReports'
import { useProductsList } from '../../hooks/useProducts'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useUiStore } from '@/store/useUiStore'
import { stockReportOptions, reportCategoryTabs } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import type { StockReportListItem } from '../../api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const StockReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { showNotificationModal } = useUiStore()

  // Filters
  const [productId, setProductId] = useState<string>('')
  const [productModel, setProductModel] = useState<string>('')

  const { data: productsResponse } = useProductsList()
  const products = productsResponse?.data || []

  const productOptions = useMemo(() => {
    return products.map((p: any) => ({ value: p.id.toString(), label: p.product_name }))
  }, [products])

  const modelOptions = useMemo(() => {
    const models = Array.from(new Set(products.map((p: any) => p.product_model).filter(Boolean)))
    return models.map(m => ({ value: m as string, label: m as string }))
  }, [products])

  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    product_name: true,
    product_model: true,
    sales_price: true,
    purchase_price: true,
    total_purchase_qnty: true,
    total_purchase_return_qnty: true,
    total_sales_qnty: true,
    total_sales_return_qnty: true,
    stock_quantity: true,
    total_sale_price: true,
    purchase_total: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const params = useMemo(() => ({
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    product_id: productId,
    product_model: productModel,
  }), [currentPage, pageSize, productId, productModel])

  const { data: reportData, isFetching: isLoading } = useStockReportDatatable(params)

  // Calculate totals from the current page data
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    return pageData.reduce((acc, item) => ({
      sales_price: acc.sales_price + (parseFloat(String(item.sales_price).replace(/,/g, '')) || 0),
      purchase_price: acc.purchase_price + (parseFloat(String(item.purchase_price).replace(/,/g, '')) || 0),
      total_purchase_qnty: acc.total_purchase_qnty + (parseFloat(String(item.total_purchase_qnty).replace(/,/g, '')) || 0),
      total_purchase_return_qnty: acc.total_purchase_return_qnty + (parseFloat(String(item.total_purchase_return_qnty).replace(/,/g, '')) || 0),
      total_sales_qnty: acc.total_sales_qnty + (parseFloat(String(item.total_sales_qnty).replace(/,/g, '')) || 0),
      total_sales_return_qnty: acc.total_sales_return_qnty + (parseFloat(String(item.total_sales_return_qnty).replace(/,/g, '')) || 0),
      stock_quantity: acc.stock_quantity + (parseFloat(String(item.stock_quantity).replace(/,/g, '')) || 0),
      total_sale_price: acc.total_sale_price + (parseFloat(String(item.total_sale_price).replace(/,/g, '')) || 0),
      purchase_total: acc.purchase_total + (parseFloat(String(item.purchase_total).replace(/,/g, '')) || 0),
    }), { 
        sales_price: 0, purchase_price: 0, total_purchase_qnty: 0, 
        total_purchase_return_qnty: 0, total_sales_qnty: 0, 
        total_sales_return_qnty: 0, stock_quantity: 0, 
        total_sale_price: 0, purchase_total: 0 
    })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      product_name: 'Total:',
      sales_price: totals.sales_price.toString(),
      purchase_price: totals.purchase_price.toString(),
      total_purchase_qnty: totals.total_purchase_qnty.toString(),
      total_purchase_return_qnty: totals.total_purchase_return_qnty.toString(),
      total_sales_qnty: totals.total_sales_qnty.toString(),
      total_sales_return_qnty: totals.total_sales_return_qnty.toString(),
      stock_quantity: totals.stock_quantity.toString(),
      total_sale_price: totals.total_sale_price.toString(),
      purchase_total: totals.purchase_total.toString(),
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<StockReportListItem>[]>(() => [
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
      headerName: 'PRODUCT NAME', 
      field: 'product_name',
      minWidth: 200,
      flex: 2,
      pinned: 'left' as const,
      hide: !visibleCols.product_name,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-medium flex items-center ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    { 
      headerName: 'MODEL', 
      field: 'product_model',
      minWidth: 120,
      flex: 1,
      hide: !visibleCols.product_model,
      cellClass: 'text-center flex items-center justify-center text-gray-500 font-medium'
    },
    { 
      headerName: 'SALE PRICE', 
      field: 'sales_price',
      minWidth: 120,
      flex: 1,
      hide: !visibleCols.sales_price,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#475569]'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    },
    { 
      headerName: 'PURCHASE PRICE', 
      field: 'purchase_price',
      minWidth: 120,
      flex: 1,
      hide: !visibleCols.purchase_price,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#475569]'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    },
    { 
      headerName: 'IN QTY', 
      field: 'total_purchase_qnty',
      minWidth: 100,
      flex: 1,
      hide: !visibleCols.total_purchase_qnty,
      cellClass: (params) => `font-black flex items-center justify-center ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-emerald-600'}`,
      valueFormatter: (params: any) => params.value ? parseFloat(params.value).toLocaleString() : '0'
    },
    { 
      headerName: 'IN RET QTY', 
      field: 'total_purchase_return_qnty',
      minWidth: 100,
      flex: 1,
      hide: !visibleCols.total_purchase_return_qnty,
      cellClass: (params) => `font-bold flex items-center justify-center ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-orange-500'}`,
      valueFormatter: (params: any) => params.value ? parseFloat(params.value).toLocaleString() : '0'
    },
    { 
      headerName: 'OUT QTY', 
      field: 'total_sales_qnty',
      minWidth: 100,
      flex: 1,
      hide: !visibleCols.total_sales_qnty,
      cellClass: (params) => `font-black flex items-center justify-center ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#1e4ba1]'}`,
      valueFormatter: (params: any) => params.value ? parseFloat(params.value).toLocaleString() : '0'
    },
    { 
      headerName: 'OUT RET QTY', 
      field: 'total_sales_return_qnty',
      minWidth: 100,
      flex: 1,
      hide: !visibleCols.total_sales_return_qnty,
      cellClass: (params) => `font-bold flex items-center justify-center ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-rose-500'}`,
      valueFormatter: (params: any) => params.value ? parseFloat(params.value).toLocaleString() : '0'
    },
    { 
      headerName: 'STOCK', 
      field: 'stock_quantity',
      minWidth: 100,
      flex: 1,
      hide: !visibleCols.stock_quantity,
      cellClass: (params) => `font-black flex items-center justify-center ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#1e4ba1]'} bg-blue-50/30`,
      valueFormatter: (params: any) => params.value ? parseFloat(params.value).toLocaleString() : '0'
    },
    { 
      headerName: 'STOCK SALE VAL', 
      field: 'total_sale_price',
      minWidth: 140,
      flex: 1.2,
      hide: !visibleCols.total_sale_price,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-emerald-600'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    },
    { 
      headerName: 'STOCK PUR VAL', 
      field: 'purchase_total',
      minWidth: 140,
      flex: 1.2,
      hide: !visibleCols.purchase_total,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-rose-600'}`,
      valueFormatter: (params: any) => formatCurrency(params.value, currency, currencyPosition)
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Product Name', field: 'product_name', visible: visibleCols.product_name },
    { name: 'Model', field: 'product_model', visible: visibleCols.product_model },
    { name: 'Sale Price', field: 'sales_price', visible: visibleCols.sales_price },
    { name: 'Purchase Price', field: 'purchase_price', visible: visibleCols.purchase_price },
    { name: 'In Qty', field: 'total_purchase_qnty', visible: visibleCols.total_purchase_qnty },
    { name: 'In Ret Qty', field: 'total_purchase_return_qnty', visible: visibleCols.total_purchase_return_qnty },
    { name: 'Out Qty', field: 'total_sales_qnty', visible: visibleCols.total_sales_qnty },
    { name: 'Out Ret Qty', field: 'total_sales_return_qnty', visible: visibleCols.total_sales_return_qnty },
    { name: 'Stock', field: 'stock_quantity', visible: visibleCols.stock_quantity },
    { name: 'Stock Sale Val', field: 'total_sale_price', visible: visibleCols.total_sale_price },
    { name: 'Stock Pur Val', field: 'purchase_total', visible: visibleCols.purchase_total },
  ]

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.get('/inventory/reports/stock-report-export', {
        params: { report_type: 'pdf', product_id: productId, product_model: productModel },
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
      const response = await apiClient.get('/inventory/reports/stock-report-export', {
        params: { report_type: 'excel', product_id: productId, product_model: productModel },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `stock_report_${new Date().toISOString().split('T')[0]}.xlsx`)
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
                options={productOptions}
                value={productId}
                onChange={(val) => { setProductId(val as string); setCurrentPage(1) }}
                rounded="full"
                variant="solid"
                placeholder="All Products"
                isClearable
            />
        </div>
        <div className="w-[180px]">
            <Select2
                options={modelOptions}
                value={productModel}
                onChange={(val) => { setProductModel(val as string); setCurrentPage(1) }}
                rounded="full"
                variant="solid"
                placeholder="All Models"
                isClearable
            />
        </div>
    </div>
  )

  const toolbarRight = (
    <div className="flex items-center gap-3">
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

  const tabs = reportCategoryTabs.map(t => ({ ...t, active: t.name === 'Stock' }))

  return (
    <ListPageLayout<StockReportListItem>
      title="Stock Report"
      titleOptions={stockReportOptions}
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
