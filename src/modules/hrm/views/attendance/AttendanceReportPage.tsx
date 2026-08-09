import { useMemo, useState } from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'
import {
  useAttendanceReportsDatatable,
  useEmployeeSelect2,
} from '../../hooks/useAttendances'
import type { ColDef } from 'ag-grid-community'
import type { Attendance } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'
import { MonthPicker } from '@/components/DateRangePicker/MonthPicker'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { formatDate } from '@/utils/formatters'
import { apiClient } from '@/api/client'

const formatTime = (dateTimeStr: string | null | undefined) => {
  if (!dateTimeStr) return '—'
  if (dateTimeStr === 'Not Yet') return 'Not Yet'
  const d = new Date(dateTimeStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return dateTimeStr
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
}

export const AttendanceReportPage = () => {
  const { showNotificationModal } = useUiStore()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    employee_name: true,
    date: true,
    sign_in: true,
    sign_out: true,
    stay_time: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      employee_id: employeeId || undefined,
      fromDate: dateRange.start || undefined,
      toDate: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, employeeId, dateRange]
  )

  const { data: reportData, isLoading } = useAttendanceReportsDatatable(params)

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Attendance>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 80,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'NAME',
        field: 'employee_name',
        minWidth: 200,
        flex: 1,
        hide: !visibleCols.employee_name,
        cellClass: 'font-medium text-gray-900 flex items-center',
      },
      {
        headerName: 'DATE',
        field: 'date',
        width: 150,
        hide: !visibleCols.date,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        headerName: 'CHECK IN',
        field: 'sign_in',
        width: 150,
        hide: !visibleCols.sign_in,
        cellClass: 'text-gray-600 flex items-center justify-center',
        valueFormatter: (params) => formatTime(params.value),
      },
      {
        headerName: 'CHECK OUT',
        field: 'sign_out',
        width: 180,
        hide: !visibleCols.sign_out,
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: any) => {
          const val = params.value
          const isEmpty =
            !val ||
            val === '0000-00-00 00:00:00' ||
            (typeof val === 'string' && (
              val.trim() === '' ||
              val.trim() === 'null' ||
              val.trim() === 'undefined' ||
              val.includes('<a') ||
              val.includes('<span')
            ))
          if (isEmpty) {
            return (
              <div className="flex items-center justify-center w-full h-full">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 leading-none">
                  Not Yet
                </span>
              </div>
            )
          }
          return (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-gray-600 font-poppins">{formatTime(val)}</span>
            </div>
          )
        },
      },
      {
        headerName: 'STAY TIME',
        field: 'stay_time',
        width: 150,
        hide: !visibleCols.stay_time,
        cellClass: 'text-gray-600 flex items-center justify-center font-semibold',
        valueFormatter: (params) => params.value ? `${params.value} hrs` : '—',
      },
    ],
    [currentPage, pageSize, visibleCols]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Employee Name', field: 'employee_name', visible: visibleCols.employee_name },
    { name: 'Date', field: 'date', visible: visibleCols.date },
    { name: 'Check In', field: 'sign_in', visible: visibleCols.sign_in },
    { name: 'Check Out', field: 'sign_out', visible: visibleCols.sign_out },
    { name: 'Stay Time', field: 'stay_time', visible: visibleCols.stay_time },
  ]

  const totalPages = Math.ceil((reportData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'HRM', to: '/hrm/designation' },
    { name: 'Attendance', to: '/hrm/attendance', active: true },
    { name: 'Payroll', to: '/hrm/payroll' },
  ]

  const titleOptions = [
    { name: 'Attendance List', to: '/hrm/attendance' },
    { name: 'Attendance Report', to: '/hrm/attendance-report' },
  ]

  // Employee filter dropdown in toolbar
  const { data: employeesData } = useEmployeeSelect2()
  const employeeOptions = useMemo(() => [
    { value: '', label: 'All Employees' },
    ...(employeesData || []).map((emp: any) => ({
      value: emp.id,
      label: emp.text || emp.name,
    }))
  ], [employeesData])

  const toolbarExtra = (
    <div className="flex items-center gap-3 shrink-0 z-50">
      <div className="w-[180px]">
        <Select2
          options={employeeOptions}
          value={employeeId}
          onChange={(val) => {
            setEmployeeId(val as string)
            setCurrentPage(1)
          }}
          rounded="full"
          variant="solid"
        />
      </div>

      <MonthPicker
        from={dateRange.start}
        onChange={(start, end) => {
          setDateRange({ start, end })
          setCurrentPage(1)
        }}
      />
    </div>
  )

  const handleExport = async (type: 'pdf' | 'excel') => {
    const isPdf = type === 'pdf'
    if (isPdf) setIsExportingPdf(true)
    else setIsExportingExcel(true)

    try {
      const response = await apiClient.post(
        '/hrm/attendance-report-export',
        {
          report_type: type,
          employee_id: employeeId || undefined,
          fromDate: dateRange.start || undefined,
          toDate: dateRange.end || undefined,
        },
        {
          responseType: 'blob',
        }
      )

      const fileType = isPdf
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const blob = new Blob([response.data], { type: fileType })
      const url = window.URL.createObjectURL(blob)

      if (isPdf) {
        window.open(url, '_blank')
      } else {
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Failed to export report:', error)
      showNotificationModal('Error!', `Failed to export ${type.toUpperCase()} report.`, 'error')
    } finally {
      if (isPdf) setIsExportingPdf(false)
      else setIsExportingExcel(false)
    }
  }

  const toolbarRightExtra = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('pdf')}
        disabled={isExportingPdf}
        className="bg-[#f8fafc] border border-gray-100 px-4 py-2 rounded-full text-[12px] font-medium text-[#64748b] h-8 flex items-center gap-1.5 hover:bg-[#f1f5f9] transition-colors disabled:opacity-50 shrink-0"
      >
        <FileText className="h-4 w-4 text-[#64748b]" />
        PDF
      </button>
      <button
        onClick={() => handleExport('excel')}
        disabled={isExportingExcel}
        className="bg-[#f8fafc] border border-gray-100 px-4 py-2 rounded-full text-[12px] font-medium text-[#64748b] h-8 flex items-center gap-1.5 hover:bg-[#f1f5f9] transition-colors disabled:opacity-50 shrink-0"
      >
        <FileSpreadsheet className="h-4 w-4 text-[#64748b]" />
        Excel
      </button>

      <DateRangePicker
        from={dateRange.start}
        to={dateRange.end}
        onChange={(start, end) => {
          setDateRange({ start, end })
          setCurrentPage(1)
        }}
      />
    </div>
  )

  return (
    <ListPageLayout
      title="Attendance Report"
      titleOptions={titleOptions}
      backTo="/"
      tabs={tabs}
      searchWidth="max-w-[200px]"
      searchValue={search}
      onSearchChange={(val) => {
        setSearch(val)
        setCurrentPage(1)
      }}
      isLoading={isLoading}
      // AG Grid Props
      rowData={reportData?.data || []}
      columnDefs={columnDefs}
      // Pagination
      recordsTotal={reportData?.recordsFiltered || 0}
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
      toolbarExtra={toolbarExtra}
      toolbarRightExtra={toolbarRightExtra}
    />
  )
}
