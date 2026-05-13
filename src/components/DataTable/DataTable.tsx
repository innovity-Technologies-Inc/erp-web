import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { 
  ColDef, 
  GridOptions, 
  GridReadyEvent,
} from 'ag-grid-community'
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  CustomEditorModule,
  ValidationModule
} from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { Loader2 } from 'lucide-react'

// Register modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  PaginationModule,
  TextFilterModule,
  NumberFilterModule,
  CustomEditorModule,
  ValidationModule
])

interface DataTableProps<T> {
  rowData: T[] | undefined
  columnDefs: ColDef<T>[]
  isLoading?: boolean
  pagination?: boolean
  paginationPageSize?: number
  onGridReady?: (event: GridReadyEvent) => void
  autoHeight?: boolean
  className?: string
  gridOptions?: GridOptions<T>
}

export const DataTable = <T extends object>({
  rowData,
  columnDefs,
  isLoading = false,
  pagination = true,
  paginationPageSize = 10,
  onGridReady,
  autoHeight = false,
  className = '',
  gridOptions = {}
}: DataTableProps<T>) => {
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  }), [])

  return (
    <div className={`ag-theme-quartz erp-table-container relative w-full ${className}`} style={{ height: autoHeight ? 'auto' : '500px' }}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        onGridReady={onGridReady}
        domLayout={autoHeight ? 'autoHeight' : 'normal'}
        animateRows={true}
        suppressCellFocus={true}
        {...gridOptions}
      />
    </div>
  )
}
