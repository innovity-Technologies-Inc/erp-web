import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Eye,
  Edit,
  Trash2,
  Send,
  BarChart3,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { useRFQs, useDeleteRFQ, useDispatchRFQ } from '../../hooks/useRFQs'
import { useDepartments } from '@/modules/hrm'
import { useCostCenters } from '../../hooks/useCostCenters'
import type { ColDef } from 'ag-grid-community'
import type { RFQ, RFQStatus } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/useAuthStore'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { clsx } from 'clsx'

const statusBadgeColors: Record<RFQStatus, { bg: string; label: string }> = {
  draft: { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Draft' },
  sent: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Sent / Open' },
  acknowledged: { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Acknowledged' },
  submitted: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Bids Received' },
  under_evaluation: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Under Evaluation' },
  awarded: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Awarded' },
  expired: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Expired' },
  cancelled: { bg: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Cancelled' },
}

export const RFQListPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isVendor = user?.user_type === 'vendor'
  const { showNotificationModal } = useUiStore()
  const { hasPermission, hasAnyPermission } = usePermissions()

  // Pagination & Filters State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  // Confirmation Modals State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [rfqToDelete, setRfqToDelete] = useState<{ uuid: string; rfqNo: string } | null>(null)

  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [rfqToDispatch, setRfqToDispatch] = useState<{ uuid: string; rfqNo: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    rfq_no: true,
    rfq_date: true,
    pr_ref: true,
    department: true,
    cost_center: true,
    deadline: true,
    vendors: true,
    status: true,
    action: true,
  })

  // Dynamic Lookups
  const { data: deptResponse } = useDepartments({ all: true })
  const deptMap = useMemo(() => {
    const list = deptResponse?.data || deptResponse?.response || []
    return new Map<number, string>(list.map((d: any) => [d.id, d.name]))
  }, [deptResponse])

  const { data: costCentersResponse } = useCostCenters({ per_page: 200 })
  const costCenterMap = useMemo(() => {
    const list = costCentersResponse?.response || []
    return new Map<number, string>(list.map((c: any) => [c.id, `${c.code} - ${c.name}`]))
  }, [costCentersResponse])

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

  const { data: rfqData, isLoading } = useRFQs(params)
  const { mutate: deleteRFQMutate, isPending: isDeleting } = useDeleteRFQ()
  const { mutate: dispatchRFQMutate, isPending: isDispatching } = useDispatchRFQ()

  // Actions Handlers
  const handleCreate = () => {
    navigate({ to: '/procurement/rfqs/create' as any })
  }

  const handleEdit = (data: RFQ) => {
    navigate({
      to: '/procurement/rfqs/edit/$id' as any,
      params: { id: data.uuid } as any,
    })
  }

  const handleView = (data: RFQ) => {
    navigate({
      to: '/procurement/rfqs/view/$id' as any,
      params: { id: data.uuid } as any,
    })
  }

  const handleComparativeStatement = (data: RFQ) => {
    if (isVendor) return
    navigate({
      to: '/procurement/rfqs/cs/$id' as any,
      params: { id: data.uuid } as any,
    })
  }

  const handleDeleteConfirm = () => {
    if (rfqToDelete) {
      deleteRFQMutate(rfqToDelete.uuid, {
        onSuccess: () => {
          setIsDeleteOpen(false)
          setRfqToDelete(null)
          showNotificationModal(
            'RFQ Deleted!',
            `Draft RFQ "${rfqToDelete.rfqNo}" has been deleted successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete RFQ.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const handleDispatchConfirm = () => {
    if (rfqToDispatch) {
      dispatchRFQMutate(rfqToDispatch.uuid, {
        onSuccess: () => {
          setIsDispatchOpen(false)
          setRfqToDispatch(null)
          showNotificationModal(
            'RFQ Dispatched!',
            `RFQ "${rfqToDispatch.rfqNo}" has been dispatched to target vendors via email notification.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to dispatch RFQ.'
          showNotificationModal('Dispatch Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!rfqData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'RFQ No', key: 'rfq_no', width: 22 },
      { header: 'Date', key: 'rfq_date', width: 15 },
      { header: 'PR Reference', key: 'pr_ref', width: 22 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Cost Center', key: 'cost_center', width: 25 },
      { header: 'Bid Deadline', key: 'deadline', width: 18 },
      { header: 'Invited Vendors', key: 'vendors_count', width: 18 },
      { header: 'Quotations Received', key: 'quotes_count', width: 18 },
      { header: 'Status', key: 'status', width: 18 },
    ]

    const exportData = rfqData.response.map((item, index) => ({
      sl: index + 1,
      rfq_no: item.rfq_no,
      rfq_date: item.rfq_date ? formatDate(item.rfq_date) : '—',
      pr_ref: item.purchase_requisition?.pr_no || '—',
      department: deptMap.get(item.department_id) || '—',
      cost_center: costCenterMap.get(item.cost_center_id) || '—',
      deadline: item.rfq_expiry_date ? formatDate(item.rfq_expiry_date) : '—',
      vendors_count: item.target_vendors?.length || item.targetVendors?.length || 0,
      quotes_count: item.quotations?.length || 0,
      status: statusBadgeColors[item.status]?.label || item.status,
    }))

    exportToExcel(exportData, exportColumns, 'request-for-quotations')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<RFQ>[]>(
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
        headerName: 'RFQ NO',
        field: 'rfq_no',
        width: 190,
        pinned: 'left',
        hide: !visibleCols.rfq_no,
        cellClass: 'font-bold text-gray-900 flex items-center',
        cellRenderer: (params: any) => {
          const data: RFQ = params.data
          return (
            <div className="flex items-center gap-2 h-full">
              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-gray-900 font-mono text-[13px]">{data.rfq_no}</span>
            </div>
          )
        },
      },
      {
        headerName: 'DATE',
        field: 'rfq_date',
        width: 125,
        hide: !visibleCols.rfq_date,
        cellClass: 'text-gray-600 flex items-center',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'PR REFERENCE',
        field: 'purchase_requisition_id',
        width: 175,
        hide: !visibleCols.pr_ref,
        cellRenderer: (params: any) => {
          const prNo = params.data?.purchase_requisition?.pr_no
          if (!prNo) {
            return <span className="text-gray-400 text-xs italic">Direct RFQ</span>
          }
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {prNo}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'DEPARTMENT',
        field: 'department_id',
        width: 180,
        hide: !visibleCols.department,
        cellRenderer: (params: any) => {
          const deptName = deptMap.get(params.value) || params.data?.department?.name || '—'
          return (
            <div className="flex items-center gap-1.5 h-full text-gray-700 font-medium text-xs truncate">
              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{deptName}</span>
            </div>
          )
        },
      },
      {
        headerName: 'BID DEADLINE',
        field: 'rfq_expiry_date',
        width: 155,
        hide: !visibleCols.deadline,
        cellRenderer: (params: any) => {
          const expiry = params.value
          if (!expiry) return '—'
          const isExpired = new Date(expiry).getTime() < new Date().setHours(0, 0, 0, 0)
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border leading-none',
                  isExpired
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}
              >
                <Clock className="w-3 h-3 shrink-0" />
                {formatDate(expiry)}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'VENDORS / BIDS',
        width: 170,
        hide: !visibleCols.vendors,
        cellRenderer: (params: any) => {
          const data: RFQ = params.data
          const vendorCount = data.target_vendors?.length || data.targetVendors?.length || 0
          const quotesCount = data.quotations?.length || 0
          return (
            <div className="flex items-center gap-1.5 h-full">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 leading-none">
                <Users className="w-3 h-3 text-slate-500 shrink-0" />
                <span>{vendorCount} {vendorCount === 1 ? 'Vendor' : 'Vendors'}</span>
              </span>
              {quotesCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-indigo-200 bg-indigo-50 text-indigo-700 leading-none">
                  {quotesCount} {quotesCount === 1 ? 'Bid' : 'Bids'}
                </span>
              )}
            </div>
          )
        },
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 150,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const st = (params.value as RFQStatus) || 'draft'
          const badge = statusBadgeColors[st] || { bg: 'bg-gray-100 text-gray-700', label: st }
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  badge.bg
                )}
              >
                {badge.label}
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
          const data: RFQ = params.data
          const st = data.status
          const canDispatch = st === 'draft'
          const hasQuotes = (data.quotations?.length ?? 0) > 0 || ['submitted', 'under_evaluation', 'awarded'].includes(st)

          return (
            <div className="flex items-center gap-1 h-full">
              {/* View RFQ Details */}
              <button
                onClick={() => handleView(data)}
                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all cursor-pointer"
                title="View RFQ Details"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Comparative Statement (CS) Matrix - Strictly for non-vendors */}
              {hasQuotes && !isVendor && (
                <button
                  onClick={() => handleComparativeStatement(data)}
                  className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all cursor-pointer"
                  title="View Comparative Statement (CS Matrix)"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              )}

              {/* Dispatch RFQ to Target Vendors */}
              {canDispatch && (
                <PermissionGuard permission="edit_rfq">
                  <button
                    onClick={() => {
                      setRfqToDispatch({ uuid: data.uuid, rfqNo: data.rfq_no })
                      setIsDispatchOpen(true)
                    }}
                    className="p-1.5 hover:bg-sky-50 text-sky-600 rounded-lg transition-all cursor-pointer"
                    title="Dispatch RFQ to Vendors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Edit Draft RFQ */}
              {st === 'draft' && (
                <PermissionGuard permission="edit_rfq">
                  <button
                    onClick={() => handleEdit(data)}
                    className="p-1.5 hover:bg-emerald-50 text-[#10b981] rounded-lg transition-all cursor-pointer"
                    title="Edit Draft RFQ"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Delete Draft RFQ */}
              {st === 'draft' && (
                <PermissionGuard permission="delete_rfq">
                  <button
                    onClick={() => {
                      setRfqToDelete({ uuid: data.uuid, rfqNo: data.rfq_no })
                      setIsDeleteOpen(true)
                    }}
                    className="p-1.5 hover:bg-rose-50 text-[#ef4444] rounded-lg transition-all cursor-pointer"
                    title="Delete Draft RFQ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, visibleCols, hasPermission, hasAnyPermission, deptMap, costCenterMap]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'RFQ No', field: 'rfq_no', visible: visibleCols.rfq_no },
    { name: 'Date', field: 'rfq_date', visible: visibleCols.rfq_date },
    { name: 'PR Reference', field: 'pr_ref', visible: visibleCols.pr_ref },
    { name: 'Department', field: 'department', visible: visibleCols.department },
    { name: 'Cost Center', field: 'cost_center', visible: visibleCols.cost_center },
    { name: 'Bid Deadline', field: 'deadline', visible: visibleCols.deadline },
    { name: 'Vendors / Bids', field: 'vendors', visible: visibleCols.vendors },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Sent / Open', value: 'sent' },
    { label: 'Bids Received', value: 'submitted' },
    { label: 'Under Evaluation', value: 'under_evaluation' },
    { label: 'Awarded', value: 'awarded' },
    { label: 'Expired', value: 'expired' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const totalRecords = rfqData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', permission: ['view_vendor', 'view_vendor_invitation', 'view_vendor_category', 'view_vendor_document_type', 'view_vendor_blacklist'] },
    {
      name: hasPermission('view_purchase_requisition') ? 'Requisitions & RFQ' : 'Request For Quotations',
      to: hasPermission('view_purchase_requisition') ? '/procurement/purchase-requisitions' : '/procurement/rfqs',
      active: true,
      permission: ['view_rfq', 'view_purchase_requisition']
    },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders', permission: 'view_purchase_order' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns', permission: 'view_grn' },
    { name: 'Invoices & Payments', to: '/procurement/invoices', permission: ['view_invoice', 'submit_invoice', 'view_vendor_invoice'] },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', permission: ['view_budget', 'view_budget_category', 'view_budget_head'] },
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
        title="Request For Quotations (RFQ)"
        titleOptions={titleOptions}
        backTo="/procurement/purchase-requisitions"
        tabs={tabs}
        onCreate={handleCreate}
        createPermission="create_rfq"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={rfqData?.response || []}
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

      {/* Delete Draft Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Draft RFQ?"
        message={`Are you sure you want to delete draft RFQ "${rfqToDelete?.rfqNo}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Dispatch Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onConfirm={handleDispatchConfirm}
        title="Dispatch RFQ to Vendors?"
        message={`Are you sure you want to dispatch RFQ "${rfqToDispatch?.rfqNo}"? All invited target vendors will receive an email invitation and the bidding period will open.`}
        confirmText="Yes, Dispatch Now"
        variant="dispatch"
        isLoading={isDispatching}
      />
    </>
  )
}
