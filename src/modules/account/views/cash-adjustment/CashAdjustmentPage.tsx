import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { useUiStore } from '@/store/useUiStore'
import { PageTitleDropdown } from '@/components/Dropdown/PageTitleDropdown'
import { clsx } from 'clsx'
import { useQueryClient } from '@tanstack/react-query'
import { useNextVoucherNo, useStoreCashAdjustment } from '../../hooks/useCashAdjustment'

export const CashAdjustmentPage = () => {
  const notify = useUiStore((state) => state.notify)
  const queryClient = useQueryClient()

  // Fetch Next Voucher Code
  const { data: voucherData, isLoading: isVoucherLoading } = useNextVoucherNo()

  // Form States
  const [voucherNo, setVoucherNo] = useState<string>('')
  const [adjustmentType, setAdjustmentType] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [remark, setRemark] = useState<string>('')
  const [amount, setAmount] = useState<string>('')

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mutation
  const { mutate: storeAdjustment, isPending: isSaving } = useStoreCashAdjustment()

  // Update voucherNo state when API returns data
  useEffect(() => {
    if (voucherData?.voucher_no) {
      setVoucherNo(voucherData.voucher_no)
    }
  }, [voucherData])

  const adjustmentTypeOptions = [
    { value: 'debit', label: 'Debit' },
    { value: 'credit', label: 'Credit' }
  ]

  const handleReset = () => {
    setAdjustmentType('')
    setDate(new Date().toISOString().split('T')[0])
    setRemark('')
    setAmount('')
    setErrors({})
    queryClient.invalidateQueries({ queryKey: ['cash-adjustment', 'next-voucher-no'] })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!voucherNo) newErrors.voucherNo = 'Voucher number is required'
    if (!adjustmentType) newErrors.adjustmentType = 'Adjustment type is required'
    if (!date) newErrors.date = 'Date is required'
    if (!remark.trim()) newErrors.remark = 'Remark is required'

    const parsedAmount = parseFloat(amount) || 0
    if (parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      notify('Please complete all required fields correctly.', 'error')
      return
    }

    const payload = {
      voucher_no: voucherNo,
      adjustment_type: adjustmentType,
      date,
      remark,
      items: [
        {
          code: '1020101',
          amount: amount
        }
      ]
    }

    storeAdjustment(payload, {
      onSuccess: (res: any) => {
        if (res.status) {
          notify('Cash Adjustment successfully done!', 'success')
          handleReset()
        } else {
          notify(res.message || 'Saved successfully', 'success')
          handleReset()
        }
      }
    })
  }

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
            title="Cash Adjustment"
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

      {/* ── Main Layout Form ── */}
      <div className="space-y-6">
        
        {/* Card 1: Adjustment Header */}
        <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm space-y-6">
          <div className="border-l-[3.5px] border-primary pl-3 py-0.5 text-[15px] font-bold text-slate-800">
            Adjustment Header
          </div>

          <div className="space-y-5">
            {/* Top row: Voucher No, Adjustment Type, Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Voucher No
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={voucherNo}
                    readOnly
                    placeholder="Loading..."
                    className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-[#475569] font-medium outline-none font-poppins cursor-not-allowed"
                  />
                  {isVoucherLoading && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Adjustment Type <span className="text-rose-500">*</span>
                </label>
                <Select2
                  options={adjustmentTypeOptions}
                  value={adjustmentType}
                  onChange={(val) => {
                    setAdjustmentType(val)
                    setErrors(prev => ({ ...prev, adjustmentType: '' }))
                  }}
                  placeholder="Select Option"
                  error={errors.adjustmentType}
                />
              </div>

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
            </div>

            {/* Bottom row: Remark */}
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
                placeholder="Remarks"
                className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins ${
                  errors.remark ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                }`}
              />
              {errors.remark && <span className="text-rose-500 text-xs mt-1 block">{errors.remark}</span>}
            </div>
          </div>
        </div>

        {/* Card 2: Adjustment Details */}
        <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm space-y-6">
          <div className="border-l-[3.5px] border-primary pl-3 py-0.5 text-[15px] font-bold text-slate-800">
            Adjustment Details
          </div>

          <div className="space-y-4">
            {/* Header row matching mockup design */}
            <div className="bg-blue-50/60 border border-blue-100/50 rounded-lg py-2.5 px-4 grid grid-cols-2 gap-6 text-[13px] font-bold text-[#1e3a8a] font-poppins">
              <div>Code <span className="text-rose-500">*</span></div>
              <div>Amount <span className="text-rose-500">*</span></div>
            </div>

            {/* Inputs row */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <input
                  type="text"
                  value="1020101"
                  readOnly
                  className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-[#475569] font-medium font-poppins cursor-not-allowed"
                />
              </div>

              <div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setErrors(prev => ({ ...prev, amount: '' }))
                  }}
                  placeholder="0.00"
                  className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] text-right outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-semibold text-[#475569] font-poppins ${
                    errors.amount ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                  }`}
                />
                {errors.amount && <span className="text-rose-500 text-xs mt-1 block text-right">{errors.amount}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleReset}
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
  )
}
