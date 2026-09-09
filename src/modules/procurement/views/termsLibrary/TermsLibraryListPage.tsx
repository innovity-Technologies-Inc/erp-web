import { useMemo, useState } from 'react'
import { Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import {
  useTermsLibrary,
  useDeleteTermsLibrary,
} from '../../hooks/useTermsLibrary'
import type { ColDef } from 'ag-grid-community'
import type { TermsLibrary } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { TermsLibraryModal } from '../../components/termsLibrary/TermsLibraryModal'
import { clsx } from 'clsx'

const typeBadgeColors: Record<string, string> = {
  commercial: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  technical: 'bg-sky-50 text-sky-700 border-sky-200',
  payment: 'bg-amber-50 text-amber-700 border-amber-200',
  delivery: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  legal: 'bg-purple-50 text-purple-700 border-purple-200',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
}

const responseTypeBadgeColors: Record<string, string> = {
  boolean: 'bg-blue-50 text-blue-700 border-blue-200',
  text: 'bg-slate-50 text-slate-700 border-slate-200',
  number: 'bg-amber-50 text-amber-800 border-amber-200',
  select: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

export const TermsLibraryListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [termToEdit, setTermToEdit] = useState<TermsLibrary | null>(null)

  // Confirmation Delete States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [termToDelete, setTermToDelete] = useState<{ uuid: string; title: string; code: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    code: true,
    title: true,
    type: true,
    response_type: true,
    description: true,
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
      is_active: status ? (status === 'active' ? true : false) : undefined,
      type: typeFilter || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, status, typeFilter, dateRange]
  )

  const { data: termsData, isLoading } = useTermsLibrary(params)
  const { mutate: deleteTerm, isPending: isDeleting } = useDeleteTermsLibrary()

  // Actions
  const handleAdd = () => {
    setTermToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (term: TermsLibrary) => {
    setTermToEdit(term)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (term: { uuid: string; title: string; code: string }) => {
    setTermToDelete(term)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (termToDelete) {
      deleteTerm(termToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setTermToDelete(null)
          showNotificationModal(
            'Clause Deleted!',
            `Terms & Conditions clause "${termToDelete.title}" (${termToDelete.code}) has been removed.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete clause.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!termsData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Code', key: 'code', width: 18 },
      { header: 'Clause Title', key: 'title', width: 30 },
      { header: 'Type', key: 'type', width: 16 },
      { header: 'Response Type', key: 'response_type', width: 18 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created Date', key: 'created_at', width: 15 },
    ]

    const exportData = termsData.response.map((item, index) => ({
      sl: index + 1,
      code: item.code,
      title: item.title,
      type: item.type ? item.type.toUpperCase() : 'GENERAL',
      response_type: item.response_type ? item.response_type.toUpperCase() : 'BOOLEAN',
      description: item.description || '—',
      status: item.is_active ? 'ACTIVE' : 'INACTIVE',
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'terms-and-conditions-library')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<TermsLibrary>[]>(
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
        width: 150,
        hide: !visibleCols.code,
        cellClass: 'font-mono text-[12px] font-bold text-gray-800 flex items-center',
      },
      {
        headerName: 'CLAUSE TITLE',
        field: 'title',
        flex: 1,
        minWidth: 220,
        hide: !visibleCols.title,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'CATEGORY',
        field: 'type',
        width: 140,
        hide: !visibleCols.type,
        cellRenderer: (params: any) => {
          const type = (params.value || 'general').toLowerCase()
          const colorClass = typeBadgeColors[type] || typeBadgeColors.general
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  colorClass
                )}
              >
                {type}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'RESPONSE TYPE',
        field: 'response_type',
        width: 160,
        hide: !visibleCols.response_type,
        cellRenderer: (params: any) => {
          const rType = (params.value || 'boolean').toLowerCase()
          const colorClass = responseTypeBadgeColors[rType] || responseTypeBadgeColors.text
          const labels: Record<string, string> = {
            boolean: 'Yes / No',
            text: 'Text Input',
            number: 'Numeric',
            select: 'Select Option',
          }
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  colorClass
                )}
              >
                {labels[rType] || rType}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'DESCRIPTION',
        field: 'description',
        flex: 1.5,
        minWidth: 250,
        hide: !visibleCols.description,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center h-full text-gray-600 truncate text-sm">
              {params.value || <span className="text-gray-400 italic">No description provided</span>}
            </div>
          )
        },
      },
      {
        headerName: 'STATUS',
        field: 'is_active',
        width: 120,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const isActive = Boolean(params.value)
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                )}
              >
                {isActive ? 'Active' : 'Inactive'}
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
        width: 110,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_terms_library', 'delete_terms_library']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: TermsLibrary = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="edit_terms_library">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 cursor-pointer"
                  title="Edit Clause"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_terms_library">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, title: data.title, code: data.code })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 cursor-pointer"
                  title="Delete Clause"
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
    { name: 'Code', field: 'code', visible: visibleCols.code },
    { name: 'Clause Title', field: 'title', visible: visibleCols.title },
    { name: 'Category Type', field: 'type', visible: visibleCols.type },
    { name: 'Response Type', field: 'response_type', visible: visibleCols.response_type },
    { name: 'Description', field: 'description', visible: visibleCols.description },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]

  const totalRecords = termsData?.meta?.total ?? 0
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
        title="Terms & Conditions Library"
        titleOptions={titleOptions}
        backTo="/procurement/purchase-requisitions"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_terms_library"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={termsData?.response || []}
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

      <TermsLibraryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setTermToEdit(null)
        }}
        termToEdit={termToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Terms & Conditions Clause?"
        message={`Are you sure you want to delete clause "${termToDelete?.title}" (${termToDelete?.code})? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
