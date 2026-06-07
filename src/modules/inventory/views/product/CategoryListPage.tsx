import { useMemo, useState } from 'react'
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useCategoriesDatatable, useDeleteCategory, useToggleCategoryStatus } from '../../hooks/useCategories'
import type { ColDef } from 'ag-grid-community'
import type { CategoryListItem } from '../../api/categories.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'
import { CategoryModal } from '../../components'

interface CategoryListPageProps {
  isSubCategory?: boolean
}

export const CategoryListPage = ({ isSubCategory = false }: CategoryListPageProps) => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()
  
  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategoryUuid, setSelectedCategoryUuid] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [editData, setEditData] = useState<any | null>(null)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [categoryUuidToDelete, setCategoryUuidToDelete] = useState<string | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    date: true,
    status: true,
    action: true
  })

  // Data Fetching
  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: search },
    status,
    start_date: dateRange.start,
    end_date: dateRange.end,
    is_subcategory: isSubCategory,
  }), [currentPage, pageSize, search, status, dateRange, isSubCategory])

  const { data: categoriesData, isLoading } = useCategoriesDatatable(params)
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleCategoryStatus()
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null)

  // Actions
  const handleAdd = () => {
    setSelectedCategoryUuid(null)
    setSelectedCategoryId(null)
    setEditData(null)
    setIsModalOpen(true)
  }

  const handleEdit = (data: CategoryListItem) => {
    setSelectedCategoryUuid(data.uuid)
    setSelectedCategoryId(data.id || null)
    
    // Clean up name for editing (remove indentation and special prefixes)
    const cleanName = data.category_name.replace(/(&nbsp;)*=>\s*/g, '').replace(/^\*\s*/, '')
    
    setEditData({
      category_name: cleanName,
      parent_id: data.parent_id,
      status: Number(data.status) === 1 ? 1 : 0
    })
    setIsModalOpen(true)
  }

  const handleStatusToggle = (uuid: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    setTogglingUuid(uuid)
    toggleStatus({ uuid, status: newStatus }, {
        onSuccess: () => {
            setTogglingUuid(null)
            showNotificationModal(
                'Status Updated!',
                `Category status has been changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
                'success'
            )
        },
        onError: () => {
            setTogglingUuid(null)
        }
    })
  }

  const handleDeleteClick = (uuid: string) => {
    setCategoryUuidToDelete(uuid)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (categoryUuidToDelete) {
      deleteCategory(categoryUuidToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setCategoryUuidToDelete(null)
          showNotificationModal(
            'Category Deleted!',
            'The category has been removed successfully.',
            'success'
          )
        },
        onError: (err: any) => {
            setIsConfirmOpen(false)
            showNotificationModal(
                'Delete Failed',
                err.response?.data?.message || 'Could not delete category.',
                'error'
            )
        }
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<CategoryListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        const index = params.node?.rowIndex ?? 0
        return (currentPage - 1) * pageSize + index + 1
      },
      width: 80,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
    },
    {
      headerName: isSubCategory ? 'CATEGORY NAME' : 'PARENT CATEGORY',
      field: (isSubCategory ? 'parent_category_name' : 'parent_name') as any,
      width: 200,
      hide: !isSubCategory,
      cellClass: 'text-gray-500 font-medium flex items-center',
    },
    {
      headerName: isSubCategory ? 'SUB CATEGORY NAME' : 'CATEGORY NAME',
      field: (isSubCategory ? 'sub_category_path' : 'category_name') as any,
      minWidth: 300,
      flex: 1,
      hide: !visibleCols.name,
      cellRenderer: (params: any) => {
        // Render with HTML for main category list to show indentation if any
        return <div dangerouslySetInnerHTML={{ __html: params.value }} className="font-medium text-gray-900" />
      }
    },
    {
        headerName: 'DATE',
        field: 'created_at',
        width: 150,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 180,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const isActive = Number(params.value) === 1
        const isProcessing = isToggling && togglingUuid === params.data.uuid
        
       return (
        <div className="flex items-center gap-2 h-full leading-none">
          <span
            className={clsx(
              'inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase leading-none',
              isActive
                ? 'bg-[#dcfce7] text-[#166534]'
                : 'bg-[#fee2e2] text-[#991b1b]',
              isProcessing && 'opacity-50 blur-[0.5px]'
            )}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>

          <PermissionGuard permission="edit_product_category">
            <button
              onClick={() =>
                handleStatusToggle(params.data.uuid, Number(params.value))
              }
              disabled={isProcessing}
              className={clsx(
                'flex items-center justify-center transition-all duration-300 transform active:scale-90',
                isActive ? 'text-primary' : 'text-gray-300',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isProcessing ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : isActive ? (
                <ToggleRight className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <ToggleLeft className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </PermissionGuard>
        </div>
      )
      }
    },
    {
      headerName: 'ACTIONS',
      width: 120,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['edit_product_category', 'delete_product_category']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="edit_product_category">
            <button
              onClick={() => handleEdit(params.data)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit Category"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_product_category">
            <button
              onClick={() => handleDeleteClick(params.data.uuid)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
              title="Delete Category"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [currentPage, pageSize, visibleCols, hasAnyPermission, isSubCategory, isToggling, togglingUuid])

  const filterColumns = useMemo(() => [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    ...(isSubCategory ? [{ name: 'Parent Category', field: 'parent_name', visible: true }] : []),
    { name: 'Category Name', field: 'name', visible: visibleCols.name },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ], [visibleCols, isSubCategory])

  const statusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
  ]

  const totalPages = Math.ceil((categoriesData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'Manage Product', to: '/inventory/product' },
    { name: 'Manage Category', to: '/inventory/product/category', active: !isSubCategory },
    { name: 'Manage Sub-Category', to: '/inventory/product/sub-category', active: isSubCategory },
    { name: 'Manage Unit', to: '/inventory/product/unit' },
  ]

  return (
    <>
      <ListPageLayout
        title={isSubCategory ? "Sub-Category Management" : "Category Management"}
        backTo="/inventory/product"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_product_category"
        addLabel={isSubCategory ? "Add" : "Add"}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={categoriesData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={categoriesData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        // Filters
        showStatusFilter={true}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        statusValue={status}
        statusOptions={statusOptions}
        fromDate={dateRange.start}
        toDate={dateRange.end}
        onDateRangeChange={(start, end) => { setDateRange({ start, end }); setCurrentPage(1) }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryUuid={selectedCategoryUuid}
        categoryId={selectedCategoryId}
        initialData={editData}
        isSubCategory={isSubCategory}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category?"
        message="Are you sure you want to remove this category? If it has sub-categories, the deletion will fail."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
