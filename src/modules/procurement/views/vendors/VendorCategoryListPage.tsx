import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import {
  useVendorCategories,
  useDeleteVendorCategory,
} from '../../hooks/useVendorCategories'
import type { ColDef } from 'ag-grid-community'
import type { VendorCategory } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { VendorCategoryModal } from '../../components/vendor/VendorCategoryModal'
import { clsx } from 'clsx'

const vendorTypeBadgeColors: Record<string, string> = {
  manufacturer: 'bg-blue-50 text-blue-700 border-blue-200',
  distributor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  retailer: 'bg-purple-50 text-purple-700 border-purple-200',
  service_provider: 'bg-amber-50 text-amber-700 border-amber-200',
  importer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  contractor: 'bg-orange-50 text-orange-700 border-orange-200',
  subcontractor: 'bg-slate-50 text-slate-700 border-slate-200',
}

export const VendorCategoryListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [vendorType, setVendorType] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<VendorCategory | null>(null)

  // Confirmation Delete States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{ uuid: string; name: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    parent: true,
    vendor_type: true,
    date: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      name: search || undefined,
      vendor_type: vendorType || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, vendorType, dateRange]
  )

  const { data: categoriesData, isLoading } = useVendorCategories(params)
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteVendorCategory()

  // Actions
  const handleAdd = () => {
    setCategoryToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: VendorCategory) => {
    setCategoryToEdit(category)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (category: { uuid: string; name: string }) => {
    setCategoryToDelete(category)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setCategoryToDelete(null)
          showNotificationModal(
            'Category Deleted!',
            `Vendor category "${categoryToDelete.name}" has been removed successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete vendor category.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!categoriesData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Category Name', key: 'name', width: 30 },
      { header: 'Parent Category', key: 'parent', width: 25 },
      { header: 'Vendor Type', key: 'vendor_type', width: 22 },
      { header: 'Created At', key: 'created_at', width: 18 },
    ]

    const exportData = categoriesData.response.map((item, index) => ({
      sl: index + 1,
      name: item.name,
      parent: item.parent?.name || '—',
      vendor_type: item.vendor_type_label || item.vendor_type,
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'procurement-vendor-categories')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<VendorCategory>[]>(
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
        headerName: 'CATEGORY NAME',
        field: 'name',
        minWidth: 220,
        flex: 1.5,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'PARENT CATEGORY',
        field: 'parent',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.parent,
        cellRenderer: (params: any) => {
          const parent = params.data?.parent
          if (!parent) return <span className="text-gray-400 flex items-center h-full">—</span>
          return (
            <span className="text-gray-700 font-medium flex items-center h-full">
              {parent.name}
            </span>
          )
        },
      },
      {
        headerName: 'VENDOR TYPE',
        field: 'vendor_type',
        minWidth: 150,
        flex: 1,
        hide: !visibleCols.vendor_type,
        cellRenderer: (params: any) => {
          const type = params.value as string
          const label = params.data?.vendor_type_label || type
          const badgeColor = vendorTypeBadgeColors[type] || 'bg-gray-100 text-gray-700 border-gray-200'

          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border capitalize leading-none',
                  badgeColor
                )}
              >
                {label}
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
        hide: !visibleCols.action || !hasAnyPermission(['edit_vendor_category', 'delete_vendor_category']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: VendorCategory = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="edit_vendor_category">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                  title="Edit Category"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_vendor_category">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, name: data.name })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                  title="Delete Category"
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
    { name: 'Category Name', field: 'name', visible: visibleCols.name },
    { name: 'Parent Category', field: 'parent', visible: visibleCols.parent },
    { name: 'Vendor Type', field: 'vendor_type', visible: visibleCols.vendor_type },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const vendorTypeOptions = [
    { label: 'Manufacturer', value: 'manufacturer' },
    { label: 'Distributor', value: 'distributor' },
    { label: 'Retailer', value: 'retailer' },
    { label: 'Service Provider', value: 'service_provider' },
    { label: 'Importer', value: 'importer' },
    { label: 'Contractor', value: 'contractor' },
    { label: 'Subcontractor', value: 'subcontractor' },
  ]

  const totalRecords = categoriesData?.meta?.total ?? 0
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
        title="Vendor Categories"
        titleOptions={titleOptions}
        backTo="/procurement/vendors"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_vendor_category"
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={categoriesData?.response || []}
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
          setVendorType(val)
          setCurrentPage(1)
        }}
        statusValue={vendorType}
        statusOptions={vendorTypeOptions}
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

      <VendorCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setCategoryToEdit(null)
        }}
        categoryToEdit={categoryToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Vendor Category?"
        message={`Are you sure you want to remove category "${categoryToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
