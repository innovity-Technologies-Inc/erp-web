import { useMemo, useState } from 'react'
import { useStockMovementDatatable } from '../../hooks/useWarehouse'
import type { ColDef } from 'ag-grid-community'
import type { StockMovementListItem } from '../../api/warehouse.api'
import { ListPageLayout } from '@/components/ListPageLayout/Listpagelayout'
import { useNavigate } from '@tanstack/react-router'
import { usePermissions } from '@/hooks/usePermissions'

const tabs = [
  { name: 'Manage Warehouse', to: '/inventory/warehouse' },
  { name: 'Stock Movement', to: '/inventory/warehouse/stock-movement', active: true },
]

export const StockMovementListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const navigate = useNavigate()
  const { hasAnyPermission } = usePermissions()

  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    batch: true,
    product: true,
    type: true,
    quantity: true,
    source: true,
    destination: true,
    reference: true
  })

  const params = useMemo(() => ({
    draw: 1,
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
  }), [searchTerm, currentPage, pageSize])

  const { data: movementData, isLoading } = useStockMovementDatatable(params)

  const handleCreate = () => {
    navigate({ to: '/inventory/warehouse/stock-movement/create' })
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const columnDefs = useMemo<ColDef<StockMovementListItem>[]>(() => [
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
      headerName: 'BATCH NO',
      field: 'batch_no',
      width: 150,
      hide: !visibleCols.batch,
      cellClass: 'text-primary font-medium',
    },
    {
      headerName: 'PRODUCT NAME',
      field: 'product_name',
      flex: 1.5,
      hide: !visibleCols.product,
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'MOVEMENT TYPE',
      field: 'movement_type',
      width: 150,
      hide: !visibleCols.type,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'QUANTITY',
      field: 'quantity',
      width: 120,
      hide: !visibleCols.quantity,
      cellClass: 'text-right font-medium text-[#1e293b]',
    },
    {
      headerName: 'SOURCE WAREHOUSE',
      field: 'source_warehouse',
      flex: 1,
      hide: !visibleCols.source,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'DESTINATION WAREHOUSE',
      field: 'destination_warehouse',
      flex: 1,
      hide: !visibleCols.destination,
      cellClass: 'text-[#64748b] font-normal',
    },
    {
      headerName: 'REFERENCE',
      field: 'reference',
      width: 150,
      hide: !visibleCols.reference,
      cellClass: 'text-[#64748b] font-normal',
    }
  ], [visibleCols, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Batch No', field: 'batch', visible: visibleCols.batch },
    { name: 'Product Name', field: 'product', visible: visibleCols.product },
    { name: 'Movement Type', field: 'type', visible: visibleCols.type },
    { name: 'Quantity', field: 'quantity', visible: visibleCols.quantity },
    { name: 'Source Warehouse', field: 'source', visible: visibleCols.source },
    { name: 'Destination Warehouse', field: 'destination', visible: visibleCols.destination },
    { name: 'Reference', field: 'reference', visible: visibleCols.reference },
  ]

  const totalPages = Math.ceil((movementData?.recordsFiltered ?? 0) / pageSize)

  return (
    <ListPageLayout<StockMovementListItem>
      title="Stock Movement List"
      backTo="/inventory/warehouse"
      tabs={tabs}
      onCreate={handleCreate}
      createPermission="warehouse_stock_movement"
      addLabel="Stock Movement"
      showColumnFilter={true}
      columns={filterColumns}
      onColumnToggle={toggleColumn}
      rowData={movementData?.data}
      columnDefs={columnDefs}
      isLoading={isLoading}
      recordsTotal={movementData?.recordsFiltered ?? 0}
      currentPage={currentPage}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    />
  )
}
