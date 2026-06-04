import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Trash2, Eye } from 'lucide-react'
import { useServiceInvoicesDatatable, useDeleteServiceInvoice } from '../../hooks/useService'
import type { ColDef } from 'ag-grid-community'
import type { ServiceInvoiceListItem } from '../../api/service.api'
import { ListPageLayout } from '@/components/ListPageLayout/Listpagelayout'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'

const tabs = [
  { name: 'Manage Service', to: '/inventory/service' },
  { name: 'Manage Service Invoice', to: '/inventory/service-invoice', active: true },
]

export const ServiceInvoiceListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    merchant: true,
    date: true,
    total: true,
    paid: true,
    due: true,
    details: true,
    action: true
  })

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }
  const { currency, currencyPosition } = useSettings()
  const navigate = useNavigate()
  const { hasAnyPermission } = usePermissions()

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, currentPage, pageSize, fromDate, toDate])

  const { data: invoicesData, isLoading } = useServiceInvoicesDatatable(params)
  const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteServiceInvoice()

  const handleCreate = () => {
    navigate({ to: '/inventory/service-invoice/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/inventory/service-invoice/edit/$id', params: { id: id.toString() } })
  }

  const handleView = (id: number) => {
    navigate({ to: '/inventory/service-invoice/view/$id', params: { id: id.toString() } })
  }

  const handleDelete = (id: number) => {
    setSelectedInvoiceId(id)
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (selectedInvoiceId) {
      deleteInvoice(selectedInvoiceId, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setSelectedInvoiceId(null)
        }
      })
    }
  }

  const columnDefs = useMemo<ColDef<ServiceInvoiceListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1,
      width: 80,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    {
      headerName: 'MERCHANT NAME',
      field: 'customer_name',
      flex: 1.5,
      hide: !visibleCols.merchant,
      cellClass: 'text-[#475569] font-medium flex items-center',
    },
    {
      headerName: 'DATE',
      field: 'date',
      width: 130,
      hide: !visibleCols.date,
      valueFormatter: (params) => formatDate(params.value),
      cellClass: 'text-[#475569] font-medium flex items-center',
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'total_amount',
      width: 150,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      hide: !visibleCols.total,
      cellClass: 'font-medium text-[#1e293b] flex items-center justify-end',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'PAID AMOUNT',
      field: 'paid_amount',
      width: 150,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      hide: !visibleCols.paid,
      cellClass: 'font-medium text-[#059669] flex items-center justify-end',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'DUE AMOUNT',
      field: 'due_amount',
      width: 150,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      hide: !visibleCols.due,
      cellClass: 'font-medium text-[#ef4444] flex items-center justify-end',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'DESCRIPTION',
      field: 'details',
      flex: 2,
      hide: !visibleCols.details,
      cellClass: 'flex items-center',
      cellRenderer: (params: any) => (
        <div className="line-clamp-1 text-[#64748b] font-normal" title={params.value}>
          {params.value || '---'}
        </div>
      ),
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 140,
      sortable: false,
      filter: false,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['view_service_invoice', 'edit_service_invoice', 'delete_service_invoice']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1.5 h-full">
          <PermissionGuard permission="view_service_invoice">
            <button
              onClick={() => handleView(params.data.id)}
              className="p-2 hover:bg-blue-50 text-primary rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="edit_service_invoice">
            <button
              onClick={() => handleEdit(params.data.id)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_service_invoice">
            <button
              onClick={() => handleDelete(params.data.id)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [currency, currencyPosition, currentPage, pageSize, hasAnyPermission, visibleCols])

  return (
    <>
      <ListPageLayout<ServiceInvoiceListItem>
        title="Manage Service Invoice"
        backTo="/inventory/service"
        tabs={tabs}
        onCreate={handleCreate}
        createPermission="create_service_invoice"
        // Search
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={invoicesData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={invoicesData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={Math.ceil((invoicesData?.recordsFiltered ?? 0) / pageSize)}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        // Date Filter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(start, end) => { setFromDate(start); setToDate(end); setCurrentPage(1) }}
        // Column Filter
        showColumnFilter={true}
        columns={[
          { name: 'SL', field: 'sl', visible: visibleCols.sl },
          { name: 'Merchant Name', field: 'merchant', visible: visibleCols.merchant },
          { name: 'Date', field: 'date', visible: visibleCols.date },
          { name: 'Total Amount', field: 'total', visible: visibleCols.total },
          { name: 'Paid Amount', field: 'paid', visible: visibleCols.paid },
          { name: 'Due Amount', field: 'due', visible: visibleCols.due },
          { name: 'Description', field: 'details', visible: visibleCols.details },
          { name: 'Action', field: 'action', visible: visibleCols.action },
        ]}
        onColumnToggle={toggleColumn}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSelectedInvoiceId(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Service Invoice?"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
