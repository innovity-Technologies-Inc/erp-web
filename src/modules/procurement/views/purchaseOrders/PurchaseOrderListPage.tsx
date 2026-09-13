import { useMemo, useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  FileText,
  DollarSign,
  PackageCheck,
  Building2,
  Printer,
  Sparkles,
  Award,
  Layers,
  ShoppingBag,
  RotateCcw,
  Check,
  X,
  Clock,
  Calendar,
} from 'lucide-react'
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
  useApprovePO,
  useDispatchPurchaseOrder,
  useReceivePOGoods,
} from '../../hooks/usePurchaseOrders'
import { ManagePOScheduleModal } from '../../components/purchaseOrder/ManagePOScheduleModal'
import type { ColDef } from 'ag-grid-community'
import type { PurchaseOrder, POStatus } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { useSettings } from '@/hooks/useSettings'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { clsx } from 'clsx'

const statusBadgeColors: Record<POStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  issued: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
  partially_delivered: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  fully_delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  invoiced: 'bg-teal-50 text-teal-700 border-teal-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels: Record<POStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  issued: 'Issued to Vendor',
  partially_delivered: 'Partially Delivered',
  fully_delivered: 'Fully Delivered',
  invoiced: 'Invoiced',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

export const PurchaseOrderListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasPermission } = usePermissions()
  const { currency, currencyPosition } = useSettings()

  // Pagination & Filters State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // Modals State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; uuid: string; poNo: string }>({
    isOpen: false,
    uuid: '',
    poNo: '',
  })

  const [approvalConfirm, setApprovalConfirm] = useState<{
    isOpen: boolean
    uuid: string
    poNo: string
    vendorName?: string
    amount?: number | string
    stageName?: string
    action: 'submit' | 'approve' | 'reject'
    remarks?: string
  }>({
    isOpen: false,
    uuid: '',
    poNo: '',
    action: 'submit',
    remarks: '',
  })

  const [issueConfirm, setIssueConfirm] = useState<{
    isOpen: boolean
    uuid: string
    poNo: string
    vendorName: string
    amount?: number | string
  } | null>(null)

  const [scheduleModalPo, setScheduleModalPo] = useState<PurchaseOrder | null>(null)

  // Queries & Mutations
  const { data: poResponse, isLoading, refetch } = usePurchaseOrders({
    page: currentPage,
    per_page: pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  })

  const { mutate: deletePOMutate, isPending: isDeleting } = useDeletePurchaseOrder()
  const { mutate: approvePOMutate, isPending: isApproving } = useApprovePO()
  const { mutate: dispatchPOMutate, isPending: isDispatching } = useDispatchPurchaseOrder()

  const poList: PurchaseOrder[] = useMemo(() => poResponse?.response || [], [poResponse])
  const totalRecords = poResponse?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  // Metric summaries
  const metrics = useMemo(() => {
    let totalVal = 0
    let pendingCount = 0
    let issuedCount = 0
    let completedCount = 0

    poList.forEach((po) => {
      const amt = Number(po.total_amount) || 0
      totalVal += amt
      if (po.status === 'pending_approval') pendingCount++
      if (po.status === 'issued' || po.status === 'partially_delivered') issuedCount++
      if (po.status === 'fully_delivered' || po.status === 'closed') completedCount++
    })

    return { totalVal, pendingCount, issuedCount, completedCount }
  }, [poList])

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    po_no: true,
    po_date: true,
    vendor: true,
    cost_center: true,
    validity_date: true,
    total_amount: true,
    progress: true,
    status: true,
    action: true,
  })

  const handleCreate = () => {
    navigate({ to: '/procurement/purchase-orders/create' as any })
  }

  // Delete handler
  const handleDeleteConfirm = () => {
    if (!deleteConfirm.uuid) return
    deletePOMutate(deleteConfirm.uuid, {
      onSuccess: () => {
        setDeleteConfirm({ isOpen: false, uuid: '', poNo: '' })
        showNotificationModal('Deleted', `Purchase Order "${deleteConfirm.poNo}" deleted successfully.`, 'success')
        refetch()
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to delete Purchase Order.'
        showNotificationModal('Delete Failed', msg, 'error')
      },
    })
  }

  // Approval Transition Handler
  const handleApprovalConfirm = () => {
    if (!approvalConfirm.uuid) return
    approvePOMutate(
      {
        uuid: approvalConfirm.uuid,
        action: approvalConfirm.action,
        remarks: approvalConfirm.remarks,
      },
      {
        onSuccess: () => {
          setApprovalConfirm({ isOpen: false, uuid: '', poNo: '', action: 'submit' })
          const actionText =
            approvalConfirm.action === 'submit'
              ? 'submitted for approval'
              : approvalConfirm.action === 'approve'
              ? 'approved'
              : 'rejected (returned to draft)'
          showNotificationModal('Status Updated', `Purchase Order "${approvalConfirm.poNo}" was ${actionText}.`, 'success')
          refetch()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Workflow transition failed.'
          showNotificationModal('Action Failed', msg, 'error')
        },
      }
    )
  }

  // Issue / Dispatch Handler
  const handleIssueConfirm = () => {
    if (!issueConfirm) return
    dispatchPOMutate(issueConfirm.uuid, {
      onSuccess: () => {
        const poNo = issueConfirm.poNo
        setIssueConfirm(null)
        showNotificationModal('PO Issued!', `Purchase Order "${poNo}" has been dispatched to the vendor.`, 'success')
        refetch()
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to issue Purchase Order.'
        showNotificationModal('Dispatch Failed', msg, 'error')
      },
    })
  }

  // Submit for Approval with Delivery Schedule Validation
  const handleSubmitForApproval = (row: PurchaseOrder) => {
    const items = Array.isArray(row.items) ? row.items : []
    const schedules = Array.isArray(row.schedules) ? row.schedules : []

    if (schedules.length === 0) {
      showNotificationModal(
        'Delivery Schedule Required',
        `Cannot submit "${row.po_no}" for approval without a delivery schedule. Please configure delivery milestones first.`,
        'warning'
      )
      setScheduleModalPo(row)
      return
    }

    if (items.length > 0) {
      const incompleteItem = items.find((it) => {
        const itemSchedQty = schedules
          .filter((s: any) => Number(s.purchase_order_item_id) === Number(it.id))
          .reduce((sum: number, s: any) => sum + (Number(s.planned_quantity) || 0), 0)
        return Math.abs(itemSchedQty - (Number(it.quantity) || 0)) > 0.001
      })

      if (incompleteItem) {
        showNotificationModal(
          'Incomplete Delivery Schedule',
          `All line items must be 100% scheduled before submitting for approval. Please complete the delivery schedule for "${row.po_no}".`,
          'warning'
        )
        setScheduleModalPo(row)
        return
      }
    }

    setApprovalConfirm({
      isOpen: true,
      uuid: row.uuid,
      poNo: row.po_no || '',
      vendorName: row.vendor?.name || '',
      amount: row.total_amount,
      action: 'submit',
      remarks: '',
    })
  }

  // AG-Grid Columns Definition
  const columnDefs = useMemo<ColDef<PurchaseOrder>[]>(
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
        headerName: 'PO NO',
        field: 'po_no',
        minWidth: 200,
        width: 220,
        hide: !visibleCols.po_no,
        cellRenderer: (params: any) => {
          const po = params.data as PurchaseOrder
          if (!po?.po_no) return '—'
          return (
            <div className="flex items-center h-full">
              <button
                type="button"
                onClick={() => navigate({ to: `/procurement/purchase-orders/view/${po.uuid}` as any })}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
                title="View Purchase Order"
              >
                {po.po_no}
              </button>
            </div>
          )
        },
      },
      {
        headerName: 'DATE',
        field: 'po_date',
        width: 120,
        hide: !visibleCols.po_date,
        cellClass: 'text-gray-700 font-medium flex items-center text-xs',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'VENDOR / SUPPLIER',
        field: 'vendor_id',
        minWidth: 160,
        flex: 1,
        hide: !visibleCols.vendor,
        cellRenderer: (params: any) => {
          const vendor = params.data?.vendor
          const vName = vendor?.name || (params.value ? `Vendor #${params.value}` : '—')
          return <span className="text-gray-800 font-medium flex items-center h-full text-xs">{vName}</span>
        },
      },
      {
        headerName: 'COST CENTER',
        field: 'cost_center_id',
        minWidth: 160,
        flex: 1,
        hide: !visibleCols.cost_center,
        cellRenderer: (params: any) => {
          const ccName = params.data?.cost_center?.name || params.data?.costCenter?.name || (params.value ? `CC #${params.value}` : '—')
          return <span className="text-gray-800 font-medium flex items-center h-full text-xs">{ccName}</span>
        },
      },
      {
        headerName: 'VALIDITY DATE',
        field: 'po_validity_date',
        width: 130,
        hide: !visibleCols.validity_date,
        cellClass: 'text-gray-700 font-medium flex items-center text-xs',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'TOTAL AMOUNT',
        field: 'total_amount',
        minWidth: 160,
        width: 170,
        hide: !visibleCols.total_amount,
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
        headerName: 'RECEIPT PROGRESS',
        field: 'items',
        width: 160,
        hide: !visibleCols.progress,
        cellRenderer: (params: any) => {
          const items = params.value || []
          if (!items.length) return <span className="text-gray-400 text-xs">—</span>
          const totalOrdered = items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 0), 0)
          const totalReceived = items.reduce((acc: number, it: any) => acc + (Number(it.received_quantity) || 0), 0)
          const percent = totalOrdered > 0 ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) : 0

          return (
            <div className="flex flex-col justify-center h-full w-full pr-2">
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium mb-1">
                <span>{totalReceived} / {totalOrdered}</span>
                <span className="font-bold">{percent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-300',
                    percent === 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-primary' : 'bg-gray-300'
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
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
          const raw = params.value
          const status = ((typeof raw === 'object' && raw !== null ? raw.value : raw) as POStatus) || 'draft'
          const label = statusLabels[status] || (typeof raw === 'object' && raw !== null ? raw.name : status) || 'Draft'
          const badgeClass = statusBadgeColors[status] || 'bg-slate-100 text-slate-700 border-slate-200'

          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  badgeClass
                )}
              >
                {label}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'ACTIONS',
        field: 'id',
        width: 190,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1',
        cellRenderer: (params: any) => {
          const row = params.data as PurchaseOrder
          if (!row) return null

          const rawStatus = row.status
          const st = (typeof rawStatus === 'object' && rawStatus !== null ? (rawStatus as any).value : rawStatus) || 'draft'
          const isDraft = st === 'draft'
          const isPending = st === 'pending_approval'
          const isApproved = st === 'approved'
          const isIssued = st === 'issued' || st === 'partially_delivered'

          return (
            <div className="flex items-center gap-1 h-full justify-center">
              {/* View */}
              <button
                type="button"
                onClick={() => navigate({ to: `/procurement/purchase-orders/view/${row.uuid}` as any })}
                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all cursor-pointer"
                title="View Purchase Order Details"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Edit (Draft only) */}
              {isDraft && (
                <PermissionGuard permission={['edit_po', 'edit_purchase_order']}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: `/procurement/purchase-orders/edit/${row.uuid}` as any })}
                    className="p-1.5 hover:bg-emerald-50 text-[#10b981] rounded-lg transition-all cursor-pointer"
                    title="Edit Draft"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Delivery Schedule (Draft only) */}
              {isDraft && (
                <PermissionGuard permission={['edit_po', 'edit_purchase_order']}>
                  <button
                    type="button"
                    onClick={() => setScheduleModalPo(row)}
                    className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-all cursor-pointer"
                    title="Manage Delivery Schedule"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Submit for Approval (Draft only) */}
              {isDraft && (
                <PermissionGuard permission={['edit_po', 'edit_purchase_order']}>
                  <button
                    type="button"
                    onClick={() => handleSubmitForApproval(row)}
                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all cursor-pointer"
                    title="Submit for Approval"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Delete (Draft only) */}
              {isDraft && (
                <PermissionGuard permission={['delete_po', 'delete_purchase_order']}>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ isOpen: true, uuid: row.uuid, poNo: row.po_no })}
                    className="p-1.5 hover:bg-rose-50 text-[#ef4444] rounded-lg transition-all cursor-pointer"
                    title="Delete Draft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Approve / Reject (Pending Approval only) */}
              {isPending && (
                <PermissionGuard permission={['approve_po', 'approve_purchase_order']}>
                  {row.can_current_user_approve ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setApprovalConfirm({
                            isOpen: true,
                            uuid: row.uuid,
                            poNo: row.po_no || '',
                            vendorName: row.vendor?.name || '',
                            amount: row.total_amount,
                            stageName: row.active_approval_step?.name,
                            action: 'approve',
                            remarks: '',
                          })
                        }
                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all cursor-pointer"
                        title="Approve Purchase Order"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setApprovalConfirm({
                            isOpen: true,
                            uuid: row.uuid,
                            poNo: row.po_no || '',
                            vendorName: row.vendor?.name || '',
                            amount: row.total_amount,
                            action: 'reject',
                            remarks: '',
                          })
                        }
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                        title="Reject / Return to Draft"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                </PermissionGuard>
              )}

              {/* Issue / Dispatch to Vendor (Approved only) */}
              {isApproved && (
                <PermissionGuard permission={['issue_po', 'issue_purchase_order']}>
                  <button
                    type="button"
                    onClick={() =>
                      setIssueConfirm({
                        isOpen: true,
                        uuid: row.uuid,
                        poNo: row.po_no || '',
                        vendorName: row.vendor?.name || 'Vendor',
                        amount: row.total_amount,
                      })
                    }
                    className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-all cursor-pointer"
                    title="Issue to Vendor"
                  >
                    <Truck className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Receive Goods Quick Link (Issued / Partially Delivered) */}
              {isIssued && (
                <PermissionGuard permission={['edit_po', 'edit_purchase_order']}>
                  <Link
                    to={`/procurement/purchase-orders/view/${row.uuid}` as any}
                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all cursor-pointer"
                    title="Receive Goods / Log GRN"
                  >
                    <PackageCheck className="h-4 w-4" />
                  </Link>
                </PermissionGuard>
              )}
            </div>
          )
        },
      },
    ],
    [visibleCols, currentPage, pageSize, currency, currencyPosition]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'PO Number', field: 'po_no', visible: visibleCols.po_no },
    { name: 'PO Date', field: 'po_date', visible: visibleCols.po_date },
    { name: 'Vendor', field: 'vendor', visible: visibleCols.vendor },
    { name: 'Cost Center', field: 'cost_center', visible: visibleCols.cost_center },
    { name: 'Validity Date', field: 'validity_date', visible: visibleCols.validity_date },
    { name: 'Total Amount', field: 'total_amount', visible: visibleCols.total_amount },
    { name: 'Receipt Progress', field: 'progress', visible: visibleCols.progress },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleExport = () => {
    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'PO Number', key: 'po_no', width: 22 },
      { header: 'PO Date', key: 'po_date', width: 15 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Cost Center', key: 'cost_center', width: 25 },
      { header: 'Validity Date', key: 'validity_date', width: 18 },
      { header: 'Sub Total', key: 'sub_total', width: 18 },
      { header: 'VAT Amount', key: 'vat_amount', width: 18 },
      { header: 'Total Amount', key: 'total_amount', width: 18 },
      { header: 'Status', key: 'status', width: 18 },
    ]

    const exportData = poList.map((po, index) => ({
      sl: index + 1,
      po_no: po.po_no,
      po_date: po.po_date ? formatDate(po.po_date) : '—',
      vendor: po.vendor?.name || `Vendor #${po.vendor_id}`,
      cost_center: po.cost_center?.name || po.costCenter?.name || '—',
      validity_date: po.po_validity_date ? formatDate(po.po_validity_date) : '—',
      sub_total: po.sub_total,
      vat_amount: po.vat_amount,
      total_amount: po.total_amount,
      status: statusLabels[po.status] || po.status,
    }))

    exportToExcel(exportData, exportColumns, 'purchase-orders')
  }

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Approval', value: 'pending_approval' },
    { label: 'Approved', value: 'approved' },
    { label: 'Issued to Vendor', value: 'issued' },
    { label: 'Partially Delivered', value: 'partially_delivered' },
    { label: 'Fully Delivered', value: 'fully_delivered' },
    { label: 'Invoiced', value: 'invoiced' },
    { label: 'Closed', value: 'closed' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', permission: ['view_vendor', 'view_vendor_invitation', 'view_vendor_category', 'view_vendor_document_type', 'view_vendor_blacklist'] },
    {
      name: hasPermission('view_purchase_requisition') ? 'Requisitions & RFQ' : 'Request For Quotations',
      to: hasPermission('view_purchase_requisition') ? '/procurement/purchase-requisitions' : '/procurement/rfqs',
      permission: ['view_rfq', 'view_purchase_requisition'],
    },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders', active: true, permission: ['view_po', 'view_purchase_order', 'view_purchase'] },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns', permission: 'view_grn' },
    { name: 'Invoices & Payments', to: '/procurement/invoices', permission: ['view_invoice', 'submit_invoice', 'view_vendor_invoice'] },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', permission: ['view_budget', 'view_budget_category', 'view_budget_head'] },
  ]

  return (
    <>
      <ListPageLayout
        title="Purchase Orders"
        backTo="/procurement/rfqs"
        tabs={tabs}
        onCreate={handleCreate}
        createPermission="create_po"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={poList}
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
        // Filters & Columns
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        showStatusFilter={true}
        statusValue={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val || undefined)
          setCurrentPage(1)
        }}
        statusOptions={statusOptions}
        // Export Actions
        onExport={handleExport}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Purchase Order Draft"
        message={`Are you sure you want to delete draft Purchase Order "${deleteConfirm.poNo}"? This action cannot be undone.`}
        confirmText="Delete Draft"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm({ isOpen: false, uuid: '', poNo: '' })}
      />

      {/* Enhanced Approval / Rejection / Submission Confirmation Modal */}
      {approvalConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'p-3 rounded-xl flex items-center justify-center text-white shrink-0',
                  approvalConfirm.action === 'submit'
                    ? 'bg-[#0d7a50]'
                    : approvalConfirm.action === 'approve'
                    ? 'bg-emerald-600'
                    : 'bg-rose-600'
                )}
              >
                {approvalConfirm.action === 'submit' && <Send className="w-5 h-5" />}
                {approvalConfirm.action === 'approve' && <CheckCircle2 className="w-5 h-5" />}
                {approvalConfirm.action === 'reject' && <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 capitalize">
                  {approvalConfirm.action === 'submit'
                    ? 'Submit Purchase Order for Approval'
                    : approvalConfirm.action === 'approve'
                    ? 'Approve Purchase Order Stage'
                    : 'Reject Purchase Order'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {approvalConfirm.action === 'submit'
                    ? 'Trigger multi-level approval pipeline across designated authorization levels.'
                    : approvalConfirm.action === 'approve'
                    ? 'Authorize and advance this purchase order to the next workflow stage.'
                    : 'Decline this purchase order and send back to draft with remarks.'}
                </p>
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs grid grid-cols-3 gap-2">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">PO No</span>
                <span className="font-bold text-gray-800 truncate block">{approvalConfirm.poNo || 'Draft'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Vendor</span>
                <span className="font-bold text-gray-800 truncate block" title={approvalConfirm.vendorName}>
                  {approvalConfirm.vendorName || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Total Value</span>
                <span className="font-bold text-[#1e4ba1] font-mono truncate block">
                  {formatCurrency(approvalConfirm.amount || 0, currency, currencyPosition)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {approvalConfirm.action === 'reject'
                  ? 'Rejection Reason / Comments (Required)'
                  : 'Approval Remarks / Notes (Optional)'}
              </label>
              <textarea
                value={approvalConfirm.remarks || ''}
                onChange={(e) => setApprovalConfirm((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder={
                  approvalConfirm.action === 'reject'
                    ? 'State the reason for rejection...'
                    : 'Add any review notes or comments...'
                }
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setApprovalConfirm({ isOpen: false, uuid: '', poNo: '', action: 'submit' })}
                disabled={isApproving}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprovalConfirm}
                disabled={isApproving || (approvalConfirm.action === 'reject' && !approvalConfirm.remarks?.trim())}
                className={clsx(
                  'px-5 py-2 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50',
                  approvalConfirm.action === 'submit'
                    ? 'bg-[#0d7a50] hover:bg-[#0a6642] shadow-emerald-500/20'
                    : approvalConfirm.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                )}
              >
                {isApproving && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {approvalConfirm.action === 'submit'
                    ? 'Confirm Submission'
                    : approvalConfirm.action === 'approve'
                    ? `Confirm Approval ${approvalConfirm.stageName ? `(${approvalConfirm.stageName})` : ''}`
                    : 'Confirm Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue / Dispatch Confirmation Modal */}
      {issueConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Issue Purchase Order</h3>
                <p className="text-xs text-gray-500 mt-0.5">PO #{issueConfirm.poNo}</p>
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Vendor</span>
                <span className="font-bold text-gray-800 truncate block">{issueConfirm.vendorName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Total Value</span>
                <span className="font-bold text-purple-700 font-mono truncate block">
                  {formatCurrency(Number(issueConfirm.amount || 0), currency, currencyPosition)}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to officially issue this purchase order to <strong>{issueConfirm.vendorName}</strong>?
              This will lock the PO, mark it as Issued, and notify the vendor via portal & email to proceed with order fulfillment.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIssueConfirm(null)}
                disabled={isDispatching}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueConfirm}
                disabled={isDispatching}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isDispatching && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>Issue Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Delivery Schedule Modal */}
      {scheduleModalPo && (
        <ManagePOScheduleModal
          isOpen={Boolean(scheduleModalPo)}
          po={scheduleModalPo}
          onClose={() => setScheduleModalPo(null)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  )
}
