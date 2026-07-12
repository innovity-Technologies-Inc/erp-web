import { useMemo, useState, useEffect } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import {
  useSubTypes,
  useAccTypeWiseHead,
  useAccHeadWiseTransaction,
  useSubLedgerReportDatatable,
} from '@/modules/account/hooks/useReports'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useUiStore } from '@/store/useUiStore'
import { cashReportOptions } from './constants'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { Select2 } from '@/components/Select/Select2'
import type { CashBookReportListItem } from '@/modules/account/api/reports.api'
import type { ColDef } from 'ag-grid-community'

export const SubLedgerReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  const getFirstDayOfMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }

  const getTodayDate = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  const [fromDate, setFromDate] = useState<string>(getFirstDayOfMonth())
  const [toDate, setToDate] = useState<string>(getTodayDate())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { showNotificationModal } = useUiStore()

  // Cascading Filters
  const [subTypeId, setSubTypeId] = useState<string>('')
  const [accHeadId, setAccHeadId] = useState<string>('')
  const [tranHeadId, setTranHeadId] = useState<string>('')

  // 1. Fetch Sub Types
  const { data: subTypes = [], isLoading: isSubTypesLoading } = useSubTypes()

  // 2. Fetch Account Heads based on selected Sub Type
  const { data: accHeads = [], isLoading: isAccHeadsLoading } = useAccTypeWiseHead(subTypeId)

  // 3. Fetch Transaction Sub-codes based on selected Sub Type
  const { data: tranHeads = [], isLoading: isTranHeadsLoading } = useAccHeadWiseTransaction(subTypeId)

  // Reset dependent filters when Sub Type changes
  useEffect(() => {
    setAccHeadId('')
    setTranHeadId('')
  }, [subTypeId])

  // Reset Transaction Head when Account Head changes
  useEffect(() => {
    setTranHeadId('')
  }, [accHeadId])

  const [visibleCols, setVisibleCols] = useState({
    sl: true,
    v_date: true,
    v_no: true,
    v_type: true,
    head_name: true,
    ledger_comment: true,
    debit: true,
    credit: true,
    current_balance: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleCols((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const params = useMemo(() => ({
    start: (currentPage - 1) * pageSize,
    length: pageSize,
    sub_type_id: subTypeId,
    acc_head_id: accHeadId,
    tran_head_id: tranHeadId,
    fromDate,
    toDate,
  }), [currentPage, pageSize, subTypeId, accHeadId, tranHeadId, fromDate, toDate])

  const { data: reportData, isFetching: isLoading } = useSubLedgerReportDatatable(params)

  // Calculate totals from the current page data (excluding opening balance row which is at index 0)
  const totals = useMemo(() => {
    const pageData = reportData?.data || []
    if (pageData.length <= 1) return { debit: 0, credit: 0 }
    
    // Sum only actual transactions (skip index 0 opening balance)
    return pageData.slice(1).reduce((acc: any, item: any) => ({
      debit: acc.debit + (parseFloat(String(item.debit).replace(/,/g, '')) || 0),
      credit: acc.credit + (parseFloat(String(item.credit).replace(/,/g, '')) || 0),
    }), { debit: 0, credit: 0 })
  }, [reportData?.data])

  // Prepare data with in-grid summary row appended
  const gridData = useMemo(() => {
    const data = (reportData?.data || []) as any[]
    if (data.length === 0) return data

    const summaryRow = {
      isSummary: true,
      ledger_comment: 'Total:',
      debit: totals.debit.toString(),
      credit: totals.credit.toString(),
      current_balance: '',
    }

    return [...data, summaryRow]
  }, [reportData?.data, totals])

  const columnDefs = useMemo<ColDef<CashBookReportListItem>[]>(() => [
    { 
      headerName: 'SL', 
      valueGetter: (params: any) => {
        if ((params.data as any)?.isSummary) return ''
        const rowIndex = params.node?.rowIndex ?? 0
        if (rowIndex === 0) return '' // Opening balance row has no SL
        return (currentPage - 1) * pageSize + rowIndex
      },
      width: 60,
      flex: 0,
      pinned: 'left' as const,
      hide: !visibleCols.sl,
      cellClass: 'text-gray-400 font-medium border-r border-primary/30 flex items-center justify-center',
    },
    { 
      headerName: 'DATE', 
      field: 'v_date',
      minWidth: 110,
      flex: 1,
      hide: !visibleCols.v_date,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `font-medium flex items-center ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : 'text-[#475569]'}`
      },
    },
    { 
      headerName: 'VOUCHER NO', 
      field: 'v_no',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.v_no,
      cellClass: 'text-center flex items-center justify-center text-gray-600 font-bold'
    },
    { 
      headerName: 'VOUCHER TYPE', 
      field: 'v_type',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.v_type,
      cellClass: 'text-center flex items-center justify-center text-gray-500 font-medium'
    },
    { 
      headerName: 'HEAD NAME', 
      field: 'head_name',
      minWidth: 160,
      flex: 1.8,
      hide: !visibleCols.head_name,
      cellClass: 'flex items-center text-gray-600 font-medium'
    },
    { 
      headerName: 'LEDGER COMMENT', 
      field: 'ledger_comment',
      minWidth: 200,
      flex: 2,
      hide: !visibleCols.ledger_comment,
      cellClass: (params) => {
        const isSum = (params.data as any)?.isSummary
        return `flex items-center text-gray-500 font-medium ${isSum ? 'justify-end pr-4 text-[#1e293b] font-bold' : ''}`
      }
    },
    { 
      headerName: 'DEBIT', 
      field: 'debit',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.debit,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-emerald-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'CREDIT', 
      field: 'credit',
      minWidth: 120,
      flex: 1.2,
      hide: !visibleCols.credit,
      cellClass: (params) => `font-bold flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-rose-600'}`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    },
    { 
      headerName: 'BALANCE', 
      field: 'current_balance',
      minWidth: 140,
      flex: 1.4,
      hide: !visibleCols.current_balance,
      cellClass: (params) => `font-black flex items-center justify-end pr-4 ${(params.data as any)?.isSummary ? 'text-[#1e293b]' : 'text-[#1e4ba1]'} bg-blue-50/20`,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value, currency, currencyPosition) : '0.00'
    }
  ], [visibleCols, currency, currencyPosition, currentPage, pageSize])

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Date', field: 'v_date', visible: visibleCols.v_date },
    { name: 'Voucher No', field: 'v_no', visible: visibleCols.v_no },
    { name: 'Voucher Type', field: 'v_type', visible: visibleCols.v_type },
    { name: 'Head Name', field: 'head_name', visible: visibleCols.head_name },
    { name: 'Ledger Comment', field: 'ledger_comment', visible: visibleCols.ledger_comment },
    { name: 'Debit', field: 'debit', visible: visibleCols.debit },
    { name: 'Credit', field: 'credit', visible: visibleCols.credit },
    { name: 'Balance', field: 'current_balance', visible: visibleCols.current_balance },
  ]

  const handlePdfExport = async () => {
    if (!subTypeId || !accHeadId || !tranHeadId) {
      showNotificationModal('Warning!', 'Please select all filters before printing or exporting.', 'warning')
      return
    }
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/sub-ledger-export', {
        report_type: 'pdf',
        sub_type_id: subTypeId,
        acc_head_id: accHeadId,
        tran_head_id: tranHeadId,
        fromDate,
        toDate,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      showNotificationModal('Error!', 'Failed to export PDF report.', 'error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleExcelExport = async () => {
    if (!subTypeId || !accHeadId || !tranHeadId) {
      showNotificationModal('Warning!', 'Please select all filters before printing or exporting.', 'warning')
      return
    }
    try {
      setIsExportingExcel(true)
      const response = await apiClient.post('/account/report/sub-ledger-export', {
        report_type: 'excel',
        sub_type_id: subTypeId,
        acc_head_id: accHeadId,
        tran_head_id: tranHeadId,
        fromDate,
        toDate,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `sub_ledger_report_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export Excel:', error)
      showNotificationModal('Error!', 'Failed to export Excel report.', 'error')
    } finally {
      setIsExportingExcel(false)
    }
  }

  const totalPages = Math.ceil((reportData?.recordsFiltered ?? 0) / pageSize)

  const toolbarLeft = (
    <div className="flex items-center gap-3">
      <div className="w-[140px]">
        <Select2
          options={subTypes}
          value={subTypeId}
          onChange={(val) => { setSubTypeId(val as string); setCurrentPage(1) }}
          rounded="full"
          variant="solid"
          placeholder="Sub Type"
          isLoading={isSubTypesLoading}
        />
      </div>
      <div className="w-[150px]">
        <Select2
          options={accHeads}
          value={accHeadId}
          onChange={(val) => { setAccHeadId(val as string); setCurrentPage(1) }}
          rounded="full"
          variant="solid"
          placeholder="Account Head"
          isLoading={isAccHeadsLoading}
          isDisabled={!subTypeId}
        />
      </div>
      <div className="w-[220px]">
        <Select2
          options={tranHeads}
          value={tranHeadId}
          onChange={(val) => { setTranHeadId(val as string); setCurrentPage(1) }}
          rounded="full"
          variant="solid"
          placeholder="Transaction Head"
          isLoading={isTranHeadsLoading}
          isDisabled={!subTypeId}
        />
      </div>
    </div>
  )

  const toolbarRight = (
    <div className="flex items-center gap-3">
      <DateRangePicker
        from={fromDate}
        to={toDate}
        onChange={(from, to) => { setFromDate(from); setToDate(to); setCurrentPage(1) }}
      />

      <button 
        disabled={isExportingPdf || isLoading}
        onClick={handlePdfExport}
        className="bg-[#f1f5f9] border border-gray-200 px-4 py-2 rounded-full text-[11px] font-bold text-[#64748b] h-9 flex items-center gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExportingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-500" strokeWidth={2.5} />
        ) : (
          <FileDown className="h-4 w-4 text-[#64748b] group-hover:text-rose-600 transition-colors" strokeWidth={2.5} />
        )}
        {isExportingPdf ? 'PROCESSING...' : 'PDF'}
      </button>

      <button 
        disabled={isExportingExcel || isLoading}
        onClick={handleExcelExport}
        className="bg-[#f1f5f9] border border-gray-200 px-4 py-2 rounded-full text-[11px] font-bold text-[#64748b] h-9 flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" strokeWidth={2.5} />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-[#64748b] group-hover:text-emerald-600 transition-colors" strokeWidth={2.5} />
        )}
        {isExportingExcel ? 'PROCESSING...' : 'EXCEL'}
      </button>
    </div>
  )

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts' as any, active: false },
    { name: 'Report', to: '/account/reports' as any, active: true },
    { name: 'EIN', to: '/account/ein' as any, active: false },
  ]

  return (
    <ListPageLayout<CashBookReportListItem>
      title="Sub Ledger Report"
      titleOptions={cashReportOptions}
      tabs={tabs}
      backTo="/"
      showSearch={false}
      showStatusFilter={false}
      showColumnFilter={false}
      columns={filterColumns}
      onColumnToggle={toggleColumn}
      rowData={gridData}
      columnDefs={columnDefs}
      isLoading={isLoading}
      recordsTotal={reportData?.recordsFiltered ?? 0}
      currentPage={currentPage}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      toolbarExtra={toolbarLeft}
      toolbarRightExtra={toolbarRight}
      gridOptions={{
        postSortRows: (params: any) => {
          const rowNodes = params.nodes;
          // Opening balance row stays at index 0, total row stays at the end
          const summaryIndex = rowNodes.findIndex((node: any) => node.data?.isSummary);
          if (summaryIndex !== -1) {
            const summaryNode = rowNodes.splice(summaryIndex, 1)[0];
            rowNodes.push(summaryNode);
          }
        },
        getRowStyle: (params: any) => {
          if (params.data?.isSummary) {
            return { 
              backgroundColor: '#f8fafc',
              fontWeight: 'bold',
              borderTop: '2px solid #e2e8f0'
            }
          }
          if (params.node?.rowIndex === 0) {
            return {
              backgroundColor: '#f1f5f9/40',
              fontStyle: 'italic',
              fontWeight: '500'
            }
          }
        }
      }}
    />
  )
}
