import { useMemo, useState } from 'react'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  useDepartments,
  useDeleteDepartment,
  useDepartmentData,
  useToggleDepartmentStatus,
} from '../../hooks/useDepartments'
import type { ColDef } from 'ag-grid-community'
import type { Department } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'
import { DepartmentModal } from '../../components/DepartmentModal'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'

export const DepartmentListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    code: true,
    details: true,
    date: true,
    status: true,
    action: true,
  })

  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      search: search || undefined,
      status: status || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, status, dateRange]
  )

  const { data: departmentsData, isLoading } = useDepartments(params)
  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleDepartmentStatus()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Fetch single department data for edit prehydration
  const { data: editData } = useDepartmentData(selectedDepartmentId)

  // Actions
  const handleAdd = () => {
    setSelectedDepartmentId(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: number) => {
    setSelectedDepartmentId(id)
    setIsModalOpen(true)
  }

  const handleStatusToggle = (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    setTogglingId(id)
    toggleStatus(
      { id, status: newStatus },
      {
        onSuccess: () => {
          setTogglingId(null)
          showNotificationModal(
            'Status Updated!',
            `Department status has been changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
            'success'
          )
        },
        onError: (error: any) => {
          setTogglingId(null)
          const message =
            error.response?.data?.message ||
            error.message ||
            'Failed to update department status.'
          showNotificationModal('Status Update Failed', message, 'error')
        },
      }
    )
  }

  const handleDeleteClick = (id: number) => {
    setDepartmentToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (departmentToDelete) {
      deleteDepartment(departmentToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setDepartmentToDelete(null)
          showNotificationModal(
            'Department Deleted!',
            'The department has been removed successfully.',
            'success'
          )
        },
        onError: (error: any) => {
          const message =
            error.response?.data?.message ||
            error.message ||
            'Failed to delete department.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }))
  }

  const departmentsList = useMemo(
    () => departmentsData?.response || departmentsData?.data || [],
    [departmentsData]
  )
  const totalRecords = departmentsData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const handleExport = () => {
    if (!departmentsList.length) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Department Name', key: 'name', width: 30 },
      { header: 'Code', key: 'code', width: 16 },
      { header: 'Details', key: 'details', width: 40 },
      { header: 'Status', key: 'status', width: 12 },
    ]

    const exportData = departmentsList.map((item, index) => ({
      sl: index + 1,
      name: item.name,
      code: item.code || '—',
      details: item.details || '',
      status: Number(item.status) === 1 ? 'Active' : 'Inactive',
    }))

    exportToExcel(exportData, exportColumns, 'departments-list')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Department>[]>(
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
        cellClass:
          'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'DEPARTMENT NAME',
        field: 'name',
        minWidth: 200,
        flex: 1.2,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'CODE',
        field: 'code',
        width: 140,
        hide: !visibleCols.code,
        cellClass: 'font-mono text-xs text-indigo-600 font-bold flex items-center',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'DETAILS / FUNCTION',
        field: 'details',
        minWidth: 240,
        flex: 1.5,
        hide: !visibleCols.details,
        cellClass: 'text-gray-600 flex items-center',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'DATE',
        field: 'created_at',
        width: 140,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center text-xs',
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 170,
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

              <PermissionGuard permission="edit_department">
                <button
                  onClick={() =>
                    handleStatusToggle(
                      params.data.id,
                      Number(params.value)
                    )
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
        },
      },
      {
        headerName: 'ACTIONS',
        width: 120,
        pinned: 'right',
        hide:
          !visibleCols.action ||
          !hasAnyPermission(['edit_department', 'delete_department']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full">
            <PermissionGuard permission="edit_department">
              <button
                onClick={() => handleEdit(params.data.id)}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                title="Edit Department"
              >
                <Edit className="h-4 w-4" />
              </button>
            </PermissionGuard>

            <PermissionGuard permission="delete_department">
              <button
                onClick={() => handleDeleteClick(params.data.id)}
                className="p-2 hover:bg-rose-50 text-[#f43f5e] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/delete"
                title="Delete Department"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [
      currentPage,
      pageSize,
      visibleCols,
      isToggling,
      togglingId,
      hasAnyPermission,
    ]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Department Name', field: 'name', visible: visibleCols.name },
    { name: 'Code', field: 'code', visible: visibleCols.code },
    { name: 'Details', field: 'details', visible: visibleCols.details },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
  ]

  const tabs = [
    { name: 'HRM', to: '/hrm/department', active: true },
    { name: 'Attendance', to: '/hrm/attendance' },
    { name: 'Payroll', to: '/hrm/payroll' },
  ]

  const titleOptions = [
    { name: 'Department List', to: '/hrm/department' },
    { name: 'Designation List', to: '/hrm/designation' },
    { name: 'Employee List', to: '/hrm/employee' },
  ]

  return (
    <>
      <ListPageLayout
        title="Department List"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_department"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={departmentsList}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={totalRecords}
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

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departmentId={selectedDepartmentId}
        initialData={editData?.data}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Department?"
        message="Are you sure you want to remove this department? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
