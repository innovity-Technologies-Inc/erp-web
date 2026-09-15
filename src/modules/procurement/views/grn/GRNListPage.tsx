import { useMemo, useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  Edit,
  Trash2,
  Eye,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Truck,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { useGRNs, useDeleteGRN, usePostGRN } from '../../hooks/useGRN'
import { GRNQCModal } from '../../components/grn/GRNQCModal'
import type { ColDef } from 'ag-grid-community'
import type { GRN, GRNStatus } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { clsx } from 'clsx'

const statusBadgeColors: Record<GRNStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels: Record<GRNStatus, string> = {
  draft: 'Draft',
  submitted: 'QC Pending',
  approved: 'QC Approved',
  closed: 'Stock Inwarded',
  cancelled: 'Cancelled',
}

export const GRNListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasPermission } = usePermissions()

  // Pagination & Filters State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // Modals State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; uuid: string; grnNo: string }>({
    isOpen: false,
    uuid: '',
    grnNo: '',
  })

  const [qcModalState, setQcModalState] = useState<{ isOpen: boolean; grn: GRN | null }>({
    isOpen: false,
    grn: null,
  })

  const [postConfirm, setPostConfirm] = useState<{ isOpen: boolean; uuid: string; grnNo: string; poNo?: string }>({
    isOpen: false,
    uuid: '',
    grnNo: '',
  })

  // Queries & Mutations
  const { data: grnData, isLoading, refetch } = useGRNs({
    page: currentPage,
    per_page: pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  })

  const deleteMutation = useDeleteGRN()
  const postMutation = usePostGRN()

  const grnList = grnData?.response || []
  const totalRecords = grnData?.meta?.total || 0
  const totalPages = grnData?.meta?.last_page || Math.ceil(totalRecords / pageSize) || 1

  const handleCreate = () => {
    navigate({ to: '/procurement/grns/create' as any })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.uuid) return
    try {
      await deleteMutation.mutateAsync(deleteConfirm.uuid)
      showNotificationModal(
        'GRN Deleted',
        `Goods Receipt Note "${deleteConfirm.grnNo}" was deleted successfully.`,
        'success'
      )
      setDeleteConfirm({ isOpen: false, uuid: '', grnNo: '' })
      refetch()
    } catch (err: any) {
      showNotificationModal(
        'Delete Failed',
        err?.response?.data?.message || err.message || 'Failed to delete draft GRN.',
        'error'
      )
    }
  }

  const handlePostConfirm = async () => {
    if (!postConfirm.uuid) return
    try {
      await postMutation.mutateAsync(postConfirm.uuid)
      showNotificationModal(
        'Stock Inwarded Successfully',
        `GRN "${postConfirm.grnNo}" has been posted to warehouse inventory and Purchase Order received records were updated.`,
        'success'
      )
      setPostConfirm({ isOpen: false, uuid: '', grnNo: '' })
      refetch()
    } catch (err: any) {
      showNotificationModal(
        'Stock Inwarding Failed',
        err?.response?.data?.message || err.message || 'Failed to post GRN to inventory.',
        'error'
      )
    }
  }

  // Column Visibility State
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    sl: true,
    grn_no: true,
    grn_date: true,
    po_no: true,
    supplier: true,
    challan: true,
    items_count: true,
    received_by: true,
    qc_result: true,
    status: true,
    actions: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const columnDefs = useMemo<ColDef<GRN>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 70,
        pinned: 'left',
        sortable: false,
        filter: false,
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center text-xs',
      },
      {
        headerName: 'GRN NO',
        field: 'grn_no',
        minWidth: 190,
        width: 210,
        hide: !visibleCols.grn_no,
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          if (!row?.grn_no) return <span className="text-gray-400 flex items-center h-full text-xs">—</span>
          return (
            <div className="flex items-center h-full">
              <button
                type="button"
                onClick={() => navigate({ to: `/procurement/grns/view/${row.uuid}` as any })}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer truncate"
                title="View Goods Receipt Note"
              >
                {row.grn_no}
              </button>
            </div>
          )
        },
      },
      {
        headerName: 'DATE',
        field: 'grn_date',
        width: 125,
        hide: !visibleCols.grn_date,
        cellClass: 'text-gray-700 font-medium flex items-center h-full text-xs',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'PO NO',
        field: 'purchase_order_id' as any,
        minWidth: 170,
        width: 185,
        hide: !visibleCols.po_no,
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          const po = row?.purchaseOrder || (row as any)?.purchase_order
          if (!po?.po_no) return <span className="text-gray-400 flex items-center h-full text-xs">—</span>
          return (
            <div className="flex items-center h-full">
              <button
                type="button"
                onClick={() => navigate({ to: `/procurement/purchase-orders/view/${po.uuid}` as any })}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline text-xs cursor-pointer"
                title="View Purchase Order"
              >
                <span>{po.po_no}</span>
                <ArrowRight className="w-3 h-3 text-blue-400" />
              </button>
            </div>
          )
        },
      },
      {
        headerName: 'VENDOR / SUPPLIER',
        field: 'supplier_id' as any,
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.supplier,
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          const supplier = row?.supplier || row?.purchaseOrder?.vendor || (row as any)?.purchase_order?.vendor
          const sName = supplier?.name || (params.value ? `Supplier #${params.value}` : '—')
          return <span className="text-gray-800 font-medium flex items-center h-full text-xs truncate" title={sName}>{sName}</span>
        },
      },
      {
        headerName: 'DELIVERY CHALLAN',
        field: 'delivery_challan_no',
        minWidth: 170,
        width: 190,
        hide: !visibleCols.challan,
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          const challanNo =
            row?.delivery_challan_no ||
            (row as any)?.challan_no ||
            (row as any)?.delivery_challan ||
            params.value
          const invoiceNo =
            row?.invoice_no ||
            (row as any)?.supplier_invoice_no ||
            (row as any)?.invoice

          if (!challanNo && !invoiceNo) {
            return <span className="text-gray-400 flex items-center h-full text-xs">—</span>
          }

          return (
            <div className="flex flex-col justify-center h-full leading-tight">
              <span
                className="font-semibold text-gray-900 text-xs truncate"
                title={`Challan: ${challanNo || '—'}`}
              >
                {challanNo || '—'}
              </span>
              {invoiceNo && (
                <span
                  className="text-[11px] text-gray-400 font-mono truncate"
                  title={`Invoice: ${invoiceNo}`}
                >
                  Inv: {invoiceNo}
                </span>
              )}
            </div>
          )
        },
      },
      {
        headerName: 'ITEMS RECEIVED',
        field: 'items' as any,
        width: 140,
        hide: !visibleCols.items_count,
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          const items = row?.items || []
          const count = items.length
          const totalAccepted = items.reduce((sum: number, it: any) => sum + Number(it.accepted_quantity || 0), 0)
          return (
            <div className="flex flex-col justify-center h-full leading-tight">
              <span className="font-bold text-gray-800 text-xs">{count} Items</span>
              <span className="text-[10px] text-gray-400">Qty: {totalAccepted.toFixed(2)}</span>
            </div>
          )
        },
      },
      {
        headerName: 'RECEIVED BY',
        field: 'received_by_id' as any,
        width: 145,
        hide: !visibleCols.received_by,
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          const receiver = row?.receivedBy || (row as any)?.received_by
          return <span className="text-gray-800 font-medium flex items-center h-full text-xs truncate">{receiver?.name || '—'}</span>
        },
      },
      {
        headerName: 'QC STATUS',
        field: 'qc_result' as any,
        width: 135,
        hide: !visibleCols.qc_result,
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          const result = row?.qc_result
          if (!result) {
            return (
              <div className="flex items-center h-full">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-500 border-gray-200 leading-none">
                  Pending QC
                </span>
              </div>
            )
          }
          if (result === 'passed') {
            return (
              <div className="flex items-center h-full">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 leading-none">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Passed
                </span>
              </div>
            )
          }
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200 leading-none">
                <XCircle className="w-3 h-3 text-rose-600" />
                Failed
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 130,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const raw = params.value
          const status = ((typeof raw === 'object' && raw !== null ? raw.value : raw) as GRNStatus) || 'draft'
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
        field: 'id' as any,
        width: 180,
        pinned: 'right',
        sortable: false,
        filter: false,
        hide: !visibleCols.actions,
        cellClass: 'flex items-center justify-center gap-1',
        cellRenderer: (params: any) => {
          const row = params.data as GRN
          if (!row) return null

          const rawStatus = row.status
          const st = (typeof rawStatus === 'object' && rawStatus !== null ? (rawStatus as any).value : rawStatus) || 'draft'
          const isDraft = st === 'draft'
          const canQC = st === 'draft' || st === 'submitted'
          const canPost = st === 'approved'

          return (
            <div className="flex items-center gap-1 h-full justify-center">
              {/* View */}
              <button
                type="button"
                onClick={() => navigate({ to: `/procurement/grns/view/${row.uuid}` as any })}
                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all cursor-pointer"
                title="View GRN Details"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Edit Draft */}
              {isDraft && (
                <PermissionGuard permission="edit_grn">
                  <button
                    type="button"
                    onClick={() => navigate({ to: `/procurement/grns/edit/${row.uuid}` as any })}
                    className="p-1.5 hover:bg-emerald-50 text-[#10b981] rounded-lg transition-all cursor-pointer"
                    title="Edit Draft GRN"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* QC Inspection */}
              {canQC && (
                <PermissionGuard permission={['inspect_grn', 'qc_grn']}>
                  <button
                    type="button"
                    onClick={() => setQcModalState({ isOpen: true, grn: row })}
                    className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-all cursor-pointer"
                    title="Log QC Inspection"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Inward Stock / Post GRN */}
              {canPost && (
                <PermissionGuard permission="post_grn">
                  <button
                    type="button"
                    onClick={() =>
                      setPostConfirm({
                        isOpen: true,
                        uuid: row.uuid,
                        grnNo: row.grn_no,
                        poNo: row.purchaseOrder?.po_no || (row as any)?.purchase_order?.po_no,
                      })
                    }
                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all cursor-pointer"
                    title="Post to Stock / Inward Inventory"
                  >
                    <PackageCheck className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Delete Draft */}
              {isDraft && (
                <PermissionGuard permission="delete_grn">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ isOpen: true, uuid: row.uuid, grnNo: row.grn_no })}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                    title="Delete Draft GRN"
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
    [visibleCols, currentPage, pageSize]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'GRN Number', field: 'grn_no', visible: visibleCols.grn_no },
    { name: 'GRN Date', field: 'grn_date', visible: visibleCols.grn_date },
    { name: 'Purchase Order', field: 'po_no', visible: visibleCols.po_no },
    { name: 'Vendor / Supplier', field: 'supplier', visible: visibleCols.supplier },
    { name: 'Challan / Invoice', field: 'challan', visible: visibleCols.challan },
    { name: 'Items Received', field: 'items_count', visible: visibleCols.items_count },
    { name: 'Received By', field: 'received_by', visible: visibleCols.received_by },
    { name: 'QC Status', field: 'qc_result', visible: visibleCols.qc_result },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Actions', field: 'actions', visible: visibleCols.actions },
  ]

  const handleExport = () => {
    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'GRN Number', key: 'grn_no', width: 20 },
      { header: 'GRN Date', key: 'grn_date', width: 15 },
      { header: 'PO Number', key: 'po_no', width: 20 },
      { header: 'Vendor / Supplier', key: 'supplier', width: 25 },
      { header: 'Delivery Challan', key: 'challan', width: 20 },
      { header: 'Invoice No', key: 'invoice_no', width: 20 },
      { header: 'QC Status', key: 'qc_result', width: 15 },
      { header: 'Status', key: 'status', width: 18 },
    ]

    const exportData = grnList.map((grn, index) => ({
      sl: index + 1,
      grn_no: grn.grn_no,
      grn_date: grn.grn_date ? formatDate(grn.grn_date) : '—',
      po_no: grn.purchaseOrder?.po_no || grn.purchase_order?.po_no || '—',
      supplier: grn.supplier?.name || '—',
      challan: grn.delivery_challan_no,
      invoice_no: grn.invoice_no || '—',
      qc_result: grn.qc_result || 'Pending',
      status: statusLabels[grn.status] || grn.status,
    }))

    exportToExcel(exportData, exportColumns, 'goods-receipt-notes')
  }

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'QC Pending', value: 'submitted' },
    { label: 'QC Approved', value: 'approved' },
    { label: 'Stock Inwarded', value: 'closed' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', permission: ['view_vendor', 'view_vendor_invitation', 'view_vendor_category', 'view_vendor_document_type', 'view_vendor_blacklist'] },
    {
      name: hasPermission('view_purchase_requisition') ? 'Requisitions & RFQ' : 'Request For Quotations',
      to: hasPermission('view_purchase_requisition') ? '/procurement/purchase-requisitions' : '/procurement/rfqs',
      permission: ['view_rfq', 'view_purchase_requisition'],
    },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders', permission: ['view_po', 'view_purchase_order', 'view_purchase'] },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns', active: true, permission: 'view_grn' },
    { name: 'Invoices & Payments', to: '/procurement/invoices', permission: ['view_invoice', 'submit_invoice', 'view_vendor_invoice'] },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', permission: ['view_budget', 'view_budget_category', 'view_budget_head'] },
  ]

  return (
    <>
      <ListPageLayout
        title="Goods Receipt Note (GRN)"
        backTo="/procurement/purchase-orders"
        tabs={tabs}
        onCreate={handleCreate}
        createPermission="create_grn"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={grnList}
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
        title="Delete Draft GRN"
        message={`Are you sure you want to delete draft Goods Receipt Note "${deleteConfirm.grnNo}"? This action cannot be undone.`}
        confirmText="Delete Draft"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm({ isOpen: false, uuid: '', grnNo: '' })}
      />

      {/* Post to Stock Confirmation Modal */}
      <ConfirmationModal
        isOpen={postConfirm.isOpen}
        title="Post GRN to Warehouse Stock"
        message={`Posting GRN "${postConfirm.grnNo}" will permanently increase inventory stocks in the designated warehouses, update received quantities on Purchase Order "${postConfirm.poNo || 'PO'}", and lock this receipt. Proceed?`}
        confirmText="Post & Inward Stock"
        variant="success"
        isLoading={postMutation.isPending}
        onConfirm={handlePostConfirm}
        onClose={() => setPostConfirm({ isOpen: false, uuid: '', grnNo: '' })}
      />

      {/* Quality Control Modal */}
      {qcModalState.isOpen && qcModalState.grn && (
        <GRNQCModal
          isOpen={qcModalState.isOpen}
          grn={qcModalState.grn}
          onClose={() => setQcModalState({ isOpen: false, grn: null })}
          onSuccess={() => refetch()}
        />
      )}
    </>
  )
}
