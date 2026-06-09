import { useMemo, useState } from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { useQuotationDatatable, useDeleteQuotation } from '../../hooks/useQuotation'
import type { ColDef } from 'ag-grid-community'
import type { QuotationListItem } from '../../api/quotation.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useNavigate, Link } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'

export const QuotationListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [status, setStatus] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const navigate = useNavigate()
  const { hasPermission, hasAnyPermission } = usePermissions()

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    merchant: true,
    quotNo: true,
    date: true,
    expiryDate: true,
    itemTotal: true,
    status: true,
    serviceTotal: true,
    action: true
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    start_date: fromDate,
    end_date: toDate,
    status: status
  }), [searchTerm, fromDate, toDate, status, currentPage, pageSize])

  const { data: quotationData, isLoading } = useQuotationDatatable(params)
  const { mutate: deleteQuotation, isPending: isDeleting } = useDeleteQuotation()
  
  const handleCreate = () => {
    navigate({ to: '/inventory/quotation/create' })
  }

  const handleView = (id: number) => {
    navigate({ to: '/inventory/quotation/view/$id', params: { id: id.toString() } })
  }

  const handleDelete = (id: number) => {
    setSelectedQuotationId(id)
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (selectedQuotationId) {
      deleteQuotation(selectedQuotationId, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setSelectedQuotationId(null)
          showNotificationModal(
            'Deleted Successfully!',
            'The quotation has been deleted successfully.',
            'success'
          )
        }
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const totalPages = Math.ceil((quotationData?.recordsFiltered ?? 0) / pageSize)

  const columnDefs = useMemo<ColDef<QuotationListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 80,
      flex: 0,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    {
      headerName: 'MERCHANT NAME',
      field: 'customer_name',
      flex: 1.5,
      hide: !visibleCols.merchant,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'QUOTATION NO',
      field: 'quot_no',
      width: 150,
      flex: 0,
      hide: !visibleCols.quotNo,
      cellClass: 'text-primary font-semibold',
    },
    {
      headerName: 'QUOTATION DATE',
      field: 'quotdate',
      width: 150,
      flex: 0,
      hide: !visibleCols.date,
      valueFormatter: (params) => formatDate(params.value),
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'EXPIRY DATE',
      field: 'expire_date',
      width: 150,
      flex: 0,
      hide: !visibleCols.expiryDate,
      valueFormatter: (params) => formatDate(params.value),
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'ITEM TOTAL',
      field: 'item_total_amount',
      width: 140,
      flex: 0,
      hide: !visibleCols.itemTotal,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-semibold text-[#0d7a50]',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'SERVICE TOTAL',
      field: 'service_total_amount',
      width: 140,
      flex: 0,
      hide: !visibleCols.serviceTotal,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-semibold text-[#0d7a50]',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'STATUS',
      field: 'add_to_invoice',
      width: 180,
      flex: 0,
      hide: !visibleCols.status,
      cellClass: 'flex items-center justify-center',
      cellRenderer: (params: any) => {
        if (params.value === 'Added To Invoice') {
          return (
            <span className="px-2 py-1 leading-normal bg-[#dcfce7] text-[#166534] rounded-full text-[11px] font-bold inline-block border border-green-200">
              Added To Invoice
            </span>
          )
        }
        if (!hasPermission('add_to_invoice')) return null;
        return (
          <Link
            to="/inventory/quotation/add-to-invoice/$id"
            params={{ id: params.data.id.toString() }}
            className="px-2 py-0 leading-normal bg-[#dbeafe] text-[#1e40af] hover:bg-[#bfdbfe] rounded-full text-[11px] font-bold transition-colors inline-block border border-blue-200"
          >
            Add to Invoice
          </Link>
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
      hide: !visibleCols.action || !hasAnyPermission(['view_quotation', 'edit_quotation', 'delete_quotation']),
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1.5 h-full">
          <PermissionGuard permission="view_quotation">
            <button
              onClick={() => handleView(params.data.id)}
              className="p-2 hover:bg-blue-50 text-primary rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110 group/view"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="edit_quotation">
            <Link
              to="/inventory/quotation/edit/$id"
              params={{ id: params.data.id.toString() }}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Link>
          </PermissionGuard>

          <PermissionGuard permission="delete_quotation">
            <button
              onClick={() => handleDelete(params.data.id)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize, hasAnyPermission, hasPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Merchant Name', field: 'merchant', visible: visibleCols.merchant },
    { name: 'Quotation No', field: 'quotNo', visible: visibleCols.quotNo },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Expiry Date', field: 'expiryDate', visible: visibleCols.expiryDate },
    { name: 'Item Total', field: 'itemTotal', visible: visibleCols.itemTotal },
    { name: 'Service Total', field: 'serviceTotal', visible: visibleCols.serviceTotal },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  return (
    <>
      <ListPageLayout<QuotationListItem>
        title="Quotation List"
        backTo="/"
        onCreate={handleCreate}
        createPermission="create_quotation"
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        showStatusFilter={true}
        statusValue={status}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        statusOptions={[
          { label: 'Pending', value: '1' },
          { label: 'Added to Invoice', value: '2' }
        ]}
        rowData={quotationData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={quotationData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSelectedQuotationId(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Quotation?"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}

