import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import {
  useVendorDocumentTypes,
  useDeleteVendorDocumentType,
} from '../../hooks/useVendorDocumentTypes'
import type { ColDef } from 'ag-grid-community'
import type { VendorDocumentType } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { VendorDocumentTypeModal } from '../../components/vendor/VendorDocumentTypeModal'
import { clsx } from 'clsx'

export const VendorDocumentTypeListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [isRequiredFilter, setIsRequiredFilter] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [docTypeToEdit, setDocTypeToEdit] = useState<VendorDocumentType | null>(null)

  // Confirmation Delete States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [docTypeToDelete, setDocTypeToDelete] = useState<{ uuid: string; name: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    code: true,
    is_required: true,
    date: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      name: search || undefined,
      is_required: isRequiredFilter !== undefined ? isRequiredFilter : undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, isRequiredFilter, dateRange]
  )

  const { data: docTypesData, isLoading } = useVendorDocumentTypes(params)
  const { mutate: deleteDocType, isPending: isDeleting } = useDeleteVendorDocumentType()

  // Actions
  const handleAdd = () => {
    setDocTypeToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (docType: VendorDocumentType) => {
    setDocTypeToEdit(docType)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (docType: { uuid: string; name: string }) => {
    setDocTypeToDelete(docType)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (docTypeToDelete) {
      deleteDocType(docTypeToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setDocTypeToDelete(null)
          showNotificationModal(
            'Document Type Deleted!',
            `Document type "${docTypeToDelete.name}" has been removed successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message =
            error.response?.data?.message || error.message || 'Failed to delete document type.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!docTypesData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Document Name', key: 'name', width: 30 },
      { header: 'Document Code', key: 'code', width: 22 },
      { header: 'Requirement', key: 'is_required', width: 18 },
      { header: 'Created At', key: 'created_at', width: 18 },
    ]

    const exportData = docTypesData.response.map((item, index) => ({
      sl: index + 1,
      name: item.name,
      code: item.code,
      is_required: item.is_required ? 'Mandatory' : 'Optional',
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'procurement-vendor-document-types')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<VendorDocumentType>[]>(
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
        headerName: 'DOCUMENT NAME',
        field: 'name',
        minWidth: 220,
        flex: 1.5,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'DOCUMENT CODE',
        field: 'code',
        minWidth: 160,
        flex: 1,
        hide: !visibleCols.code,
        cellRenderer: (params: any) => (
          <div className="flex items-center h-full">
            <span className="font-mono text-[12px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {params.value}
            </span>
          </div>
        ),
      },
      {
        headerName: 'COMPLIANCE REQUIREMENT',
        field: 'is_required',
        width: 190,
        hide: !visibleCols.is_required,
        cellRenderer: (params: any) => {
          const isMandatory = Boolean(params.value)

          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border leading-none',
                  isMandatory
                    ? 'bg-[#dcfce7] text-[#166534] border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                {isMandatory ? 'Mandatory' : 'Optional'}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'DATE',
        field: 'created_at',
        width: 140,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'ACTIONS',
        width: 110,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_vendor_document_type', 'delete_vendor_document_type']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: VendorDocumentType = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="edit_vendor_document_type">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                  title="Edit Document Type"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_vendor_document_type">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, name: data.name })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                  title="Delete Document Type"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </PermissionGuard>
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, visibleCols, hasAnyPermission]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Document Name', field: 'name', visible: visibleCols.name },
    { name: 'Document Code', field: 'code', visible: visibleCols.code },
    { name: 'Compliance', field: 'is_required', visible: visibleCols.is_required },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const requirementFilterOptions = [
    { label: 'Mandatory', value: '1' },
    { label: 'Optional', value: '0' },
  ]

  const totalRecords = docTypesData?.meta?.total ?? 0
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
        title="Document Types"
        titleOptions={titleOptions}
        backTo="/procurement/vendors"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_vendor_document_type"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={docTypesData?.response || []}
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
          setIsRequiredFilter(val)
          setCurrentPage(1)
        }}
        statusValue={isRequiredFilter}
        statusOptions={requirementFilterOptions}
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

      <VendorDocumentTypeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setDocTypeToEdit(null)
        }}
        documentTypeToEdit={docTypeToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Document Type?"
        message={`Are you sure you want to remove document type "${docTypeToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
