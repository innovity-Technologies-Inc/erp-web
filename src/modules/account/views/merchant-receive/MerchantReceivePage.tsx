import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Loader2, Printer, FileText } from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { useUiStore } from '@/store/useUiStore'
import { Modal } from '@/components/Modal/Modal'
import { PageTitleDropdown } from '@/components/Dropdown/PageTitleDropdown'
import { clsx } from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { useSettings } from '@/hooks/useSettings'
import { 
  usePaymentMethodsSelect2, 
  useMerchantsSelect2,
  useMerchantVouchersSelect2, 
  useStoreMerchantReceive 
} from '../../hooks/useMerchantReceive'

export const MerchantReceivePage = () => {
  const navigate = useNavigate()
  const notify = useUiStore((state) => state.notify)
  const queryClient = useQueryClient()
  const { currency, companyInformation, webSetting } = useSettings()

  // Fetch select options
  const { data: rawPaymentMethods = [], isLoading: isMethodsLoading } = usePaymentMethodsSelect2()
  const { data: rawMerchants = [], isLoading: isMerchantsLoading } = useMerchantsSelect2()

  // Form States
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [remark, setRemark] = useState<string>('')
  
  // Input/Field States
  const [merchantId, setMerchantId] = useState<string>('')
  const [voucherId, setVoucherId] = useState<string>('')
  const [dueAmount, setDueAmount] = useState<number>(0)
  const [amount, setAmount] = useState<string>('')

  // Payment Info States
  const [paymentTypeId, setPaymentTypeId] = useState<string>('')
  const [paymentAmount, setPaymentAmount] = useState<string>('0')

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch Vouchers dynamically when a Merchant is selected
  const { data: rawVouchers = [], isLoading: isVouchersLoading } = useMerchantVouchersSelect2(
    merchantId ? Number(merchantId) : null
  )

  // Print Dialog States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [savedVoucherData, setSavedVoucherData] = useState<any>(null)

  // Mutation
  const { mutate: storeReceive, isPending: isSaving } = useStoreMerchantReceive()

  // Map raw API responses safely to Select2 options format
  const paymentMethodOptions = useMemo(() => 
    (rawPaymentMethods || []).map((m: any) => ({ value: String(m.id), label: m.text })),
    [rawPaymentMethods]
  )

  const merchantOptions = useMemo(() => 
    (rawMerchants || []).map((v: any) => ({ value: String(v.id), label: v.text })),
    [rawMerchants]
  )

  const voucherOptions = useMemo(() => 
    (rawVouchers || []).map((v: any) => ({ value: String(v.id), label: v.text, due_amount: v.due_amount })),
    [rawVouchers]
  )

  // Selected Voucher Text helper for Financial Audit Card
  const selectedVoucherText = useMemo(() => {
    const selected = voucherOptions.find(v => String(v.value) === voucherId)
    return selected ? selected.label : ''
  }, [voucherId, voucherOptions])

  // Automatically update the bottom payment amount field whenever the row amount changes
  useEffect(() => {
    setPaymentAmount(amount || '')
  }, [amount])

  // Clear voucher selections if merchant changes
  const handleMerchantChange = (val: string) => {
    setMerchantId(val)
    setVoucherId('')
    setDueAmount(0)
    setAmount('')
    setErrors(prev => ({ ...prev, merchantId: '' }))
  }

  // Handle voucher selection, extract due amount, and pre-fill payment amount
  const handleVoucherChange = (val: string) => {
    setVoucherId(val)
    setErrors(prev => ({ ...prev, voucherId: '' }))
    const selectedVoucher = voucherOptions.find(v => String(v.value) === val)
    if (selectedVoucher) {
      const due = selectedVoucher.due_amount ?? 0
      setDueAmount(due)
      setAmount(String(due)) // Pre-fill amount field with full due amount
    } else {
      setDueAmount(0)
      setAmount('')
    }
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!date) newErrors.date = 'Date is required'
    if (!remark.trim()) newErrors.remark = 'Remark is required'
    if (!merchantId) newErrors.merchantId = 'Merchant Name is required'
    if (!voucherId) newErrors.voucherId = 'Voucher Number is required'
    
    const parsedAmount = parseFloat(amount) || 0
    if (parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    } else if (parsedAmount > dueAmount) {
      newErrors.amount = `Amount cannot exceed the due amount (${dueAmount.toFixed(2)})`
    }

    if (!paymentTypeId) newErrors.paymentTypeId = 'Payment Type is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      notify('Please complete all required fields correctly.', 'error')
      return
    }

    const payload = {
      date,
      remark,
      items: [
        {
          merchant_id: merchantId,
          invoice_id: voucherId,
          amount: amount
        }
      ],
      payment_type_id: paymentTypeId,
      payment_amount: paymentAmount
    }

    storeReceive(payload, {
      onSuccess: (res: any) => {
        if (res.status) {
          // Invalidate Queries to clear cache and refresh due amount data instantly
          queryClient.invalidateQueries({ queryKey: ['select2', 'merchant-vouchers'] })
          queryClient.invalidateQueries({ queryKey: ['merchants', 'select2'] })

          setSavedVoucherData(res.data)
          setIsPrintModalOpen(true)
        } else {
          notify(res.message || 'Saved successfully', 'success')
          handleReset()
        }
      }
    })
  }

  const handleReset = () => {
    setDate(new Date().toISOString().split('T')[0])
    setRemark('')
    setMerchantId('')
    setVoucherId('')
    setDueAmount(0)
    setAmount('')
    setPaymentTypeId('')
    setPaymentAmount('0')
    setErrors({})
  }

  const handlePrint = () => {
    window.print()
  }

  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false)
    setSavedVoucherData(null)
    handleReset()
  }

  // Calculate totals inside printable modal
  const calculatedTotals = useMemo(() => {
    let debit = 0
    let credit = 0
    if (savedVoucherData?.items) {
      savedVoucherData.items.forEach((item: any) => {
        debit += parseFloat(item.debit) || 0
        credit += parseFloat(item.credit) || 0
      })
    }
    return { debit, credit }
  }, [savedVoucherData])

  const navOptions = [
    { name: 'Chart of Accounts', to: '/account/chart-of-accounts' },
    { name: 'Account Sub Type', to: '/account/sub-type' },
    { name: 'Sub Account Manage', to: '/account/sub-account' },
    { name: 'Predefined Accounts', to: '/account/predefined-accounts' },
    { name: 'Financial Year Manage', to: '/account/financial-year' },
    { name: 'Opening Balance', to: '/account/opening-balance' },
    { name: 'Debit Voucher', to: '/account/voucher/debit' },
    { name: 'Credit Voucher', to: '/account/voucher/credit' },
    { name: 'Contra Voucher', to: '/account/voucher/contra' },
    { name: 'Journal Voucher', to: '/account/voucher/journal' },
    { name: 'Bank Reconciliation', to: '/account/bank-reconciliation' },
    { name: 'Payment Method', to: '/account/payment-method' },
    { name: 'Vendor Payment', to: '/account/vendor-payment' },
    { name: 'Merchant Receive', to: '/account/merchant-receive' },
    { name: 'Service Payment', to: '/account/service-payment' },
    { name: 'Cash Adjustment', to: '/account/cash-adjustment' },
    { name: 'Voucher Approval', to: '/account/voucher-approval' },
  ]

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts', active: true },
    { name: 'Report', to: '/account/reports', active: false },
    { name: 'EIN', to: '/account/ein', active: false },
  ]

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/account/chart-of-accounts"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          
          <PageTitleDropdown 
            title="Merchant Receive"
            options={navOptions}
          />
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-3">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.to}
              className={clsx(
                'px-2 py-2 text-[10px] font-medium rounded-lg transition-all duration-200 shadow-sm border',
                tab.active
                  ? 'bg-[#3b82f6] text-white border-blue-500 shadow-blue-500/20'
                  : 'bg-white text-gray-500 border border-gray-50 hover:bg-gray-50'
              )}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Layout Grid Split (9 / 3) ── */}
      <div className="grid grid-cols-12 gap-6 mt-6 print:hidden">
        
        {/* Left Column (spans 9 cols on desktop) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          
          {/* Card 1: Transaction Details */}
          <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm space-y-6">
            <div className="border-l-[3.5px] border-primary pl-3 py-0.5 text-[15px] font-bold text-slate-800">
              Transaction Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Column 1 */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value)
                      setErrors(prev => ({ ...prev, date: '' }))
                    }}
                    className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins ${
                      errors.date ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                    }`}
                  />
                  {errors.date && <span className="text-rose-500 text-xs mt-1 block">{errors.date}</span>}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                    Voucher Number <span className="text-rose-500">*</span>
                  </label>
                  <Select2
                    options={voucherOptions}
                    value={voucherId}
                    onChange={handleVoucherChange}
                    placeholder="Select Voucher"
                    error={errors.voucherId}
                    isDisabled={!merchantId}
                    isLoading={isVouchersLoading}
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                    Merchant Name <span className="text-rose-500">*</span>
                  </label>
                  <Select2
                    options={merchantOptions}
                    value={merchantId}
                    onChange={handleMerchantChange}
                    placeholder="Select Merchant"
                    error={errors.merchantId}
                    isLoading={isMerchantsLoading}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                    Remark <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={remark}
                    onChange={(e) => {
                      setRemark(e.target.value)
                      setErrors(prev => ({ ...prev, remark: '' }))
                    }}
                    placeholder="Add Remarks"
                    className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins ${
                      errors.remark ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                    }`}
                  />
                  {errors.remark && <span className="text-rose-500 text-xs mt-1 block">{errors.remark}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Settlement Method */}
          <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm space-y-6">
            <div className="border-l-[3.5px] border-primary pl-3 py-0.5 text-[15px] font-bold text-slate-800">
              Settlement Method
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Payment Type <span className="text-rose-500">*</span>
                </label>
                <Select2
                  options={paymentMethodOptions}
                  value={paymentTypeId}
                  onChange={(val) => {
                    setPaymentTypeId(val)
                    setErrors(prev => ({ ...prev, paymentTypeId: '' }))
                  }}
                  placeholder="Select Payment Type"
                  error={errors.paymentTypeId}
                  isLoading={isMethodsLoading}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Payment Amount <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setErrors(prev => ({ ...prev, amount: '' }))
                  }}
                  placeholder="0.00"
                  disabled={!voucherId}
                  className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-semibold text-[#475569] font-poppins ${
                    errors.amount ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                  }`}
                />
                {errors.amount && <span className="text-rose-500 text-xs mt-1 block">{errors.amount}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (spans 3 cols on desktop) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col justify-between min-h-[300px]">
          
          {/* Status Box */}
          {!voucherId ? (
            /* No data loaded state */
            <div className="border-2 border-dashed border-[#475569]/30 bg-[#113671]/14 rounded-xl p-10 flex flex-col items-center justify-center text-center h-[280px]">
              <h3 className="text-[#0f2d4a] font-bold text-[18px] mb-4 font-poppins">
                No data found!
              </h3>
              <p className="text-[#0f2d4a]/80 text-[14px] italic font-poppins px-2 leading-relaxed">
                "Select merchant name and voucher number."
              </p>
            </div>
          ) : (
            /* Data loaded state */
            <div className="bg-[#003671] text-white rounded-xl p-6 flex flex-col justify-between h-[280px] shadow-sm">
              <div>
                <h3 className="text-[16px] font-bold tracking-tight mb-6 font-poppins">
                  Financial Audit
                </h3>
                
                <div className="space-y-1">
                  <div className="text-blue-200/50 uppercase tracking-wider text-[15px] font-bold font-poppins">
                    DUE AMOUNT
                  </div>
                  <div className="text-[35px] font-bold text-white tracking-tight flex items-baseline gap-1 font-poppins">
                    <span>${dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="border-t border-white/10 my-3" />
                <div className="text-blue-200/50 uppercase tracking-wider text-[15px] font-bold mb-2 font-poppins">
                  CURRENT VOUCHER
                </div>
                <div className="flex items-center gap-2 text-white font-medium text-[15px] font-poppins">
                  <FileText className="h-4 w-4 text-blue-300" />
                  <span>{selectedVoucherText}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => navigate({ to: '/account/chart-of-accounts' })}
              className="px-6 h-[38px] bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all text-[13px] shadow-sm font-poppins cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 h-[38px] text-white font-semibold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 bg-[#0d7a50] hover:bg-[#0a6642] disabled:opacity-50 text-[13px] font-poppins cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Details / Print Modal ── */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={handleClosePrintModal}
        title="Print Voucher Details"
        size="lg"
        showCloseButton={false}
      >
        <div className="p-2 print:p-0 font-poppins">
          {/* Header Action Buttons inside Modal */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6 print:hidden">
            <span className="text-[13px] text-gray-400 font-medium">Voucher created successfully.</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-poppins text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Voucher
              </button>
              <button
                type="button"
                onClick={handleClosePrintModal}
                className="px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-poppins text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {savedVoucherData && (
            /* Voucher Card Container */
            <div id="print-area" className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
              
              {/* Header Section */}
              <div className="flex justify-between items-center pb-6 border-b border-gray-100 mb-6">
                {/* Logo and Type */}
                <div className="flex items-center gap-4">
                  {webSetting?.logo_url || companyInformation?.logo_url ? (
                    <img 
                      src={webSetting?.logo_url || companyInformation?.logo_url || undefined} 
                      alt="Logo" 
                      className="h-10 w-auto object-contain max-w-[150px]" 
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md font-poppins shadow-blue-500/20">
                      G
                    </div>
                  )}
                  <div className="border-l border-gray-200 pl-4">
                    <h3 className="text-lg font-extrabold text-[#003671] tracking-wide leading-none uppercase">
                      {webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH'}
                    </h3>
                    <span className="text-xs font-bold text-gray-400 tracking-wider mt-1.5 block uppercase">
                      Merchant Receive
                    </span>
                  </div>
                </div>

                {/* Voucher Meta Info */}
                <div className="text-right font-poppins text-[13px] text-gray-500">
                  <div className="grid grid-cols-[100px_10px_auto] text-left gap-y-1">
                    <span className="font-semibold text-gray-500">Voucher No</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-[#1e293b] font-bold">{savedVoucherData.v_no}</span>

                    <span className="font-semibold text-gray-500">Date</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-[#1e293b] font-bold">{savedVoucherData.v_date}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-150 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-gray-150">
                      <th className="px-5 py-3 text-left font-bold text-gray-500 text-xs tracking-wider uppercase">Particulars</th>
                      <th className="px-5 py-3 text-right font-bold text-gray-500 text-xs tracking-wider uppercase w-[20%]">Debit ({currency || 'BDT'})</th>
                      <th className="px-5 py-3 text-right font-bold text-gray-500 text-xs tracking-wider uppercase w-[20%]">Credit ({currency || 'BDT'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {savedVoucherData.items?.map((item: any) => {
                      const dbVal = parseFloat(item.debit) || 0
                      const crVal = parseFloat(item.credit) || 0

                      // Fetch/Fallback head name (Customer Receive double-entry: Dr. Cash/Bank, Cr. Accounts Receivable)
                      let particulars = item.acc_coa?.head_name
                      if (!particulars) {
                        if (dbVal > 0) {
                          particulars = paymentMethodOptions.find(p => String(p.value) === paymentTypeId)?.label || 'Cash/Bank'
                        } else {
                          particulars = `Accounts Receivable - ${merchantOptions.find(v => String(v.value) === merchantId)?.label || 'Merchant'}`
                        }
                      }

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-800 text-[13px]">
                              {particulars}
                              {item.sub_type !== 1 && item.acc_sub_code?.name && ` (${item.acc_sub_code.name})`}
                            </div>
                            {item.ledger_comment && (
                              <div className="text-[11px] text-gray-400 mt-1 font-medium italic">
                                "{item.ledger_comment}"
                              </div>
                            )}
                          </td>
                          <td className={`px-5 py-4 text-right font-semibold text-[13px] ${dbVal > 0 ? 'text-gray-900 font-bold' : 'text-gray-400/60 font-normal'}`}>
                            {dbVal.toFixed(2)}
                          </td>
                          <td className={`px-5 py-4 text-right font-semibold text-[13px] ${crVal > 0 ? 'text-gray-900 font-bold' : 'text-gray-400/60 font-normal'}`}>
                            {crVal.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Grand Total Row */}
                    <tr className="bg-[#f8fafc]/50 font-bold border-t border-gray-150">
                      <td className="px-5 py-3.5 text-center text-xs font-extrabold text-[#003671] tracking-wider uppercase">Grand Total</td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-extrabold text-[#003671]">
                        {calculatedTotals.debit.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-extrabold text-[#003671]">
                        {calculatedTotals.credit.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks Section */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Remarks</div>
                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] text-gray-700 font-medium italic">
                  "{savedVoucherData.narration || 'No narration provided'}"
                </div>
              </div>

              {/* Verification Trail */}
              <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                Verification Trail
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-4 gap-8 mt-12 pt-6 text-center text-[10px] font-bold text-gray-400 tracking-wider">
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Prepared By</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Checked By</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Authorised By</div>
                </div>
                <div>
                  <div className="border-t border-gray-200/80 pt-2 uppercase">Pay By</div>
                </div>
              </div>

            </div>
          )}
        </div>
      </Modal>

      {/* ── CSS Print Overrides (Aligned to DebitVoucherListPage) ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all page and layout elements by default */
          body * {
            visibility: hidden !important;
          }
          
          /* Only make print-area card and its child text/images visible */
          #print-area, #print-area * {
            visibility: visible !important;
          }
          
          /* Position print-area at absolute top-left of Page 1 */
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Collapse the height and layout space of all wrapper containers in the document flow */
          #root, .fixed.inset-0.z-50, .relative.w-full.bg-white.rounded-2xl, .flex-1.overflow-y-auto.px-6.py-4 {
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          
          /* Ensure child nodes inside print-area render with their natural height */
          #print-area, #print-area div, #print-area table, #print-area tr, #print-area td, #print-area span, #print-area img {
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
          }
          
          /* Hide print-hidden classes completely */
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Force colors and background colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

    </div>
  )
}
