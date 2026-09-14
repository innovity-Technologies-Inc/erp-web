import { useMemo, useState } from 'react'
import { Edit, Trash2, MapPin, Building2, Tag, CheckCircle2, XCircle } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { clsx } from 'clsx'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { exportToExcel } from '@/utils/exportUtils'
import { formatDate } from '@/utils/formatters'
import { useWarehouseZones, useDeleteWarehouseZone } from '../../hooks/useWarehouseZones'
import { useWarehouses } from '../../hooks/useWarehouse'
import { ZoneModal } from '../../components/warehouse/ZoneModal'
import { getWarehouseTabs } from './warehouseNavigation'
import type { WarehouseZone } from '../../api/warehouseZone.api'

export const WarehouseZoneListPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoneToEdit, setZoneToEdit] = useState<WarehouseZone | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState<WarehouseZone | null>(null)

  const { hasAnyPermission } = usePermissions()
  const { data: warehousesData } = useWarehouses()

  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    zone_code: true,
    zone_name: true,
    warehouse: true,
    status: true,
    created_at: true,
    action: true,
  })

  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      warehouse_id: selectedWarehouseId || undefined,
      status: statusFilter || undefined,
    }),
    [currentPage, pageSize, selectedWarehouseId, statusFilter]
  )

  const { data: zonesResponse, isLoading } = useWarehouseZones(params)
  const { mutate: deleteZone, isPending: isDeleting } = useDeleteWarehouseZone()

  const resData = (zonesResponse as any)?.response || (zonesResponse as any)?.data
  const rawZones: WarehouseZone[] = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : []

  const filteredZones = useMemo(() => {
    if (!search.trim()) return rawZones
    const s = search.toLowerCase()
    return rawZones.filter(
      (z) =>
        z.zone_name.toLowerCase().includes(s) ||
        z.zone_code.toLowerCase().includes(s) ||
        (z.warehouse?.name && z.warehouse.name.toLowerCase().includes(s))
    )
  }, [rawZones, search])

  const totalRecords = resData?.total ?? rawZones.length
  const totalPages = (resData?.last_page ?? Math.ceil(totalRecords / pageSize)) || 1

  const handleCreate = () => {
    setZoneToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (zone: WarehouseZone) => {
    setZoneToEdit(zone)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (zone: WarehouseZone) => {
    setZoneToDelete(zone)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (zoneToDelete) {
      deleteZone(zoneToDelete.id, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setZoneToDelete(null)
        },
      })
    }
  }

  const columnDefs = useMemo<ColDef<WarehouseZone>[]>(
    () => [
      {
        headerName: 'SL',
        width: 70,
        hide: !visibleCols.sl,
        cellRenderer: (params: any) => {
          const index = params.node?.rowIndex ?? 0
          return <span className="text-gray-500 font-medium text-xs flex items-center h-full">{(currentPage - 1) * pageSize + index + 1}</span>
        },
      },
      {
        headerName: 'ZONE CODE',
        field: 'zone_code',
        width: 140,
        hide: !visibleCols.zone_code,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                <Tag className="w-3 h-3" />
                {params.value}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'ZONE NAME',
        field: 'zone_name',
        minWidth: 200,
        flex: 1,
        hide: !visibleCols.zone_name,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center gap-2 h-full">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 font-semibold text-xs">{params.value}</span>
            </div>
          )
        },
      },
      {
        headerName: 'WAREHOUSE',
        field: 'warehouse_id',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.warehouse,
        cellRenderer: (params: any) => {
          const wh = params.data?.warehouse
          const whLabel = wh ? (wh.warehouse_code ? `${wh.name} (${wh.warehouse_code})` : wh.name) : (params.value ? `Warehouse #${params.value}` : '—')
          return (
            <div className="flex items-center gap-2 h-full">
              <Building2 className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="text-gray-700 font-medium text-xs">{whLabel}</span>
            </div>
          )
        },
      },
      {
        headerName: 'STATUS',
        field: 'status',
        width: 110,
        hide: !visibleCols.status,
        cellRenderer: (params: any) => {
          const isActive = params.value === 'active' || !params.value
          return (
            <div className="flex items-center h-full">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                )}
              >
                {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {params.value || 'active'}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'CREATED DATE',
        field: 'created_at',
        width: 140,
        hide: !visibleCols.created_at,
        cellClass: 'text-gray-600 font-medium flex items-center text-xs',
        valueFormatter: (params) => (params.value ? formatDate(params.value) : '—'),
      },
      {
        headerName: 'ACTIONS',
        field: 'id',
        width: 110,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1',
        cellRenderer: (params: any) => {
          const row = params.data as WarehouseZone
          if (!row) return null

          return (
            <div className="flex items-center justify-center gap-1 h-full">
              <PermissionGuard permission={['edit_warehouse', 'manage_warehouse']}>
                <button
                  type="button"
                  onClick={() => handleEdit(row)}
                  className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                  title="Edit Zone"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission={['delete_warehouse', 'manage_warehouse']}>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(row)}
                  className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete Zone"
                >
                  <Trash2 className="w-4 h-4" />
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
    { name: 'Zone Code', field: 'zone_code', visible: visibleCols.zone_code },
    { name: 'Zone Name', field: 'zone_name', visible: visibleCols.zone_name },
    { name: 'Warehouse', field: 'warehouse', visible: visibleCols.warehouse },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Created Date', field: 'created_at', visible: visibleCols.created_at },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleExport = () => {
    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Zone Code', key: 'zone_code', width: 18 },
      { header: 'Zone Name', key: 'zone_name', width: 25 },
      { header: 'Warehouse', key: 'warehouse', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created Date', key: 'created_at', width: 18 },
    ]

    const exportData = filteredZones.map((z, index) => ({
      sl: index + 1,
      zone_code: z.zone_code,
      zone_name: z.zone_name,
      warehouse: z.warehouse?.name || `WH #${z.warehouse_id}`,
      status: z.status || 'active',
      created_at: z.created_at ? formatDate(z.created_at) : '—',
    }))

    exportToExcel(exportData, exportColumns, 'warehouse-zones')
  }

  const warehouseFilterOptions = [
    { label: 'All Warehouses', value: '' },
    ...(warehousesData || []).map((w: any) => {
      const name = w.name || w.text || `Warehouse #${w.id}`
      const code = w.warehouse_code || w.code
      return {
        label: code ? `${name} (${code})` : name,
        value: String(w.id),
      }
    }),
  ]

  return (
    <>
      <ListPageLayout
        title="Warehouse Zones"
        backTo="/"
        tabs={getWarehouseTabs('zones')}
        onCreate={handleCreate}
        createPermission="create_warehouse"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        rowData={filteredZones}
        columnDefs={columnDefs}
        recordsTotal={totalRecords}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        showStatusFilter={true}
        statusValue={selectedWarehouseId}
        onStatusChange={(val) => {
          setSelectedWarehouseId(val || '')
          setCurrentPage(1)
        }}
        statusOptions={warehouseFilterOptions}
        onExport={handleExport}
      />

      {/* Create / Edit Zone Modal */}
      <ZoneModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setZoneToEdit(null)
        }}
        initialData={zoneToEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setZoneToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Warehouse Zone"
        message={`Are you sure you want to delete zone "${zoneToDelete?.zone_name}" (${zoneToDelete?.zone_code})? This action cannot be undone.`}
        confirmText="Delete Zone"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
