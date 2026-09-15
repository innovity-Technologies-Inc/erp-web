import { useMemo, useState } from 'react'
import { Edit, Trash2, QrCode, Building2, Layers, CheckCircle2, XCircle } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { clsx } from 'clsx'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { exportToExcel } from '@/utils/exportUtils'
import { useWarehouseRackBins, useDeleteWarehouseRackBin } from '../../hooks/useWarehouseRackBins'
import { useWarehouseZones } from '../../hooks/useWarehouseZones'
import { RackBinModal } from '../../components/warehouse/RackBinModal'
import { warehouseTitleOptions } from './warehouseNavigation'
import type { WarehouseRackBin } from '../../api/warehouseRackBin.api'
import type { WarehouseZone } from '../../api/warehouseZone.api'

export const WarehouseRackBinListPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rackBinToEdit, setRackBinToEdit] = useState<WarehouseRackBin | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [rackBinToDelete, setRackBinToDelete] = useState<WarehouseRackBin | null>(null)

  const { hasAnyPermission } = usePermissions()
  const { data: zonesResponse } = useWarehouseZones({ per_page: 100 })

  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    barcode: true,
    warehouse: true,
    zone: true,
    location: true,
    capacity: true,
    status: true,
    action: true,
  })

  const params = useMemo(
    () => ({
      page: currentPage,
      per_page: pageSize,
      zone_id: selectedZoneId || undefined,
      status: statusFilter || undefined,
    }),
    [currentPage, pageSize, selectedZoneId, statusFilter]
  )

  const { data: rackBinsResponse, isLoading } = useWarehouseRackBins(params)
  const { mutate: deleteRackBin, isPending: isDeleting } = useDeleteWarehouseRackBin()

  const resData = (rackBinsResponse as any)?.response || (rackBinsResponse as any)?.data
  const rawRackBins: WarehouseRackBin[] = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : []

  const filteredRackBins = useMemo(() => {
    if (!search.trim()) return rawRackBins
    const s = search.toLowerCase()
    return rawRackBins.filter(
      (rb) =>
        rb.barcode_value.toLowerCase().includes(s) ||
        (rb.aisle && rb.aisle.toLowerCase().includes(s)) ||
        (rb.rack && rb.rack.toLowerCase().includes(s)) ||
        (rb.bin && rb.bin.toLowerCase().includes(s)) ||
        (rb.zone?.zone_name && rb.zone.zone_name.toLowerCase().includes(s)) ||
        (rb.zone?.warehouse?.name && rb.zone.warehouse.name.toLowerCase().includes(s))
    )
  }, [rawRackBins, search])

  const totalRecords = resData?.total ?? rawRackBins.length
  const totalPages = (resData?.last_page ?? Math.ceil(totalRecords / pageSize)) || 1

  const handleCreate = () => {
    setRackBinToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (rackBin: WarehouseRackBin) => {
    setRackBinToEdit(rackBin)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (rackBin: WarehouseRackBin) => {
    setRackBinToDelete(rackBin)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (rackBinToDelete) {
      deleteRackBin(rackBinToDelete.id, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setRackBinToDelete(null)
        },
      })
    }
  }

  const columnDefs = useMemo<ColDef<WarehouseRackBin>[]>(
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
        headerName: 'LOCATION BARCODE',
        field: 'barcode_value',
        minWidth: 220,
        flex: 1,
        hide: !visibleCols.barcode,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center gap-2 h-full">
              <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <QrCode className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                {params.value}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'WAREHOUSE',
        field: 'warehouse' as any,
        minWidth: 160,
        flex: 1,
        hide: !visibleCols.warehouse,
        cellRenderer: (params: any) => {
          const wh = params.data?.zone?.warehouse
          const whName = wh ? (wh.warehouse_code ? `${wh.name} (${wh.warehouse_code})` : wh.name) : 'Warehouse'
          return (
            <div className="flex items-center gap-2 h-full">
              <Building2 className="w-3.5 h-3.5 text-primary/70 shrink-0" />
              <span className="text-gray-700 font-medium text-xs truncate" title={whName}>
                {whName}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'ZONE',
        field: 'zone_id',
        minWidth: 150,
        flex: 1,
        hide: !visibleCols.zone,
        cellRenderer: (params: any) => {
          const zone = params.data?.zone
          const zoneLabel = zone ? `${zone.zone_name} (${zone.zone_code})` : (params.value ? `Zone #${params.value}` : '—')
          return (
            <div className="flex items-center gap-1.5 h-full">
              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-gray-900 font-semibold text-xs truncate" title={zoneLabel}>
                {zoneLabel}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'AISLE / RACK / SHELF / BIN',
        minWidth: 200,
        hide: !visibleCols.location,
        cellRenderer: (params: any) => {
          const row = params.data
          return (
            <div className="flex items-center gap-1.5 h-full text-xs font-mono">
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                A:{row.aisle || '—'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                R:{row.rack || '—'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                S:{row.shelf || '—'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                B:{row.bin || '—'}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'CAPACITY (MAX QTY)',
        field: 'max_quantity',
        width: 160,
        hide: !visibleCols.capacity,
        cellRenderer: (params: any) => {
          const qty = params.value ?? 999999
          const row = params.data
          return (
            <div className="flex flex-col justify-center h-full text-xs">
              <span className="font-semibold text-gray-800">{Number(qty).toLocaleString()} units</span>
              {(row.capacity_weight || row.capacity_volume) && (
                <span className="text-[10px] text-gray-500">
                  {row.capacity_weight ? `${row.capacity_weight}kg` : ''} {row.capacity_volume ? `• ${row.capacity_volume}m³` : ''}
                </span>
              )}
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
          const isActive = params.value === 'active'
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
        headerName: 'ACTIONS',
        field: 'id',
        width: 110,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1',
        cellRenderer: (params: any) => {
          const row = params.data as WarehouseRackBin
          if (!row) return null

          return (
            <div className="flex items-center justify-center gap-1 h-full">
              <PermissionGuard permission={['edit_warehouse', 'manage_warehouse']}>
                <button
                  type="button"
                  onClick={() => handleEdit(row)}
                  className="p-1.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                  title="Edit Location"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission={['delete_warehouse', 'manage_warehouse']}>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(row)}
                  className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete Location"
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
    { name: 'Barcode', field: 'barcode', visible: visibleCols.barcode },
    { name: 'Warehouse', field: 'warehouse', visible: visibleCols.warehouse },
    { name: 'Zone', field: 'zone', visible: visibleCols.zone },
    { name: 'Location Coordinates', field: 'location', visible: visibleCols.location },
    { name: 'Capacity', field: 'capacity', visible: visibleCols.capacity },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Action', field: 'action', visible: visibleCols.action },
  ]

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleExport = () => {
    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Barcode', key: 'barcode', width: 25 },
      { header: 'Warehouse', key: 'warehouse', width: 22 },
      { header: 'Zone', key: 'zone', width: 18 },
      { header: 'Aisle', key: 'aisle', width: 10 },
      { header: 'Rack', key: 'rack', width: 10 },
      { header: 'Shelf', key: 'shelf', width: 10 },
      { header: 'Bin', key: 'bin', width: 10 },
      { header: 'Max Quantity', key: 'max_quantity', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ]

    const exportData = filteredRackBins.map((rb, index) => ({
      sl: index + 1,
      barcode: rb.barcode_value,
      warehouse: rb.zone?.warehouse?.name || 'Warehouse',
      zone: rb.zone?.zone_name || `Zone #${rb.zone_id}`,
      aisle: rb.aisle || '—',
      rack: rb.rack || '—',
      shelf: rb.shelf || '—',
      bin: rb.bin || '—',
      max_quantity: rb.max_quantity,
      status: rb.status,
    }))

    exportToExcel(exportData, exportColumns, 'rack-bin-locations')
  }

  const zoneFilterRes = (zonesResponse as any)?.response || (zonesResponse as any)?.data
  const zonesForFilter: WarehouseZone[] = Array.isArray(zoneFilterRes?.data) ? zoneFilterRes.data : Array.isArray(zoneFilterRes) ? zoneFilterRes : []

  const zoneFilterOptions = [
    { label: 'All Zones', value: '' },
    ...zonesForFilter.map((z) => ({
      label: `${z.zone_name} (${z.zone_code})`,
      value: String(z.id),
    })),
  ]

  return (
    <>
      <ListPageLayout
        title="Rack & Bin Locations"
        titleOptions={warehouseTitleOptions}
        backTo="/"
        onCreate={handleCreate}
        createPermission="create_warehouse"
        searchWidth="max-w-[220px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        rowData={filteredRackBins}
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
        statusValue={selectedZoneId}
        onStatusChange={(val) => {
          setSelectedZoneId(val || '')
          setCurrentPage(1)
        }}
        statusOptions={zoneFilterOptions}
        onExport={handleExport}
      />

      {/* Create / Edit RackBin Modal */}
      <RackBinModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setRackBinToEdit(null)
        }}
        initialData={rackBinToEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setRackBinToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Rack / Bin Location"
        message={`Are you sure you want to delete location with barcode "${rackBinToDelete?.barcode_value}"? This action cannot be undone.`}
        confirmText="Delete Location"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
