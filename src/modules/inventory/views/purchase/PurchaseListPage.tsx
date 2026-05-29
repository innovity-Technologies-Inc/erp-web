import { useMemo, useState } from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import { usePurchasesDatatable, useDeletePurchase } from '../../hooks/usePurchases'
import { useVendorSelect2 } from '../../hooks/useSuppliers'
import type { ColDef } from 'ag-grid-community'
import type { PurchaseListItem } from '../../api/purchase.api'
import { clsx } from 'clsx'
import { ListPageLayout } from '@/components/ListPageLayout/Listpagelayout'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { exportToExcel } from '@/utils/exportUtils'
import { useNavigate } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { Select2 } from '@/components/Select/Select2'

export const PurchaseListPage = () => {
  const [searchTerm, setSearchTerm]   = useState('')
  const [status, setStatus]           = useState('')
  const [supplierId, setSupplierId]   = useState<number | string>('')
  const [fromDate, setFromDate]       = useState('')
  const [toDate, setToDate]           = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize]       = useState(10)
  
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const navigate = useNavigate()
  const { hasAnyPermission } = usePermissions()
  
  // Lookups
  const { data: vendors } = useVendorSelect2()
  const vendorOptions = useMemo(() => [
    { value: '', label: 'All Vendors' },
    ...(vendors?.map((v: any) => ({ value: v.id, label: v.text })) || [])
  ], [vendors])

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    chalan: true,
    invoice: true,
    vendor: true,
    date: true,
    expiry: true,
    total: true,
    status: true,
    action: true
  })

  const params = useMemo(() => ({
    draw:   1,
    start:  (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    status,
    supplier_id: supplierId,
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, status, supplierId, fromDate, toDate, currentPage, pageSize])

  const { data: purchasesData, isLoading } = usePurchasesDatatable(params)
  const { mutate: deletePurchase, isPending: isDeleting } = useDeletePurchase()
  
  const handleCreate = () => {
    navigate({ to: '/inventory/purchase/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/inventory/purchase/edit/$id', params: { id: id.toString() } })
  }

  const handleView = (id: number) => {
    navigate({ to: '/inventory/purchase/view/$id', params: { id: id.toString() } })
  }

  const handleDelete = (id: number) => {
    setSelectedPurchaseId(id)
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (selectedPurchaseId) {
      deletePurchase(selectedPurchaseId, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setSelectedPurchaseId(null)
          showNotificationModal(
            'Deleted Successfully!',
            'The purchase record has been deleted.',
            'success'
          )
        }
      })
    }
  }

  const handleExport = () => {
    if (!purchasesData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Chalan No', key: 'chalan_no', width: 15 },
      { header: 'Invoice No', key: 'purchase_id', width: 15 },
      { header: 'Vendor Name', key: 'supplier_name', width: 30 },
      { header: 'Purchase Date', key: 'purchase_date', width: 15 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    const exportData = purchasesData.data.map((item, index) => ({
      sl: (currentPage - 1) * pageSize + index + 1,
      chalan_no: item.chalan_no,
      purchase_id: item.purchase_id,
      supplier_name: item.supplier_name,
      purchase_date: item.purchase_date,
      total_amount: item.total_amount,
      status: item.status,
    }))

    exportToExcel(exportData, exportColumns, 'purchases')
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const totalPages = Math.ceil((purchasesData?.recordsFiltered ?? 0) / pageSize)

  const columnDefs = useMemo<ColDef<PurchaseListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => {
        return (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1
      },
      width: 80,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    {
      headerName: 'CHALAN NO',
      field: 'chalan_no',
      width: 140,
      hide: !visibleCols.chalan,
      cellClass: 'text-primary font-medium flex items-center justify-center',
    },
    {
      headerName: 'INVOICE NO',
      field: 'purchase_id',
      width: 140,
      hide: !visibleCols.invoice,
      cellClass: 'text-[#475569] font-bold flex items-center justify-center',
    },
    {
      headerName: 'VENDOR NAME',
      field: 'supplier_name',
      flex: 1.5,
      hide: !visibleCols.vendor,
      cellClass: 'text-[#475569] font-medium flex items-center',
    },
    {
      headerName: 'PURCHASE DATE',
      field: 'purchase_date',
      width: 130,
      hide: !visibleCols.date,
      valueFormatter: (params) => formatDate(params.value),
      cellClass: 'text-[#475569] font-medium flex items-center justify-center',
    },
    {
        headerName: 'EXPIRY DATE',
        field: 'expiry_date',
        width: 130,
        hide: !visibleCols.expiry,
        cellClass: 'text-[#475569] font-medium flex items-center justify-center',
        valueFormatter: (params) => params.value && params.value !== 'N/A' ? formatDate(params.value) : '---'
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'total_amount',
      width: 140,
      hide: !visibleCols.total,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right' },
      cellClass: 'font-bold text-[#1e293b] flex items-center justify-end',
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 130,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const status = String(params.value).toLowerCase()
        const isApproved = status === 'approved' || status === '1'
        const isPending = status === 'pending' || status === '0'
        
        return (
          <div className="flex items-center justify-center h-full">
            <span className={clsx(
              'px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase leading-none',
              isApproved && 'bg-[#dcfce7] text-[#166534]',
              isPending && 'bg-[#fef9c3] text-[#854d0e]',
              !isApproved && !isPending && 'bg-gray-100 text-gray-600'
            )}>
              {isApproved ? 'Approved' : 'Pending'}
            </span>
          </div>
        )
      }
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 120,
      pinned: 'right',
      hide: !visibleCols.action || !hasAnyPermission(['view_purchase', 'edit_purchase', 'delete_purchase']),
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-1.5 h-full">
          <PermissionGuard permission="view_purchase">
            <button onClick={() => handleView(params.data.id)} className="p-2 hover:bg-blue-50 text-primary rounded-xl transition-all border border-transparent hover:border-blue-100 hover:scale-110" title="View Details">
              <Eye className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="edit_purchase">
            <button onClick={() => handleEdit(params.data.id)} className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110" title="Edit">
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_purchase">
            <button onClick={() => handleDelete(params.data.id)} className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize, hasAnyPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Chalan No', field: 'chalan', visible: visibleCols.chalan },
    { name: 'Invoice No', field: 'invoice', visible: visibleCols.invoice },
    { name: 'Vendor', field: 'vendor', visible: visibleCols.vendor },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Expiry', field: 'expiry', visible: visibleCols.expiry },
    { name: 'Total', field: 'total', visible: visibleCols.total },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  return (
    <>
      <ListPageLayout<PurchaseListItem>
        title="Purchase List"
        backTo="/inventory/purchase"
        onCreate={handleCreate}
        createPermission="create_purchase"
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        showStatusFilter={true}
        statusValue={status}
        statusOptions={[
           { label: 'Approved', value: 'Approved' },
           { label: 'Pending', value: 'Pending' }
        ]}
        onStatusChange={(val) => { setStatus(val); setCurrentPage(1) }}
        toolbarExtra={
          <div className="w-[180px] shrink-0">
             <Select2
                options={vendorOptions}
                value={supplierId}
                onChange={(val) => { setSupplierId(val); setCurrentPage(1) }}
                placeholder="All Vendors"
                rounded="full"
                variant="solid"
             />
          </div>
        }
        onExport={handleExport}
        rowData={purchasesData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={purchasesData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSelectedPurchaseId(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Purchase?"
        message="Are you sure you want to remove this purchase record? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
