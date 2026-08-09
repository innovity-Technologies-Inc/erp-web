import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { MonthPicker } from '@/components/DateRangePicker/MonthPicker'
import { useEmployeeSalariesDatatable } from '../../hooks/useSalarySheets'
import type { EmployeeSalary } from '../../api/types'

export const SalaryManageListPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Column Visibility States
  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    employee_name: true,
    sal_month_year: true,
    net_salary: true,
    actions: true,
  })

  // API query
  const queryFilters = useMemo(() => {
    let formattedMonth = undefined
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-')
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      formattedMonth = `${monthNames[parseInt(month) - 1]} ${year}`
    }

    return {
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      draw: currentPage,
      'search[value]': searchQuery || undefined,
      month: formattedMonth,
      start_date: fromDate || undefined,
      end_date: toDate || undefined,
    }
  }, [currentPage, pageSize, searchQuery, selectedMonth, fromDate, toDate])

  const { data: salaryData, isLoading } = useEmployeeSalariesDatatable(queryFilters)

  // Datatable Column Defs
  const columnDefs = useMemo<ColDef<EmployeeSalary>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 80,
        flex: 0,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'EMPLOYEE NAME',
        field: 'employee_name',
        minWidth: 220,
        flex: 1,
        hide: !visibleCols.employee_name,
        cellClass: 'font-medium text-gray-900 flex items-center',
      },
      {
        headerName: 'SALARY MONTH',
        field: 'sal_month_year',
        width: 180,
        flex: 0,
        hide: !visibleCols.sal_month_year,
        cellClass: 'text-gray-600 flex items-center justify-center font-medium',
      },
      {
        headerName: 'TOTAL SALARY',
        field: 'net_salary',
        width: 180,
        flex: 0,
        hide: !visibleCols.net_salary,
        cellClass: 'text-gray-700 flex items-center justify-end font-semibold px-4',
        valueFormatter: (params) => params.value ? `$${Number(params.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      },
      {
        headerName: 'ACTIONS',
        field: 'actions',
        width: 180,
        flex: 0,
        pinned: 'right',
        hide: !visibleCols.actions,
        cellClass: 'flex items-center justify-center gap-2 border-l border-primary/10',
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1.5 h-full justify-center">
            <Link
              to="/hrm/payroll-payslip/$uuid"
              params={{ uuid: params.data.uuid }}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1 text-[11px]"
              title="Payslip"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Payslip</span>
            </Link>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, visibleCols]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Employee Name', field: 'employee_name', visible: visibleCols.employee_name },
    { name: 'Salary Month', field: 'sal_month_year', visible: visibleCols.sal_month_year },
    { name: 'Total Salary', field: 'net_salary', visible: visibleCols.net_salary },
    { name: 'Actions', field: 'actions', visible: visibleCols.actions },
  ]

  const totalPages = Math.ceil((salaryData?.recordsFiltered ?? 0) / pageSize)

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

  const toggleColumn = (col: string) => {
    setVisibleCols((prev) => ({
      ...prev,
      [col]: !prev[col as keyof typeof prev],
    }))
  }

  return (
    <ListPageLayout
      title="Employee Payment List"
      titleOptions={titleOptions}
      backTo="/"
      tabs={tabs}
      searchWidth="max-w-[200px]"
      searchValue={searchQuery}
      onSearchChange={(val) => {
        setSearchQuery(val)
        setCurrentPage(1)
      }}
      isLoading={isLoading}
      // AG Grid Props
      rowData={salaryData?.data || []}
      columnDefs={columnDefs}
      // Pagination
      recordsTotal={salaryData?.recordsFiltered || 0}
      currentPage={currentPage}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => {
        setPageSize(size)
        setCurrentPage(1)
      }}
      // Column Filter
      showColumnFilter={true}
      columns={filterColumns}
      onColumnToggle={toggleColumn}
      // Date Range Picker (renders on right of toolbar)
      fromDate={fromDate}
      toDate={toDate}
      onDateRangeChange={handleDateRangeChange}
      // Month Picker (renders in left side of toolbar next to search)
      toolbarExtra={
        <div className="flex items-center gap-2">
          <MonthPicker
            from={selectedMonth}
            onChange={(start) => {
              setSelectedMonth(start)
              setCurrentPage(1)
            }}
          />
        </div>
      }
    />
  )
}
