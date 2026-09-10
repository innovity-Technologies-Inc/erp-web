import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react'
import {
  usePurchaseRequisitions,
  useDeletePurchaseRequisition,
  useApprovePurchaseRequisition,
} from '../../hooks/usePurchaseRequisitions'
import type { ColDef } from 'ag-grid-community'
import type { PurchaseRequisition, PRStatus, PRPriority } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { useSettings } from '@/hooks/useSettings'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { useDepartments } from '@/modules/hrm'
import { useCostCenters } from '../../hooks/useCostCenters'
import { clsx } from 'clsx'

const statusBadgeColors: Record<PRStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

const priorityBadgeColors: Record<PRPriority, string> = {
  low: 'bg-slate-50 text-slate-600 border-slate-200',
  medium: 'bg-sky-50 text-sky-700 border-sky-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
}

export const PurchaseRequisitionListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const { currency, currencyPosition } = useSettings()

  // Dynamic Departments from HRM & Cost Centers from Procurement
  const { data: departmentsData } = useDepartments({ all: true })
  const deptMap = useMemo(() => {
    const list = departmentsData?.data || departmentsData?.response || []
    return Object.fromEntries(list.map((d: any) => [String(d.id), d.name]))
  }, [departmentsData])

  const { data: costCentersData } = useCostCenters({ per_page: 100 })
  const costCenterMap = useMemo(() => {
    const list = costCentersData?.response || []
    return Object.fromEntries(list.map((c: any) => [String(c.id), c.name]))
  }, [costCentersData])

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [priority, setPriority] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Delete Confirmation States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [prToDelete, setPrToDelete] = useState<{ uuid: string; prNo: string } | null>(null)

  // Action Confirmation (Submit / Approve / Reject)
  const [actionConfirm, setActionConfirm] = useState<{
    isOpen: boolean
    uuid: string
    prNo: string
    action: 'submit' | 'approve' | 'reject'
    remarks?: string
  }>({
    isOpen: false,
    uuid: '',
    prNo: '',
    action: 'submit',
    remarks: '',
  })

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    pr_no: true,
    pr_date: true,
    required_by_date: true,
    department: true,
    cost_center: true,
    requisitioner: true,
    designation: false,
    total_estimated_amount: true,
    priority: true,
    procurement_type: true,
    status: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, status, priority, dateRange]
  )

  const { data: prData, isLoading } = usePurchaseRequisitions(params)
  const { mutate: deletePR, isPending: isDeleting } = useDeletePurchaseRequisition()
  const { mutate: approvePR, isPending: isActionPending } = useApprovePurchaseRequisition()

  // Actions
  const handleAdd = () => {
    navigate({ to: '/procurement/purchase-requisitions/create' as any })
  }

  const handleEdit = (pr: PurchaseRequisition) => {
    navigate({ to: `/procurement/purchase-requisitions/edit/${pr.uuid}` as any })
  }

  const handleView = (pr: PurchaseRequisition) => {
    navigate({ to: `/procurement/purchase-requisitions/view/${pr.uuid}` as any })
  }

  const handleDeleteClick = (pr: { uuid: string; prNo: string }) => {
    setPrToDelete(pr)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (prToDelete) {
      deletePR(prToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setPrToDelete(null)
          showNotificationModal(
            'Purchase Requisition Deleted!',
            'Draft purchase requisition has been removed successfully.',
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete purchase requisition.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const handleActionSubmit = () => {
    if (!actionConfirm.uuid) return
    approvePR(
      {
        uuid: actionConfirm.uuid,
        action: actionConfirm.action,
        remarks: actionConfirm.remarks,
      },
      {
        onSuccess: () => {
          const actionText =
            actionConfirm.action === 'submit'
              ? 'Submitted'
              : actionConfirm.action === 'approve'
                ? 'Approved'
                : 'Rejected'
          setActionConfirm({ isOpen: false, uuid: '', prNo: '', action: 'submit' })
          showNotificationModal(
            `Purchase Requisition ${actionText}!`,
            `PR ${actionConfirm.prNo} has been ${actionText.toLowerCase()} successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Action failed.'
          showNotificationModal('Action Failed', message, 'error')
        },
      }
    )
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!prData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'PR No', key: 'pr_no', width: 22 },
      { header: 'Date', key: 'pr_date', width: 14 },
      { header: 'Required By', key: 'required_by_date', width: 14 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Cost Center', key: 'cost_center', width: 25 },
      { header: 'Requisitioner', key: 'requisitioner', width: 22 },
      { header: 'Designation', key: 'designation', width: 18 },
      { header: 'Estimated Amount', key: 'amount', width: 18 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Type', key: 'procurement_type', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
    ]

    const exportData = prData.response.map((item, index) => ({
      sl: index + 1,
      pr_no: item.pr_no,
      pr_date: item.pr_date ? formatDate(item.pr_date) : '—',
      required_by_date: item.required_by_date ? formatDate(item.required_by_date) : '—',
      department: item.department?.name || deptMap[String(item.department_id)] || `Dept #${item.department_id}`,
      cost_center: item.cost_center?.name || costCenterMap[String(item.cost_center_id)] || `CC #${item.cost_center_id}`,
      requisitioner: item.requisitioner_name,
      designation: item.designation || '—',
      amount: Number(item.total_estimated_amount),
      priority: item.priority.toUpperCase(),
      procurement_type: item.procurement_type.toUpperCase(),
      status: item.status_label || item.status,
    }))

    exportToExcel(exportData, exportColumns, 'purchase-requisitions')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<PurchaseRequisition>[]>(
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
        headerName: 'PR NO',
        field: 'pr_no',
        minWidth: 200,
        width: 220,
        hide: !visibleCols.pr_no,
        cellRenderer: (params: any) => {
          const pr = params.data as PurchaseRequisition
          return (
            <div className="flex items-center h-full">
              <button
                onClick={() => handleView(pr)}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
                title="View Purchase Requisition"
              >
                {pr.pr_no}
              </button>
            </div>
          )
        },
      },
      {
        headerName: 'DATE',
        field: 'pr_date',
        width: 120,
        hide: !visibleCols.pr_date,
        cellClass: 'text-gray-700 font-medium flex items-center',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'REQUIRED BY',
        field: 'required_by_date',
        width: 130,
        hide: !visibleCols.required_by_date,
        cellClass: 'text-gray-700 font-medium flex items-center',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'DEPARTMENT',
        field: 'department_id',
        minWidth: 160,
        flex: 1,
        hide: !visibleCols.department,
        cellRenderer: (params: any) => {
          const deptName = params.data?.department?.name || deptMap[String(params.value)] || `Dept #${params.value}`
          return <span className="text-gray-800 font-medium flex items-center h-full text-xs">{deptName}</span>
        },
      },
      {
        headerName: 'COST CENTER',
        field: 'cost_center_id',
        minWidth: 160,
        flex: 1,
        hide: !visibleCols.cost_center,
        cellRenderer: (params: any) => {
          const ccName = params.data?.cost_center?.name || costCenterMap[String(params.value)] || `CC #${params.value}`
          return <span className="text-gray-800 font-medium flex items-center h-full text-xs">{ccName}</span>
        },
      },
      {
        headerName: 'REQUISITIONER',
        field: 'requisitioner_name',
        minWidth: 150,
        flex: 1,
        hide: !visibleCols.requisitioner,
        cellRenderer: (params: any) => {
          return (
            <span className="text-gray-900 font-medium text-xs truncate flex items-center h-full">
              {params.value || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'DESIGNATION',
        field: 'designation',
        minWidth: 140,
        flex: 1,
        hide: !visibleCols.designation,
        cellRenderer: (params: any) => {
          return (
            <span className="text-gray-600 text-xs truncate flex items-center h-full">
              {params.value || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'ESTIMATED AMOUNT',
        field: 'total_estimated_amount',
        minWidth: 160,
        width: 170,
        hide: !visibleCols.total_estimated_amount,
        cellClass: 'flex items-center justify-end pr-3',
        cellRenderer: (params: any) => {
          const val = params.value ?? 0
          return (
            <span className="font-mono font-bold text-gray-900 text-sm whitespace-nowrap">
              {formatCurrency(Number(val), currency, currencyPosition)}
            </span>
          )
        },
      },
      {
        headerName: 'PRIORITY',
        field: 'priority',
        width: 110,
        hide: !visibleCols.priority,
        cellRenderer: (params: any) => {
          const prio = (params.value as PRPriority) || 'medium'
          const badgeClass = priorityBadgeColors[prio] || 'bg-gray-100 text-gray-700'
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border capitalize leading-none',
                  badgeClass
                )}
              >
                {prio}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'TYPE',
        field: 'procurement_type',
        width: 115,
        hide: !visibleCols.procurement_type,
        cellRenderer: (params: any) => {
          const isEm = params.data?.is_emergency || params.value === 'emergency'
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border leading-none',
                  isEm
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                )}
              >
                {isEm ? 'Emergency' : 'Normal'}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 125,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const st = (params.value as PRStatus) || 'draft'
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
        headerName: 'ACTIONS',
        width: 170,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1',
        cellRenderer: (params: any) => {
          const data: PurchaseRequisition = params.data
          const st = data.status

          return (
            <div className="flex items-center gap-1 h-full">
              {/* View PR Details */}
              <button
                onClick={() => handleView(data)}
                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all cursor-pointer"
                title="View Purchase Requisition"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Status Specific Actions */}
              {st === 'draft' && (
                <>
                  <PermissionGuard permission="submit_purchase_requisition">
                    <button
                      onClick={() =>
                        setActionConfirm({
                          isOpen: true,
                          uuid: data.uuid,
                          prNo: data.pr_no,
                          action: 'submit',
                        })
                      }
                      className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all cursor-pointer"
                      title="Submit for Approval"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </PermissionGuard>

                  <PermissionGuard permission="edit_purchase_requisition">
                    <button
                      onClick={() => handleEdit(data)}
                      className="p-1.5 hover:bg-emerald-50 text-[#10b981] rounded-lg transition-all cursor-pointer"
                      title="Edit Draft"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </PermissionGuard>

                  <PermissionGuard permission="delete_purchase_requisition">
                    <button
                      onClick={() => handleDeleteClick({ uuid: data.uuid, prNo: data.pr_no })}
                      className="p-1.5 hover:bg-rose-50 text-[#ef4444] rounded-lg transition-all cursor-pointer"
                      title="Delete Draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </PermissionGuard>
                </>
              )}

              {st === 'submitted' && (
                <PermissionGuard permission="approve_purchase_requisition">
                  {data.can_current_user_approve ? (
                    <>
                      <button
                        onClick={() =>
                          setActionConfirm({
                            isOpen: true,
                            uuid: data.uuid,
                            prNo: data.pr_no,
                            action: 'approve',
                          })
                        }
                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all cursor-pointer"
                        title="Approve Stage"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActionConfirm({
                            isOpen: true,
                            uuid: data.uuid,
                            prNo: data.pr_no,
                            action: 'reject',
                          })
                        }
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                        title="Reject Requisition"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </PermissionGuard>
              )}
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, visibleCols, hasPermission, hasAnyPermission, currency, currencyPosition, deptMap, costCenterMap]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'PR No', field: 'pr_no', visible: visibleCols.pr_no },
    { name: 'Date', field: 'pr_date', visible: visibleCols.pr_date },
    { name: 'Required By', field: 'required_by_date', visible: visibleCols.required_by_date },
    { name: 'Department', field: 'department', visible: visibleCols.department },
    { name: 'Cost Center', field: 'cost_center', visible: visibleCols.cost_center },
    { name: 'Requisitioner', field: 'requisitioner', visible: visibleCols.requisitioner },
    { name: 'Designation', field: 'designation', visible: visibleCols.designation },
    { name: 'Estimated Amount', field: 'total_estimated_amount', visible: visibleCols.total_estimated_amount },
    { name: 'Priority', field: 'priority', visible: visibleCols.priority },
    { name: 'Type', field: 'procurement_type', visible: visibleCols.procurement_type },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  const totalRecords = prData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', permission: ['view_vendor', 'view_vendor_invitation', 'view_vendor_category', 'view_vendor_document_type', 'view_vendor_blacklist'] },
    { name: 'Requisitions & RFQ', to: '/procurement/purchase-requisitions', active: true, permission: ['view_rfq', 'view_purchase_requisition'] },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders', permission: 'view_purchase_order' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns', permission: 'view_grn' },
    { name: 'Invoices & Payments', to: '/procurement/invoices', permission: ['view_invoice', 'submit_invoice', 'view_vendor_invoice'] },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', permission: ['view_budget', 'view_budget_category', 'view_budget_head', 'view_cost_center'] },
  ]

  const titleOptions = [
    { name: 'Purchase Requisitions', to: '/procurement/purchase-requisitions', permission: 'view_purchase_requisition' },
    { name: 'Request For Quotations (RFQ)', to: '/procurement/rfqs', permission: 'view_rfq' },
    { name: 'RFQ Evaluation Templates', to: '/procurement/rfq-templates', permission: 'view_rfq_evaluation_template' },
    { name: 'Terms & Conditions Library', to: '/procurement/terms-library', permission: 'view_terms_library' },
  ]

  return (
    <>
      <ListPageLayout
        title="Purchase Requisitions"
        titleOptions={titleOptions}
        backTo="/procurement/vendors"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_purchase_requisition"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={prData?.response || []}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Requisition?"
        message={`Are you sure you want to delete draft purchase requisition "${prToDelete?.prNo}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />

      {/* Action Interactive Modal (Submit, Approve, Reject with Remarks) */}
      {actionConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 transform transition-all">
            <div className="flex items-start gap-3">
              <div
                className={clsx(
                  'p-2.5 rounded-xl shrink-0',
                  actionConfirm.action === 'submit' && 'bg-blue-50 text-blue-600',
                  actionConfirm.action === 'approve' && 'bg-emerald-50 text-emerald-600',
                  actionConfirm.action === 'reject' && 'bg-rose-50 text-rose-600'
                )}
              >
                {actionConfirm.action === 'submit' ? (
                  <Send className="w-5 h-5" />
                ) : actionConfirm.action === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 capitalize">
                  {actionConfirm.action === 'submit'
                    ? 'Submit Purchase Requisition'
                    : actionConfirm.action === 'approve'
                      ? 'Approve Purchase Requisition'
                      : 'Reject Purchase Requisition'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {actionConfirm.action === 'submit'
                    ? 'Submit this requisition to initiate multi-level workflow approvals.'
                    : actionConfirm.action === 'approve'
                      ? 'Authorize and advance this requisition to the next approval level.'
                      : 'Reject this requisition and notify the requester with your comments.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionConfirm({ isOpen: false, uuid: '', prNo: '', action: 'submit', remarks: '' })}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick PR Reference Card */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Purchase Requisition</span>
              <span className="font-bold text-gray-800 text-[13px]">{actionConfirm.prNo || 'Draft Requisition'}</span>
            </div>

            {/* Remarks / Comments Input */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {actionConfirm.action === 'reject'
                  ? 'Rejection Reason / Comments (Required)'
                  : 'Remarks / Comments (Optional)'}
              </label>
              <textarea
                rows={3}
                value={actionConfirm.remarks || ''}
                onChange={(e) => setActionConfirm((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder={
                  actionConfirm.action === 'reject'
                    ? 'State the reason for rejecting this requisition...'
                    : 'Add any remarks or instructions (optional)...'
                }
                className="w-full p-3 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setActionConfirm({ isOpen: false, uuid: '', prNo: '', action: 'submit', remarks: '' })}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={isActionPending || (actionConfirm.action === 'reject' && !(actionConfirm.remarks || '').trim())}
                className={clsx(
                  'px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                  actionConfirm.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionConfirm.action === 'submit'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-[#0d7a50] hover:bg-[#0a6642]'
                )}
              >
                {isActionPending
                  ? 'Processing...'
                  : actionConfirm.action === 'submit'
                    ? 'Submit Now'
                    : actionConfirm.action === 'approve'
                      ? 'Confirm Approval'
                      : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
