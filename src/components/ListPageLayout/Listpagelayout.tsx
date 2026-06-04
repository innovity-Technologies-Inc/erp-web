// src/shared/ui/ListPageLayout/ListPageLayout.tsx
// Generic reusable list page layout for the entire ERP.
// Drop-in replacement for any datatable page — just pass props.

import { useMemo, useState, useRef, useEffect, type ReactNode } from 'react'
import { DataTable } from '@/components/DataTable/DataTable'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { Select2 } from '@/components/Select/Select2'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import {
  Plus,
  Search,
  ArrowLeft,
  ChevronDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Columns as ColumnsIcon,
  X
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import type { ColDef } from 'ag-grid-community'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavTab {
  name: string
  to: string
  active?: boolean
}

export interface ListPageLayoutProps<T extends object> {
  // ── Header ──
  title: string
  backTo: string

  // ── Nav tabs (top-right) ──
  tabs?: NavTab[]

  // ── Toolbar (left side) ──
  /** Show the dark "+ Create" button. Pass onClick handler. */
  onCreate?: () => void

  /** Permission required to show the create button */
  createPermission?: string | string[]
  
  /** Status filter */
  showStatusFilter?: boolean
  statusValue?: string
  onStatusChange?: (status: string) => void
  statusOptions?: { label: string; value: string }[]
  
  /** Column toggle */
  showColumnFilter?: boolean
  columns?: { name: string; field: string; visible: boolean }[]
  onColumnToggle?: (field: string) => void
  
  /** Date range */
  fromDate?: string
  toDate?: string
  onDateRangeChange?: (from: string, to: string) => void
  
  /** Export */
  onExport?: () => void

  /** Label for the dark create button. Defaults to 'Create' */
  addLabel?: string
  
  /** Extra component to show in the toolbar */
  toolbarExtra?: ReactNode

  // ── Table ──
  rowData: T[] | undefined
  columnDefs: ColDef<T>[]
  isLoading?: boolean
  gridOptions?: any

  // ── Pagination meta (from API response) ──
  recordsTotal?: number
  currentPage?: number
  pageSize?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void

  // ── Search ──
  searchValue?: string
  onSearchChange?: (value: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ListPageLayout = <T extends object>({
  title,
  backTo,
  tabs,
  onCreate,
  createPermission,
  showStatusFilter = false,
  statusValue = '',
  onStatusChange,
  statusOptions,
  showColumnFilter = true,
  columns = [],
  onColumnToggle,
  fromDate = '',
  toDate = '',
  onDateRangeChange,
  onExport,
  addLabel,
  toolbarExtra,
  rowData,
  columnDefs,
  isLoading = false,
  gridOptions = {},
  recordsTotal = 0,
  currentPage = 1,
  pageSize = 10,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  searchValue = '',
  onSearchChange,
}: ListPageLayoutProps<T>) => {

  const [colMenuOpen, setColMenuOpen] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)

  // Close column menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setColMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Build visible page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }, [totalPages, currentPage])

  const showingFrom = recordsTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, recordsTotal)

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={backTo}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            {title}
          </h1>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-3">
          {tabs?.map((tab) => (
            <Link
              key={tab.name}
              to={tab.to}
              className={clsx(
                'px-2 py-2 text-[10px] font-medium rounded-lg transition-all duration-200',
                tab.active
                  ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white text-gray-500 border border-gray-50 hover:bg-gray-50 shadow-sm'
              )}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ── 2. Main Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-50 p-7 space-y-7">

        {/* Filter & Action Row */}
        <div className="flex items-center justify-between gap-4">

          {/* Left side */}
          <div className="flex items-center gap-3 flex-1">
            {onCreate && (
              createPermission ? (
                <PermissionGuard permission={createPermission}>
                  <button
                    onClick={onCreate}
                    className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2 rounded-xl flex items-center gap-2 h-10 transition-all shadow-lg shadow-slate-200 shrink-0 group active:scale-95"
                  >
                    <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" strokeWidth={3} />
                    <span className="font-bold text-[13px]">{addLabel || 'Create'}</span>
                  </button>
                </PermissionGuard>
              ) : (
                <button
                  onClick={onCreate}
                  className="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-2xl flex items-center gap-2 h-8 transition-all shadow-md shadow-primary/10 shrink-0"
                >
                  <Plus className="h-5 w-5" strokeWidth={3} />
                  <span className="font-medium text-[12px]">Create</span>
                </button>
              )
            )}

            <div className="relative w-full max-w-70">
              <input type="text"
                placeholder="Search everything..."
                className="w-full bg-[#f8fafc] border border-gray-100 rounded-full px-6 py-2.5 text-[12px] h-8 outline-none pr-12 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <Search
                className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                strokeWidth={2}
              />
            </div>

            {toolbarExtra}

            {showStatusFilter && (
              <div className="relative shrink-0 min-w-[120px] z-50">
                <Select2
                  options={[
                    { value: '', label: 'All Status' },
                    ...(statusOptions || [
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ])
                  ]}
                  value={statusValue}
                  onChange={(val) => onStatusChange?.(val as string)}
                  rounded="full"
                  variant="solid"
                />
              </div>
            )}

            {showColumnFilter && (
               <div className="relative shrink-0" ref={colMenuRef}>
                 <button 
                   onClick={() => setColMenuOpen(!colMenuOpen)}
                   className={clsx(
                     "bg-[#f8fafc] border border-gray-100 px-6 py-2 rounded-full text-[12px] font-medium h-8 flex items-center gap-2 transition-all",
                     colMenuOpen ? "text-primary border-primary/30 bg-white" : "text-[#64748b] hover:bg-[#f1f5f9]"
                   )}
                 >
                   <ColumnsIcon className="h-4 w-4" />
                   Column
                   <ChevronDown className={clsx("h-3 w-3 transition-transform", colMenuOpen && "rotate-180")} />
                 </button>
                 
                 {colMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.1)] z-[100] py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-5 pb-2 mb-2 border-b border-gray-50 flex items-center justify-between">
                         <span className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-widest font-poppins">Table Columns</span>
                         <button onClick={() => setColMenuOpen(false)}>
                            <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                         </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar px-1">
                        {columns.map(col => (
                          <label key={col.field} className="flex items-center px-4 py-2 hover:bg-[#f8fafc] cursor-pointer gap-3 group transition-colors rounded-lg mx-1">
                             <div className={clsx(
                               "w-4 h-4 rounded border flex items-center justify-center transition-all",
                               col.visible ? "bg-primary border-primary" : "bg-white border-gray-200 group-hover:border-gray-300"
                             )}>
                               {col.visible && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                             </div>
                             <input type="checkbox" 
                               checked={col.visible} 
                               onChange={() => onColumnToggle?.(col.field)}
                               className="hidden"
                             />
                             <span className={clsx(
                               "text-[13px] transition-colors",
                               col.visible ? "text-primary font-semibold" : "text-[#475569] font-medium"
                             )}>
                               {col.name}
                             </span>
                          </label>
                        ))}
                      </div>
                    </div>
                 )}
               </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onExport?.()}
              className="bg-[#f8fafc] border border-gray-100 px-6 py-2 rounded-full text-[12px] font-medium text-[#64748b] h-8 flex items-center gap-2 hover:bg-[#f1f5f9] transition-colors group shrink-0"
            >
              <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" strokeWidth={2.5} />
              Export
            </button>

            {onDateRangeChange && (
              <DateRangePicker 
                from={fromDate}
                to={toDate}
                onChange={onDateRangeChange}
              />
            )}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-primary/20 overflow-hidden shadow-sm">
          <DataTable
            rowData={rowData}
            columnDefs={columnDefs}
            isLoading={isLoading}
            autoHeight
            pagination={false}
            className=""
            gridOptions={{
              rowHeight: 40,
              headerHeight: 38,
              suppressHorizontalScroll: true,
              ...gridOptions
            }}
          />
          
          {/* ── Table Footer / Pagination ─────────────────────────── */}
          <div className="bg-[#f8fafc] border-t border-primary/20 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-[#94a3b8] font-medium uppercase tracking-widest">Per Page</span>
                <div className="w-[80px]">
                  <Select2
                    options={[
                      { value: 10, label: '10' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' }
                    ]}
                    value={pageSize}
                    onChange={(val) => onPageSizeChange?.(Number(val))}
                    rounded="lg"
                    size="sm"
                    menuPlacement="top"
                  />
                </div>
              </div>

              <span className="text-[13px] text-[#64748b] font-medium border-l border-primary/10 pl-8 py-1">
                Showing <span className="text-primary font-medium">{showingFrom}</span> to <span className="text-primary font-medium">{showingTo}</span> of <span className="text-primary font-medium">{recordsTotal}</span> entries
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-[#94a3b8] hover:bg-white hover:text-primary hover:border-primary/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all mr-1 shadow-sm"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </button>

              {pageNumbers.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === 'number' && onPageChange?.(page)}
                  disabled={page === '...'}
                  className={clsx(
                    'min-w-[34px] h-8 rounded-lg text-[13px] font-medium transition-all shadow-sm',
                    page === currentPage
                      ? 'bg-primary text-white shadow-primary/20 shadow-md'
                      : page === '...'
                      ? 'text-[#94a3b8] cursor-default'
                      : 'bg-white text-[#64748b] border border-gray-200 hover:border-primary/30 hover:text-primary hover:bg-gray-50'
                  )}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-[#94a3b8] hover:bg-white hover:text-primary hover:border-primary/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all mr-1 shadow-sm"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
