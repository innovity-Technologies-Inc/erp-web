import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Printer, CheckSquare, Loader2, Info } from 'lucide-react'
import { useSalarySheetApprovalInfo, useApproveSalarySheet } from '../../hooks/useSalarySheets'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'

export const SalaryApprovalPage = () => {
  const { id } = useParams({ from: '/_authenticated/hrm/payroll-approval/$id' })
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()

  // API Queries & Mutations
  const { data: infoData, isLoading, error, refetch } = useSalarySheetApprovalInfo(Number(id))
  const { mutate: approvePayroll, isPending: isApproving } = useApproveSalarySheet()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Account Selection Form State
  const [netSalaryAccount, setNetSalaryAccount] = useState('')
  const [taxAccount, setTaxAccount] = useState('')
  const [npfAccount, setNpfAccount] = useState('')
  const [icfAccount, setIcfAccount] = useState('')

  const handlePrint = () => {
    window.print()
  }

  const handleApproveClick = () => {
    if (!infoData) return
    // Pre-fill accounts if available or set defaults
    setIsModalOpen(true)
  }

  const handleSubmitApproval = (e: React.FormEvent) => {
    e.preventDefault()
    if (!infoData) return

    const { summary, sheet } = infoData

    // Validations
    if (!netSalaryAccount) {
      showNotificationModal('Validation Error', 'Please select Net Salary Payment Account.', 'error')
      return
    }
    if (summary.state_income_tax > 0 && !taxAccount) {
      showNotificationModal('Validation Error', 'Please select State Income Tax Bank Account.', 'error')
      return
    }
    if (summary.total_npf_contribution > 0 && !npfAccount) {
      showNotificationModal('Validation Error', 'Please select NPF Payment Bank Account.', 'error')
      return
    }
    if (summary.icf_amount > 0 && !icfAccount) {
      showNotificationModal('Validation Error', 'Please select ICF Payment Bank Account.', 'error')
      return
    }

    const payload = {
      ssg_id: sheet.id,
      payment_nature: netSalaryAccount,
      amount: summary.net_salary,
      tax_payment_nature: taxAccount || undefined,
      tax_amount: summary.state_income_tax > 0 ? summary.state_income_tax : undefined,
      npf_payment_nature: npfAccount || undefined,
      npf_amount: summary.total_npf_contribution > 0 ? summary.total_npf_contribution : undefined,
      iicf_payment_nature: icfAccount || undefined,
      iicf_amount: summary.icf_amount > 0 ? summary.icf_amount : undefined,
      net_renumeration: summary.net_salary,
      employee_npf_contribution: summary.employee_npf_contribution,
      employer_npf_contribution: summary.employer_npf_contribution,
      icf_amount: summary.icf_amount,
      state_income_tax: summary.state_income_tax,
      month_year: sheet.name,
    }

    approvePayroll(payload, {
      onSuccess: (res: any) => {
        setIsModalOpen(false)
        refetch()
        showNotificationModal(
          'Success',
          res?.message || 'Salary sheet approved and posted successfully.',
          'success'
        )
        navigate({ to: '/hrm/payroll-generate' })
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to approve salary sheet.'
        showNotificationModal('Error', msg, 'error')
      },
    })
  }

  const currencySymbol = infoData?.currency || '$'

  // Calculations for debit and credit totals
  const debitTotal = useMemo(() => {
    if (!infoData?.summary) return 0
    const { gross_salary, employer_npf_contribution, icf_amount } = infoData.summary
    return gross_salary + employer_npf_contribution + icf_amount
  }, [infoData])

  const creditTotal = useMemo(() => {
    if (!infoData?.summary) return 0
    const { net_salary, loans, salary_advance, state_income_tax, employee_npf_contribution, employer_npf_contribution, icf_amount } = infoData.summary
    return net_salary + loans + salary_advance + state_income_tax + employee_npf_contribution + employer_npf_contribution + icf_amount
  }, [infoData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !infoData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow border border-gray-100 max-w-[1200px] mx-auto text-center text-red-500">
        Error loading approval details: {error?.message || 'Sheet not found.'}
      </div>
    )
  }

  const { sheet, summary, payment_natures, bank_payment_natures } = infoData
  const isApproved = sheet.approved === 1

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
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
          aside, header, nav, footer, button, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#f1f0f5] pb-12 font-poppins text-[#475569]">
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
                Employee Salary Approval
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              {!isApproved ? (
                <button
                  onClick={handleApproveClick}
                  className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-md transition-all active:scale-95"
                >
                  <CheckSquare className="w-4 h-4" />
                  Approve & Post
                </button>
              ) : (
                <span className="flex items-center gap-1 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[12px] font-bold border border-emerald-100 shadow-sm cursor-not-allowed">
                  ✓ Approved & Posted
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden print-container">
            {/* Sheet Title */}
            <div className="flex flex-row justify-between items-center p-6 md:p-6 pb-6 border-b border-gray-100 w-full">
              <h2 className="font-bold text-[15px] text-gray-800 font-poppins">
                Payroll posting sheet for {sheet.name} |{' '}
                <span className={isApproved ? 'text-emerald-500' : 'text-amber-500'}>
                  {isApproved ? 'Approved' : 'Not Approve'}
                </span>
              </h2>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-poppins">
                Journal Entry Preview
              </span>
            </div>

            {/* Posting Ledger Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[#94a3b8] font-bold uppercase tracking-widest text-[10px]">
                    <th className="py-3 pl-6 md:pl-6 pr-4 w-7/12">Description</th>
                    <th className="py-3 px-4 text-right w-2.5/12">Debit ({currencySymbol})</th>
                    <th className="py-3 pl-4 pr-6 md:pr-8 text-right w-2.5/12">Credit ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Category 1: EARNINGS & GROSS */}
                  <tr className="font-bold text-[10px] text-[#1E3A5F] uppercase tracking-widest bg-slate-50 border-y border-gray-100/50">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4" colSpan={3}>
                      Earnings & Gross
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">Gross Salary</div>
                      <div className="text-[11px] text-gray-400">Total base pay before any deductions</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-800 text-[14px]">
                      {debitTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right text-gray-305 font-medium">-</td>
                  </tr>

                  {/* Category 2: DEDUCTIONS & LIABILITIES */}
                  <tr className="font-bold text-[10px] text-[#1E3A5F] uppercase tracking-widest bg-slate-50 border-y border-gray-100/50">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4" colSpan={3}>
                      Deductions & Liabilities
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">Net Salary Payable</div>
                      <div className="text-[11px] text-gray-400">Total amount to be paid to employees</div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-305 font-medium">-</td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right font-bold text-rose-500 text-[14px]">
                      {summary.net_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">Staff Loans Recovery</div>
                      <div className="text-[11px] text-gray-400">Installment payments for active employee loans</div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-305 font-medium">-</td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right font-semibold text-gray-800">
                      {summary.loans.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">Salary Advance Adjustment</div>
                      <div className="text-[11px] text-gray-400">Reversal of mid-month advances</div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-305 font-medium">-</td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right font-semibold text-gray-800">
                      {summary.salary_advance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">State Income Tax (PAYE)</div>
                      <div className="text-[11px] text-gray-400">Statutory tax withholdings</div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-350 font-medium">-</td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right font-semibold text-gray-800">
                      {summary.state_income_tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Category 3: STATUTORY CONTRIBUTIONS */}
                  <tr className="font-bold text-[10px] text-[#1E3A5F] uppercase tracking-widest bg-slate-50 border-y border-gray-100/50">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4" colSpan={3}>
                      Statutory Contributions
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">Employee 5% NPF Contribution</div>
                      <div className="text-[11px] text-gray-400">Deducted from employee pay</div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-350 font-medium">-</td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right font-semibold text-gray-800">
                      {summary.employee_npf_contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">Employer 10% NPF Contribution</div>
                      <div className="text-[11px] text-gray-400">Company portion liability</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-800">
                      {summary.employer_npf_contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right font-semibold text-gray-800">
                      {summary.employer_npf_contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-2.5 pl-6 md:pl-6 pr-4">
                      <div className="font-semibold text-gray-800">IICF Contribution</div>
                      <div className="text-[11px] text-gray-400">Industrial Insurance Fund</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-800">
                      {summary.icf_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-4 pr-6 md:pr-8 text-right font-semibold text-gray-800">
                      {summary.icf_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Grand Totals */}
                  <tr className="bg-[#1E3A5F] text-white font-bold text-[14px]">
                    <td className="py-3.5 pl-6 md:pl-6 pr-4">TOTAL POSTING VALUE</td>
                    <td className="py-3.5 px-4 text-right">
                      {currencySymbol} {debitTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 md:pr-8 text-right">
                      {currencySymbol} {creditTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Account Mapping Allocation Pop-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[15px] text-slate-800 font-poppins">Approve & Post Payroll</h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Assign accounts for ledger vouchers mapping</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-slate-600 text-[18px] font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitApproval}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Net Salary Cash/Bank Option */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                    <span>Net Salary Payment Account <span className="text-red-500">*</span></span>
                    <span className="text-[11px] font-bold text-rose-500">
                      {currencySymbol} {summary.net_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </label>
                  <Select2
                    options={payment_natures}
                    value={netSalaryAccount}
                    onChange={(val) => setNetSalaryAccount(val as string)}
                    placeholder="Select Bank / Cash Account"
                    size="md"
                    rounded="lg"
                  />
                </div>

                {/* State Income Tax Option */}
                {summary.state_income_tax > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                      <span>State Income Tax (PAYE) Bank Account <span className="text-red-500">*</span></span>
                      <span className="text-[11px] font-bold text-gray-800">
                        {currencySymbol} {summary.state_income_tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                    <Select2
                      options={bank_payment_natures}
                      value={taxAccount}
                      onChange={(val) => setTaxAccount(val as string)}
                      placeholder="Select Bank Account"
                      size="md"
                      rounded="lg"
                    />
                  </div>
                )}

                {/* NPF Contribution Option */}
                {summary.total_npf_contribution > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                      <span>Provident Fund (NPF) Bank Account <span className="text-red-500">*</span></span>
                      <span className="text-[11px] font-bold text-gray-800">
                        {currencySymbol} {summary.total_npf_contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                    <Select2
                      options={bank_payment_natures}
                      value={npfAccount}
                      onChange={(val) => setNpfAccount(val as string)}
                      placeholder="Select Bank Account"
                      size="md"
                      rounded="lg"
                    />
                  </div>
                )}

                {/* ICF Contribution Option */}
                {summary.icf_amount > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                      <span>IICF Liability Bank Account <span className="text-red-500">*</span></span>
                      <span className="text-[11px] font-bold text-gray-800">
                        {currencySymbol} {summary.icf_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                    <Select2
                      options={bank_payment_natures}
                      value={icfAccount}
                      onChange={(val) => setIcfAccount(val as string)}
                      placeholder="Select Bank Account"
                      size="md"
                      rounded="lg"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-[12px] font-semibold text-slate-500 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  {isApproving ? 'Posting...' : '✓ Post & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
