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
  ValidationModule,
  CellStyleModule,
  CsvExportModule
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
  ValidationModule,
  CellStyleModule,
  CsvExportModule
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

  // Explicitly extract options that might be passed in gridOptions
  const finalGridOptions = useMemo(() => ({
    ...gridOptions,
    pagination: gridOptions.pagination ?? pagination,
    paginationPageSize: gridOptions.paginationPageSize ?? paginationPageSize,
    domLayout: gridOptions.domLayout ?? (autoHeight ? 'autoHeight' : 'normal'),
    onGridReady: (params: any) => {
      onGridReady?.(params)
      gridOptions.onGridReady?.(params)
    }
  }), [gridOptions, pagination, paginationPageSize, autoHeight, onGridReady])

  return (
    <div className={`ag-theme-quartz erp-table-container relative w-full ${className}`} style={!autoHeight ? { height: '500px' } : {}}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        suppressCellFocus={true}
        theme="legacy"
        paginationPageSizeSelector={[10, 20, 50, 100]}
        {...finalGridOptions}
      />
    </div>
  )
}
