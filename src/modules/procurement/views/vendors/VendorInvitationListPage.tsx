import { useMemo, useState } from 'react'
import {
  Mail,
  UserCheck,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  useVendorInvitations,
  useCancelVendorInvitation,
} from '../../hooks/useVendorInvitations'
import type { ColDef } from 'ag-grid-community'
import type { VendorInvitation, Vendor } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { VendorInviteModal } from '../../components/vendor/VendorInviteModal'
import { VendorApprovalModal } from '../../components/vendor/VendorApprovalModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { exportToExcel } from '@/utils/exportUtils'
import { clsx } from 'clsx'

export const VendorInvitationListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [excludeApproved, setExcludeApproved] = useState(true)

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [vendorToApprove, setVendorToApprove] = useState<Vendor | null>(null)
  const [invitationToCancel, setInvitationToCancel] = useState<VendorInvitation | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    company: true,
    email: true,
    category: true,
    status: true,
    application_status: true,
    invited_at: true,
    expires_at: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      search: search || undefined,
      status: status || undefined,
      exclude_approved: excludeApproved ? 1 : undefined,
    }),
    [currentPage, pageSize, search, status, excludeApproved]
  )

  const { data: invitationsData, isLoading } = useVendorInvitations(params)
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelVendorInvitation()

  const handleConfirmCancel = () => {
    if (invitationToCancel) {
      cancelInvitation(invitationToCancel.uuid, {
        onSuccess: () => {
          setInvitationToCancel(null)
          showNotificationModal(
            'Invitation Cancelled',
            `Invitation for "${invitationToCancel.company_name}" has been cancelled.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message =
            error.response?.data?.message ||
            error.message ||
            'Failed to cancel invitation.'
          showNotificationModal('Error', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!invitationsData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Company Name', key: 'company_name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Invitation Status', key: 'status', width: 18 },
      { header: 'Vendor Status', key: 'vendor_status', width: 18 },
      { header: 'Invited Date', key: 'created_at', width: 18 },
      { header: 'Expiry Date', key: 'expires_at', width: 18 },
    ]

    const exportData = invitationsData.response.map((inv, idx) => ({
      sl: idx + 1,
      company_name: inv.company_name,
      email: inv.email,
      phone: inv.phone || '—',
      category_name: inv.category?.name || '—',
      status: inv.status,
      vendor_status: inv.vendor?.status || 'Awaiting Submission',
      created_at: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—',
      expires_at: inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : '—',
    }))

    exportToExcel(exportData, exportColumns, 'Vendor_Invitations_List')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<VendorInvitation>[]>(
    () => [
      {
        headerName: 'SL',
        field: 'id' as any,
        width: 70,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'font-mono text-gray-500 flex items-center justify-center',
        valueGetter: (params) => {
          if (!params.node?.rowIndex && params.node?.rowIndex !== 0) return ''
          return (currentPage - 1) * pageSize + params.node.rowIndex + 1
        },
      },
      {
        headerName: 'COMPANY NAME',
        field: 'company_name',
        minWidth: 220,
        flex: 1.5,
        hide: !visibleCols.company,
        cellRenderer: (params: any) => {
          const data: VendorInvitation = params.data
          if (!data) return null
          return (
            <div className="flex flex-col justify-center h-full">
              <span className="font-bold text-gray-900 leading-tight">
                {data.company_name}
              </span>
              {data.phone && (
                <span className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {data.phone}
                </span>
              )}
            </div>
          )
        },
      },
      {
        headerName: 'TARGET EMAIL',
        field: 'email',
        minWidth: 200,
        flex: 1.2,
        hide: !visibleCols.email,
        cellClass: 'flex items-center text-gray-700 font-medium',
      },
      {
        headerName: 'CATEGORY',
        field: 'category.name' as any,
        minWidth: 150,
        flex: 1,
        hide: !visibleCols.category,
        cellRenderer: (params: any) => {
          const cat = params.data?.category
          if (!cat) return <span className="text-gray-400 flex items-center h-full">—</span>
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
              {cat.name}
            </span>
          )
        },
      },
      {
        headerName: 'INVITATION STATUS',
        field: 'status',
        width: 160,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const status = params.value as string
          let badgeClass = 'bg-gray-100 text-gray-700 border-gray-200'
          let label = status

          if (status === 'pending') {
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200'
            label = 'Pending Email'
          } else if (status === 'completed') {
            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
            label = 'Form Submitted'
          } else if (status === 'expired') {
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200'
            label = 'Expired'
          } else if (status === 'cancelled') {
            badgeClass = 'bg-slate-100 text-slate-500 border-slate-200'
            label = 'Cancelled'
          }

          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider',
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
        headerName: 'APPLICATION / REVIEW STATUS',
        field: 'vendor.status' as any,
        minWidth: 180,
        flex: 1.2,
        hide: !visibleCols.application_status,
        cellRenderer: (params: any) => {
          const data: VendorInvitation = params.data
          if (!data) return null

          if (!data.vendor) {
            return (
              <div className="flex items-center gap-1.5 text-slate-400 text-[12px] h-full">
                <Clock className="h-3.5 w-3.5" />
                <span>Awaiting Submission</span>
              </div>
            )
          }

          const vStatus = data.vendor.status
          if (vStatus === 'approved' || vStatus === 'active') {
            return (
              <div className="flex items-center gap-1 text-emerald-700 font-bold text-[12px] h-full">
                <CheckCircle2 className="h-4 w-4" />
                <span>Approved (Active)</span>
              </div>
            )
          }

          return (
            <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[12px] h-full">
              <AlertCircle className="h-4 w-4 text-amber-600 animate-pulse" />
              <span>Under Review</span>
            </div>
          )
        },
      },
      {
        headerName: 'INVITED DATE',
        field: 'created_at',
        width: 140,
        hide: !visibleCols.invited_at,
        cellRenderer: (params: any) => {
          const val = params.value
          if (!val) return <span className="text-gray-400 flex items-center h-full">—</span>
          return (
            <div className="flex items-center text-[12px] text-gray-600 font-medium h-full">
              {new Date(val).toLocaleDateString()}
            </div>
          )
        },
      },
      {
        headerName: 'EXPIRY DATE',
        field: 'expires_at',
        width: 140,
        hide: !visibleCols.expires_at,
        cellRenderer: (params: any) => {
          const val = params.value
          if (!val) return <span className="text-gray-400 flex items-center h-full">—</span>
          const isExpired = new Date(val) < new Date()
          return (
            <div
              className={clsx(
                'flex items-center text-[12px] font-medium h-full',
                isExpired ? 'text-rose-600 font-bold' : 'text-gray-600'
              )}
            >
              {new Date(val).toLocaleDateString()}
            </div>
          )
        },
      },
      {
        headerName: 'ACTIONS',
        width: 160,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['create_vendor', 'edit_vendor', 'view_vendor']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: VendorInvitation = params.data
          if (!data) return null

          const isSubmitted = !!data.vendor
          const isPendingReview = data.vendor && data.vendor.status === 'under_review'

          return (
            <div className="flex items-center gap-1.5 h-full">
              {/* If application submitted & under review, allow Admin to approve directly */}
              {isPendingReview && (
                <PermissionGuard permission="edit_vendor">
                  <button
                    onClick={() => setVendorToApprove(data.vendor!)}
                    className="p-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[11px] transition-all border border-blue-200 flex items-center gap-1 cursor-pointer"
                    title="Review & Approve Vendor Application"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                </PermissionGuard>
              )}

              {/* View Vendor Profile if created */}
              {isSubmitted && data.vendor?.uuid && (
                <PermissionGuard permission="view_vendor">
                  <button
                    onClick={() =>
                      navigate({
                        to: `/procurement/vendors/view/${data.vendor!.uuid}` as any,
                      })
                    }
                    className="p-2 hover:bg-slate-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all border border-transparent hover:border-slate-100"
                    title="View Vendor Profile"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              {/* Cancel Pending Invitation */}
              {data.status === 'pending' && (
                <PermissionGuard permission="create_vendor">
                  <button
                    onClick={() => setInvitationToCancel(data)}
                    className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-100"
                    title="Cancel Invitation"
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
    [currentPage, pageSize, visibleCols, hasAnyPermission, navigate]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Company Name', field: 'company', visible: visibleCols.company },
    { name: 'Target Email', field: 'email', visible: visibleCols.email },
    { name: 'Category', field: 'category', visible: visibleCols.category },
    { name: 'Invitation Status', field: 'status', visible: visibleCols.status },
    { name: 'Review Status', field: 'application_status', visible: visibleCols.application_status },
    { name: 'Invited Date', field: 'invited_at', visible: visibleCols.invited_at },
    { name: 'Expiry Date', field: 'expires_at', visible: visibleCols.expires_at },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Pending Email', value: 'pending' },
    { label: 'Form Submitted', value: 'completed' },
    { label: 'Expired Link', value: 'expired' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const totalRecords = invitationsData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', active: true, permission: ['view_vendor', 'view_vendor_invitation', 'view_vendor_category', 'view_vendor_document_type', 'view_vendor_blacklist'] },
    { name: 'Requisitions & RFQ', to: '/procurement/purchase-requisitions', permission: ['view_rfq', 'view_purchase_requisition'] },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders', permission: 'view_purchase_order' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns', permission: 'view_grn' },
    { name: 'Invoices & Payments', to: '/procurement/invoices', permission: ['view_invoice', 'submit_invoice', 'view_vendor_invoice'] },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', permission: ['view_budget', 'view_budget_category', 'view_budget_head', 'view_cost_center'] },
  ]

  const titleOptions = [
    { name: 'Vendor List', to: '/procurement/vendors', permission: 'view_vendor' },
    { name: 'Invited Vendors', to: '/procurement/vendors/invitations', permission: 'view_vendor_invitation' },
    { name: 'Vendor Categories', to: '/procurement/vendors/categories', permission: 'view_vendor_category' },
    { name: 'Document Types', to: '/procurement/vendors/document-types', permission: 'view_vendor_document_type' },
    { name: 'Blacklisted Vendors', to: '/procurement/vendors/blacklists', permission: 'view_vendor_blacklist' },
  ]

  return (
    <>
      <ListPageLayout
        title="Invited Vendors"
        titleOptions={titleOptions}
        backTo="/procurement/vendors"
        tabs={tabs}
        onCreate={() => setIsInviteModalOpen(true)}
        createPermission="create_vendor"
        addLabel="Invite Vendor"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={invitationsData?.response || []}
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
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        // Export
        onExport={handleExport}
        toolbarRightExtra={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={excludeApproved}
                onChange={(e) => setExcludeApproved(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Hide Approved</span>
            </label>
          </div>
        }
      />

      <ConfirmationModal
        isOpen={!!invitationToCancel}
        onClose={() => setInvitationToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Vendor Invitation?"
        message={`Are you sure you want to cancel the invitation for "${invitationToCancel?.company_name}"? The onboarding registration link will be permanently revoked.`}
        confirmText="Yes, Cancel Invitation"
        isLoading={isCancelling}
      />

      {/* Vendor Status / Approval Modal for direct approval from this list */}
      <VendorApprovalModal
        isOpen={!!vendorToApprove}
        onClose={() => setVendorToApprove(null)}
        vendor={vendorToApprove}
        initialStatus={vendorToApprove?.status}
      />

      {/* Vendor Invite Modal */}
      <VendorInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </>
  )
}
