import { useMemo } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { useSalarySheetChart } from '../../hooks/useSalarySheets'
import { useUiStore } from '@/store/useUiStore'
import { clsx } from 'clsx'

export const SalaryChartPage = () => {
  const { id } = useParams({ from: '/_authenticated/hrm/payroll-chart/$id' })
  const { data: chartData, isLoading, error } = useSalarySheetChart(Number(id))

  const currencySymbol = chartData?.setting?.currency || 'USD'

  const handlePrint = () => {
    window.print()
  }

  // Calculate Column Totals
  const totals = useMemo(() => {
    if (!chartData?.charts) return null
    return chartData.charts.reduce(
      (acc, row) => ({
        basic: acc.basic + row.basic,
        total_benefit: acc.total_benefit + row.total_benefit,
        transport: acc.transport + row.transport,
        gross_salary: acc.gross_salary + row.gross_salary,
        income_tax: acc.income_tax + row.income_tax,
        soc_sec_npf_tax: acc.soc_sec_npf_tax + row.soc_sec_npf_tax,
        employer_contribution: acc.employer_contribution + row.employer_contribution,
        loan_deduct: acc.loan_deduct + row.loan_deduct,
        salary_advance: acc.salary_advance + row.salary_advance,
        total_deductions: acc.total_deductions + row.total_deductions,
        net_salary: acc.net_salary + row.net_salary,
      }),
      {
        basic: 0,
        total_benefit: 0,
        transport: 0,
        gross_salary: 0,
        income_tax: 0,
        soc_sec_npf_tax: 0,
        employer_contribution: 0,
        loan_deduct: 0,
        salary_advance: 0,
        total_deductions: 0,
        net_salary: 0,
      }
    )
  }, [chartData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !chartData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow border border-gray-100 max-w-[1600px] mx-auto text-center text-red-500">
        Error loading salary chart: {error?.message || 'Sheet not found.'}
      </div>
    )
  }

  const { sheet, charts, company, setting: rawSetting } = chartData
  const setting = rawSetting as any

  return (
    <>
      {/* Print Style Injector */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 10mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Hide AppShell elements */
          aside, header, nav, footer, button, .print\\:hidden {
            display: none !important;
          }
          /* Make table fit to print width */
          table {
            width: 100% !important;
            table-layout: auto !important;
            font-size: 9px !important;
          }
          th, td {
            padding: 4px 6px !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#f1f0f5] pb-12 font-poppins text-[#475569] ">
        {/* Header - Hidden in Print */}
        <div className="max-w-[1600px] mx-auto pb-6 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/hrm/payroll-generate"
                className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={3} />
                <span>Back</span>
              </Link>
              <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
                Employee Salary Chart
              </h1>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-md transition-all active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Print Content Wrapper */}
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8 print-container">
            {/* Logo & Company details */}
            <div className="flex flex-row justify-between items-center pb-6 border-b border-gray-100 mb-6 w-full">
              <div className="flex flex-col gap-1 text-[13px] text-gray-500 font-poppins">
                {(setting?.invoice_logo_url || setting?.invoice_logo) && (
                  <div className="pb-2">
                    <img
                      src={setting.invoice_logo_url || `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:5000/storage'}/${setting.invoice_logo}`}
                      alt="Company Logo"
                      className="h-10 object-contain"
                    />
                  </div>
                )}
                {!(setting?.invoice_logo_url || setting?.invoice_logo) && (
                  <h2 className="font-bold text-[16px] text-blue-900 uppercase font-poppins">
                    {company?.company_name || 'GEN-ITECH'}
                  </h2>
                )}
                <p>{company?.address || 'Block -C, House-66, Level-5 Niketon Road-8, Dhaka 1212, Bangladesh'}</p>
                <p>Email: {company?.email || 'info@genitech.com'} | Mob: {company?.mobile || '+8801771850228'}</p>
              </div>

              <div className="text-right flex flex-col gap-1 font-poppins">
                <h3 className="font-bold text-[18px] text-gray-700 font-poppins">
                  Employee Salary Chart
                </h3>
                <p className="text-[13px] text-gray-500 font-semibold uppercase font-poppins">
                  {sheet?.name || 'August 2026'}
                </p>
              </div>
            </div>

            {/* Subtitle Section */}
            <div className="w-full text-center pb-4">
              <span className="text-[12px] font-bold tracking-widest text-[#94a3b8] uppercase font-poppins">
                SALES CHART
              </span>
            </div>

            {/* Table Container */}
            <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-2 border-r border-gray-200 text-center w-10 whitespace-normal break-words leading-tight align-middle">SL.</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-left whitespace-normal break-words leading-tight align-middle min-w-[100px]">Employee Name</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[80px]">Basic Salary</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[80px]">Total Benefit</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[80px]">Transport Allowance</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[85px]">Gross Salary</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[80px]">Income Tax</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[80px]">Soc.Sec (NPF)</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[90px]">Employer Cont.</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[80px]">Loan Deduct.</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[80px]">Salary Advance</th>
                    <th className="py-2.5 px-2 border-r border-gray-200 text-right whitespace-normal break-words leading-tight align-middle max-w-[85px]">Total Deduct.</th>
                    <th className="py-2.5 px-2 text-right whitespace-normal break-words leading-tight align-middle max-w-[90px]">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {charts.map((row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2 px-2 border-r border-gray-100 text-center text-gray-400 font-bold whitespace-nowrap">{index + 1}</td>
                      <td className="py-2 px-2 border-r border-gray-100 font-semibold text-gray-800 whitespace-nowrap">{row.employee_name}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium whitespace-nowrap">{currencySymbol} {row.basic.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium text-green-600 whitespace-nowrap">{currencySymbol} {row.total_benefit.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium whitespace-nowrap">{currencySymbol} {row.transport.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-semibold text-gray-900 whitespace-nowrap">{currencySymbol} {row.gross_salary.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium text-red-500 whitespace-nowrap">{currencySymbol} {row.income_tax.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium text-red-500 whitespace-nowrap">{currencySymbol} {row.soc_sec_npf_tax.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium whitespace-nowrap">{currencySymbol} {row.employer_contribution.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium text-red-500 whitespace-nowrap">{currencySymbol} {row.loan_deduct.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-medium text-red-500 whitespace-nowrap">{currencySymbol} {row.salary_advance.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-100 text-right font-semibold text-red-600 whitespace-nowrap">{currencySymbol} {row.total_deductions.toFixed(2)}</td>
                      <td className={clsx("py-2 px-2 text-right font-bold whitespace-nowrap", row.net_salary < 0 ? "text-rose-600" : "text-blue-600")}>
                        {currencySymbol} {row.net_salary.toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Totals Row */}
                  {totals && (
                    <tr className="bg-gray-50 border-t border-gray-200 font-bold text-gray-900">
                      <td className="py-2 px-2 border-r border-gray-200 text-center whitespace-nowrap" colSpan={2}>Grand Total</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right whitespace-nowrap">{currencySymbol} {totals.basic.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right text-green-700 whitespace-nowrap">{currencySymbol} {totals.total_benefit.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right whitespace-nowrap">{currencySymbol} {totals.transport.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right text-gray-950 whitespace-nowrap">{currencySymbol} {totals.gross_salary.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right text-red-600 whitespace-nowrap">{currencySymbol} {totals.income_tax.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right text-red-600 whitespace-nowrap">{currencySymbol} {totals.soc_sec_npf_tax.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right whitespace-nowrap">{currencySymbol} {totals.employer_contribution.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right text-red-600 whitespace-nowrap">{currencySymbol} {totals.loan_deduct.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right text-red-600 whitespace-nowrap">{currencySymbol} {totals.salary_advance.toFixed(2)}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-right text-red-700 whitespace-nowrap">{currencySymbol} {totals.total_deductions.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-blue-700 whitespace-nowrap">{currencySymbol} {totals.net_salary.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Verification Trail Banner */}
            <div className="w-full bg-[#f8fafc] border border-gray-150 rounded-lg py-2.5 text-center mt-6">
              <span className="text-[12px] font-bold tracking-widest text-[#64748b] uppercase font-poppins">
                VERIFICATION TRAIL
              </span>
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-3 gap-6 pt-24 font-poppins">
              <div className="flex flex-col gap-1">
                <div className="border-t border-gray-300 pt-2 text-[12px] text-gray-500">
                  Prepared by: <span className="font-bold text-gray-800">{sheet?.generated_by_name || 'Admin'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="border-t border-gray-300 pt-2 text-[12px] text-gray-500">
                  Checked by
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="border-t border-gray-300 pt-2 text-[12px] text-gray-500">
                  Authorised by: <span className="font-bold text-gray-800">{sheet?.approved_by_name || ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
