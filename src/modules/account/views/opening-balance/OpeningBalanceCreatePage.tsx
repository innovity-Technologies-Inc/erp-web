import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, X, Check, Loader2 } from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { 
  useFinancialYearsSelect2, 
  useAccountsSelect2, 
  useStoreOpeningBalance 
} from '../../hooks/useOpeningBalance'
import { openingBalanceApi } from '../../api/opening-balance.api'

interface ActiveRow {
  key: string // unique key for React rendering
  account_id: string
  sub_type_id: string
  is_sub_type: number
  debit: string
  credit: string
  subTypeOptions: { value: string | number; label: string }[]
  isSubTypeLoading: boolean
}

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

export const OpeningBalanceCreatePage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()

  // React Query Hooks
  const { data: financialYears = [], isLoading: isFyLoading } = useFinancialYearsSelect2()
  const { data: accounts = [], isLoading: isAccountsLoading } = useAccountsSelect2()
  const { mutate: storeOpeningBalance, isPending: isSaving } = useStoreOpeningBalance()

  // Form States
  const [financialYearId, setFinancialYearId] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [activeRows, setActiveRows] = useState<ActiveRow[]>([
    {
      key: Math.random().toString(),
      account_id: '',
      sub_type_id: '',
      is_sub_type: 1,
      debit: '0.00',
      credit: '0.00',
      subTypeOptions: [],
      isSubTypeLoading: false
    }
  ])

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)

  // Check if form is dirty (for discard protection)
  const isDirty = useMemo(() => {
    if (financialYearId) return true
    if (date !== new Date().toISOString().split('T')[0]) return true
    if (activeRows.length > 1) return true
    const firstRow = activeRows[0]
    if (firstRow.account_id || firstRow.sub_type_id || parseFloat(firstRow.debit) > 0 || parseFloat(firstRow.credit) > 0) return true
    return false
  }, [financialYearId, date, activeRows])

  // Handle Back / Exit
  const handleBack = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true)
    } else {
      navigate({ to: '/account/opening-balance' })
    }
  }

  // Row Management
  const handleAddRow = () => {
    setActiveRows(prev => [
      ...prev,
      {
        key: Math.random().toString(),
        account_id: '',
        sub_type_id: '',
        is_sub_type: 1,
        debit: '0.00',
        credit: '0.00',
        subTypeOptions: [],
        isSubTypeLoading: false
      }
    ])
  }

  const handleRemoveRow = (index: number) => {
    if (activeRows.length > 1) {
      setActiveRows(prev => prev.filter((_, i) => i !== index))
    } else {
      showNotificationModal('Warning', 'You must keep at least one active row.', 'error')
    }
  }

  // Handle Account Selection (fetches sub-types dynamically)
  const handleAccountChange = async (index: number, accountId: string) => {
    const updatedRows = [...activeRows]
    const row = updatedRows[index]
    row.account_id = accountId
    row.sub_type_id = ''
    row.subTypeOptions = []
    
    if (!accountId) {
      setActiveRows(updatedRows)
      return
    }

    row.isSubTypeLoading = true
    setActiveRows(updatedRows)

    try {
      // 1. Fetch sub-type flag
      const flagRes = await openingBalanceApi.getSubTypeFlag(accountId)
      const isSubTypeFlag = flagRes.subType // e.g. 1 or other

      // 2. Fetch sub-type dropdown options HTML
      const htmlRes = await openingBalanceApi.getSubTypesHtml(accountId)
      const options = parseSubTypesHtml(htmlRes)

      setActiveRows(prev => {
        const next = [...prev]
        if (next[index]) {
          next[index].is_sub_type = isSubTypeFlag
          next[index].subTypeOptions = options
          next[index].isSubTypeLoading = false
        }
        return next
      })
    } catch (error) {
      console.error('Failed to load sub-types:', error)
      setActiveRows(prev => {
        const next = [...prev]
        if (next[index]) {
          next[index].isSubTypeLoading = false
        }
        return next
      })
    }
  }

  const handleRowValueChange = (index: number, field: 'sub_type_id' | 'debit' | 'credit', value: string) => {
    setActiveRows(prev => {
      const next = [...prev]
      if (next[index]) {
        if (field === 'debit' || field === 'credit') {
          // Allow numeric entry
          next[index][field] = value
        } else {
          next[index][field] = value
        }
      }
      return next
    })
  }

  // Calculations
  const totals = useMemo(() => {
    let totalDebit = 0
    let totalCredit = 0
    activeRows.forEach(row => {
      totalDebit += parseFloat(row.debit) || 0
      totalCredit += parseFloat(row.credit) || 0
    })
    return {
      debit: totalDebit.toFixed(2),
      credit: totalCredit.toFixed(2)
    }
  }, [activeRows])

  // Form Submission Validation
  const handleSave = () => {
    const newErrors: Record<string, string> = {}
    if (!financialYearId) newErrors.financialYearId = 'Financial Year is required.'
    if (!date) newErrors.date = 'Date is required.'

    let hasValidItems = false
    activeRows.forEach((row, idx) => {
      if (row.account_id) {
        hasValidItems = true
        // If it requires a sub-type, check if selected
        if (row.subTypeOptions.length > 0 && !row.sub_type_id) {
          newErrors[`row_${idx}_sub_type`] = 'Sub Type is required for this account.'
        }
      }
    })

    if (!hasValidItems) {
      newErrors.items = 'Please select at least one Account Name.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to first error
      setTimeout(() => {
        const errorEl = document.querySelector('.text-rose-500, .border-rose-500')
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }

    // Build payload
    const itemsPayload = activeRows
      .filter(row => row.account_id)
      .map(row => ({
        account_id: row.account_id,
        is_sub_type: row.is_sub_type,
        sub_type_id: row.sub_type_id || null,
        debit: parseFloat(row.debit) || 0,
        credit: parseFloat(row.credit) || 0
      }))

    storeOpeningBalance({
      financial_year_id: financialYearId,
      date,
      items: itemsPayload
    }, {
      onSuccess: () => {
        navigate({ to: '/account/opening-balance' })
      }
    })
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
            Create Opening Balance
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

        {/* ── Items Grid Table ── */}
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
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[35%] font-poppins">
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
                  <th className="px-4 py-3 text-center text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[5%] font-poppins">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((row, index) => (
                  <tr key={row.key} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                    {/* Account Name Dropdown */}
                    <td className="p-3">
                      <Select2
                        options={accounts}
                        value={row.account_id}
                        onChange={(val) => {
                          handleAccountChange(index, val || '')
                          setErrors(prev => ({ ...prev, items: '' }))
                        }}
                        placeholder="Select Account"
                        isLoading={isAccountsLoading}
                      />
                    </td>

                    {/* Sub Type Dropdown */}
                    <td className="p-3">
                      <div className="relative">
                        <Select2
                          options={row.subTypeOptions}
                          value={row.sub_type_id}
                          onChange={(val) => handleRowValueChange(index, 'sub_type_id', val || '')}
                          placeholder="Select Sub Type"
                          isDisabled={row.subTypeOptions.length === 0 || row.isSubTypeLoading}
                          error={errors[`row_${index}_sub_type`]}
                        />
                        {row.isSubTypeLoading && (
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
                        value={row.debit}
                        onChange={(e) => handleRowValueChange(index, 'debit', e.target.value)}
                        placeholder="0.00"
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-right outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins"
                      />
                    </td>

                    {/* Credit Input */}
                    <td className="p-3">
                      <input
                        type="number"
                        value={row.credit}
                        onChange={(e) => handleRowValueChange(index, 'credit', e.target.value)}
                        placeholder="0.00"
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-right outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins"
                      />
                    </td>

                    {/* Delete Button */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-sm shadow-rose-500/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* ── Dummy/Add Row Row ── */}
                <tr>
                  <td className="p-3 opacity-40">
                    <div className="h-[38px] px-3 bg-white text-[13px] flex items-center text-[#475569] font-medium select-none font-poppins">
                      Select
                    </div>
                  </td>
                  <td className="p-3 opacity-40">
                    <div className="h-[38px] px-3 bg-white text-[13px] flex items-center text-[#475569] font-medium select-none font-poppins">
                      Select
                    </div>
                  </td>
                  <td className="p-3 opacity-40">
                    <div className="h-[38px] px-3 bg-white text-[13px] flex items-center justify-end text-[#475569] font-medium select-none font-poppins">
                      0.00
                    </div>
                  </td>
                  <td className="p-3 opacity-40">
                    <div className="h-[38px] px-3 bg-white text-[13px] flex items-center justify-end text-[#475569] font-medium select-none font-poppins">
                      0.00
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all shadow-sm"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {errors.items && (
            <div className="p-4 bg-rose-50 border-t border-rose-100">
              <span className="text-rose-500 text-sm font-medium">{errors.items}</span>
            </div>
          )}

          {/* ── Totals Row ── */}
          <div className="flex justify-end items-center gap-4 p-4 border-t border-gray-100 bg-gray-50/30">
            <span className="text-[13px] font-bold text-[#1e293b] font-poppins">Total:</span>
            <div className="w-[15%]">
              <input
                type="text"
                readOnly
                value={totals.debit}
                className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-right font-bold text-[#1e293b] outline-none font-poppins"
              />
            </div>
            <div className="w-[15%] mr-[5%]">
              <input
                type="text"
                readOnly
                value={totals.credit}
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
            onClick={handleSave}
            disabled={isSaving}
            className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 text-[14px] font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Discard Changes Confirmation Modal ── */}
      <ConfirmationModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={() => {
          setIsDiscardConfirmOpen(false)
          navigate({ to: '/account/opening-balance' })
        }}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them? Any unsaved data will be lost."
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
