import { useMemo, useState } from 'react'
import { Edit, Trash2, LogOut } from 'lucide-react'
import {
  useAttendancesDatatable,
  useDeleteAttendance,
  useAttendanceData,
  useEmployeeSelect2,
} from '../../hooks/useAttendances'
import type { ColDef } from 'ag-grid-community'
import type { Attendance } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { Select2 } from '@/components/Select/Select2'
import { AttendanceModal } from '../../components/AttendanceModal'
import { formatDate } from '@/utils/formatters'

const formatTime = (dateTimeStr: string | null | undefined) => {
  if (!dateTimeStr) return '—'
  const d = new Date(dateTimeStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return dateTimeStr
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
}

export const AttendanceListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'sign_out'>('create')
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<number | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [attendanceToDelete, setAttendanceToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    employee_name: true,
    date: true,
    sign_in: true,
    sign_out: true,
    stay_time: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      employee_id: employeeId || undefined,
      fromDate: dateRange.start || undefined,
      toDate: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, employeeId, dateRange]
  )

  const { data: attendanceData, isLoading } = useAttendancesDatatable(params)
  const { mutate: deleteAttendance, isPending: isDeleting } = useDeleteAttendance()

  // Fetch single attendance data for edit/sign_out prehydration
  const { data: editData } = useAttendanceData(selectedAttendanceId)

  // Actions
  const handleAdd = () => {
    setSelectedAttendanceId(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = (id: number) => {
    setSelectedAttendanceId(id)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSignOutClick = (id: number) => {
    setSelectedAttendanceId(id)
    setModalMode('sign_out')
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setAttendanceToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (attendanceToDelete) {
      deleteAttendance(attendanceToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setAttendanceToDelete(null)
          showNotificationModal(
            'Record Deleted!',
            'Attendance record has been deleted successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          setIsConfirmOpen(false)
          setAttendanceToDelete(null)
          const msg = err.response?.data?.message || err.message || 'Failed to delete.'
          showNotificationModal('Error', msg, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Attendance>[]>(
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
        headerName: 'NAME',
        field: 'employee_name',
        minWidth: 200,
        flex: 1,
        hide: !visibleCols.employee_name,
        cellClass: 'font-medium text-gray-900 flex items-center',
      },
      {
        headerName: 'DATE',
        field: 'date',
        width: 150,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        headerName: 'CHECK IN',
        field: 'sign_in',
        width: 150,
        hide: !visibleCols.sign_in,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => formatTime(params.value),
      },
      {
        headerName: 'CHECK OUT',
        field: 'sign_out',
        width: 180,
        hide: !visibleCols.sign_out,
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: any) => {
          const val = params.value
          const isEmpty =
            !val ||
            val === '0000-00-00 00:00:00' ||
            (typeof val === 'string' && (
              val.trim() === '' ||
              val.trim() === 'null' ||
              val.trim() === 'undefined' ||
              val.includes('<a')
            ))
          if (isEmpty) {
            return (
              <div className="flex items-center justify-center w-full h-full">
                <PermissionGuard permission="edit_attendance">
                  <button
                    onClick={() => handleSignOutClick(params.data.id)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95 leading-none"
                    title="Sign Out"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </PermissionGuard>
              </div>
            )
          }
          return (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-gray-600 font-poppins">{formatTime(val)}</span>
            </div>
          )
        },
      },
      {
        headerName: 'STAY TIME',
        field: 'stay_time',
        width: 150,
        hide: !visibleCols.stay_time,
        cellClass: 'text-gray-600 flex items-center justify-center font-semibold',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'ACTIONS',
        width: 120,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_attendance', 'delete_attendance']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full">
            <PermissionGuard permission="edit_attendance">
              <button
                onClick={() => handleEdit(params.data.id)}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                title="Edit Attendance"
              >
                <Edit className="h-4 w-4" />
              </button>
            </PermissionGuard>

            <PermissionGuard permission="delete_attendance">
              <button
                onClick={() => handleDeleteClick(params.data.id)}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                title="Delete Attendance"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, visibleCols, hasAnyPermission]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Employee Name', field: 'employee_name', visible: visibleCols.employee_name },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Check In', field: 'sign_in', visible: visibleCols.sign_in },
    { name: 'Check Out', field: 'sign_out', visible: visibleCols.sign_out },
    { name: 'Stay Time', field: 'stay_time', visible: visibleCols.stay_time },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const totalPages = Math.ceil((attendanceData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'HRM', to: '/hrm/designation' },
    { name: 'Attendance', to: '/hrm/attendance', active: true },
    { name: 'Payroll', to: '/hrm/payroll' },
  ]

  const titleOptions = [
    { name: 'Attendance List', to: '/hrm/attendance' },
    { name: 'Attendance Report', to: '/hrm/attendance-report' },
  ]

  // Employee filter dropdown in toolbar
  const { data: employeesData } = useEmployeeSelect2()
  const employeeOptions = useMemo(() => [
    { value: '', label: 'All Employees' },
    ...(employeesData || []).map((emp: any) => ({
      value: emp.id,
      label: emp.text || emp.name,
    }))
  ], [employeesData])

  const toolbarExtra = (
    <div className="w-[180px] shrink-0 z-50">
      <Select2
        options={employeeOptions}
        value={employeeId}
        onChange={(val) => {
          setEmployeeId(val as string)
          setCurrentPage(1)
        }}
        rounded="full"
        variant="solid"
      />
    </div>
  )

  return (
    <>
      <ListPageLayout
        title="Attendance List"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_attendance"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={attendanceData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={attendanceData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Date range filters
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
        toolbarExtra={toolbarExtra}
      />

      <AttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        attendanceId={selectedAttendanceId}
        mode={modalMode}
        initialData={editData?.data}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Attendance Record?"
        message="Are you sure you want to remove this attendance entry? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
