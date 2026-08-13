import { useMemo, useState } from 'react'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  useDesignationsDatatable,
  useDeleteDesignation,
  useDesignationData,
  useToggleDesignationStatus,
} from '../../hooks/useDesignations'
import type { ColDef } from 'ag-grid-community'
import type { Designation } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'
import { DesignationModal } from '../../components/DesignationModal'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'

export const DesignationListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDesignationId, setSelectedDesignationId] = useState<number | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [designationToDelete, setDesignationToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    designation: true,
    details: true,
    date: true,
    status: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      status,
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
    [currentPage, pageSize, search, status, dateRange]
  )

  const { data: designationsData, isLoading } = useDesignationsDatatable(params)
  const { mutate: deleteDesignation, isPending: isDeleting } = useDeleteDesignation()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleDesignationStatus()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Fetch single designation data for edit prehydration
  const { data: editData } = useDesignationData(selectedDesignationId)

  // Actions
  const handleAdd = () => {
    setSelectedDesignationId(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: number) => {
    setSelectedDesignationId(id)
    setIsModalOpen(true)
  }

  const handleStatusToggle = (id: number, designation: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    setTogglingId(id)
    toggleStatus(
      { id, designation, status: newStatus },
      {
        onSuccess: () => {
          setTogglingId(null)
          showNotificationModal(
            'Status Updated!',
            `Designation status has been changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
            'success'
          )
        },
        onError: (error: any) => {
          setTogglingId(null)
          const message = error.response?.data?.message || error.message || 'Failed to update designation status.'
          showNotificationModal('Status Update Failed', message, 'error')
        },
      }
    )
  }

  const handleDeleteClick = (id: number) => {
    setDesignationToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (designationToDelete) {
      deleteDesignation(designationToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setDesignationToDelete(null)
          showNotificationModal(
            'Designation Deleted!',
            'The designation has been removed successfully.',
            'success'
          )
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!designationsData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Designation', key: 'designation', width: 30 },
      { header: 'Details', key: 'details', width: 40 },
      { header: 'Status', key: 'status', width: 12 },
    ]

    const exportData = designationsData.data.map((item, index) => ({
      sl: index + 1,
      designation: item.designation,
      details: item.details || '',
      status: Number(item.status) === 1 ? 'Active' : 'Inactive',
    }))

    exportToExcel(exportData, exportColumns, 'designations-list')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Designation>[]>(
    () => [
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
        headerName: 'DESIGNATION',
        field: 'designation',
        minWidth: 200,
        flex: 1,
        hide: !visibleCols.designation,
        cellClass: 'font-medium text-gray-900 flex items-center',
      },
      {
        headerName: 'DETAILS',
        field: 'details',
        minWidth: 250,
        flex: 1.5,
        hide: !visibleCols.details,
        cellClass: 'text-gray-600 flex items-center',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'DATE',
        field: 'created_at',
        width: 150,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => formatDate(params.value),
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
                  isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]',
                  isProcessing && 'opacity-50 blur-[0.5px]'
                )}
              >
                {isActive ? 'Active' : 'Inactive'}
              </span>

              <PermissionGuard permission="edit_designation">
                <button
                  onClick={() => handleStatusToggle(params.data.id, params.data.designation, Number(params.value))}
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
        },
      },
      {
        headerName: 'ACTIONS',
        width: 120,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_designation', 'delete_designation']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full">
            <PermissionGuard permission="edit_designation">
              <button
                onClick={() => handleEdit(params.data.id)}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                title="Edit Designation"
              >
                <Edit className="h-4 w-4" />
              </button>
            </PermissionGuard>

            <PermissionGuard permission="delete_designation">
              <button
                onClick={() => handleDeleteClick(params.data.id)}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                title="Delete Designation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, visibleCols, hasAnyPermission, isToggling, togglingId]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Designation', field: 'designation', visible: visibleCols.designation },
    { name: 'Details', field: 'details', visible: visibleCols.details },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
  ]

  const totalPages = Math.ceil((designationsData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'HRM', to: '/hrm/designation', active: true },
    { name: 'Attendance', to: '/hrm/attendance' },
    { name: 'Payroll', to: '/hrm/payroll' },
  ]

  const titleOptions = [
    { name: 'Designation List', to: '/hrm/designation' },
    { name: 'Employee List', to: '/hrm/employee' },
  ]

  return (
    <>
      <ListPageLayout
        title="Designation List"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_designation"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={designationsData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={designationsData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Filters
        showStatusFilter={true}
        onStatusChange={(val) => {
          setStatus(val)
          setCurrentPage(1)
        }}
        statusValue={status}
        statusOptions={statusOptions}
        fromDate={dateRange.start}
        toDate={dateRange.end}
        onDateRangeChange={(start, end) => {
          setDateRange({ start, end })
          setCurrentPage(1)
        }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        // Export
        onExport={handleExport}
      />

      <DesignationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        designationId={selectedDesignationId}
        initialData={editData?.data}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Designation?"
        message="Are you sure you want to remove this designation? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
