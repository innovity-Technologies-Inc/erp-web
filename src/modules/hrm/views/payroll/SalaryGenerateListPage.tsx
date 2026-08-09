import { useMemo, useState, useRef, useEffect } from 'react'
import { Trash2, CheckSquare, List, Calendar, Info, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useSalarySheetsDatatable,
  useGenerateSalarySheet,
  useDeleteSalarySheet,
} from '../../hooks/useSalarySheets'
import type { ColDef } from 'ag-grid-community'
import type { SalarySheet } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DataTable } from '@/components/DataTable/DataTable'
import { Select2 } from '@/components/Select/Select2'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { Link } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'

export const SalaryGenerateListPage = () => {
  const { showNotificationModal } = useUiStore()

  // Datatable parameters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Selected Month State for Generator
  const [selectedMonth, setSelectedMonth] = useState('')
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const monthPickerRef = useRef<HTMLDivElement>(null)

  // Selected Month State for Filter
  const [isFilterMonthPickerOpen, setIsFilterMonthPickerOpen] = useState(false)
  const [filterPickerYear, setFilterPickerYear] = useState(new Date().getFullYear())
  const filterMonthPickerRef = useRef<HTMLDivElement>(null)

  // Delete Confirm States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [sheetToDelete, setSheetToDelete] = useState<number | null>(null)

  // API Mutators
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      month: filterMonth,
      start_date: fromDate,
      end_date: toDate,
    }),
    [currentPage, pageSize, search, filterMonth, fromDate, toDate]
  )

  const { data: sheetData, isLoading, refetch } = useSalarySheetsDatatable(params)
  const { mutate: generateSalary, isPending: isGenerating } = useGenerateSalarySheet()
  const { mutate: deleteSalarySheet, isPending: isDeleting } = useDeleteSalarySheet()

  const backendBaseUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    return apiUrl.replace(/\/api$/, '')
  }, [])

  // Close Month Picker Popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false)
      }
      if (filterMonthPickerRef.current && !filterMonthPickerRef.current.contains(event.target as Node)) {
        setIsFilterMonthPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Month options for filter dropdown (last 12 months)
  const filterMonthOptions = useMemo(() => {
    const options = [{ value: '', label: 'Select Month' }]
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = d.toLocaleString('en-US', { month: 'long' })
      const year = d.getFullYear()
      options.push({
        value: `${monthName} ${year}`,
        label: `${monthName} ${year}`
      })
    }
    return options
  }, [])

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMonth) {
      showNotificationModal('Validation Error', 'Please select a salary month!', 'error')
      return
    }

    generateSalary(
      { name: selectedMonth },
      {
        onSuccess: (res: any) => {
          setSelectedMonth('')
          refetch()
          showNotificationModal(
            'Success',
            res?.message || 'Salary generation completed successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to generate salary.'
          showNotificationModal('Error', msg, 'error')
        },
      }
    )
  }

  const handleDeleteClick = (id: number) => {
    setSheetToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (sheetToDelete) {
      deleteSalarySheet(sheetToDelete, {
        onSuccess: (res: any) => {
          setIsConfirmOpen(false)
          setSheetToDelete(null)
          refetch()
          showNotificationModal(
            'Deleted Successfully',
            res?.message || 'Salary sheet record has been deleted.',
            'success'
          )
        },
        onError: (err: any) => {
          setIsConfirmOpen(false)
          setSheetToDelete(null)
          const msg = err.response?.data?.message || err.message || 'Failed to delete.'
          showNotificationModal('Error', msg, 'error')
        },
      })
    }
  }

  // Column toggle options for ListPageLayout structure mapping
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    gdate: true,
    generated_by: true,
    status: true,
    approved_date: true,
    approved_by: true,
    actions: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // Table Column Definitions
  const columnDefs = useMemo<ColDef<SalarySheet>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 60,
        flex: 0,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'SALARY NAME',
        field: 'name',
        minWidth: 150,
        flex: 1.2,
        hide: !visibleCols.name,
        cellClass: 'font-medium text-gray-900 flex items-center',
      },
      {
        headerName: 'GENERATION DATE',
        field: 'gdate',
        width: 160,
        flex: 0,
        hide: !visibleCols.gdate,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'GENERATED BY',
        field: 'generated_by_name',
        width: 150,
        flex: 0,
        hide: !visibleCols.generated_by,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'STATUS',
        field: 'approved',
        width: 180,
        flex: 0,
        hide: !visibleCols.status,
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: any) => {
          const isApproved = params.data?.approved === 1
          return isApproved ? (
            <button
              type="button"
              className="px-4 py-1 bg-orange-500 text-white text-[12px] font-bold rounded-lg shadow-sm flex items-center justify-center gap-1 hover:brightness-105 transition-all h-[28px]"
              onClick={() => showNotificationModal('Salary Status', `${params.data?.name} salary is approved!`, 'success')}
            >
              ✓ Approve
            </button>
          ) : (
            <button
              type="button"
              className="px-4 py-1 bg-yellow-500 text-white text-[12px] font-bold rounded-lg shadow-sm flex items-center justify-center hover:brightness-105 transition-all h-[28px]"
              onClick={() => showNotificationModal('Salary Status', `${params.data?.name} salary is not approved yet.`, 'info')}
            >
              Not Approve
            </button>
          )
        },
      },
      {
        headerName: 'APPROVED DATE',
        field: 'approved_date',
        width: 150,
        flex: 0,
        hide: !visibleCols.approved_date,
        cellClass: 'text-gray-500 flex items-center',
        valueFormatter: (params) => params.value || '-',
      },
      {
        headerName: 'APPROVED BY',
        field: 'approved_by_name',
        width: 140,
        flex: 0,
        hide: !visibleCols.approved_by,
        cellClass: 'text-gray-500 flex items-center',
        valueFormatter: (params) => params.value || '-',
      },
      {
        headerName: 'ACTION',
        field: 'actions',
        width: 130,
        flex: 0,
        pinned: 'right',
        hide: !visibleCols.actions,
        cellClass: 'flex items-center justify-center gap-2 border-l border-primary/10',
        cellRenderer: (params: any) => {
          const sheet = params.data as SalarySheet
          const isApproved = sheet.approved === 1
          return (
            <div className="flex items-center gap-1.5 h-full justify-center">
              <PermissionGuard permission="generate_salary_approved">
                {!isApproved ? (
                  <Link
                    to="/hrm/payroll-approval/$id"
                    params={{ id: String(sheet.id) }}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-105 active:scale-95 border border-blue-100"
                    title="Approve Salary"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="p-1.5 bg-gray-50 text-gray-300 rounded-lg border border-gray-100 cursor-not-allowed" title="Already Approved">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </span>
                )}
              </PermissionGuard>

              <Link
                to="/hrm/payroll-chart/$id"
                params={{ id: String(sheet.id) }}
                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all hover:scale-105 active:scale-95 border border-emerald-100"
                title="Salary Chart"
              >
                <List className="w-3.5 h-3.5" />
              </Link>

              <PermissionGuard permission="delete_salary_generate">
                {!isApproved ? (
                  <button
                    onClick={() => handleDeleteClick(sheet.id)}
                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all hover:scale-105 active:scale-95 border border-rose-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="p-1.5 bg-gray-50 text-gray-300 rounded-lg border border-gray-100 cursor-not-allowed" title="Cannot delete approved sheet">
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </PermissionGuard>
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, visibleCols, backendBaseUrl]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Salary Name', field: 'name', visible: visibleCols.name },
    { name: 'Generation Date', field: 'gdate', visible: visibleCols.gdate },
    { name: 'Generated By', field: 'generated_by', visible: visibleCols.generated_by },
    { name: 'Status', field: 'status', visible: visibleCols.status },
    { name: 'Approved Date', field: 'approved_date', visible: visibleCols.approved_date },
    { name: 'Approved By', field: 'approved_by', visible: visibleCols.approved_by },
    { name: 'Actions', field: 'actions', visible: visibleCols.actions },
  ]

  const totalPages = Math.ceil((sheetData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'HRM', to: '/hrm/designation' },
    { name: 'Attendance', to: '/hrm/attendance' },
    { name: 'Payroll', to: '/hrm/payroll', active: true },
  ]

  const titleOptions = [
    { name: 'Salary Advance', to: '/hrm/payroll' },
    { name: 'Salary Generate', to: '/hrm/payroll-generate' },
    { name: 'Manage Employee Salary', to: '/hrm/payroll-manage-salary' },
  ]

  const handleDateRangeChange = (from: string, to: string) => {
    setFromDate(from)
    setToDate(to)
    setCurrentPage(1)
  }

  return (
    <>
      <ListPageLayout
        title="Salary Selection List"
        titleOptions={titleOptions}
        backTo="/"
        tabs={tabs}
        disableCard={true}
        hideFilterRow={true}
      >
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Left Panel - Width 25% */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6">
            {/* Card 1: Target Month Generator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-[15px] text-gray-800 font-poppins">Target Month</h3>
                </div>
                <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500" />
              </div>

              <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 relative" ref={monthPickerRef}>
                  <label className="text-[12px] font-medium text-gray-600">Salary Month <span className="text-red-500">*</span></label>
                  
                  <div 
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-all text-[13px]"
                  >
                    <span className={clsx(selectedMonth ? 'text-gray-800 font-medium' : 'text-gray-400')}>
                      {selectedMonth || 'Select Month'}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Month Picker Dropdown */}
                  {isMonthPickerOpen && (
                    <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-150 rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] z-50 p-4 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-50">
                        <button 
                          type="button"
                          onClick={() => setPickerYear(prev => prev - 1)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-[14px] text-gray-700 font-poppins">{pickerYear}</span>
                        <button 
                          type="button"
                          onClick={() => setPickerYear(prev => prev + 1)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {monthsList.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setSelectedMonth(`${m} ${pickerYear}`)
                              setIsMonthPickerOpen(false)
                            }}
                            className={clsx(
                              "py-1.5 px-1 text-[12px] font-medium rounded-lg transition-all hover:bg-blue-50 hover:text-blue-600",
                              selectedMonth === `${m} ${pickerYear}` ? "bg-blue-500 text-white hover:bg-blue-500 hover:text-white" : "text-gray-600 bg-gray-50"
                            )}
                          >
                            {m.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth('')}
                    className="flex-1 py-2 px-4 border border-gray-200 text-gray-500 hover:bg-gray-50 text-[13px] font-medium rounded-lg transition-all"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-all shadow-md shadow-blue-200"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2: Pro Insights */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl shadow-sm p-6 text-white flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-200" />
                <h4 className="font-bold text-[14px] uppercase tracking-wider font-poppins">PRO INSIGHTS</h4>
              </div>
              <p className="text-[12px] text-blue-100 font-medium leading-relaxed font-poppins">
                Payroll efficiency is up by 12% compared to last quarter.
              </p>
            </div>
          </div>

          {/* Right Panel - Width 75% */}
          <div className="w-full lg:w-3/4 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Table Action Toolbar - All filters in one line */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-gray-100 mb-6 w-full">
              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                {/* Search */}
                <div className="relative w-40 shrink-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search ..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-gray-200 rounded-full text-[12px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors h-[32px]"
                  />
                </div>

                {/* Month Dropdown Filter (Custom popover style matching Generator) */}
                <div className="flex flex-col relative" ref={filterMonthPickerRef}>
                  <div 
                    onClick={() => setIsFilterMonthPickerOpen(!isFilterMonthPickerOpen)}
                    className="flex items-center justify-between px-4 py-1.5 bg-[#f8fafc] border border-gray-200 rounded-full cursor-pointer hover:border-blue-300 transition-all text-[12px] h-[32px] w-40"
                  >
                    <span className={clsx(filterMonth ? 'text-gray-800 font-medium' : 'text-gray-400')}>
                      {filterMonth || 'Select Month'}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </div>

                  {/* Month Picker Dropdown */}
                  {isFilterMonthPickerOpen && (
                    <div className="absolute top-[100%] left-0 w-52 bg-white border border-gray-150 rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] z-50 p-4 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-50">
                        <button 
                          type="button"
                          onClick={() => setFilterPickerYear(prev => prev - 1)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-[14px] text-gray-700 font-poppins">{filterPickerYear}</span>
                        <button 
                          type="button"
                          onClick={() => setFilterPickerYear(prev => prev + 1)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {monthsList.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setFilterMonth(`${m} ${filterPickerYear}`)
                              setIsFilterMonthPickerOpen(false)
                              setCurrentPage(1)
                            }}
                            className={clsx(
                              "py-1.5 px-1 text-[12px] font-medium rounded-lg transition-all hover:bg-blue-50 hover:text-blue-600",
                              filterMonth === `${m} ${filterPickerYear}` ? "bg-blue-500 text-white hover:bg-blue-500 hover:text-white" : "text-gray-600 bg-gray-50"
                            )}
                          >
                            {m.substring(0, 3)}
                          </button>
                        ))}
                      </div>

                      {filterMonth && (
                        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterMonth('')
                              setIsFilterMonthPickerOpen(false)
                              setCurrentPage(1)
                            }}
                            className="text-[11px] text-red-500 font-medium hover:underline"
                          >
                            Clear Filter
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Group (Export & Date Range) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => showNotificationModal('Export', 'Exporting functionality is disabled or placeholder.', 'info')}
                  className="bg-[#f8fafc] border border-gray-200 px-4 py-1 rounded-full text-[12px] font-medium text-[#64748b] flex items-center gap-1.5 hover:bg-[#f1f5f9] transition-all h-[32px]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>

                {/* Date Range Picker (Far Right) */}
                <div className="shrink-0 scale-95 origin-right">
                  <DateRangePicker
                    from={fromDate}
                    to={toDate}
                    onChange={handleDateRangeChange}
                  />
                </div>
              </div>
            </div>

            {/* Table Container using AG Grid DataTable */}
            <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <DataTable
                rowData={sheetData?.data || []}
                columnDefs={columnDefs}
                isLoading={isLoading}
                autoHeight
                pagination={false}
                gridOptions={{
                  rowHeight: 45,
                  headerHeight: 42,
                  suppressHorizontalScroll: true,
                }}
              />

              {/* Table Footer / Pagination */}
              {sheetData && sheetData.recordsFiltered > 0 && (
                <div className="bg-[#f8fafc] border-t border-gray-100 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-[#94a3b8] font-medium uppercase tracking-widest">Per Page</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-2 py-1 bg-white border border-gray-200 rounded-md text-[13px] text-gray-600 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>

                    <span className="text-[13px] text-[#64748b] font-medium border-l border-gray-200 pl-4">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sheetData.recordsFiltered)} of {sheetData.recordsFiltered} entries
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-[#94a3b8] hover:bg-white hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={3} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          'w-8 h-8 rounded-lg text-[13px] font-medium transition-all shadow-sm',
                          page === currentPage
                            ? 'bg-blue-600 text-white shadow-blue-200 shadow-md'
                            : 'bg-white text-[#64748b] border border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-gray-50'
                        )}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 text-[#94a3b8] hover:bg-white hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all shadow-sm"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ListPageLayout>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false)
          setSheetToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Salary Generation"
        description="Are you sure you want to delete this salary sheet? This will delete all generated employee salary records for this month. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </>
  )
}
