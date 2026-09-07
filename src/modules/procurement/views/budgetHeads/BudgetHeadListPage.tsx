import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import {
  useBudgetHeads,
  useDeleteBudgetHead,
} from '../../hooks/useBudgetHeads'
import { useBudgetCategories } from '../../hooks/useBudgetCategories'
import type { ColDef } from 'ag-grid-community'
import type { BudgetHead } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportUtils'
import { BudgetHeadModal } from '../../components/budgetHead/BudgetHeadModal'

export const BudgetHeadListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [headToEdit, setHeadToEdit] = useState<BudgetHead | null>(null)

  // Confirmation Delete States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [headToDelete, setHeadToDelete] = useState<{ uuid: string; name: string } | null>(null)

  // Category Options for filtering
  const { data: categoriesData } = useBudgetCategories({ per_page: 200 })
  const categoryFilterOptions = useMemo(() => {
    return (categoriesData?.response || []).map((cat) => ({
      value: String(cat.id),
      label: cat.name,
    }))
  }, [categoriesData])

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    code: true,
    name: true,
    category: true,
    coa: true,
    date: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      search: search || undefined,
      budget_category_id: selectedCategory ? Number(selectedCategory) : undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, selectedCategory, dateRange]
  )

  const { data: headsData, isLoading } = useBudgetHeads(params)
  const { mutate: deleteHead, isPending: isDeleting } = useDeleteBudgetHead()

  // Actions
  const handleAdd = () => {
    setHeadToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (head: BudgetHead) => {
    setHeadToEdit(head)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (head: { uuid: string; name: string }) => {
    setHeadToDelete(head)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (headToDelete) {
      deleteHead(headToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setHeadToDelete(null)
          showNotificationModal(
            'Budget Head Deleted!',
            `Budget head "${headToDelete.name}" has been removed successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to delete budget head.'
          showNotificationModal('Delete Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!headsData?.response) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Budget Head Code', key: 'code', width: 18 },
      { header: 'Budget Head Name', key: 'name', width: 30 },
      { header: 'Budget Category', key: 'category', width: 25 },
      { header: 'COA Head Code', key: 'coa_id', width: 18 },
      { header: 'Created At', key: 'created_at', width: 18 },
    ]

    const exportData = headsData.response.map((item, index) => ({
      sl: index + 1,
      code: item.code,
      name: item.name,
      category: item.category?.name || '—',
      coa_id: item.coa_id || '—',
      created_at: item.created_at ? formatDate(item.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'procurement-budget-heads')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<BudgetHead>[]>(
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
        headerName: 'BUDGET HEAD NAME',
        field: 'name',
        minWidth: 220,
        flex: 1.5,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-900 flex items-center',
      },
      {
        headerName: 'BUDGET CATEGORY',
        field: 'category',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.category,
        cellRenderer: (params: any) => {
          const cat = params.data?.category
          if (!cat) return <span className="text-gray-400 flex items-center h-full">—</span>
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {cat.name}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'COA HEAD CODE',
        field: 'coa_id',
        width: 150,
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
        hide: !visibleCols.action || !hasAnyPermission(['edit_budget_head', 'delete_budget_head']),
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const data: BudgetHead = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              <PermissionGuard permission="edit_budget_head">
                <button
                  onClick={() => handleEdit(data)}
                  className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
                  title="Edit Budget Head"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_budget_head">
                <button
                  onClick={() => handleDeleteClick({ uuid: data.uuid, name: data.name })}
                  className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
                  title="Delete Budget Head"
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
    { name: 'Head Name', field: 'name', visible: visibleCols.name },
    { name: 'Budget Category', field: 'category', visible: visibleCols.category },
    { name: 'COA Head Code', field: 'coa', visible: visibleCols.coa },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const totalRecords = headsData?.meta?.total ?? 0
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
        title="Budget Heads"
        titleOptions={titleOptions}
        backTo="/procurement/budgets/categories"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_budget_head"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={headsData?.response || []}
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
          setSelectedCategory(val)
          setCurrentPage(1)
        }}
        statusValue={selectedCategory}
        statusOptions={categoryFilterOptions}
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

      <BudgetHeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setHeadToEdit(null)
        }}
        headToEdit={headToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Budget Head?"
        message={`Are you sure you want to remove budget head "${headToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
