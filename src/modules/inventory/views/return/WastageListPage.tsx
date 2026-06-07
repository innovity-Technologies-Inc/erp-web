import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { useWastageDatatable } from '../../hooks/useReturn'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { Link } from '@tanstack/react-router'
import { useSettings } from '@/hooks/useSettings'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import type { ReturnListItem } from '../../api/return.api'
import { formatCurrency } from '@/utils/formatters'

const tabs = [
  { name: 'Return To Vendor', to: '/inventory/return/vendor' },
  { name: 'Return From Merchant', to: '/inventory/return/merchant' },
  { name: 'Wastage', to: '/inventory/return/wastage', active: true },
]

export const WastageListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const { currency, currencyPosition } = useSettings()
  const { hasPermission } = usePermissions()

  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    invoiceNo: true,
    merchantName: true,
    date: true,
    returnQty: true,
    totalAmount: true,
    action: true
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, fromDate, toDate, currentPage, pageSize])

  const { data: returnData, isLoading } = useWastageDatatable(params)

  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  const columns = useMemo<ColDef[]>(() => [
    {
      headerName: 'SL',
      valueGetter: 'node.rowIndex + 1',
      width: 60,
      flex: 0,
      hide: !visibleCols.sl
    },
    { 
      headerName: 'INVOICE NO', 
      field: 'invoice_id', 
      minWidth: 150, 
      flex: 1,
      hide: !visibleCols.invoiceNo
    },
    { 
      headerName: 'MERCHANT NAME', 
      field: 'customer_name', 
      minWidth: 200, 
      flex: 2,
      hide: !visibleCols.merchantName
    },
    { 
      headerName: 'DATE', 
      field: 'date_return', 
      width: 150, 
      flex: 1,
      hide: !visibleCols.date
    },
    { 
      headerName: 'WASTAGE QTY', 
      field: 'return_quantity', 
      width: 150, 
      flex: 1,
      cellClass: 'text-right',
      hide: !visibleCols.returnQty
    },
    { 
      headerName: 'TOTAL AMOUNT', 
      field: 'total_amount', 
      width: 180, 
      flex: 1,
      cellClass: 'text-right font-bold text-primary',
      hide: !visibleCols.totalAmount,
      cellRenderer: (params: any) => formatValue(params.value)
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 120,
      flex: 0,
      hide: !visibleCols.action,
      cellClass: 'flex items-center justify-center',
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1.5 h-full">
          <PermissionGuard permission="sales_return">
            <Link
              to={`/inventory/return/wastage/details/${params.data.id}` as any}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110"
              title="View Details"
            >
              <Eye className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </PermissionGuard>
        </div>
      )
    }
  ], [visibleCols, hasPermission, formatValue])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Invoice No', field: 'invoiceNo', visible: visibleCols.invoiceNo },
    { name: 'Merchant Name', field: 'merchantName', visible: visibleCols.merchantName },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Return Qty', field: 'returnQty', visible: visibleCols.returnQty },
    { name: 'Total Amount', field: 'totalAmount', visible: visibleCols.totalAmount },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  return (
    <>
      <ListPageLayout<ReturnListItem>
        tabs={tabs}
        title="Wastage List"
        backTo="/inventory/return/vendor"
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        rowData={returnData?.data}
        columnDefs={columns}
        isLoading={isLoading}
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
        recordsTotal={returnData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={Math.ceil((returnData?.recordsFiltered || 0) / pageSize)}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      />
    </>
  )
}
