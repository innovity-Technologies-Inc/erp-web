import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import {
  useCostCenters,
  useDeleteCostCenter,
} from '../../hooks/useCostCenters'
import type { ColDef } from 'ag-grid-community'
import type { CostCenter } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { CostCenterModal } from '../../components/costCenter/CostCenterModal'
import { clsx } from 'clsx'

export const CostCenterListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [costCenterToEdit, setCostCenterToEdit] = useState<CostCenter | null>(null)

  // Confirmation Delete States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [costCenterToDelete, setCostCenterToDelete] = useState<{ uuid: string; name: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    code: true,
    name: true,
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
      status: status || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, status, dateRange]
  )

  const { data: costCentersData, isLoading } = useCostCenters(params)
  const { mutate: deleteCostCenter, isPending: isDeleting } = useDeleteCostCenter()

  // Actions
  const handleAdd = () => {
    setCostCenterToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (costCenter: CostCenter) => {
    setCostCenterToEdit(costCenter)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (costCenter: { uuid: string; name: string }) => {
    setCostCenterToDelete(costCenter)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (costCenterToDelete) {
      deleteCostCenter(costCenterToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setCostCenterToDelete(null)
          showNotificationModal(
            'Cost Center Deleted!',
            `Cost center "${costCenterToDelete.name}" has been removed successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete cost center.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!costCentersData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Cost Center Code', key: 'code', width: 18 },
      { header: 'Cost Center Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'created_at', width: 18 },
    ]

    const exportData = costCentersData.response.map((item, index) => ({
      sl: index + 1,
      code: item.code,
      name: item.name,
      description: item.description || '—',
      status: item.status_label || item.status,
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'procurement-cost-centers')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<CostCenter>[]>(
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
        width: 140,
        hide: !visibleCols.code,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 tracking-wider">
                {params.value}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'COST CENTER NAME',
        field: 'name',
        minWidth: 220,
        flex: 1.5,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'DESCRIPTION',
        field: 'description',
        minWidth: 220,
        flex: 2,
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
        field: 'status',
        width: 120,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const st = params.value as string
          const isActive = st === 'active'
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
                {params.data?.status_label || (isActive ? 'Active' : 'Inactive')}
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
        hide: !visibleCols.action || !hasAnyPermission(['edit_cost_center', 'delete_cost_center']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: CostCenter = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="edit_cost_center">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                  title="Edit Cost Center"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_cost_center">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, name: data.name })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                  title="Delete Cost Center"
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
    { name: 'Cost Center Name', field: 'name', visible: visibleCols.name },
    { name: 'Description', field: 'description', visible: visibleCols.description },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]

  const totalRecords = costCentersData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors', permission: ['view_vendor', 'view_vendor_invitation', 'view_vendor_category', 'view_vendor_document_type', 'view_vendor_blacklist'] },
    { name: 'Requisitions & RFQ', to: '/procurement/sourcing', permission: ['view_rfq', 'view_procurement_pr'] },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders', permission: 'view_purchase_order' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns', permission: 'view_grn' },
    { name: 'Invoices & Payments', to: '/procurement/invoices', permission: ['view_invoice', 'submit_invoice', 'view_vendor_invoice'] },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', active: true, permission: ['view_budget', 'view_budget_category', 'view_budget_head', 'view_cost_center'] },
  ]

  const titleOptions = [
    { name: 'Budget Allocations', to: '/procurement/budgets', permission: 'view_budget' },
    { name: 'Budget Categories', to: '/procurement/budgets/categories', permission: 'view_budget_category' },
    { name: 'Budget Heads', to: '/procurement/budgets/heads', permission: 'view_budget_head' },
    { name: 'Cost Centers', to: '/procurement/cost-centers', permission: 'view_cost_center' },
  ]

  return (
    <>
      <ListPageLayout
        title="Cost Centers"
        titleOptions={titleOptions}
        backTo="/procurement/vendors"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_cost_center"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={costCentersData?.response || []}
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

      <CostCenterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setCostCenterToEdit(null)
        }}
        costCenterToEdit={costCenterToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Cost Center?"
        message={`Are you sure you want to remove cost center "${costCenterToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
