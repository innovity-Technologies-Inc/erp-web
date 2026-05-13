// src/shared/ui/ListPageLayout/ListPageLayout.tsx
// Generic reusable list page layout for the entire ERP.
// Drop-in replacement for any datatable page — just pass props.

import { useMemo, type ReactNode } from 'react'
import { DataTable } from '@/components/DataTable/DataTable'
import {
  Plus,
  Search,
  ArrowLeft,
  ChevronDown,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  tabs: NavTab[]

  // ── Toolbar (left side) ──
  /** Show the dark "+ Create" button. Pass onClick handler. */
  onCreate?: () => void
  /** Show the "Status" dropdown filter */
  showStatusFilter?: boolean
  /** Show the "Column" dropdown filter */
  showColumnFilter?: boolean
  /** Extra toolbar nodes rendered after the filters */
  toolbarExtra?: ReactNode

  // ── Table ──
  rowData: T[] | undefined
  columnDefs: ColDef<T>[]
  isLoading?: boolean

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
  showStatusFilter = false,
  showColumnFilter = true,
  toolbarExtra,
  rowData,
  columnDefs,
  isLoading = false,
  recordsTotal = 0,
  currentPage = 1,
  pageSize = 10,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  searchValue = '',
  onSearchChange,
}: ListPageLayoutProps<T>) => {

  // Build visible page numbers: [1, 2, 3, 4, '...', last]
  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1)
    return [1, 2, 3, 4, '...', totalPages] as (number | string)[]
  }, [totalPages])

  const showingFrom = recordsTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, recordsTotal)

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={backTo}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors shadow-sm text-[10px] font-bold"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-bold text-[#1e4ba1] tracking-tight ml-2">
            {title}
          </h1>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-3">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.to}
              className={clsx(
                'px-2 py-2 text-[10px] font-bold rounded-xl transition-all duration-200',
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
      <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-50 p-7 space-y-7">

        {/* Filter & Action Row */}
        <div className="flex items-center justify-between gap-4">

          {/* Left side */}
          <div className="flex items-center gap-3 flex-1">
            {onCreate && (
              <button
                onClick={onCreate}
                className="bg-primary hover:bg-primary-hover text-white px-2 py-2 rounded-2xl flex items-center gap-2 h-8 transition-all shadow-md shadow-gray-200"
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
                <span className="font-bold text-[15px]">Create</span>
              </button>
            )}

            <div className="relative w-full max-w-70">
              <input
                type="text"
                placeholder="Search ..."
                className="w-full bg-[#f8fafc] border border-gray-100 rounded-full px-6 py-2.5 text-[14px] h-8 focus:ring-2 focus:ring-blue-500/10 outline-none pr-12"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <Search
                className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                strokeWidth={2}
              />
            </div>

            {showStatusFilter && (
              <button className="bg-[#f8fafc] border border-gray-50 px-6 py-2.5 rounded-full text-[14px] font-bold text-[#64748b] h-8 flex items-center gap-2 hover:bg-[#f1f5f9] transition-colors">
                Status
                <ChevronDown className="h-4 w-4" />
              </button>
            )}

            {showColumnFilter && (
              <button className="bg-[#f8fafc] border border-gray-50 px-6 py-2.5 rounded-full text-[14px] font-bold text-[#64748b] h-8 flex items-center gap-2 hover:bg-[#f1f5f9] transition-colors">
                Column
                <ChevronDown className="h-4 w-4" />
              </button>
            )}

            {toolbarExtra}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="bg-[#f8fafc] border border-gray-50 px-6 py-2 rounded-full text-[14px] font-bold text-[#64748b] h-8 flex items-center gap-2 hover:bg-[#f1f5f9] transition-colors">
              Export
              <Download className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <div className="bg-[#f8fafc] border border-gray-50 px-6 py-2 rounded-full text-[14px] font-bold text-[#94a3b8] h-8 flex items-center gap-4 min-w-[340px] shadow-inner">
              <span className="flex-1 whitespace-nowrap text-center">From -- / -- / ----</span>
              <span className="text-gray-300 font-light">|</span>
              <span className="flex-1 whitespace-nowrap text-center">To -- / -- / ----</span>
              <Calendar className="h-4 w-4 text-[#94a3b8]" />
            </div>
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <DataTable
            rowData={rowData}
            columnDefs={columnDefs}
            isLoading={isLoading}
            autoHeight
            className="rounded-2xl"
            gridOptions={{
              rowHeight: 40,
              headerHeight: 45,
              suppressHorizontalScroll: true,
            }}
          />
        </div>

        {/* ── Pagination Footer ──────────────────────────────────── */}
        {!isLoading && recordsTotal > 0 && (
          <div className="flex items-center justify-between pt-2 px-4">
            <div className="text-[14px] text-[#64748b] font-medium">
              Showing{' '}
              <span className="font-bold text-gray-800">{showingFrom}</span> to{' '}
              <span className="font-bold text-gray-800">{showingTo}</span> of{' '}
              <span className="font-bold text-gray-800">{recordsTotal}</span> entries
            </div>

            <div className="flex items-center gap-8">
              {/* Page size selector */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                    className="appearance-none bg-[#f8fafc] border border-gray-100 rounded-xl pl-4 pr-10 py-1.5 outline-none text-[14px] font-bold text-gray-600 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
                <span className="text-[14px] font-medium text-[#64748b]">Items per page</span>
              </div>

              {/* Page buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-[#3b82f6] transition-colors disabled:opacity-30"
                >
                  <div className="flex items-center gap-1 font-bold text-[13px]">
                    <ChevronLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, i) => (
                    <button
                      key={i}
                      onClick={() => typeof page === 'number' ? onPageChange?.(page) : undefined}
                      disabled={page === '...'}
                      className={clsx(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-bold transition-all',
                        page === currentPage
                          ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20'
                          : page === '...'
                          ? 'text-gray-300 cursor-default'
                          : 'text-gray-400 hover:bg-gray-50'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-[#3b82f6] transition-colors disabled:opacity-30"
                >
                  <div className="flex items-center gap-1 font-bold text-[13px]">
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}