import { useMemo, useState } from 'react'
import { Eye, Edit, Trash2, Star, UserCheck } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useVendors, useDeleteVendor } from '../../hooks/useVendors'
import type { ColDef } from 'ag-grid-community'
import type { Vendor } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { VendorApprovalModal } from '../../components/vendor/VendorApprovalModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { exportToExcel } from '@/utils/exportUtils'
import { clsx } from 'clsx'

export const VendorListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<{ uuid: string; name: string } | null>(null)

  // Status Approval Modal
  const [vendorToApprove, setVendorToApprove] = useState<Vendor | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    code: true,
    name: true,
    phone: true,
    email: true,
    rating: true,
    status: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      name: search || undefined,
      status: status || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, status, dateRange]
  )

  const { data: vendorsData, isLoading } = useVendors(params)
  const { mutate: deleteVendor, isPending: isDeleting } = useDeleteVendor()

  // Actions
  const handleAdd = () => {
    navigate({ to: '/procurement/vendors/create' as any })
  }

  const handleDeleteClick = (vendor: { uuid: string; name: string }) => {
    setVendorToDelete(vendor)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (vendorToDelete) {
      deleteVendor(vendorToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setVendorToDelete(null)
          showNotificationModal(
            'Vendor Deleted!',
            `Vendor "${vendorToDelete.name}" has been removed successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete vendor.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!vendorsData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Vendor Name', key: 'name', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Rating', key: 'rating', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    const exportData = vendorsData.response.map((item, index) => ({
      sl: index + 1,
      code: item.code,
      name: item.name,
      phone: item.phone || '—',
      email: item.email || '—',
      rating: item.rating ? `${item.rating} (${item.rating_grade || 'N/A'})` : '—',
      status: item.status_label || item.status,
    }))

    exportToExcel(exportData, exportColumns, 'procurement-vendors-list')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Vendor>[]>(
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
        headerName: 'CODE',
        field: 'code',
        width: 130,
        hide: !visibleCols.code,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'VENDOR NAME',
        field: 'name',
        minWidth: 220,
        flex: 1.5,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
        cellRenderer: (params: any) => {
          const name = params.value || params.data?.name
          if (!name) return <span className="text-gray-400 font-normal">—</span>
          const uuid = params.data?.uuid

          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (uuid) {
                  navigate({ to: `/procurement/vendors/view/${uuid}` as any })
                }
              }}
              className="font-bold text-gray-900 hover:text-primary transition-colors text-left truncate cursor-pointer text-[13px]"
              title={name}
            >
              {name}
            </button>
          )
        },
      },
      {
        headerName: 'PHONE',
        field: 'phone',
        width: 140,
        hide: !visibleCols.phone,
        cellClass: 'text-gray-600 flex items-center',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'EMAIL',
        field: 'email',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.email,
        cellClass: 'text-gray-600 flex items-center',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'RATING',
        field: 'rating',
        width: 120,
        hide: !visibleCols.rating,
        cellRenderer: (params: any) => {
          const score = params.data?.rating
          const grade = params.data?.rating_grade
          if (!score && score !== 0) {
            return <span className="text-gray-400 flex items-center h-full">—</span>
          }
          return (
            <div className="flex items-center gap-1 h-full">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[13px] font-semibold text-gray-800">{score}</span>
              {grade && (
                <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded">
                  {grade}
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
          const status = params.value
          const label = params.data?.status_label || status

          let badgeStyle = 'bg-gray-100 text-gray-700'
          if (status === 'active' || status === 'approved') {
            badgeStyle = 'bg-[#dcfce7] text-[#166534]'
          } else if (status === 'under_review' || status === 'kyc_pending' || status === 'monitored') {
            badgeStyle = 'bg-[#fef3c7] text-[#92400e]'
          } else if (status === 'blacklisted') {
            badgeStyle = 'bg-[#fee2e2] text-[#991b1b]'
          } else if (status === 'documents_uploaded' || status === 'evaluated') {
            badgeStyle = 'bg-[#e0e7ff] text-[#3730a3]'
          }

          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-tight uppercase leading-none',
                  badgeStyle
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
        width: 160,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['view_vendor', 'edit_vendor', 'delete_vendor']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: Vendor = params.data
          if (!data) return null
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="view_vendor">
                <button
                  onClick={() => navigate({ to: `/procurement/vendors/view/${data.uuid}` as any })}
                  className="p-2 hover:bg-slate-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all border border-transparent hover:border-slate-100 hover:scale-110 group/view"
                  title="View Profile Page"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="edit_vendor">
                <button
                  onClick={() => setVendorToApprove(data)}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110 group/status"
                  title="Change Status / Approve"
                >
                  <UserCheck className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="edit_vendor">
                <button
                  onClick={() => navigate({ to: `/procurement/vendors/edit/${data.uuid}` as any })}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                  title="Edit Vendor"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_vendor">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, name: data.name })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                  title="Delete Vendor"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </PermissionGuard>
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, visibleCols, hasAnyPermission, navigate]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Code', field: 'code', visible: visibleCols.code },
    { name: 'Vendor Name', field: 'name', visible: visibleCols.name },
    { name: 'Phone', field: 'phone', visible: visibleCols.phone },
    { name: 'Email', field: 'email', visible: visibleCols.email },
    { name: 'Rating', field: 'rating', visible: visibleCols.rating },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Approved', value: 'approved' },
    { label: 'Draft', value: 'draft' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'KYC Pending', value: 'kyc_pending' },
    { label: 'Documents Uploaded', value: 'documents_uploaded' },
    { label: 'Evaluated', value: 'evaluated' },
    { label: 'Monitored', value: 'monitored' },
    { label: 'Blacklisted', value: 'blacklisted' },
  ]

  const totalRecords = vendorsData?.meta?.total ?? 0
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
        title="Vendor List"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_vendor"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={vendorsData?.response || []}
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

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Vendor?"
        message={`Are you sure you want to remove vendor "${vendorToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />

      {/* Vendor Approval / Status Modal */}
      <VendorApprovalModal
        isOpen={!!vendorToApprove}
        onClose={() => setVendorToApprove(null)}
        vendor={vendorToApprove}
        initialStatus={vendorToApprove?.status}
      />
    </>
  )
}
