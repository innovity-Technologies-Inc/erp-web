import { useMemo, useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import {
  useSalaryAdvancesDatatable,
  useDeleteSalaryAdvance,
} from '../../hooks/useSalaryAdvances'
import type { ColDef } from 'ag-grid-community'
import type { SalaryAdvance } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { SalaryAdvanceModal } from '../../components/SalaryAdvanceModal'

export const SalaryAdvanceListPage = () => {
  const { showNotificationModal } = useUiStore()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvance | null>(null)

  // Delete Confirm States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [advanceToDelete, setAdvanceToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    employee_name: true,
    amount: true,
    release_amount: true,
    salary_month: true,
    created_at: true,
    actions: true,
  })

  // Data Query Params
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
    }),
    [currentPage, pageSize, search]
  )

  const { data: advanceData, isLoading } = useSalaryAdvancesDatatable(params)
  const { mutate: deleteAdvance, isPending: isDeleting } = useDeleteSalaryAdvance()

  const handleAdd = () => {
    setModalMode('create')
    setSelectedAdvance(null)
    setIsModalOpen(true)
  }

  const handleEdit = (data: SalaryAdvance) => {
    setModalMode('edit')
    setSelectedAdvance(data)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setAdvanceToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (advanceToDelete) {
      deleteAdvance(advanceToDelete, {
        onSuccess: (res: any) => {
          setIsConfirmOpen(false)
          setAdvanceToDelete(null)
          showNotificationModal(
            'Deleted Successfully',
            res?.message || 'Salary advance record has been deleted.',
            'success'
          )
        },
        onError: (err: any) => {
          setIsConfirmOpen(false)
          setAdvanceToDelete(null)
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
  const columnDefs = useMemo<ColDef<SalaryAdvance>[]>(
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
        minWidth: 220,
        flex: 1,
        hide: !visibleCols.employee_name,
        cellClass: 'font-medium text-gray-900 flex items-center',
      },
      {
        headerName: 'AMOUNT',
        field: 'amount',
        width: 150,
        hide: !visibleCols.amount,
        cellClass: 'text-gray-700 flex items-center justify-end font-semibold px-4',
        valueFormatter: (params) => params.value ? `$${Number(params.value).toLocaleString()}` : '$0',
      },
      {
        headerName: 'RELEASE AMOUNT',
        field: 'release_amount',
        width: 180,
        hide: !visibleCols.release_amount,
        cellClass: 'text-gray-700 flex items-center justify-end font-semibold px-4',
        valueFormatter: (params) => params.value ? `$${Number(params.value).toLocaleString()}` : '$0',
      },
      {
        headerName: 'SALARY MONTH',
        field: 'salary_month',
        width: 180,
        hide: !visibleCols.salary_month,
        cellClass: 'text-gray-600 flex items-center justify-center font-medium',
      },
      {
        headerName: 'CREATED AT',
        field: 'created_at',
        width: 150,
        hide: !visibleCols.created_at,
        cellClass: 'text-gray-500 flex items-center justify-center',
      },
      {
        headerName: 'ACTIONS',
        field: 'actions',
        width: 120,
        pinned: 'right',
        hide: !visibleCols.actions,
        cellClass: 'flex items-center justify-center gap-2 border-l border-primary/10',
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full justify-center">
            <PermissionGuard permission="edit_salary_advance">
              <button
                onClick={() => handleEdit(params.data)}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-105 active:scale-95 border border-blue-100"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </PermissionGuard>
            <PermissionGuard permission="delete_salary_advance">
              <button
                onClick={() => handleDeleteClick(params.data.id)}
                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all hover:scale-105 active:scale-95 border border-rose-100"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, visibleCols]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Employee Name', field: 'employee_name', visible: visibleCols.employee_name },
    { name: 'Amount', field: 'amount', visible: visibleCols.amount },
    { name: 'Release Amount', field: 'release_amount', visible: visibleCols.release_amount },
    { name: 'Salary Month', field: 'salary_month', visible: visibleCols.salary_month },
    { name: 'Created At', field: 'created_at', visible: visibleCols.created_at },
    { name: 'Actions', field: 'actions', visible: visibleCols.actions },
  ]

  const totalPages = Math.ceil((advanceData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'HRM', to: '/hrm/designation' },
    { name: 'Attendance', to: '/hrm/attendance' },
    { name: 'Payroll', to: '/hrm/payroll', active: true },
  ]

  const titleOptions = [
    { name: 'Salary Advance', to: '/hrm/payroll' },
    { name: 'Salary Generate', to: '/hrm/payroll-generate' },
    { name: 'Manage Employee Salary', to: '/hrm/payroll-manage-salary' },
  ]

  return (
    <>
      <ListPageLayout
        title="Salary Advance"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_salary_advance"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={advanceData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={advanceData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
      />

      <SalaryAdvanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAdvance(null)
        }}
        mode={modalMode}
        salaryAdvanceId={selectedAdvance?.id}
        initialData={selectedAdvance}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setAdvanceToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Salary Advance"
        description="Are you sure you want to delete this salary advance? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </>
  )
}
