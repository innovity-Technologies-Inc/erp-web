import { useState, useMemo, useRef, Fragment } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useReceiptPaymentReport } from '@/modules/account/hooks/useReports'
import { useUiStore } from '@/store/useUiStore'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { cashReportOptions } from './constants'

export const ReceiptPaymentReportPage = () => {
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const printRef = useRef<HTMLDivElement>(null)

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
  const [reportType, setReportType] = useState<string>('Accrual Basis')

  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const params = useMemo(() => ({
    fromDate,
    toDate,
    reportType,
  }), [fromDate, toDate, reportType])

  const { data: reportData, isFetching: isLoading } = useReceiptPaymentReport(params)

  const receiptitems = reportData?.receiptitems || []
  const paymentitems = reportData?.paymentitems || []
  const cashOpening = parseFloat(String(reportData?.cashOpening || 0))
  const bankOpening = parseFloat(String(reportData?.bankOpening || 0))
  const advOpening = parseFloat(String(reportData?.advOpening || 0))
  const cashClosing = parseFloat(String(reportData?.cashClosing || 0))
  const bankClosing = parseFloat(String(reportData?.bankClosing || 0))
  const advClosing = parseFloat(String(reportData?.advClosing || 0))

  // Calculate totals
  const totals = useMemo(() => {
    let rTotal = 0
    receiptitems.forEach((item: any) => {
      rTotal += parseFloat(String(item.subtotal || 0))
    })

    let pTotal = 0
    paymentitems.forEach((item: any) => {
      pTotal += parseFloat(String(item.subtotal || 0))
    })

    const openingTotal = cashOpening + bankOpening + advOpening
    const closingTotal = cashClosing + bankClosing + advClosing

    return {
      openingTotal,
      receiptsTotal: rTotal,
      paymentsTotal: pTotal,
      closingTotal,
      receiptsGrandTotal: rTotal + openingTotal,
      paymentsGrandTotal: pTotal + closingTotal,
    }
  }, [receiptitems, paymentitems, cashOpening, bankOpening, advOpening, cashClosing, bankClosing, advClosing])

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true)
      const response = await apiClient.post('/account/report/receipt-payment-export', {
        report_type: 'pdf',
        fromDate,
        toDate,
        reportType,
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
    try {
      setIsExportingExcel(true)
      const response = await apiClient.post('/account/report/receipt-payment-export', {
        report_type: 'excel',
        fromDate,
        toDate,
        reportType,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `receipt-payment-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
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
        Receipt & Payment Report
      </h2>
      <p className="text-[11px] font-bold text-slate-400">
        Comprehensive analysis of corporate physical assets and valuation.
      </p>
    </div>
  )

  const toolbarRight = (
    <div className="flex items-center gap-4">
      {/* Basis Radio Buttons */}
      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800">
          <input
            type="radio"
            name="reportType"
            value="Accrual Basis"
            checked={reportType === 'Accrual Basis'}
            onChange={() => setReportType('Accrual Basis')}
            className="w-4 h-4 accent-[#003671] cursor-pointer"
          />
          Accrual Basis
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800">
          <input
            type="radio"
            name="reportType"
            value="Cash Basis"
            checked={reportType === 'Cash Basis'}
            onChange={() => setReportType('Cash Basis')}
            className="w-4 h-4 accent-[#003671] cursor-pointer"
          />
          Cash Basis
        </label>
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
      title="Receipt & Payment"
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
          {/* Card 1: Opening Total */}
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
              Opening Balance
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 1 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.openingTotal), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 1 ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                  color: hoveredCard === 1 ? '#ffffff' : '#2563eb',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Start
              </span>
            </div>
          </div>

          {/* Card 2: Receipts Total */}
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
              Total Receipts (Inflow)
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 2 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.receiptsTotal), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 2 ? 'rgba(255,255,255,0.2)' : '#ecfdf5',
                  color: hoveredCard === 2 ? '#ffffff' : '#059669',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Receipts
              </span>
            </div>
          </div>

          {/* Card 3: Payments Total */}
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
              Total Payments (Outflow)
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 3 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.paymentsTotal), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 3 ? 'rgba(255,255,255,0.2)' : '#fdf2f2',
                  color: hoveredCard === 3 ? '#ffffff' : '#dc2626',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                Payments
              </span>
            </div>
          </div>

          {/* Card 4: Closing Total */}
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
              Closing Balance
            </div>
            <div className="flex items-baseline justify-between">
              <div 
                style={{ color: hoveredCard === 4 ? '#ffffff' : '#1e293b' }}
                className="text-[18px] font-extrabold tracking-tight transition-colors"
              >
                {formatCurrency(Math.round(totals.closingTotal), currency, currencyPosition).split('.')[0]}
              </div>
              <span 
                style={{
                  backgroundColor: hoveredCard === 4 ? 'rgba(255,255,255,0.2)' : '#fdf6b2',
                  color: hoveredCard === 4 ? '#ffffff' : '#ca8a04',
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              >
                End
              </span>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-100 rounded-[16px] shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#003671]" />
            <span className="text-xs font-bold text-slate-500">Loading Receipt & Payment Report...</span>
          </div>
        ) : (
          <div ref={printRef} className="flex flex-col gap-6">
            {/* Main Report Table */}
            <div className="overflow-hidden border border-slate-100 rounded-[16px] shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#003671] text-white">
                      <th className="px-6 py-4 text-left font-extrabold uppercase tracking-wider text-[11px] border-r border-[#003671]/20">Particulars</th>
                      <th className="px-6 py-4 text-right font-extrabold uppercase tracking-wider text-[11px] w-[35%]">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* --- OPENING BALANCE --- */}
                    <tr className="bg-slate-50/40">
                      <td colSpan={2} className="px-6 py-3.5 text-[#003671] text-left font-extrabold uppercase tracking-widest text-[11px]">
                        Opening Balance
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">Cash In Hand</td>
                      <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">{formatCurrency(cashOpening, currency, currencyPosition)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">Cash At Bank</td>
                      <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">{formatCurrency(bankOpening, currency, currencyPosition)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">Advance</td>
                      <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">{formatCurrency(advOpening, currency, currencyPosition)}</td>
                    </tr>

                    {/* --- RECEIPTS --- */}
                    <tr className="bg-slate-50/40">
                      <td colSpan={2} className="px-6 py-3.5 text-[#003671] text-left font-extrabold uppercase tracking-widest text-[11px]">
                        Receipt
                      </td>
                    </tr>
                    {receiptitems.map((receiptitem: any, idx: number) => (
                      <Fragment key={`receipt-${idx}`}>
                        <tr className="bg-[#F2F4F6]/50">
                          <td className="px-10 py-3 font-bold text-slate-700 text-left text-[12px] border-r border-slate-100" colSpan={2}>
                            {receiptitem.headName}
                          </td>
                        </tr>
                        {receiptitem.innerHead?.map((inner: any, innerIdx: number) => (
                          <tr key={`receipt-inner-${innerIdx}`} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">
                              {inner.headName}
                            </td>
                            <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">
                              {formatCurrency(inner.credit, currency, currencyPosition)}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                    {receiptitems.length > 0 && (
                      <tr className="bg-[#003671]/5 font-bold border-t border-b border-slate-200">
                        <td className="pl-20 py-3.5  text-[#003671] text-left font-extrabold italic pr-4 text-[12px] border-r border-slate-100">
                          Total Receipts
                        </td>
                        <td className="px-6 py-3.5 text-right text-slate-900 font-black text-[12px]">
                          {formatCurrency(totals.receiptsTotal, currency, currencyPosition)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#003671] border-t-2 border-slate-200 font-bold">
                      <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-[#003671]/20">Grand Total Receipts</td>
                      <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[12px]">
                        {formatCurrency(totals.receiptsGrandTotal, currency, currencyPosition)}
                      </td>
                    </tr>

                    {/* --- PAYMENTS --- */}
                    <tr className="bg-slate-50/40">
                      <td colSpan={2} className="px-6 py-3.5 text-[#BA1A1A] text-left font-extrabold uppercase tracking-widest text-[11px]">
                        Payments
                      </td>
                    </tr>
                    {paymentitems.map((paymentitem: any, idx: number) => (
                      <Fragment key={`payment-${idx}`}>
                        <tr className="bg-[#F2F4F6]/50">
                          <td className="px-10 py-3 font-bold text-slate-700 text-left text-[12px] border-r border-slate-100" colSpan={2}>
                            {paymentitem.headName}
                          </td>
                        </tr>
                        {paymentitem.innerHead?.map((inner: any, innerIdx: number) => (
                          <tr key={`payment-inner-${innerIdx}`} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">
                              {inner.headName}
                            </td>
                            <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">
                              {formatCurrency(inner.debit, currency, currencyPosition)}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                    {paymentitems.length > 0 && (
                      <tr className="bg-[#BA1A1A]/5 font-bold border-t border-b border-slate-200">
                        <td className="pl-20 py-3.5  text-[#BA1A1A] text-left font-extrabold italic pr-4 text-[12px] border-r border-slate-100">
                          Total Payments
                        </td>
                        <td className="px-6 py-3.5 text-right text-slate-900 font-black text-[12px]">
                          {formatCurrency(totals.paymentsTotal, currency, currencyPosition)}
                        </td>
                      </tr>
                    )}

                    {/* --- CLOSING BALANCE --- */}
                    <tr className="bg-slate-50/40">
                      <td colSpan={2} className="px-6 py-3.5 text-[#003671] text-left font-extrabold uppercase tracking-widest text-[11px]">
                        Closing Balance
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">Cash In Hand</td>
                      <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">{formatCurrency(cashClosing, currency, currencyPosition)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">Cash At Bank</td>
                      <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">{formatCurrency(bankClosing, currency, currencyPosition)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2.5 text-left text-slate-500 font-medium pl-20 text-[12px] border-r border-slate-100">Advance</td>
                      <td className="px-6 py-2.5 text-right font-semibold text-slate-600 text-[12px]">{formatCurrency(advClosing, currency, currencyPosition)}</td>
                    </tr>
                    <tr className="bg-[#003671] border-t-2 border-slate-200 font-bold">
                      <td className="px-10 py-3.5 text-right font-black text-[#FFFFFF] uppercase tracking-wider text-[12px] border-r border-[#003671]/20">Grand Total Payments & Closing</td>
                      <td className="px-6 py-3.5 text-right font-black text-[#FFFFFF] text-[12px]">
                        {formatCurrency(totals.paymentsGrandTotal, currency, currencyPosition)}
                      </td>
                    </tr>
                  </tbody>
                </table>
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
