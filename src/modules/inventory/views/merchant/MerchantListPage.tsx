import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Trash2, FileText } from 'lucide-react'
import { useMerchantsDatatable, useDeleteMerchant } from '../../hooks/useMerchants'
import type { ColDef } from 'ag-grid-community'
import type { MerchantListItem } from '../../api/merchants.api'
import { ListPageLayout } from '@/components/ListPageLayout/Listpagelayout'
import { formatCurrency } from '@/utils/formatters'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'

export const MerchantListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()
  
  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [merchantToDelete, setVendorToDelete] = useState<{ id: number; uuid: string } | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    mobile: true,
    email: true,
    spNo: true,
    spFile: true,
    balance: true,
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
  }), [currentPage, pageSize, search, status, dateRange])

  const { data: merchantsData, isLoading } = useMerchantsDatatable(params)
  const { mutate: deleteMerchant, isPending: isDeleting } = useDeleteMerchant()

  // Actions
  const handleAdd = () => {
    navigate({ to: '/inventory/merchant/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/inventory/merchant/edit/$id', params: { id: id.toString() } })
  }

  const handleDeleteClick = (id: number, uuid: string) => {
    setVendorToDelete({ id, uuid })
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (merchantToDelete) {
      deleteMerchant({ id: merchantToDelete.id, uuid: merchantToDelete.uuid }, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setVendorToDelete(null)
          showNotificationModal(
            'Merchant Deleted!',
            'The merchant has been removed successfully.',
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
  const columnDefs = useMemo<ColDef<MerchantListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        const index = params.node?.rowIndex ?? 0
        return (currentPage - 1) * pageSize + index + 1
      },
      width: 60,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
    },
    {
      headerName: 'MERCHANT NAME',
      field: 'customer_name',
      minWidth: 180,
      flex: 1,
      hide: !visibleCols.name,
      cellClass: 'font-medium text-gray-900 flex items-center',
    },
    {
      headerName: 'MOBILE NO',
      field: 'customer_mobile',
      width: 140,
      hide: !visibleCols.mobile,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'EMAIL',
      field: 'customer_email',
      width: 180,
      hide: !visibleCols.email,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'SP NO',
      field: 'sales_permit_number',
      width: 120,
      hide: !visibleCols.spNo,
      cellClass: 'text-gray-600 flex items-center',
    },
    {
      headerName: 'SP FILE',
      field: 'sales_permit',
      width: 100,
      hide: !visibleCols.spFile,
      cellRenderer: (params: any) => {
        if (!params.value) return <span className="text-gray-300">---</span>
        // Backend returns HTML. We extract URL if possible or just show a branded button.
        const urlMatch = params.value.match(/href="([^"]+)"/)
        const url = urlMatch ? urlMatch[1] : null
        
        return url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary font-bold hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View</span>
          </a>
        ) : <span className="text-gray-300">---</span>
      }
    },
    {
      headerName: 'BALANCE',
      field: 'balance',
      width: 120,
      hide: !visibleCols.balance,
      cellClass: 'text-gray-600 flex items-center font-bold',
      valueFormatter: (params) => formatCurrency(params.value, '$', 'left') // Replace with settings if needed
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 110,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const isActive = params.value?.includes('Active')
        return (
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase',
            isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef9c3] text-[#854d0e]'
          )}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )
      }
    },
    {
      headerName: 'ACTIONS',
      width: 120,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['edit_merchant', 'delete_merchant']),
      cellClass: 'flex items-center justify-center gap-1.5',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <PermissionGuard permission="edit_merchant">
            <button
              onClick={() => handleEdit(params.data.id)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit"
              title="Edit Merchant"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_merchant">
            <button
              onClick={() => handleDeleteClick(params.data.id, params.data.uuid)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del"
              title="Delete Merchant"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [currentPage, pageSize, visibleCols, hasAnyPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Merchant Name', field: 'name', visible: visibleCols.name },
    { name: 'Mobile No', field: 'mobile', visible: visibleCols.mobile },
    { name: 'Email', field: 'email', visible: visibleCols.email },
    { name: 'SP No', field: 'spNo', visible: visibleCols.spNo },
    { name: 'SP File', field: 'spFile', visible: visibleCols.spFile },
    { name: 'Balance', field: 'balance', visible: visibleCols.balance },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'Active', value: '1' },
    { label: 'Inactive', value: '0' },
  ]

  const totalPages = Math.ceil((merchantsData?.recordsFiltered ?? 0) / pageSize)

  return (
    <>
      <ListPageLayout
        title="Merchant List"
        backTo="/"
        onCreate={handleAdd}
        createPermission="create_merchant"
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1) }}
        isLoading={isLoading}
        // AG Grid Props
        rowData={merchantsData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={merchantsData?.recordsFiltered || 0}
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
        // Export
        onExport={() => {}} 
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Merchant?"
        message="Are you sure you want to remove this merchant? This action will also affect related accounting records."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
