import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { LoadingState } from '@/components/Loading/LoadingState'
import { 
  useFinancialYearsSelect2, 
  useAccountsSelect2, 
  useOpeningBalanceDetails,
  useUpdateOpeningBalance 
} from '../../hooks/useOpeningBalance'
import { openingBalanceApi } from '../../api/opening-balance.api'

// Utility to parse HTML options string into a list of { value, label } options
const parseSubTypesHtml = (html: string) => {
  if (!html) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const options = doc.querySelectorAll('option')
  return Array.from(options)
    .map(opt => ({
      value: opt.getAttribute('value') || '',
      label: opt.textContent || ''
    }))
    .filter(opt => opt.value !== '')
}

export const OpeningBalanceEditPage = () => {
  const navigate = useNavigate()
  const { uuid } = useParams({ from: '/_authenticated/account/opening-balance/edit/$uuid' })

  // React Query Hooks
  const { data: financialYears = [], isLoading: isFyLoading } = useFinancialYearsSelect2()
  const { data: accounts = [], isLoading: isAccountsLoading } = useAccountsSelect2()
  const { data: record, isLoading: isRecordLoading } = useOpeningBalanceDetails(uuid)
  const { mutate: updateOpeningBalance, isPending: isSaving } = useUpdateOpeningBalance()

  // Form States
  const [financialYearId, setFinancialYearId] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [accountId, setAccountId] = useState<string>('')
  const [subTypeId, setSubTypeId] = useState<string>('')
  const [isSubTypeFlag, setIsSubTypeFlag] = useState<number>(1)
  const [debit, setDebit] = useState<string>('0.00')
  const [credit, setCredit] = useState<string>('0.00')

  // Sub Type dropdown options
  const [subTypeOptions, setSubTypeOptions] = useState<{ value: string | number; label: string }[]>([])
  const [isSubTypeLoading, setIsSubTypeLoading] = useState(false)

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate Form Fields from Loaded Record
  useEffect(() => {
    if (record) {
      setFinancialYearId(String(record.f_year))
      setDate(record.open_date)
      setAccountId(String(record.coaid))
      setSubTypeId(record.sub_code ? String(record.sub_code) : '')
      setIsSubTypeFlag(record.sub_type || 1)
      setDebit(String(record.debit || '0.00'))
      setCredit(String(record.credit || '0.00'))

      // Fetch sub-types for the loaded account
      if (record.coaid) {
        loadSubTypesForAccount(String(record.coaid), record.sub_code ? String(record.sub_code) : '')
      }
    }
  }, [record])

  // Helper to load and populate sub-types
  const loadSubTypesForAccount = async (accId: string, preselectedSubTypeId = '') => {
    setIsSubTypeLoading(true)
    try {
      const flagRes = await openingBalanceApi.getSubTypeFlag(accId)
      setIsSubTypeFlag(flagRes.subType)

      const htmlRes = await openingBalanceApi.getSubTypesHtml(accId)
      const options = parseSubTypesHtml(htmlRes)
      setSubTypeOptions(options)
      
      if (preselectedSubTypeId) {
        setSubTypeId(preselectedSubTypeId)
      }
    } catch (error) {
      console.error('Failed to load sub-types on edit:', error)
    } finally {
      setIsSubTypeLoading(false)
    }
  }

  // Handle Account Selection
  const handleAccountChange = async (accId: string) => {
    setAccountId(accId)
    setSubTypeId('')
    setSubTypeOptions([])
    
    if (!accId) return

    setIsSubTypeLoading(true)
    try {
      const flagRes = await openingBalanceApi.getSubTypeFlag(accId)
      setIsSubTypeFlag(flagRes.subType)

      const htmlRes = await openingBalanceApi.getSubTypesHtml(accId)
      const options = parseSubTypesHtml(htmlRes)
      setSubTypeOptions(options)
    } catch (error) {
      console.error('Failed to load sub-types on account change:', error)
    } finally {
      setIsSubTypeLoading(false)
    }
  }

  // Exit handler
  const handleBack = () => {
    navigate({ to: '/account/opening-balance' })
  }

  // Form Submission Validation & Update
  const handleUpdate = () => {
    const newErrors: Record<string, string> = {}
    if (!financialYearId) newErrors.financialYearId = 'Financial Year is required.'
    if (!date) newErrors.date = 'Date is required.'
    if (!accountId) newErrors.accountId = 'Account Name is required.'
    
    // If it requires a sub-type, check if selected
    if (subTypeOptions.length > 0 && !subTypeId) {
      newErrors.subTypeId = 'Sub Type is required for this account.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Build payload (update accepts an items array containing our single item, plus the uuid)
    const itemsPayload = [
      {
        account_id: accountId,
        is_sub_type: isSubTypeFlag,
        sub_type_id: subTypeId || null,
        debit: parseFloat(debit) || 0,
        credit: parseFloat(credit) || 0
      }
    ]

    updateOpeningBalance({
      uuid,
      financial_year_id: financialYearId,
      date,
      items: itemsPayload
    }, {
      onSuccess: () => {
        navigate({ to: '/account/opening-balance' })
      }
    })
  }

  // Loading state
  if (isRecordLoading) {
    return <LoadingState message="Loading opening balance details..." />
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* ── Page Header ── */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            Edit Opening Balance
          </h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* ── Opening Balance Header Card ── */}
        <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm space-y-6">
          {/* ── Voucher Header Title ── */}
          <div className="border-l-[3.5px] border-[#0052cc] pl-3 py-0.5">
            <h2 className="text-[16px] font-bold text-[#1e293b] font-poppins">
              Header
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                Financial Year <span className="text-rose-500">*</span>
              </label>
              <Select2
                options={financialYears}
                value={financialYearId}
                onChange={(val) => {
                  setFinancialYearId(val || '')
                  setErrors(prev => ({ ...prev, financialYearId: '' }))
                }}
                placeholder="Select Financial Year"
                error={errors.financialYearId}
                isLoading={isFyLoading}
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
                className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] ${
                  errors.date ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 font-poppins'
                }`}
              />
              {errors.date && <span className="text-rose-500 text-xs mt-1 block">{errors.date}</span>}
            </div>
          </div>
        </div>

        {/* ── Items Grid Table (Locked to Single Row) ── */}
        <div className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-sm p-4 space-y-6">
          {/* ── Transaction Entries Title ── */}
          <div className="border-l-[3.5px] border-[#0052cc] pl-3 py-0.5">
            <h2 className="text-[16px] font-bold text-[#1e293b] font-poppins">
              Transaction Entries
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#dae8ff]">
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[40%] font-poppins">
                    Account Name <span className="text-rose-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[30%] font-poppins">
                    Sub Type <span className="text-rose-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[15%] font-poppins">
                    Debit <span className="text-rose-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[15%] font-poppins">
                    Credit <span className="text-rose-500">*</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                  {/* Account Name Dropdown */}
                  <td className="p-3">
                    <Select2
                      options={accounts}
                      value={accountId}
                      onChange={(val) => {
                        handleAccountChange(val || '')
                        setErrors(prev => ({ ...prev, accountId: '' }))
                      }}
                      placeholder="Select Account"
                      error={errors.accountId}
                      isLoading={isAccountsLoading}
                    />
                  </td>

                  {/* Sub Type Dropdown */}
                  <td className="p-3">
                    <div className="relative">
                      <Select2
                        options={subTypeOptions}
                        value={subTypeId}
                        onChange={(val) => {
                          setSubTypeId(val || '')
                          setErrors(prev => ({ ...prev, subTypeId: '' }))
                        }}
                        placeholder="Select Sub Type"
                        isDisabled={subTypeOptions.length === 0 || isSubTypeLoading}
                        error={errors.subTypeId}
                      />
                      {isSubTypeLoading && (
                        <div className="absolute right-8 top-2.5">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Debit Input */}
                  <td className="p-3">
                    <input
                      type="number"
                      value={debit}
                      onChange={(e) => setDebit(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-right outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins"
                    />
                  </td>

                  {/* Credit Input */}
                  <td className="p-3">
                    <input
                      type="number"
                      value={credit}
                      onChange={(e) => setCredit(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-right outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Totals Row ── */}
          <div className="flex justify-end items-center gap-4 p-4 border-t border-gray-100 bg-gray-50/30">
            <span className="text-[13px] font-bold text-[#1e293b] font-poppins">Total:</span>
            <div className="w-[15%]">
              <input
                type="text"
                readOnly
                value={(parseFloat(debit) || 0).toFixed(2)}
                className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-right font-bold text-[#1e293b] outline-none font-poppins"
              />
            </div>
            <div className="w-[15%]">
              <input
                type="text"
                readOnly
                value={(parseFloat(credit) || 0).toFixed(2)}
                className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-right font-bold text-[#1e293b] outline-none font-poppins"
              />
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleBack}
            className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[14px] shadow-sm font-poppins"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isSaving}
            className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 text-[14px] font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
