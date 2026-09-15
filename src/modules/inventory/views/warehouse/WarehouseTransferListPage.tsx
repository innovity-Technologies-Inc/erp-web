import { useMemo, useState } from 'react'
import { Eye, Ban, Calendar, Building2, Boxes } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { clsx } from 'clsx'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useNavigate } from '@tanstack/react-router'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { exportToExcel } from '@/utils/exportUtils'
import { formatDate } from '@/utils/formatters'
import { warehouseTitleOptions } from './warehouseNavigation'
import {
  useWarehouseTransferDatatable,
  useCancelWarehouseTransfer,
  useCreatePickList,
} from '../../hooks/useWarehouseTransfers'
import type { WarehouseTransferListItem } from '../../api/warehouseTransfer.api'

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  dispatched: 'bg-blue-50 text-blue-700 border-blue-200',
  received: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending Dispatch',
  dispatched: 'In Transit',
  received: 'Received',
  cancelled: 'Cancelled',
}

export const WarehouseTransferListPage = () => {
  const navigate = useNavigate()
  const { hasAnyPermission } = usePermissions()

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Modals
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null)
  const [isPickConfirmOpen, setIsPickConfirmOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    transfer_no: true,
    date: true,
    source: true,
    destination: true,
    creator: true,
    items_count: true,
    quantity: true,
    status: true,
    action: true,
  })

  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search, regex: false },
      status: statusFilter || undefined,
      start_date: fromDate || undefined,
      end_date: toDate || undefined,
    }),
    [currentPage, pageSize, search, statusFilter, fromDate, toDate]
  )

  const { data: transferData, isLoading } = useWarehouseTransferDatatable(params)
  const { mutate: cancelTransfer, isPending: isCancelling } = useCancelWarehouseTransfer()
  const { mutate: createPickList, isPending: isGeneratingPickList } = useCreatePickList()

  const handleCreate = () => {
    navigate({ to: '/inventory/warehouse/stock-movement/create' })
  }

  const handleOpenDetail = (id: number) => {
    navigate({ to: `/inventory/warehouse/stock-movement/view/${id}` as any })
  }

  const handleOpenPickConfirm = (id: number) => {
    setSelectedTransferId(id)
    setIsPickConfirmOpen(true)
  }

  const handleConfirmGeneratePick = () => {
    if (selectedTransferId) {
      createPickList(selectedTransferId, {
        onSuccess: () => {
          setIsPickConfirmOpen(false)
          setSelectedTransferId(null)
        },
      })
    }
  }

  const handleOpenCancel = (id: number) => {
    setSelectedTransferId(id)
    setIsCancelConfirmOpen(true)
  }

  const handleConfirmCancel = () => {
    if (selectedTransferId) {
      cancelTransfer(selectedTransferId, {
        onSuccess: () => {
          setIsCancelConfirmOpen(false)
          setSelectedTransferId(null)
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const columnDefs = useMemo<ColDef<WarehouseTransferListItem>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1,
        width: 70,
        flex: 0,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
      },
      {
        headerName: 'TRANSFER NO',
        field: 'transfer_no',
        minWidth: 190,
        width: 210,
        hide: !visibleCols.transfer_no,
        cellRenderer: (params: any) => (
          <div className="flex items-center h-full">
            <span
              onClick={() => handleOpenDetail(params.data.id)}
              className="font-bold text-primary hover:underline cursor-pointer font-mono tracking-tight whitespace-nowrap"
            >
              {params.value}
            </span>
          </div>
        ),
      },
      {
        headerName: 'TRANSFER DATE',
        field: 'transfer_date',
        width: 140,
        hide: !visibleCols.date,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full text-gray-600 font-medium text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {params.value ? formatDate(params.value) : '—'}
          </div>
        ),
      },
      {
        headerName: 'SOURCE WAREHOUSE',
        field: 'from_warehouse_name',
        flex: 1.2,
        hide: !visibleCols.source,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full text-gray-800 font-semibold text-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{params.value}</span>
          </div>
        ),
      },
      {
        headerName: 'DESTINATION WAREHOUSE',
        field: 'to_warehouse_name',
        flex: 1.2,
        hide: !visibleCols.destination,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full text-gray-800 font-semibold text-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{params.value}</span>
          </div>
        ),
      },
      {
        headerName: 'CREATED BY',
        field: 'creator_name',
        width: 140,
        hide: !visibleCols.creator,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full text-gray-700 text-xs font-medium">
            <span className="truncate font-semibold">{params.value || 'System'}</span>
          </div>
        ),
      },
      {
        headerName: 'ITEMS',
        field: 'items_count',
        width: 100,
        hide: !visibleCols.items_count,
        cellRenderer: (params: any) => (
          <div className="flex items-center justify-center h-full">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
              {params.value} items
            </span>
          </div>
        ),
      },
      {
        headerName: 'TOTAL QTY',
        field: 'total_quantity',
        width: 120,
        hide: !visibleCols.quantity,
        cellClass: 'text-right font-bold text-gray-900',
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 140,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const val = params.value || ''
          const label = statusLabels[val] || val || 'Draft'
          const badgeClass = statusBadgeColors[val] || 'bg-slate-100 text-slate-700 border-slate-200'

          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  badgeClass
                )}
              >
                {label}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'ACTION',
        field: 'action' as any,
        width: 150,
        pinned: 'right',
        hide: !visibleCols.action,
        cellRenderer: (params: any) => {
          const item = params.data
          return (
            <div className="flex items-center gap-1.5 h-full">
              {/* 1. View Details */}
              <button
                onClick={() => handleOpenDetail(item.id)}
                className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-all"
                title="View Transfer Details"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* 2. Pick List / Picking Action (if pending) */}
              {item.status === 'pending' && (
                <PermissionGuard permission={['pick_warehouse_transfer', 'edit_warehouse', 'manage_warehouse']}>
                  {item.pick_no ? (
                    <button
                      onClick={() => handleOpenDetail(item.id)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all border border-emerald-200"
                      title={`Pick List Generated (${item.pick_no}) - Click to View Picking Details`}
                    >
                      <Boxes className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenPickConfirm(item.id)}
                      className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all"
                      title="Generate Pick List"
                    >
                      <Boxes className="h-4 w-4" />
                    </button>
                  )}
                </PermissionGuard>
              )}

              {/* 3. Cancel (if pending) */}
              {item.status === 'pending' && (
                <PermissionGuard permission={['cancel_warehouse_transfer', 'edit_warehouse', 'manage_warehouse']}>
                  <button
                    onClick={() => handleOpenCancel(item.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                    title="Cancel Transfer Request"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                </PermissionGuard>
              )}
            </div>
          )
        },
      },
    ],
    [visibleCols, currentPage, pageSize]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Transfer No', field: 'transfer_no', visible: visibleCols.transfer_no },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Source Warehouse', field: 'source', visible: visibleCols.source },
    { name: 'Destination Warehouse', field: 'destination', visible: visibleCols.destination },
    { name: 'Created By', field: 'creator', visible: visibleCols.creator },
    { name: 'Items', field: 'items_count', visible: visibleCols.items_count },
    { name: 'Total Qty', field: 'quantity', visible: visibleCols.quantity },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending Dispatch', value: 'pending' },
    { label: 'In Transit (Dispatched)', value: 'dispatched' },
    { label: 'Completed (Received)', value: 'received' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const handleExport = () => {
    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Transfer No', key: 'transfer_no', width: 22 },
      { header: 'Transfer Date', key: 'transfer_date', width: 16 },
      { header: 'Source Warehouse', key: 'from_warehouse_name', width: 25 },
      { header: 'Destination Warehouse', key: 'to_warehouse_name', width: 25 },
      { header: 'Created By', key: 'creator_name', width: 20 },
      { header: 'Items Count', key: 'items_count', width: 12 },
      { header: 'Total Quantity', key: 'total_quantity', width: 16 },
      { header: 'Status', key: 'status', width: 16 },
    ]

    const exportData = (transferData?.data || []).map((t, index) => ({
      sl: index + 1,
      transfer_no: t.transfer_no,
      transfer_date: t.transfer_date ? formatDate(t.transfer_date) : '—',
      from_warehouse_name: t.from_warehouse_name,
      to_warehouse_name: t.to_warehouse_name,
      creator_name: t.creator_name || '—',
      items_count: t.items_count,
      total_quantity: t.total_quantity,
      status: t.status,
    }))

    exportToExcel(exportData, exportColumns, 'warehouse-transfers')
  }

  const totalPages = Math.ceil((transferData?.recordsFiltered ?? 0) / pageSize)

  return (
    <>
      <ListPageLayout<WarehouseTransferListItem>
        title="Warehouse Transfers"
        titleOptions={warehouseTitleOptions}
        backTo="/"
        onCreate={handleCreate}
        createPermission={['create_warehouse_transfer', 'create_warehouse'] as any}
        showStatusFilter={true}
        statusValue={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val)
          setCurrentPage(1)
        }}
        statusOptions={statusOptions}
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => {
          setFromDate(from)
          setToDate(to)
          setCurrentPage(1)
        }}
        onExport={handleExport}
        rowData={transferData?.data || []}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={transferData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
      />

      {/* 1. Pick List Confirmation Modal */}
      <ConfirmationModal
        isOpen={isPickConfirmOpen}
        onClose={() => {
          setIsPickConfirmOpen(false)
          setSelectedTransferId(null)
        }}
        onConfirm={handleConfirmGeneratePick}
        title="Generate Pick List"
        message="Are you sure you want to generate a smart pick list and reserve available stock for this transfer order?"
        confirmText="Generate Pick List"
        variant="info"
        isLoading={isGeneratingPickList}
      />

      {/* 2. Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={() => {
          setIsCancelConfirmOpen(false)
          setSelectedTransferId(null)
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Warehouse Transfer"
        message="Are you sure you want to cancel this pending transfer request?"
        confirmText="Cancel Transfer"
        variant="danger"
        isLoading={isCancelling}
      />
    </>
  )
}
