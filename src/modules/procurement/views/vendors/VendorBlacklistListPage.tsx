import { useMemo, useState } from 'react'
import { Edit, Trash2, ShieldAlert, ShieldCheck, Eye, Clock, AlertTriangle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  useVendorBlacklists,
  useDeleteVendorBlacklist,
} from '../../hooks/useVendorBlacklists'
import type { ColDef } from 'ag-grid-community'
import type { VendorBlacklist } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { VendorBlacklistModal } from '../../components/vendor/VendorBlacklistModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { clsx } from 'clsx'

export const VendorBlacklistListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [blacklistType, setBlacklistType] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recordToEdit, setRecordToEdit] = useState<VendorBlacklist | null>(null)

  // Unblacklist / Remove Confirmation States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<{ uuid: string; vendorName: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    date: true,
    vendor_name: true,
    vendor_code: true,
    type: true,
    reason: true,
    blacklisted_by: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      search: search || undefined,
      blacklist_type: blacklistType || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, blacklistType, dateRange]
  )

  const { data: blacklistData, isLoading } = useVendorBlacklists(params)
  const { mutate: deleteBlacklist, isPending: isDeleting } = useDeleteVendorBlacklist()

  // Actions
  const handleAdd = () => {
    setRecordToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (record: VendorBlacklist) => {
    setRecordToEdit(record)
    setIsModalOpen(true)
  }

  const handleRemoveClick = (record: VendorBlacklist) => {
    setRecordToDelete({
      uuid: record.uuid,
      vendorName: record.vendor?.name || 'Vendor',
    })
    setIsConfirmOpen(true)
  }

  const handleConfirmRemove = () => {
    if (recordToDelete) {
      deleteBlacklist(recordToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setRecordToDelete(null)
          showNotificationModal(
            'Vendor Reinstated',
            `"${recordToDelete.vendorName}" has been removed from the blacklist and restored to active status.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to remove vendor from blacklist.'
          showNotificationModal('Removal Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!blacklistData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Date', key: 'date', width: 16 },
      { header: 'Vendor Name', key: 'vendor_name', width: 30 },
      { header: 'Vendor Code', key: 'vendor_code', width: 15 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Disciplinary Reason', key: 'reason', width: 40 },
      { header: 'Blacklisted By', key: 'by', width: 22 },
    ]

    const exportData = blacklistData.response.map((item, index) => ({
      sl: index + 1,
      date: formatDate(item.blacklisted_at || item.created_at || ''),
      vendor_name: item.vendor?.name || '—',
      vendor_code: item.vendor?.code || '—',
      type: item.blacklist_type_label || item.blacklist_type,
      reason: item.reason,
      by: item.blacklisted_by_user?.name || `User #${item.blacklisted_by || '—'}`,
    }))

    exportToExcel(exportData, exportColumns, 'procurement-vendor-blacklists')
  }

  // AG Grid Column Definitions
  const columnDefs: ColDef<VendorBlacklist>[] = useMemo(
    () => [
      {
        headerName: 'SL',
        field: 'id' as any,
        width: 70,
        hide: !visibleCols.sl,
        cellRenderer: (params: any) => {
          const rowIndex = params.node?.rowIndex ?? 0
          return <span className="text-gray-500 font-medium">{rowIndex + 1 + (currentPage - 1) * pageSize}</span>
        },
      },
      {
        headerName: 'DATE',
        field: 'blacklisted_at',
        width: 130,
        hide: !visibleCols.date,
        cellRenderer: (params: any) => {
          const date = params.value || params.data?.created_at
          return (
            <span className="text-[12px] font-medium text-gray-700">
              {date ? formatDate(date) : '—'}
            </span>
          )
        },
      },
      {
        headerName: 'VENDOR NAME',
        field: 'vendor.name' as any,
        width: 250,
        flex: 1,
        hide: !visibleCols.vendor_name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
        cellRenderer: (params: any) => {
          const vendor = params.data?.vendor
          if (!vendor) return <span className="text-gray-400">—</span>

          return (
            <button
              type="button"
              onClick={() => navigate({ to: `/procurement/vendors/view/${vendor.uuid}` as any })}
              className="text-[13px] font-bold text-gray-900 hover:text-primary hover:underline transition-colors text-left truncate cursor-pointer"
            >
              {vendor.name}
            </button>
          )
        },
      },
      {
        headerName: 'VENDOR CODE',
        field: 'vendor.code' as any,
        width: 140,
        hide: !visibleCols.vendor_code,
        cellRenderer: (params: any) => {
          const code = params.data?.vendor?.code
          return (
            <span className="font-mono text-[12px] px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 font-semibold">
              {code || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'BLACKLIST TYPE',
        field: 'blacklist_type',
        width: 180,
        hide: !visibleCols.type,
        cellRenderer: (params: any) => {
          const type = params.value
          const isPermanent = type === 'permanent'

          return (
            <span
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5',
                isPermanent
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              <span className={clsx('w-1.5 h-1.5 rounded-full', isPermanent ? 'bg-rose-500' : 'bg-amber-500')} />
              {isPermanent ? 'Permanent Bar' : 'Temporary Suspension'}
            </span>
          )
        },
      },
      {
        headerName: 'DISCIPLINARY REASON',
        field: 'reason',
        width: 280,
        flex: 2,
        hide: !visibleCols.reason,
        cellRenderer: (params: any) => {
          return (
            <span className="text-[12px] text-gray-700 line-clamp-1" title={params.value}>
              {params.value || '—'}
            </span>
          )
        },
      },
      {
        headerName: 'LOGGED BY',
        field: 'blacklisted_by_user.name' as any,
        width: 160,
        hide: !visibleCols.blacklisted_by,
        cellRenderer: (params: any) => {
          const user = params.data?.blacklisted_by_user
          return (
            <span className="text-[12px] text-gray-600 font-medium">
              {user?.name || (params.data?.blacklisted_by ? `User #${params.data?.blacklisted_by}` : 'System Admin')}
            </span>
          )
        },
      },
      {
        headerName: 'ACTIONS',
        width: 140,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_vendor_blacklist', 'delete_vendor_blacklist', 'view_vendor']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: VendorBlacklist = params.data
          if (!data) return null
          return (
            <div className="flex items-center gap-1.5 h-full">
              {data.vendor?.uuid && (
                <PermissionGuard permission="view_vendor">
                  <button
                    onClick={() => navigate({ to: `/procurement/vendors/view/${data.vendor?.uuid}` as any })}
                    className="p-2 hover:bg-slate-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all border border-transparent hover:border-slate-100 hover:scale-110 group/view"
                    title="View Vendor Profile"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}

              <PermissionGuard permission="edit_vendor_blacklist">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-amber-50 text-amber-600 rounded-xl transition-all border border-transparent hover:border-amber-100 hover:scale-110 group/edit"
                  title="Edit Disciplinary Record"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_vendor_blacklist">
                <button
                  onClick={() => handleRemoveClick(data)}
                  className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/del"
                  title="Remove from Blacklist (Reinstate Vendor)"
                >
                  <ShieldCheck className="h-4 w-4" />
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
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Vendor Name', field: 'vendor_name', visible: visibleCols.vendor_name },
    { name: 'Vendor Code', field: 'vendor_code', visible: visibleCols.vendor_code },
    { name: 'Type', field: 'type', visible: visibleCols.type },
    { name: 'Reason', field: 'reason', visible: visibleCols.reason },
    { name: 'Logged By', field: 'blacklisted_by', visible: visibleCols.blacklisted_by },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Temporary Suspension', value: 'temporary' },
    { label: 'Permanent Blacklist', value: 'permanent' },
  ]

  const totalRecords = blacklistData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', active: true },
    { name: 'Requisitions & RFQ', to: '/procurement/sourcing' },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns' },
    { name: 'Invoices & Payments', to: '/procurement/invoices' },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets' },
  ]

  const titleOptions = [
    { name: 'Vendor List', to: '/procurement/vendors' },
    { name: 'Invited Vendors', to: '/procurement/vendors/invitations' },
    { name: 'Vendor Categories', to: '/procurement/vendors/categories' },
    { name: 'Document Types', to: '/procurement/vendors/document-types' },
    { name: 'Blacklisted Vendors', to: '/procurement/vendors/blacklists' },
  ]

  return (
    <>
      <ListPageLayout
        title="Blacklisted Vendors"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_vendor_blacklist"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={blacklistData?.response || []}
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
          setBlacklistType(val)
          setCurrentPage(1)
        }}
        statusValue={blacklistType}
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

      {/* Blacklist Vendor Modal */}
      <VendorBlacklistModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setRecordToEdit(null)
        }}
        blacklistRecord={recordToEdit}
      />

      {/* Remove / Reinstate Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Reinstate Vendor?"
        message={`Are you sure you want to remove "${recordToDelete?.vendorName}" from the blacklist? The vendor will be restored to Active status.`}
        confirmText="Yes, Reinstate Vendor"
        variant="info"
        isLoading={isDeleting}
      />
    </>
  )
}
