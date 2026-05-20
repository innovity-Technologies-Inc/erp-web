import { useMemo, useState } from 'react'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useUnitsDatatable, useDeleteUnit, useUnitData, useToggleUnitStatus } from '@/modules/inventory'
import type { ColDef } from 'ag-grid-community'
import type { UnitListItem } from '../../api/units.api'
import { ListPageLayout } from '@/components/ListPageLayout/Listpagelayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'
import { UnitModal } from '../../components'

export const UnitListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()
  
  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    date: true,
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
    start_date: dateRange.start,
    end_date: dateRange.end,
  }), [currentPage, pageSize, search, status, dateRange])

  const { data: unitsData, isLoading } = useUnitsDatatable(params)
  const { mutate: deleteUnit, isPending: isDeleting } = useDeleteUnit()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleUnitStatus()
  const [togglingId, setTogglingId] = useState<number | null>(null)
  
  // Fetch single unit data for editing
  const { data: editData } = useUnitData(selectedUnitId)

  // Actions
  const handleAdd = () => {
    setSelectedUnitId(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: number) => {
    setSelectedUnitId(id)
    setIsModalOpen(true)
  }

  const handleStatusToggle = (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    setTogglingId(id)
    toggleStatus({ id, status: newStatus }, {
        onSuccess: () => {
            setTogglingId(null)
            showNotificationModal(
                'Status Updated!',
                `Unit status has been changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
                'success'
            )
        },
        onError: () => {
            setTogglingId(null)
        }
    })
  }

  const handleDeleteClick = (id: number) => {
    setUnitToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (unitToDelete) {
      deleteUnit(unitToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setUnitToDelete(null)
          showNotificationModal(
            'Unit Deleted!',
            'The unit has been removed successfully.',
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
  const columnDefs = useMemo<ColDef<UnitListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        const index = params.node?.rowIndex ?? 0
        return (currentPage - 1) * pageSize + index + 1
      },
      width: 80,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
    },
    {
      headerName: 'UNIT NAME',
      field: 'unit_name',
      minWidth: 200,
      flex: 1,
      hide: !visibleCols.name,
      cellClass: 'font-medium text-gray-900 flex items-center',
    },
    {
        headerName: 'DATE',
        field: 'created_at',
        width: 150,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 180,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const isActive = Number(params.value) === 1
        const isProcessing = isToggling && togglingId === params.data.id
        
       return (
        <div className="flex items-center gap-2 h-full leading-none">
          <span
            className={clsx(
              'inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase leading-none',
              isActive
                ? 'bg-[#dcfce7] text-[#166534]'
                : 'bg-[#fee2e2] text-[#991b1b]',
              isProcessing && 'opacity-50 blur-[0.5px]'
            )}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>

          <PermissionGuard permission="edit_unit">
            <button
              onClick={() =>
                handleStatusToggle(params.data.id, Number(params.value))
              }
              disabled={isProcessing}
              className={clsx(
                'flex items-center justify-center transition-all duration-300 transform active:scale-90',
                isActive ? 'text-primary' : 'text-gray-300',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isProcessing ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : isActive ? (
                <ToggleRight className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <ToggleLeft className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </PermissionGuard>
        </div>
      )
      }
    },
    {
      headerName: 'ACTIONS',
      width: 120,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['edit_unit', 'delete_unit']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="edit_unit">
            <button
              onClick={() => handleEdit(params.data.id)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit Unit"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_unit">
            <button
              onClick={() => handleDeleteClick(params.data.id)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
              title="Delete Unit"
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
    { name: 'Unit Name', field: 'name', visible: visibleCols.name },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
  ]

  const totalPages = Math.ceil((unitsData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'Manage Product', to: '/inventory/product' },
    { name: 'Manage Category', to: '/inventory/product/category' },
    { name: 'Manage Sub-Category', to: '/inventory/product/sub-category' },
    { name: 'Manage Unit', to: '/inventory/product/unit', active: true },
  ]

  return (
    <>
      <ListPageLayout
        title="Unit Management"
        backTo="/inventory/product"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_unit"
        addLabel="Add"
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={unitsData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={unitsData?.recordsFiltered || 0}
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
      />

      <UnitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        unitId={selectedUnitId}
        initialData={editData?.data}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Unit?"
        message="Are you sure you want to remove this unit? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
