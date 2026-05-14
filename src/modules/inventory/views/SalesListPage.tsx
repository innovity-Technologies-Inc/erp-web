import { useMemo, useState } from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { useSalesDatatable, useDeleteSale } from '../hooks/useSales'
import type { ColDef } from 'ag-grid-community'
import type { SaleListItem } from '../api/sales.api'
import { clsx } from 'clsx'
import { ListPageLayout, type NavTab } from '@/components/ListPageLayout/Listpagelayout'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { exportToExcel } from '@/utils/exportUtils'
import { useNavigate } from '@tanstack/react-router'

const tabs: NavTab[] = [
  { name: 'Manage Sale',          to: '/inventory/sales', active: true },
  { name: 'Manage Sales Payment', to: '/inventory/sales/payments' },
  { name: 'Manage Sales Terms',   to: '/inventory/terms' },
  { name: 'Manage Contact Us',    to: '/inventory/contact-us' },
]

export const SalesListPage = () => {
  const [searchTerm, setSearchTerm]   = useState('')
  const [status, setStatus]           = useState('')
  const [fromDate, setFromDate]       = useState('')
  const [toDate, setToDate]           = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize]       = useState(10)
  const [gridApi, setGridApi]         = useState<any>(null)
  
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const navigate = useNavigate()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    invoice: true,
    salesBy: true,
    channel: true,
    merchant: true,
    date: true,
    deliveryNote: true,
    total: true,
    voucher: true,
    action: true
  })

  const params = useMemo(() => ({
    draw:   1,
    start:  (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    status,
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, status, fromDate, toDate, currentPage, pageSize])

  const { data: salesData, isLoading } = useSalesDatatable(params)
  const { mutate: deleteSale, isPending: isDeleting } = useDeleteSale()
  
  const handleCreate = () => {
    navigate({ to: '/inventory/sales/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: `/inventory/sales/edit/${id}` })
  }

  const handleView = (id: number) => {
    navigate({ to: `/inventory/sales/view/${id}` })
  }

  const handleDelete = (id: number) => {
    setSelectedSaleId(id)
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (selectedSaleId) {
      deleteSale(selectedSaleId, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setSelectedSaleId(null)
          showNotificationModal(
            'Deleted Successfully!',
            'Your sales invoice has been deleted successfully.',
            'success'
          )
        }
      })
    }
  }

  const handleExport = () => {
    if (!salesData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Invoice No', key: 'invoice_id', width: 15 },
      { header: 'Sales By', key: 'sales_by', width: 20 },
      { header: 'Channel', key: 'channel', width: 15 },
      { header: 'Merchant Name', key: 'customer_name', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Delivery Note', key: 'delivery_note', width: 40 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Voucher Status', key: 'status', width: 15 },
    ]

    const exportData = salesData.data.map((item, index) => ({
      sl: index + 1,
      invoice_id: item.invoice_id,
      sales_by: item.sales_by,
      channel: item.channel,
      customer_name: item.customer_name,
      date: item.date ? new Date(item.date) : '',
      delivery_note: item.delivery_note,
      total_amount: item.total_amount,
      status: item.status,
    }))

    exportToExcel(exportData, exportColumns, 'sales-invoices')
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const totalPages = Math.ceil((salesData?.recordsFiltered ?? 0) / pageSize)

  const columnDefs = useMemo<ColDef<SaleListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: 'node.rowIndex + 1',
      width: 80,
      flex: 0,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-[#1e4ba1]/30 flex items-center justify-center',
    },
    {
      headerName: 'INVOICE NO',
      field: 'invoice_id',
      width: 130,
      flex: 0,
      hide: !visibleCols.invoice,
      cellClass: 'text-[#1e4ba1] font-medium ',
    },
    {
      headerName: 'SALES BY',
      field: 'sales_by',
      width: 140,
      flex: 0,
      hide: !visibleCols.salesBy,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'CHANNEL',
      field: 'channel',
      width: 120,
      flex: 0,
      hide: !visibleCols.channel,
      cellClass: 'text-[#64748b] font-medium',
    },
    {
      headerName: 'MERCHANT NAME',
      field: 'customer_name',
      flex: 1.5,
      hide: !visibleCols.merchant,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'DATE',
      field: 'date',
      width: 120,
      flex: 0,
      hide: !visibleCols.date,
      valueFormatter: (params) => formatDate(params.value),
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'DELIVERY NOTE',
      field: 'delivery_note',
      width: 180,
      flex: 1,
      hide: !visibleCols.deliveryNote,
      cellRenderer: (params: any) => (
        <div className="line-clamp-1 text-[#64748b] font-normal" title={params.value}>
          {params.value || '---'}
        </div>
      ),
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'total_amount',
      width: 140,
      flex: 0,
      hide: !visibleCols.total,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-medium text-[#1e293b]',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'VOUCHER STATUS',
      field: 'status',
      width: 150,
      flex: 0,
      hide: !visibleCols.voucher,
      cellRenderer: (params: any) => {
        const isApproved = params.value === 'Approved'
        return (
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase',
            isApproved ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'
          )}>
            {params.value}
          </span>
        )
      }
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 140,
      flex: 0,
      sortable: false,
      filter: false,
      pinned: 'right',
      hide: !visibleCols.action,
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-3 h-full">
          <button
            onClick={() => handleView(params.data.id)}
            className="text-[#64748b] hover:scale-110 transition-transform group/view"
            title="View Details"
          >
            <Eye className="h-4.5 w-4.5 group-hover/view:text-[#1e4ba1]" />
          </button>
          <button
            onClick={() => handleEdit(params.data.id)}
            className="text-[#10b981] hover:scale-110 transition-transform group/edit"
            title="Edit"
          >
            <Edit className="h-4.5 w-4.5 text-emerald-500 group-hover/edit:text-emerald-600" />
          </button>
          <button
            onClick={() => handleDelete(params.data.id)}
            className="text-[#ef4444] hover:scale-110 transition-transform group/delete"
            title="Delete"
          >
            <Trash2 className="h-4.5 w-4.5 text-rose-500 group-hover/delete:text-rose-600" />
          </button>
        </div>
      ),
    },
  ], [visibleCols, currency, currencyPosition])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Invoice No', field: 'invoice', visible: visibleCols.invoice },
    { name: 'Sales By', field: 'salesBy', visible: visibleCols.salesBy },
    { name: 'Channel', field: 'channel', visible: visibleCols.channel },
    { name: 'Merchant Name', field: 'merchant', visible: visibleCols.merchant },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Delivery Note', field: 'deliveryNote', visible: visibleCols.deliveryNote },
    { name: 'Total Amount', field: 'total', visible: visibleCols.total },
    { name: 'Voucher Status', field: 'voucher', visible: visibleCols.voucher },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Approved', value: 'Active' },
    { label: 'Not Approved', value: 'Inactive' },
  ]

  return (
    <>
      <ListPageLayout<SaleListItem>
        title="Manage Sales"
        backTo="/inventory/sales"
        tabs={tabs}
        onCreate={handleCreate}
        showStatusFilter={true}
        statusValue={status}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        statusOptions={statusOptions}
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        onExport={handleExport}
        rowData={salesData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={salesData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
        gridOptions={{
          onGridReady: (params) => setGridApi(params.api)
        }}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSelectedSaleId(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Sales Invoice?"
        message="Are you sure you want to delete this sales invoice? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
