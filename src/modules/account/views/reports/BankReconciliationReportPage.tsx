import { useState, useMemo, useRef } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { Select2 } from '@/components/Select/Select2'
import { useBankReconciliationReport } from '@/modules/account/hooks/useReports'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { cashReportOptions } from './constants'

export const BankReconciliationReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const printRef = useRef<HTMLDivElement>(null)

  // Timezone-safe default dates
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
  const [bankCode, setBankCode] = useState<string>('')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const params = useMemo(() => ({
    fromDate,
    toDate,
    bankCode: bankCode || undefined,
  }), [fromDate, toDate, bankCode])

  const { data: reportData, isFetching: isLoading } = useBankReconciliationReport(params)

  const rawVouchers = reportData?.vauchers || []
  const banksList = reportData?.bank || []

  // Default bankCode to first bank in the list if not selected
  useMemo(() => {
    if (!bankCode && banksList.length > 0) {
      setBankCode(banksList[0].head_code)
    }
  }, [banksList, bankCode])

  // Map banks list for Select2 options
  const bankOptions = useMemo(() => {
    return banksList.map((b: any) => ({
      value: b.head_code,
      label: b.head_name,
    }))
  }, [banksList])

  // Separate approved (honoured) and unapproved (pending) cheques
  const { approvedVouchers, unapprovedVouchers, approvedTotal, unapprovedTotal } = useMemo(() => {
    const approved: any[] = []
    const unapproved: any[] = []
    let appSum = 0
    let unappSum = 0

    rawVouchers.forEach((v: any) => {
      if (v.is_honour === 1) {
        approved.push(v)
        appSum += parseFloat(String(v.debit || 0))
      } else {
        unapproved.push(v)
        unappSum += parseFloat(String(v.debit || 0))
      }
    })

    return {
      approvedVouchers: approved,
      unapprovedVouchers: unapproved,
      approvedTotal: appSum,
      unapprovedTotal: unappSum,
    }
  }, [rawVouchers])

  const handlePdfExport = async () => {
    if (!bankCode) {
      showNotificationModal('Warning!', 'Please select a bank first.', 'warning')
      return
    }
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/bank-reconciliation-export', {
        report_type: 'pdf',
        fromDate,
        toDate,
        bankCode,
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
    if (!bankCode) {
      showNotificationModal('Warning!', 'Please select a bank first.', 'warning')
      return
    }
    try {
      setIsExportingExcel(true)
      const response = await apiClient.post('/account/report/bank-reconciliation-export', {
        report_type: 'excel',
        fromDate,
        toDate,
        bankCode,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bank-reconciliation-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export Excel:', error)
      showNotificationModal('Error!', 'Failed to export Excel report.', 'error')
    } finally {
      setIsExportingExcel(false)
    }
  }

  const toolbarLeft = (
    <div className="flex flex-col gap-1">
      <h2 className="text-[16px] font-black text-[#003671] tracking-tight uppercase">
        Bank Reconciliation Report
      </h2>
      <p className="text-[11px] font-bold text-slate-400">
        Reconciliation of bank statements with ledger cheque transaction entries.
      </p>
    </div>
  )

  const toolbarRight = (
    <div className="flex items-center gap-3">
      {/* Bank Select Dropdown */}
      <div className="w-56">
        <Select2
          options={bankOptions}
          value={bankCode}
          onChange={(val: any) => setBankCode(val || '')}
          rounded="full"
          variant="solid"
          placeholder="Select Bank"
          isLoading={isLoading && bankOptions.length === 0}
        />
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        from={fromDate}
        to={toDate}
        onChange={(from, to) => {
          setFromDate(from)
          setToDate(to)
        }}
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
    <ListPageLayout<any>
      title="Bank Reconciliation"
      titleOptions={cashReportOptions}
      tabs={tabs}
      backTo="/"
      showSearch={false}
      showStatusFilter={false}
      showColumnFilter={false}
      columns={[]}
      onColumnToggle={() => {}}
      rowData={[]}
      columnDefs={[]}
      isLoading={isLoading}
      toolbarExtra={toolbarLeft}
      toolbarRightExtra={toolbarRight}
    >
      <div className="flex flex-col gap-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Honoured Sum */}
          <div 
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === 1 ? '#003671' : '#ffffff',
              color: hoveredCard === 1 ? '#ffffff' : '#1e293b',
              borderColor: hoveredCard === 1 ? '#003671' : '#f1f5f9',
            }}
            className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
          >
            <div 
              style={{ color: hoveredCard === 1 ? '#ffffff' : '#64748b' }}
              className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
            >
              Honoured Amount
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 1 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(approvedTotal), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 1 ? 'rgba(255,255,255,0.2)' : '#ecfdf5',
                  color: hoveredCard === 1 ? '#ffffff' : '#059669',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Cleared
              </span>
            </div>
          </div>

          {/* Card 2: Honoured Count */}
          <div 
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === 2 ? '#003671' : '#ffffff',
              color: hoveredCard === 2 ? '#ffffff' : '#1e293b',
              borderColor: hoveredCard === 2 ? '#003671' : '#f1f5f9',
            }}
            className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
          >
            <div 
              style={{ color: hoveredCard === 2 ? '#ffffff' : '#64748b' }}
              className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
            >
              Honoured Cheques
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 2 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {approvedVouchers.length} <span className="text-xs font-normal text-slate-400">Qty</span>
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 2 ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                  color: hoveredCard === 2 ? '#ffffff' : '#2563eb',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Approved
              </span>
            </div>
          </div>

          {/* Card 3: Pending Sum */}
          <div 
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === 3 ? '#003671' : '#ffffff',
              color: hoveredCard === 3 ? '#ffffff' : '#1e293b',
              borderColor: hoveredCard === 3 ? '#003671' : '#f1f5f9',
            }}
            className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
          >
            <div 
              style={{ color: hoveredCard === 3 ? '#ffffff' : '#64748b' }}
              className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
            >
              Pending Amount
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 3 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(unapprovedTotal), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 3 ? 'rgba(255,255,255,0.2)' : '#fdf2f2',
                  color: hoveredCard === 3 ? '#ffffff' : '#dc2626',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Pending
              </span>
            </div>
          </div>

          {/* Card 4: Pending Count */}
          <div 
            onMouseEnter={() => setHoveredCard(4)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === 4 ? '#003671' : '#ffffff',
              color: hoveredCard === 4 ? '#ffffff' : '#1e293b',
              borderColor: hoveredCard === 4 ? '#003671' : '#f1f5f9',
            }}
            className="px-6 border rounded-[16px] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-center h-28 relative overflow-hidden cursor-pointer"
          >
            <div 
              style={{ color: hoveredCard === 4 ? '#ffffff' : '#64748b' }}
              className="text-[12px] font-bold uppercase tracking-wider mb-2 transition-colors"
            >
              Pending Cheques
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 4 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {unapprovedVouchers.length} <span className="text-xs font-normal text-slate-400">Qty</span>
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 4 ? 'rgba(255,255,255,0.2)' : '#fdf6b2',
                  color: hoveredCard === 4 ? '#ffffff' : '#ca8a04',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Hold
              </span>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-100 rounded-[16px] shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#003671]" />
            <span className="text-xs font-bold text-slate-500">Loading Bank Reconciliation Data...</span>
          </div>
        ) : (
          <div ref={printRef} className="flex flex-col gap-8">
            
            {/* Table 1: Approved Cheques */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-[#003671] uppercase tracking-wider">
                  Approved Cheques (Honoured)
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Total Approved: <strong className="text-slate-700">{formatCurrency(approvedTotal, currency, currencyPosition)}</strong>
                </span>
              </div>
              <div className="overflow-hidden border border-slate-100 rounded-[16px] shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#003671] text-white">
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[8%] border-r border-[#003671]/20">Sl No</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[18%] border-r border-[#003671]/20">Voucher No</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] border-r border-[#003671]/20">Particulars</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[18%] border-r border-[#003671]/20">Cheque No</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[14%] border-r border-[#003671]/20">Date</th>
                        <th className="px-6 py-3.5 text-right font-extrabold uppercase tracking-wider text-[11px] w-[16%]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvedVouchers.length > 0 ? (
                        approvedVouchers.map((v: any, index: number) => (
                          <tr key={`appr-${index}`} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{index + 1}</td>
                            <td className="px-6 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-100">{v.v_No}</td>
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{v.accountName}</td>
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{v.cheque_no}</td>
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{v.cheque_date}</td>
                            <td className="px-6 py-2.5 text-right font-semibold text-slate-700">{formatCurrency(v.debit, currency, currencyPosition)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                            No Honoured Cheques Found
                          </td>
                        </tr>
                      )}
                      {approvedVouchers.length > 0 && (
                        <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                          <td colSpan={5} className="px-6 py-3 text-right text-slate-900 font-extrabold text-[12px] border-r border-slate-100">
                            Total Approved
                          </td>
                          <td className="px-6 py-3 text-right text-[#003671] font-black text-[12px]">
                            {formatCurrency(approvedTotal, currency, currencyPosition)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Table 2: Unapproved Cheques */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-[#BA1A1A] uppercase tracking-wider">
                  Unapproved Cheques (Pending)
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Total Unapproved: <strong className="text-slate-700">{formatCurrency(unapprovedTotal, currency, currencyPosition)}</strong>
                </span>
              </div>
              <div className="overflow-hidden border border-slate-100 rounded-[16px] shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#BA1A1A] text-white">
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[8%] border-r border-red-800/20">Sl No</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[18%] border-r border-red-800/20">Voucher No</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] border-r border-red-800/20">Particulars</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[18%] border-r border-red-800/20">Cheque No</th>
                        <th className="px-6 py-3.5 text-left font-extrabold uppercase tracking-wider text-[11px] w-[14%] border-r border-red-800/20">Date</th>
                        <th className="px-6 py-3.5 text-right font-extrabold uppercase tracking-wider text-[11px] w-[16%]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unapprovedVouchers.length > 0 ? (
                        unapprovedVouchers.map((v: any, index: number) => (
                          <tr key={`unappr-${index}`} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{index + 1}</td>
                            <td className="px-6 py-2.5 text-left font-semibold text-slate-700 border-r border-slate-100">{v.v_no}</td>
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{v.accountName}</td>
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{v.cheque_no}</td>
                            <td className="px-6 py-2.5 text-left text-slate-500 font-medium border-r border-slate-100">{v.cheque_date}</td>
                            <td className="px-6 py-2.5 text-right font-semibold text-slate-700">{formatCurrency(v.debit, currency, currencyPosition)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                            No Pending Cheques Found
                          </td>
                        </tr>
                      )}
                      {unapprovedVouchers.length > 0 && (
                        <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                          <td colSpan={5} className="px-6 py-3 text-right text-slate-900 font-extrabold text-[12px] border-r border-slate-100">
                            Total Unapproved
                          </td>
                          <td className="px-6 py-3 text-right text-[#BA1A1A] font-black text-[12px]">
                            {formatCurrency(unapprovedTotal, currency, currencyPosition)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Verification Trail logs info box */}
            <div className="bg-slate-50 border border-slate-200 rounded-[12px] p-4 flex flex-col gap-1.5 mt-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Verification Trail</span>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-3 gap-6 mt-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-300 pt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Prepared By
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-300 pt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Checked By
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-slate-300 pt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Authorised By
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ListPageLayout>
  )
}
