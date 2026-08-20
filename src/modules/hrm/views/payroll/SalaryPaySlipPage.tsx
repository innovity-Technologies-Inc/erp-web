import { useMemo } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { useSalaryPaySlipInfo } from '../../hooks/useSalarySheets'

export const SalaryPaySlipPage = () => {
  const { uuid } = useParams({ from: '/_authenticated/hrm/payroll-payslip/$uuid' })
  const { data: responseData, isLoading, error } = useSalaryPaySlipInfo(uuid)

  const handlePrint = () => {
    window.print()
  }

  const slip = responseData?.data
  const currencySymbol = slip?.setting?.currency_symbol || '$'

  const initials = useMemo(() => {
    if (!slip?.salary_info) return 'EE'
    const first = slip.salary_info.first_name?.[0] || ''
    const last = slip.salary_info.last_name?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }, [slip])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !slip) {
    return (
      <div className="p-6 bg-white rounded-xl shadow border border-gray-100 max-w-[1200px] mx-auto text-center text-red-500">
        Error loading payslip details: {error?.message || 'Payslip not found.'}
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
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
          .print-grid-two-cols {
            display: grid !important;
            grid-template-columns: 8fr 4fr !important;
            gap: 1.5rem !important;
          }
          .print-grid-equal-cols {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 2.5rem !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
      `}</style>

      <div className="min-h-screen bg-[#f1f0f5] pb-12 font-poppins text-[#475569]">
        {/* Header - Hidden in Print */}
        <div className="max-w-[1600px] mx-auto pb-6 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/hrm/payroll-manage-salary"
                className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={3} />
                <span>Back</span>
              </Link>
              <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
                Employee Payment List
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
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 print-container space-y-6">
            
            {/* Logo & Company details */}
            <div className="flex flex-row justify-between items-center pb-4 w-full">
              <div className="flex flex-col gap-1 text-[13px] text-gray-500 font-poppins">
                {(slip.setting as any)?.invoice_logo_url || (slip.setting as any)?.invoice_logo ? (
                  <div className="pb-2">
                    <img
                      src={(slip.setting as any).invoice_logo_url || `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:5000/storage'}/${(slip.setting as any).invoice_logo}`}
                      alt="Company Logo"
                      className="h-10 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pb-1">
                    <div className="bg-blue-900 text-white p-1.5 rounded-lg flex items-center justify-center font-bold text-[16px] h-8 w-8">
                      {slip.company?.company_name?.[0] || 'G'}
                    </div>
                    <h2 className="font-bold text-[18px] text-blue-900 tracking-tight font-poppins">
                      {slip.company?.company_name || 'GEN-ITECH'}
                    </h2>
                  </div>
                )}

                <p className="text-[12px] text-gray-400">
                  {slip.company?.address || 'Block -C, House-66, Level-5 Niketon Road-8, Dhaka 1212, Bangladesh'}
                </p>
                <p className="text-[12px] text-gray-400">
                  Email: <span className="text-blue-600 hover:underline">{slip.company?.email || 'info@genitech.com'}</span> | Mob: {slip.company?.mobile || '+8801771850228'}
                </p>
              </div>

              <div className="text-right flex flex-col gap-1 font-poppins">
                <h3 className="font-bold text-[18px] text-[#1E3A5F] font-poppins">
                  Employee Salary Chart
                </h3>
                <p className="text-[12px] text-gray-400 font-medium font-poppins">
                  {slip.month_name} {slip.year_name}
                </p>
              </div>
            </div>

            {/* Gray PAYSLIP bar */}
            <div className="w-full bg-[#f8fafc] border border-gray-100 rounded-xl py-2.5 text-center">
              <span className="text-[12px] font-bold tracking-widest text-[#64748b] uppercase font-poppins">
                PAYSLIP
              </span>
            </div>

            {/* Info Row Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch print-grid-two-cols">
              
              {/* Left Side: Employee Details */}
              <div className="lg:col-span-8 bg-white border border-gray-150/60 rounded-2xl p-5 flex flex-col justify-center gap-4">
                
                {/* Employee Header */}
                <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
                  <div className="h-12 w-12 rounded-full bg-[#0F4C81] text-white flex items-center justify-center font-bold text-[15px] font-poppins">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] text-gray-900 font-poppins leading-snug">
                      {slip.salary_info.first_name} {slip.salary_info.last_name}
                    </h3>
                    <p className="text-[11px] font-semibold text-gray-400 font-poppins">
                      Staff ID : #{String(slip.salary_info.employee_id).padStart(3, '0')}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[12px] font-poppins">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">POSITION</span>
                    <span className="font-semibold text-gray-700">{slip.employee_info.designation || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">CONTACT</span>
                    <span className="font-semibold text-gray-700">{slip.employee_info.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">WORKED DAYS</span>
                    <span className="font-semibold text-gray-700">{slip.work_days} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">PAY PERIOD</span>
                    <span className="font-semibold text-gray-700">01-{slip.month_name.substring(0,3)}-{slip.year_name} to {slip.work_days}-{slip.month_name.substring(0,3)}-{slip.year_name}</span>
                  </div>
                </div>

              </div>

              {/* Right Side: Calculation blocks */}
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                
                {/* Gross Earnings block */}
                <div className="bg-[#eff6ff] border border-blue-100 rounded-2xl py-3 px-4 flex flex-col justify-center flex-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">GROSS EARNINGS</span>
                  <span className="text-[18px] font-bold text-[#1E3A5F] mt-0.5">
                    {Number(slip.salary_info.gross_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Total Deductions block */}
                <div className="bg-[#fff1f2] border border-rose-100 rounded-2xl py-3 px-4 flex flex-col justify-center flex-1">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">TOTAL DEDUCTIONS</span>
                  <span className="text-[18px] font-bold text-rose-600 mt-0.5">
                    {Number(slip.total_deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Net Payable block */}
                <div className="bg-[#1E3A5F] border border-blue-900 rounded-2xl py-3 px-4 flex flex-col justify-center flex-1 text-white">
                  <div>
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">NET PAYABLE</span>
                    <h4 className="text-[20px] font-bold mt-0.5">
                      {Number(slip.salary_info.net_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <span className="text-[9px] text-blue-200/80 mt-1 block font-medium">
                    Calculated based on standard regulations
                  </span>
                </div>

              </div>

            </div>

            {/* Earnings and Deductions tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 print-grid-equal-cols">
              
              {/* Earnings Column */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-blue-900 mb-3 text-[11px] font-bold">
                  <span className="text-blue-900 uppercase tracking-widest text-[12px]">EARNINGS</span>
                  <span className="text-gray-400 uppercase tracking-widest text-[10px]">AMOUNT</span>
                </div>
                <div className="divide-y divide-gray-50 text-[12px] font-poppins space-y-0.5">
                  <div className="flex justify-between py-2 px-1">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-semibold text-gray-800">
                      {Number(slip.salary_info.basic_salary_pro_rated).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 px-1">
                    <span className="text-gray-600">Transport Allowance</span>
                    <span className="font-semibold text-gray-800">
                      {Number(slip.salary_info.transport_allowance_pro_rated).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 px-1">
                    <span className="text-gray-600">Total Benefit</span>
                    <span className="font-semibold text-gray-800">
                      {Number(slip.total_benefits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 px-3 bg-slate-50 rounded-xl font-bold text-gray-900 mt-2">
                    <span className="text-blue-900 uppercase text-[11px] tracking-wider">Gross Salary</span>
                    <span>
                      {Number(slip.salary_info.gross_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-rose-500 mb-3 text-[11px] font-bold">
                  <span className="text-rose-600 uppercase tracking-widest text-[12px]">DEDUCTIONS</span>
                  <span className="text-gray-400 uppercase tracking-widest text-[10px]">AMOUNT</span>
                </div>
                <div className="divide-y divide-gray-50 text-[12px] font-poppins space-y-0.5">
                  <div className="flex justify-between py-2 px-1">
                    <span className="text-gray-600">Income Tax</span>
                    <span className="font-semibold text-gray-800">
                      {Number(slip.salary_info.income_tax).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 px-1">
                    <span className="text-gray-600 font-poppins">Social Security (%)</span>
                    <span className="font-semibold text-gray-800">
                      {Number(slip.salary_info.soc_sec_npf_tax).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 px-1">
                    <span className="text-gray-600">Loan Deduction</span>
                    <span className="font-semibold text-gray-800">
                      {Number(slip.salary_info.loan_deduct).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 px-1">
                    <span className="text-gray-600">Salary Advance</span>
                    <span className="font-semibold text-gray-800">
                      {Number(slip.salary_info.salary_advance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 px-3 bg-[#fff1f2]/40 border border-rose-100/50 rounded-xl font-bold text-gray-900 mt-2">
                    <span className="text-rose-600 uppercase text-[11px] tracking-wider">Total Deductions</span>
                    <span className="text-rose-600">
                      {Number(slip.total_deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Gray Verification Trail bar */}
            <div className="w-full bg-[#f8fafc] border border-gray-100 rounded-xl py-2.5 text-center mt-6">
              <span className="text-[12px] font-bold tracking-widest text-[#64748b] uppercase font-poppins">
                VERIFICATION TRAIL
              </span>
            </div>

            {/* Signature blocks */}
            <div className="grid grid-cols-3 gap-10 pt-10 text-[11px] text-gray-400 font-medium font-poppins">
              <div className="text-center">
                <div className="border-t border-dashed border-gray-250 pt-2.5">
                  <span className="block font-bold text-gray-700">Prepared By</span>
                  <span className="text-[10px] text-gray-400">{slip.prepared_by}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-dashed border-gray-250 pt-2.5">
                  <span className="block font-bold text-gray-700">Checked By</span>
                  <span className="text-[10px] text-gray-400">Finance Controller</span>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-dashed border-gray-250 pt-2.5">
                  <span className="block font-bold text-gray-700">Authorised By</span>
                  <span className="text-[10px] text-gray-400">Operations Manager</span>
                </div>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="text-center text-[10px] text-gray-400 pt-6 border-t border-gray-100">
              © {slip.year_name} All rights reserved by GEN-ITECH. Developed by GEN-ITECH
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
