import { useMemo, useState } from 'react'
import {
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Lock,
} from 'lucide-react'
import {
  useBudgets,
  useDeleteBudget,
} from '../../hooks/useBudgets'
import type { ColDef } from 'ag-grid-community'
import type { Budget, BudgetStatus } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { useSettings } from '@/hooks/useSettings'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { BudgetModal } from '../../components/budget/BudgetModal'
import { BudgetApprovalModal } from '../../components/budget/BudgetApprovalModal'
import type { BudgetActionType } from '../../components/budget/BudgetApprovalModal'
import { BudgetTransferModal } from '../../components/budget/BudgetTransferModal'
import { BudgetDetailsModal } from '../../components/budget/BudgetDetailsModal'
import { useDepartments } from '@/modules/hrm'
import { clsx } from 'clsx'

const statusBadgeColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
}

export const BudgetListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const { currency, currencyPosition } = useSettings()

  // Dynamic Departments from HRM
  const { data: departmentsData } = useDepartments({ all: true })
  const deptMap = useMemo(() => {
    const list = departmentsData?.data || departmentsData?.response || []
    return Object.fromEntries(list.map((d: any) => [String(d.id), d.name]))
  }, [departmentsData])

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null)

  // Details Modal
  const [detailsUuid, setDetailsUuid] = useState<string | null>(null)

  // Approval Modal
  const [approvalState, setApprovalState] = useState<{
    isOpen: boolean
    budget: Budget | null
    action: BudgetActionType
  }>({
    isOpen: false,
    budget: null,
    action: 'submit',
  })

  // Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [sourceBudgetForTransfer, setSourceBudgetForTransfer] = useState<Budget | null>(null)

  // Delete Confirmation States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState<{ uuid: string; budgetNo: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    budget_no: true,
    financial_year: true,
    cost_center: true,
    budget_head: true,
    department: true,
    allocated_amount: true,
    remarks: true,
    status: true,
    date: true,
    action: true,
  })

  // Data Fetching params
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

  const { data: budgetsData, isLoading } = useBudgets(params)
  const { mutate: deleteBudget, isPending: isDeleting } = useDeleteBudget()

  // Actions
  const handleAdd = () => {
    setBudgetToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (budget: Budget) => {
    setBudgetToEdit(budget)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (budget: { uuid: string; budgetNo: string }) => {
    setBudgetToDelete(budget)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (budgetToDelete) {
      deleteBudget(budgetToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setBudgetToDelete(null)
          showNotificationModal(
            'Budget Deleted!',
            'Draft budget allocation has been removed successfully.',
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete budget.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const handleActionClick = (budget: Budget, action: BudgetActionType) => {
    setApprovalState({
      isOpen: true,
      budget,
      action,
    })
  }

  const handleTransferClick = (budget?: Budget) => {
    setSourceBudgetForTransfer(budget || null)
    setIsTransferOpen(true)
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!budgetsData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Budget No', key: 'budget_no', width: 20 },
      { header: 'Financial Year', key: 'fy', width: 15 },
      { header: 'Cost Center', key: 'cost_center', width: 25 },
      { header: 'Budget Head', key: 'budget_head', width: 25 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Allocated Amount', key: 'amount', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Date', key: 'created_at', width: 16 },
    ]

    const exportData = budgetsData.response.map((item, index) => ({
      sl: index + 1,
      budget_no: item.budget_no || 'DRAFT',
      fy: item.financial_year?.year || '—',
      cost_center: item.cost_center?.name || '—',
      budget_head: item.budget_head?.name || '—',
      department: deptMap[String(item.department_id)] || `Dept #${item.department_id}`,
      amount: Number(item.allocated_amount),
      status: item.status_label || item.status,
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'procurement-budgets')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Budget>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 70,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'BUDGET NO',
        field: 'budget_no',
        minWidth: 220,
        width: 240,
        hide: !visibleCols.budget_no,
        cellRenderer: (params: any) => {
          const bNo = params.value
          const uuid = params.data?.uuid
          if (!bNo) {
            return (
              <div className="flex items-center h-full">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-gray-100 text-gray-500 border border-gray-200">
                  DRAFT
                </span>
              </div>
            )
          }
          return (
            <div className="flex items-center h-full">
              <button
                onClick={() => setDetailsUuid(uuid)}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
                title="View Balances & Details"
              >
                {bNo}
              </button>
            </div>
          )
        },
      },
      {
        headerName: 'FINANCIAL YEAR',
        field: 'financial_year',
        width: 140,
        hide: !visibleCols.financial_year,
        cellRenderer: (params: any) => {
          return (
            <span className="text-gray-700 font-medium flex items-center h-full">
              {params.data?.financial_year?.year || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'COST CENTER',
        field: 'cost_center',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.cost_center,
        cellRenderer: (params: any) => {
          return (
            <span className="text-gray-800 font-medium flex items-center h-full">
              {params.data?.cost_center?.name || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'BUDGET HEAD',
        field: 'budget_head',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.budget_head,
        cellRenderer: (params: any) => {
          return (
            <span className="text-gray-900 font-semibold flex items-center h-full">
              {params.data?.budget_head?.name || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'DEPARTMENT',
        field: 'department_id',
        minWidth: 160,
        flex: 1,
        hide: !visibleCols.department,
        cellRenderer: (params: any) => {
          const deptName = deptMap[String(params.value)] || `Dept #${params.value}`
          return <span className="text-gray-600 flex items-center h-full text-xs">{deptName}</span>
        },
      },
      {
        headerName: 'ALLOCATED AMOUNT',
        field: 'allocated_amount',
        minWidth: 180,
        width: 200,
        hide: !visibleCols.allocated_amount,
        cellClass: 'flex items-center justify-end pr-3',
        cellRenderer: (params: any) => {
          const val = params.data?.allocated_limit ?? params.value ?? 0
          return (
            <span className="font-mono font-bold text-gray-900 text-sm whitespace-nowrap">
              {formatCurrency(Number(val), currency, currencyPosition)}
            </span>
          )
        },
      },
      {
        headerName: 'NOTE / REMARKS',
        field: 'remarks',
        minWidth: 220,
        flex: 2,
        hide: !visibleCols.remarks,
        cellRenderer: (params: any) => {
          return (
            <span className="text-gray-600 flex items-center h-full text-xs truncate" title={params.value}>
              {params.value || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 125,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const st = (params.value as BudgetStatus) || 'draft'
          const badgeClass = statusBadgeColors[st] || 'bg-gray-100 text-gray-700'
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  badgeClass
                )}
              >
                {params.data?.status_label || st}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'DATE',
        field: 'created_at',
        width: 130,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'ACTIONS',
        width: 170,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1',
        cellRenderer: (params: any) => {
          const data: Budget = params.data
          const st = data.status

          return (
            <div className="flex items-center gap-1 h-full">
              {/* View Balance Breakdown */}
              <button
                onClick={() => setDetailsUuid(data.uuid)}
                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                title="View Balances & Limits"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Status Specific Actions */}
              {st === 'draft' && (
                <>
                  <PermissionGuard permission="submit_budget">
                    <button
                      onClick={() => handleActionClick(data, 'submit')}
                      className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all"
                      title="Submit for Approval"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </PermissionGuard>

                  <PermissionGuard permission="edit_budget">
                    <button
                      onClick={() => handleEdit(data)}
                      className="p-1.5 hover:bg-emerald-50 text-[#10b981] rounded-lg transition-all"
                      title="Edit Draft"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </PermissionGuard>

                  <PermissionGuard permission="delete_budget">
                    <button
                      onClick={() => handleDeleteClick({ uuid: data.uuid, budgetNo: data.budget_no || 'Draft' })}
                      className="p-1.5 hover:bg-rose-50 text-[#ef4444] rounded-lg transition-all"
                      title="Delete Draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </PermissionGuard>
                </>
              )}

              {st === 'submitted' && (
                <PermissionGuard permission="approve_budget">
                  <button
                    onClick={() => handleActionClick(data, 'approve')}
                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                    title="Approve Budget"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleActionClick(data, 'reject')}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                    title="Reject Budget"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {st === 'approved' && (
                <>
                  <PermissionGuard permission="transfer_budget">
                    <button
                      onClick={() => handleTransferClick(data)}
                      className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-all"
                      title="Transfer Funds Out"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                  </PermissionGuard>

                  <PermissionGuard permission="close_budget">
                    <button
                      onClick={() => handleActionClick(data, 'close')}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                      title="Close Budget"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  </PermissionGuard>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, visibleCols, hasPermission, hasAnyPermission, currency, currencyPosition]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Budget No', field: 'budget_no', visible: visibleCols.budget_no },
    { name: 'Financial Year', field: 'financial_year', visible: visibleCols.financial_year },
    { name: 'Cost Center', field: 'cost_center', visible: visibleCols.cost_center },
    { name: 'Budget Head', field: 'budget_head', visible: visibleCols.budget_head },
    { name: 'Department', field: 'department', visible: visibleCols.department },
    { name: 'Allocated Amount', field: 'allocated_amount', visible: visibleCols.allocated_amount },
    { name: 'Note / Remarks', field: 'remarks', visible: visibleCols.remarks },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Closed', value: 'closed' },
  ]

  const totalRecords = budgetsData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors' },
    { name: 'Requisitions & RFQ', to: '/procurement/sourcing' },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns' },
    { name: 'Invoices & Payments', to: '/procurement/invoices' },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', active: true },
  ]

  const titleOptions = [
    { name: 'Budget Allocations', to: '/procurement/budgets' },
    { name: 'Budget Categories', to: '/procurement/budgets/categories' },
    { name: 'Budget Heads', to: '/procurement/budgets/heads' },
    { name: 'Cost Centers', to: '/procurement/cost-centers' },
  ]

  return (
    <>
      <ListPageLayout
        title="Budgets & Allocations"
        titleOptions={titleOptions}
        backTo="/procurement/vendors"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_budget"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={budgetsData?.response || []}
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

      {/* Create / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setBudgetToEdit(null)
        }}
        budgetToEdit={budgetToEdit}
      />

      {/* Workflow Action Modal (Submit, Approve, Reject, Close) */}
      <BudgetApprovalModal
        isOpen={approvalState.isOpen}
        onClose={() => setApprovalState({ isOpen: false, budget: null, action: 'submit' })}
        budget={approvalState.budget}
        action={approvalState.action}
      />

      {/* Budget Transfer Modal */}
      <BudgetTransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false)
          setSourceBudgetForTransfer(null)
        }}
        sourceBudget={sourceBudgetForTransfer}
      />

      {/* Budget Details & Balances Modal */}
      <BudgetDetailsModal
        isOpen={!!detailsUuid}
        onClose={() => setDetailsUuid(null)}
        budgetUuid={detailsUuid}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Budget Allocation?"
        message={`Are you sure you want to remove draft budget allocation "${budgetToDelete?.budgetNo}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
