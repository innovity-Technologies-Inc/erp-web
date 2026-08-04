import { useMemo, useState } from 'react'
import { Edit, Trash2, User } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  useEmployeesDatatable,
  useDeleteEmployee,
} from '../hooks/useEmployees'
import type { ColDef } from 'ag-grid-community'
import type { Employee } from '../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'

export const EmployeeListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<{ uuid: string; id: number } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    image: true,
    name: true,
    designation: true,
    phone: true,
    email: true,
    date: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
    [currentPage, pageSize, search, dateRange]
  )

  const { data: employeesData, isLoading } = useEmployeesDatatable(params)
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee()

  // Actions
  const handleCreate = () => {
    navigate({ to: '/hrm/employee/create' })
  }

  const handleDeleteClick = (uuid: string, id: number) => {
    setEmployeeToDelete({ uuid, id })
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setEmployeeToDelete(null)
          showNotificationModal(
            'Employee Deleted!',
            'The employee has been removed successfully.',
            'success'
          )
        },
        onError: (error: any) => {
          setIsConfirmOpen(false)
          setEmployeeToDelete(null)
          const message = error.response?.data?.message || error.message || 'Failed to delete employee.'
          showNotificationModal('Deletion Failed', message, 'error')
        }
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Employee>[]>(
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
        headerName: 'PICTURE',
        field: 'image',
        width: 100,
        hide: !visibleCols.image,
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: any) => {
          return (
            <div className="w-10 h-10 rounded-full border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
              <img
                src={params.value}
                alt={params.data?.name || 'Employee'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-image/user-profile.png'
                }}
              />
            </div>
          )
        }
      },
      {
        headerName: 'NAME',
        field: 'name',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.name,
        cellClass: 'font-medium text-gray-900 flex items-center',
      },
      {
        headerName: 'DESIGNATION',
        field: 'designation',
        minWidth: 150,
        flex: 1,
        hide: !visibleCols.designation,
        cellClass: 'text-gray-700 font-medium flex items-center',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'PHONE',
        field: 'phone',
        minWidth: 140,
        hide: !visibleCols.phone,
        cellClass: 'text-gray-600 flex items-center',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'EMAIL',
        field: 'email',
        minWidth: 200,
        flex: 1.2,
        hide: !visibleCols.email,
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
        headerName: 'ACTIONS',
        width: 150,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['view_employee', 'edit_employee', 'delete_employee']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full">
            <PermissionGuard permission="view_employee">
              <button
                onClick={() => navigate({ to: `/hrm/employee/show/${params.data.uuid}` })}
                className="p-2 hover:bg-slate-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all border border-transparent hover:border-slate-100 hover:scale-110 group/view"
                title="View Profile"
              >
                <User className="h-4 w-4" />
              </button>
            </PermissionGuard>

            <PermissionGuard permission="edit_employee">
              <button
                onClick={() => navigate({ to: `/hrm/employee/edit/${params.data.uuid}` })}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                title="Edit Employee"
              >
                <Edit className="h-4 w-4" />
              </button>
            </PermissionGuard>

            <PermissionGuard permission="delete_employee">
              <button
                onClick={() => handleDeleteClick(params.data.uuid, params.data.id)}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                title="Delete Employee"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, visibleCols, hasAnyPermission, navigate]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Picture', field: 'image', visible: visibleCols.image },
    { name: 'Name', field: 'name', visible: visibleCols.name },
    { name: 'Designation', field: 'designation', visible: visibleCols.designation },
    { name: 'Phone', field: 'phone', visible: visibleCols.phone },
    { name: 'Email', field: 'email', visible: visibleCols.email },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const totalPages = Math.ceil((employeesData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'HRM', to: '/hrm/employee', active: true },
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
        title="Employee List"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        onCreate={handleCreate}
        createPermission="create_employee"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={employeesData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={employeesData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Date Range
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
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Employee?"
        message="Are you sure you want to remove this employee? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
