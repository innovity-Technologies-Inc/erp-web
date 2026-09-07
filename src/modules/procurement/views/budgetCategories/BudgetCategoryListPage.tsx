import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import {
  useBudgetCategories,
  useDeleteBudgetCategory,
} from '../../hooks/useBudgetCategories'
import type { ColDef } from 'ag-grid-community'
import type { BudgetCategory } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { BudgetCategoryModal } from '../../components/budgetCategory/BudgetCategoryModal'

export const BudgetCategoryListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<BudgetCategory | null>(null)

  // Confirmation Delete States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{ uuid: string; name: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    coa: true,
    description: true,
    date: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      search: search || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, dateRange]
  )

  const { data: categoriesData, isLoading } = useBudgetCategories(params)
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteBudgetCategory()

  // Actions
  const handleAdd = () => {
    setCategoryToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: BudgetCategory) => {
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
            'Budget Category Deleted!',
            `Budget category "${categoryToDelete.name}" has been removed successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete budget category.'
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
      { header: 'Budget Category Name', key: 'name', width: 30 },
      { header: 'COA Head Code', key: 'coa_id', width: 18 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Created At', key: 'created_at', width: 18 },
    ]

    const exportData = categoriesData.response.map((item, index) => ({
      sl: index + 1,
      name: item.name,
      coa_id: item.coa_id || '—',
      description: item.description || '—',
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'procurement-budget-categories')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<BudgetCategory>[]>(
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
        headerName: 'BUDGET CATEGORY NAME',
        field: 'name',
        minWidth: 240,
        flex: 1.5,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'COA HEAD CODE',
        field: 'coa_id',
        width: 160,
        hide: !visibleCols.coa,
        cellRenderer: (params: any) => {
          if (!params.value) return <span className="text-gray-400 flex items-center h-full">—</span>
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                {params.value}
              </span>
            </div>
          )
        },
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
        hide: !visibleCols.action || !hasAnyPermission(['edit_budget_category', 'delete_budget_category']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: BudgetCategory = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="edit_budget_category">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                  title="Edit Budget Category"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_budget_category">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, name: data.name })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                  title="Delete Budget Category"
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
    { name: 'COA Head Code', field: 'coa', visible: visibleCols.coa },
    { name: 'Description', field: 'description', visible: visibleCols.description },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const totalRecords = categoriesData?.meta?.total ?? 0
  const totalPages = Math.ceil(totalRecords / pageSize) || 1

  const tabs = [
    { name: 'Vendors', to: '/procurement/vendors' },
    { name: 'Requisitions & RFQ', to: '/procurement/sourcing' },
    { name: 'Purchase Orders', to: '/procurement/purchase-orders' },
    { name: 'Goods Receipt (GRN)', to: '/procurement/grns' },
    { name: 'Invoices & Payments', to: '/procurement/invoices' },
    { name: 'Budgets & Cost Centers', to: '/procurement/budgets', active: true },
  ]

  const titleOptions = [
    { name: 'Budget Allocations', to: '/procurement/budgets' },
    { name: 'Budget Categories', to: '/procurement/budgets/categories' },
    { name: 'Budget Heads', to: '/procurement/budgets/heads' },
    { name: 'Cost Centers', to: '/procurement/cost-centers' },
  ]

  return (
    <>
      <ListPageLayout
        title="Budget Categories"
        titleOptions={titleOptions}
        backTo="/procurement/cost-centers"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_budget_category"
        searchWidth="max-w-[220px]"
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

      <BudgetCategoryModal
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
        title="Delete Budget Category?"
        message={`Are you sure you want to remove budget category "${categoryToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
