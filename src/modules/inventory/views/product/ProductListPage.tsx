import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import { useProductsDatatable, useDeleteProduct, useToggleProductStatus } from '../../hooks/useProducts'
import type { ColDef } from 'ag-grid-community'
import type { ProductListItem } from '../../api/products.api'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { formatCurrency } from '@/utils/formatters'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'

export const ProductListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()
  
  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: number; uuid: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    image: true,
    name: true,
    category: true,
    supplier: true,
    price: true,
    supplierPrice: true,
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
  }), [currentPage, pageSize, search, status])

  const { data: productsData, isLoading } = useProductsDatatable(params)
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleProductStatus()
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null)

  // Actions
  const handleAdd = () => {
    navigate({ to: '/inventory/product/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/inventory/product/edit/$id', params: { id: id.toString() } })
  }

  const handleStatusToggle = (uuid: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    setTogglingUuid(uuid)
    toggleStatus({ uuid, status: newStatus }, {
        onSuccess: () => {
            setTogglingUuid(null)
            showNotificationModal(
                'Status Updated!',
                `Product status has been changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.`,
                'success'
            )
        },
        onError: () => {
            setTogglingUuid(null)
        }
    })
  }

  const handleDeleteClick = (id: number, uuid: string) => {
    setProductToDelete({ id, uuid })
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.uuid, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setProductToDelete(null)
          showNotificationModal(
            'Product Deleted!',
            'The product has been removed successfully.',
            'success'
          )
        }
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<ProductListItem>[]>(() => [
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
      headerName: 'IMAGE',
      field: 'image',
      width: 80,
      hide: !visibleCols.image,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center justify-center h-full">
            {params.value ? (
              <img 
                src={params.value} 
                alt="Product" 
                className="w-8 h-8 rounded-lg object-cover border border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
                <Package className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        )
      }
    },
    {
      headerName: 'PRODUCT NAME',
      field: 'product_name',
      minWidth: 200,
      flex: 1,
      hide: !visibleCols.name,
      cellClass: 'font-medium text-gray-900 flex items-center',
    },
    {
      headerName: 'CATEGORY',
      field: 'category_name',
      width: 150,
      hide: !visibleCols.category,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'SUPPLIER',
      field: 'supplier_name',
      width: 150,
      hide: !visibleCols.supplier,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'PRICE',
      field: 'price',
      width: 120,
      hide: !visibleCols.price,
      cellClass: 'text-primary font-bold flex items-center',
      valueFormatter: (params) => formatCurrency(params.value, '$', 'left')
    },
    {
      headerName: 'SUPPLIER PRICE',
      field: 'supplier_price',
      width: 140,
      hide: !visibleCols.supplierPrice,
      cellClass: 'text-gray-600 font-medium flex items-center',
      valueFormatter: (params) => formatCurrency(params.value, '$', 'left')
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

          <PermissionGuard permission="edit_product">
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
      hide: !visibleCols.action || !hasAnyPermission(['edit_product', 'delete_product']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="edit_product">
            <button
              onClick={() => handleEdit(params.data.id)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit Product"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_product">
            <button
              onClick={() => handleDeleteClick(params.data.id, params.data.uuid)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
              title="Delete Product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [currentPage, pageSize, visibleCols, hasAnyPermission, isToggling, togglingUuid])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Image', field: 'image', visible: visibleCols.image },
    { name: 'Product Name', field: 'name', visible: visibleCols.name },
    { name: 'Category', field: 'category', visible: visibleCols.category },
    { name: 'Supplier', field: 'supplier', visible: visibleCols.supplier },
    { name: 'Price', field: 'price', visible: visibleCols.price },
    { name: 'Supplier Price', field: 'supplierPrice', visible: visibleCols.supplierPrice },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
  ]

  const totalPages = Math.ceil((productsData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'Manage Product', to: '/inventory/product', active: true },
    { name: 'Manage Category', to: '/inventory/product/category' },
    { name: 'Manage Sub-Category', to: '/inventory/product/sub-category' },
    { name: 'Manage Unit', to: '/inventory/product/unit' },
  ]

  return (
    <>
      <ListPageLayout
        title="Product Management"
        backTo="/"
        tabs={tabs}
        onCreate={handleAdd}
        createPermission="create_product"
        addLabel="Create"
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={productsData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={productsData?.recordsFiltered || 0}
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
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product?"
        message="Are you sure you want to remove this product? This will also affect stock levels and reports."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
