import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useWarehouseDatatable, useDeleteWarehouse } from '../../hooks/useWarehouse'
import type { ColDef } from 'ag-grid-community'
import type { WarehouseListItem } from '../../api/warehouse.api'
import { clsx } from 'clsx'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useNavigate } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { exportToExcel } from '@/utils/exportUtils'

const tabs = [
  { name: 'Manage Warehouse', to: '/inventory/warehouse', active: true },
  { name: 'Stock Movement', to: '/inventory/warehouse/stock-movement' },
]

export const WarehouseListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ uuid: string; id: number } | null>(null)
  
  const navigate = useNavigate()
  const { hasAnyPermission } = usePermissions()

  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    code: true,
    name: true,
    contact: true,
    city: true,
    phone: true,
    email: true,
    status: true,
    action: true
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
    status,
    start_date: fromDate,
    end_date: toDate
  }), [searchTerm, status, fromDate, toDate, currentPage, pageSize])

  const { data: warehouseData, isLoading } = useWarehouseDatatable(params)
  const { mutate: deleteWarehouse, isPending: isDeleting } = useDeleteWarehouse()

  const handleCreate = () => {
    navigate({ to: '/inventory/warehouse/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/inventory/warehouse/edit/$id', params: { id: id.toString() } })
  }

  const handleDelete = (uuid: string, id: number) => {
    setSelectedWarehouse({ uuid, id })
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (selectedWarehouse) {
      deleteWarehouse(selectedWarehouse, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setSelectedWarehouse(null)
        }
      })
    }
  }

  const handleExport = () => {
    if (!warehouseData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Warehouse Code', key: 'warehouse_code', width: 20 },
      { header: 'Warehouse Name', key: 'name', width: 30 },
      { header: 'Contact Person', key: 'employee_name', width: 25 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    const exportData = warehouseData.data.map((item, index) => ({
      sl: (currentPage - 1) * pageSize + index + 1,
      warehouse_code: item.warehouse_code,
      name: item.name,
      employee_name: item.employee_name,
      city: item.city,
      phone: item.phone,
      email: item.email,
      status: item.status,
    }))

    exportToExcel(exportData, exportColumns, 'warehouse-list')
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const columnDefs = useMemo<ColDef<WarehouseListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: (params) => (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1,
      width: 80,
      flex: 0,
      pinned: 'left',
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    {
      headerName: 'WAREHOUSE CODE',
      field: 'warehouse_code',
      width: 150,
      hide: !visibleCols.code,
      cellClass: 'text-primary font-medium',
    },
    {
      headerName: 'WAREHOUSE NAME',
      field: 'name',
      flex: 1.5,
      hide: !visibleCols.name,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'CONTACT PERSON',
      field: 'employee_name',
      flex: 1.2,
      hide: !visibleCols.contact,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'CITY',
      field: 'city',
      width: 120,
      hide: !visibleCols.city,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'PHONE',
      field: 'phone',
      width: 130,
      hide: !visibleCols.phone,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'EMAIL',
      field: 'email',
      flex: 1.2,
      hide: !visibleCols.email,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 120,
      hide: !visibleCols.status,
      cellRenderer: (params: any) => {
        const isActive = params.value === 'Active'
        return (
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-medium tracking-tight uppercase',
            isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
          )}>
            {params.value}
          </span>
        )
      }
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 120,
      pinned: 'right',
      sortable: false,
      filter: false,
      hide: !visibleCols.action || !hasAnyPermission(['edit_warehouse', 'delete_warehouse']),
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-2 h-full">
          <PermissionGuard permission="edit_warehouse">
            <button
              onClick={() => handleEdit(params.data.id)}
              className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 group/edit"
              title="Edit Warehouse"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission="delete_warehouse">
            <button
              onClick={() => handleDelete(params.data.uuid, params.data.id)}
              className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ], [visibleCols, currentPage, pageSize, hasAnyPermission])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Warehouse Code', field: 'code', visible: visibleCols.code },
    { name: 'Warehouse Name', field: 'name', visible: visibleCols.name },
    { name: 'Contact Person', field: 'contact', visible: visibleCols.contact },
    { name: 'City', field: 'city', visible: visibleCols.city },
    { name: 'Phone', field: 'phone', visible: visibleCols.phone },
    { name: 'Email', field: 'email', visible: visibleCols.email },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const totalPages = Math.ceil((warehouseData?.recordsFiltered ?? 0) / pageSize)

  return (
    <>
      <ListPageLayout<WarehouseListItem>
        title="Warehouse List"
        backTo="/"
        tabs={tabs}
        onCreate={handleCreate}
        createPermission="create_warehouse"
        showStatusFilter={true}
        statusValue={status}
        onStatusChange={setStatus}
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
        onExport={handleExport}
        rowData={warehouseData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={warehouseData?.recordsFiltered ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSelectedWarehouse(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Warehouse?"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
      />
    </>
  )
}
