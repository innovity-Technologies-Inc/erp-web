import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useServicesDatatable, useDeleteService } from '../../hooks/useService'
import type { ColDef } from 'ag-grid-community'
import type { ServiceListItem } from '../../api/service.api'
import { ListPageLayout } from '@/components/ListPageLayout/Listpagelayout'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { ServiceFormModal } from '../../components/ServiceFormModal'
import { clsx } from 'clsx'

const tabs = [
  { name: 'Manage Service', to: '/inventory/service', active: true },
  { name: 'Manage Service Invoice', to: '/inventory/service-invoice' },
]

export const ServiceListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [serviceToEdit, setServiceToEdit] = useState<ServiceListItem | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    name: true,
    charge: true,
    vat: true,
    status: true,
    description: true,
    action: true
  })

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }
  
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    status,
    start_date: fromDate,
    end_date: toDate,
  }), [searchTerm, currentPage, pageSize, status, fromDate, toDate])

  const statusOptions = useMemo(() => [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' }
  ], [])

  const { data: servicesData, isLoading } = useServicesDatatable(params)
  const { mutate: deleteService, isPending: isDeleting } = useDeleteService()

  const handleCreate = () => {
    setServiceToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (service: ServiceListItem) => {
    setServiceToEdit(service)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    setSelectedServiceId(id)
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (selectedServiceId) {
      deleteService(selectedServiceId, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setSelectedServiceId(null)
          showNotificationModal(
            'Deleted Successfully!',
            'The service has been removed from the catalog.',
            'success'
          )
        }
      })
    }
  }

  const columnDefs = useMemo<ColDef<ServiceListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1,
      width: 80,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    {
      headerName: 'DATE',
      field: 'created_at',
      width: 130,
      hide: !visibleCols.date,
      valueFormatter: (params) => formatDate(params.value),
      cellClass: 'text-[#475569] font-medium flex items-center',
    },
    {
      headerName: 'SERVICE NAME',
      field: 'service_name',
      flex: 1.5,
      hide: !visibleCols.name,
      cellClass: 'text-[#475569] font-medium flex items-center',
    },
    {
      headerName: 'CHARGE',
      field: 'charge',
      width: 150,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      hide: !visibleCols.charge,
      cellClass: 'font-medium text-[#1e293b] flex items-center justify-end',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'SERVICE VAT (%)',
      field: 'service_vat',
      width: 150,
      headerClass: 'text-center',
      cellStyle: { textAlign: 'center' },
      hide: !visibleCols.vat,
      cellClass: 'text-[#64748b] font-medium flex items-center justify-center',
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 120,
      hide: !visibleCols.status,
      cellClass: 'flex items-center justify-center',
      cellRenderer: (params: any) => {
        const isActive = params.value === 1
        return (
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase',
            isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
          )}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )
      }
    },
    {
      headerName: 'DESCRIPTION',
      field: 'description',
      flex: 2,
      hide: !visibleCols.description,
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
      width: 120,
      sortable: false,
      filter: false,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['edit_service', 'delete_service']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1.5 h-full">
          <PermissionGuard permission="edit_service">
            <button
              onClick={() => handleEdit(params.data)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_service">
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
  ], [currency, currencyPosition, currentPage, pageSize, hasAnyPermission, visibleCols])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Service Name', field: 'name', visible: visibleCols.name },
    { name: 'Charge', field: 'charge', visible: visibleCols.charge },
    { name: 'VAT', field: 'vat', visible: visibleCols.vat },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Description', field: 'description', visible: visibleCols.description },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  return (
    <>
      <ListPageLayout<ServiceListItem>
        title="Manage Service"
        backTo="/"
        tabs={tabs}
        onCreate={handleCreate}
        createPermission="create_service"
        // Search
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={servicesData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={servicesData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={Math.ceil((servicesData?.recordsFiltered ?? 0) / pageSize)}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        // Status Filter
        showStatusFilter={true}
        statusValue={status}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        statusOptions={statusOptions}
        // Date Filter
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(start, end) => { setFromDate(start); setToDate(end); setCurrentPage(1) }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
      />

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setServiceToEdit(null)
        }}
        service={serviceToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSelectedServiceId(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Service?"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
