import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Trash2, Eye, Plus, MapPin, Phone, Mail, Globe } from 'lucide-react'
import { useSuppliersDatatable, useDeleteSupplier } from '../../hooks/useSuppliers'
import type { ColDef } from 'ag-grid-community'
import type { SupplierListItem } from '../../api/suppliers.api'
import { ListPageLayout } from '@/components/ListPageLayout/Listpagelayout'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { VendorModal } from '../../components/VendorModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'

export const VendorListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()
  
  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [country, setCountry] = useState<string | undefined>(undefined)
  const [state, setState] = useState<string | undefined>(undefined)
  const [city, setCity] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<SupplierListItem | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<{ id: number; uuid: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    id: true,
    name: true,
    address: true,
    date: true,
    mobile: true,
    email: true,
    country: true,
    state: true,
    city: true,
    zip: true,
    status: true,
    action: true
  })

  // Data Fetching
  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: search },
    status,
    country,
    state,
    city,
    start_date: dateRange.start,
    end_date: dateRange.end,
  }), [currentPage, pageSize, search, status, country, state, city, dateRange])

  const { data: vendorsData, isLoading } = useSuppliersDatatable(params)
  const { mutate: deleteVendor, isPending: isDeleting } = useDeleteSupplier()

  // Actions
  const handleAdd = () => {
    navigate({ to: '/inventory/vendors/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/inventory/vendors/edit/$id', params: { id: id.toString() } })
  }

  const handleDeleteClick = (id: number, uuid: string) => {
    setVendorToDelete({ id, uuid })
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (vendorToDelete) {
      deleteVendor({ id: vendorToDelete.id, uuid: vendorToDelete.uuid }, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setVendorToDelete(null)
          showNotificationModal(
            'Vendor Deleted!',
            'The vendor has been removed successfully.',
            'success'
          )
        }
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<SupplierListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        const index = params.node?.rowIndex ?? 0
        return (currentPage - 1) * pageSize + index + 1
      },
      width: 60,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
    },
    {
      headerName: 'VENDOR ID',
      field: 'id',
      width: 100,
      hide: !visibleCols.id,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'VENDOR NAME',
      field: 'supplier_name',
      minWidth: 180,
      flex: 1,
      hide: !visibleCols.name,
      cellClass: 'font-medium text-gray-900 flex items-center',
    },
    {
      headerName: 'ADDRESS',
      field: 'address',
      minWidth: 200,
      flex: 1.2,
      hide: !visibleCols.address,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'DATE',
      field: 'date',
      width: 120,
      hide: !visibleCols.date,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'MOBILE NO',
      field: 'mobile',
      width: 140,
      hide: !visibleCols.mobile,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'EMAIL',
      field: 'emailnumber',
      width: 180,
      hide: !visibleCols.email,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'COUNTRY',
      field: 'country',
      width: 120,
      hide: !visibleCols.country,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'STATE',
      field: 'state',
      width: 120,
      hide: !visibleCols.state,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'CITY',
      field: 'city',
      width: 120,
      hide: !visibleCols.city,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'ZIP',
      field: 'zip',
      width: 100,
      hide: !visibleCols.zip,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 110,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const isActive = params.value === 'Active'
        return (
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase',
            isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'
          )}>
            {params.value}
          </span>
        )
      }
    },
    {
      headerName: 'ACTIONS',
      width: 120,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['edit_supplier', 'delete_supplier']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="edit_supplier">
           <button
             onClick={() => handleEdit(params.data.id)}
             className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 group/edit"
             title="Edit Vendor"
           >              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_supplier">
            <button
              onClick={() => handleDeleteClick(params.data.id, params.data.uuid)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 group/del"
              title="Delete Vendor"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [currentPage, pageSize, visibleCols, hasAnyPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Vendor ID', field: 'id', visible: visibleCols.id },
    { name: 'Vendor Name', field: 'name', visible: visibleCols.name },
    { name: 'Address', field: 'address', visible: visibleCols.address },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Mobile No', field: 'mobile', visible: visibleCols.mobile },
    { name: 'Email', field: 'email', visible: visibleCols.email },
    { name: 'Country', field: 'country', visible: visibleCols.country },
    { name: 'State', field: 'state', visible: visibleCols.state },
    { name: 'City', field: 'city', visible: visibleCols.city },
    { name: 'Zip', field: 'zip', visible: visibleCols.zip },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
  ]

  const totalPages = Math.ceil((vendorsData?.recordsFiltered ?? 0) / pageSize)

  return (
    <>
      <ListPageLayout
        title="Vendor List"
        backTo="/"
        onCreate={handleAdd}
        createPermission="create_supplier"
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={vendorsData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={vendorsData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        // Filters
        showStatusFilter={true}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        statusValue={status}
        statusOptions={statusOptions}
        fromDate={dateRange.start}
        toDate={dateRange.end}
        onDateRangeChange={(start, end) => { setDateRange({ start, end }); setCurrentPage(1) }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        // Export
        onExport={() => {}} 
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Vendor?"
        message="Are you sure you want to remove this vendor? This action will also affect related accounting records."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
