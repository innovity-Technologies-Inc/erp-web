import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Info, Plus, X, Check, Loader2 } from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { LoadingState } from '@/components/Loading/LoadingState'
import { useUiStore } from '@/store/useUiStore'
import { 
  useCreditAccountHeadsSelect2, 
  useTransactionHeadsSelect2, 
  useDebitVoucherDetails,
  useUpdateDebitVoucher 
} from '../../hooks/useDebitVoucher'
import { debitVoucherApi } from '../../api/debit-voucher.api'

interface ActiveRow {
  key: string
  account_id: string
  sub_type_id: string
  is_sub_type: number | null
  ledger_comment: string
  amount: string
  subTypeOptions: { value: string | number; label: string }[]
  isSubTypeLoading: boolean
}

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

export const DebitVoucherEditPage = () => {
  const navigate = useNavigate()
  const { uuid } = useParams({ from: '/_authenticated/account/voucher/debit/edit/$uuid' })
  const { showNotificationModal } = useUiStore()

  // Queries & Mutations
  const { data: creditAccountHeads = [], isLoading: isCreditLoading } = useCreditAccountHeadsSelect2()
  const { data: transactionAccountHeads = [], isLoading: isTransactionLoading } = useTransactionHeadsSelect2()
  const { data: record, isLoading: isRecordLoading } = useDebitVoucherDetails(uuid)
  const { mutate: updateDebitVoucher, isPending: isSaving } = useUpdateDebitVoucher()

  // Form States
  const [creditAccountHead, setCreditAccountHead] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [remark, setRemark] = useState<string>('')
  const [checkNo, setCheckNo] = useState<string>('')
  const [checkDate, setCheckDate] = useState<string>('')
  const [isHonours, setIsHonours] = useState<boolean>(false)

  const [activeRows, setActiveRows] = useState<ActiveRow[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Determine if the selected credit head is a bank nature
  const showBankFields = useMemo(() => {
    const selected = creditAccountHeads.find(h => String(h.value) === creditAccountHead)
    return selected?.is_bank_nature === 1
  }, [creditAccountHead, creditAccountHeads])

  // Populate from record
  useEffect(() => {
    if (record && !isInitialized) {
      setDate(record.v_date || '')
      setRemark(record.narration || '')
      setCheckNo(record.cheque_no || '')
      setCheckDate(record.cheque_date || '')
      setIsHonours(record.is_honour === 1)

      // Find credit head (credit > 0)
      const creditItem = record.items?.find(item => parseFloat(item.credit) > 0)
      if (creditItem) {
        setCreditAccountHead(String(creditItem.coa_id))
      }

      // Find debit heads (debit > 0)
      const debitItems = record.items?.filter(item => parseFloat(item.debit) > 0) || []
      
      const mappedRows = debitItems.map(item => ({
        key: Math.random().toString(),
        account_id: String(item.coa_id),
        sub_type_id: item.sub_code ? String(item.sub_code) : '',
        is_sub_type: item.sub_type !== 1 ? item.sub_type : null,
        ledger_comment: item.ledger_comment || '',
        amount: String(parseFloat(item.debit) || ''),
        subTypeOptions: [],
        isSubTypeLoading: false
      }))

      if (mappedRows.length > 0) {
        setActiveRows(mappedRows)
        // Fetch sub-types for all mapped rows
        mappedRows.forEach((row, idx) => {
          if (row.account_id) {
            loadSubTypesForInitialRow(idx, row.account_id, row.sub_type_id)
          }
        })
      } else {
        setActiveRows([
          {
            key: Math.random().toString(),
            account_id: '',
            sub_type_id: '',
            is_sub_type: null,
            ledger_comment: '',
            amount: '',
            subTypeOptions: [],
            isSubTypeLoading: false
          }
        ])
      }

      setIsInitialized(true)
    }
  }, [record, isInitialized])

  // Load sub-types for initial rows
  const loadSubTypesForInitialRow = async (index: number, accountId: string, preselectedSubTypeId = '') => {
    try {
      const flagRes = await debitVoucherApi.getSubTypeFlag(accountId)
      const isSubTypeFlag = flagRes.subType 

      const htmlRes = await debitVoucherApi.getSubTypesHtml(accountId)
      const options = parseSubTypesHtml(htmlRes)

      setActiveRows(prev => {
        const next = [...prev]
        if (next[index]) {
          next[index].is_sub_type = isSubTypeFlag !== 1 ? isSubTypeFlag : null
          next[index].subTypeOptions = options
          next[index].sub_type_id = preselectedSubTypeId
        }
        return next
      })
    } catch (error) {
      console.error('Failed to load initial sub-types:', error)
    }
  }

  const handleCreditHeadChange = (value: string) => {
    setCreditAccountHead(value)
    setErrors(prev => ({ ...prev, creditAccountHead: '' }))
    
    const selected = creditAccountHeads.find(h => String(h.value) === value)
    if (selected?.is_bank_nature !== 1) {
      setCheckNo('')
      setCheckDate('')
      setIsHonours(false)
    }
  }

  const handleBack = () => {
    navigate({ to: '/account/voucher/debit' })
  }

  // Row Management
  const handleAddRow = () => {
    setActiveRows(prev => [
      ...prev,
      {
        key: Math.random().toString(),
        account_id: '',
        sub_type_id: '',
        is_sub_type: null,
        ledger_comment: '',
        amount: '',
        subTypeOptions: [],
        isSubTypeLoading: false
      }
    ])
  }

  const handleRemoveRow = (index: number) => {
    if (activeRows.length > 1) {
      setActiveRows(prev => prev.filter((_, i) => i !== index))
    } else {
      showNotificationModal('Warning', 'You must keep at least one item row.', 'error')
    }
  }

  // Fetch sub-types on account change
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
      const flagRes = await debitVoucherApi.getSubTypeFlag(accountId)
      const isSubTypeFlag = flagRes.subType 

      const htmlRes = await debitVoucherApi.getSubTypesHtml(accountId)
      const options = parseSubTypesHtml(htmlRes)

      setActiveRows(prev => {
        const next = [...prev]
        if (next[index]) {
          next[index].is_sub_type = isSubTypeFlag !== 1 ? isSubTypeFlag : null
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

  const handleRowValueChange = (index: number, field: 'sub_type_id' | 'ledger_comment' | 'amount', value: string) => {
    setActiveRows(prev => {
      const next = [...prev]
      if (next[index]) {
        next[index][field] = value
      }
      return next
    })
  }

  const grandTotal = useMemo(() => {
    return activeRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0).toFixed(2)
  }, [activeRows])

  // Validation & Save
  const handleUpdate = () => {
    const newErrors: Record<string, string> = {}
    if (!creditAccountHead) newErrors.creditAccountHead = 'Credit Account Head is required.'
    if (!date) newErrors.date = 'Date is required.'
    if (!remark) newErrors.remark = 'Remark is required.'

    let hasValidItems = false
    activeRows.forEach((row, idx) => {
      if (row.account_id) {
        const amount = parseFloat(row.amount) || 0
        if (amount <= 0) {
          newErrors[`row_${idx}_amount`] = 'Amount must be greater than 0.'
        } else {
          hasValidItems = true
        }

        if (row.subTypeOptions.length > 0 && !row.sub_type_id) {
          newErrors[`row_${idx}_sub_type`] = 'Sub Type is required.'
        }
      } else if (row.amount || row.ledger_comment) {
        newErrors[`row_${idx}_account`] = 'Account Name is required.'
      }
    })

    if (!hasValidItems && !newErrors.items) {
      newErrors.items = 'Please add at least one complete item with account and amount.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
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
      .filter(row => row.account_id && (parseFloat(row.amount) || 0) > 0)
      .map(row => ({
        account_id: row.account_id,
        is_sub_type: row.is_sub_type,
        sub_type_id: row.sub_type_id || null,
        ledger_comment: row.ledger_comment || null,
        amount: parseFloat(row.amount) || 0
      }))

    updateDebitVoucher({
      uuid,
      credit_account_head: creditAccountHead,
      date,
      remark,
      check_no: showBankFields ? checkNo : null,
      check_date: showBankFields ? checkDate : null,
      is_honours: showBankFields ? (isHonours ? 1 : 0) : undefined,
      items: itemsPayload
    }, {
      onSuccess: () => {
        navigate({ to: '/account/voucher/debit' })
      }
    })
  }

  if (isRecordLoading) {
    return <LoadingState message="Loading voucher details..." />
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
            Edit Debit Voucher
          </h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* ── Debit Voucher Header Card ── */}
        <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1e293b] mb-6 flex items-center gap-2 font-poppins">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Info className="h-4 w-4" />
            </div>
            Voucher Information
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Voucher Type */}
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Voucher Type
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="Debit"
                  className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] font-poppins"
                />
              </div>

              {/* Credit Account Head */}
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Credit Account Head <span className="text-rose-500">*</span>
                </label>
                <Select2
                  options={creditAccountHeads}
                  value={creditAccountHead}
                  onChange={handleCreditHeadChange}
                  placeholder="Select Credit Account Head"
                  error={errors.creditAccountHead}
                  isLoading={isCreditLoading}
                />
              </div>

              {/* Date */}
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

            {/* Conditionally Render Bank Nature Fields */}
            {showBankFields && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-blue-50/30 border border-blue-100/50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Cheque No */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                    Check No
                  </label>
                  <input
                    type="text"
                    value={checkNo}
                    onChange={(e) => setCheckNo(e.target.value)}
                    placeholder="Enter Check No"
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins"
                  />
                </div>

                {/* Cheque Date */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                    Check Date
                  </label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins"
                  />
                </div>

                {/* Is Honours */}
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isHonours}
                      onChange={(e) => setIsHonours(e.target.checked)}
                      className="h-4 w-4 text-[#0d7a50] focus:ring-[#0d7a50] border-gray-300 rounded"
                    />
                    <span className="text-[13px] font-semibold text-[#475569] font-poppins">Is Honours</span>
                  </label>
                </div>
              </div>
            )}

            {/* Remark */}
            <div>
              <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                Remark <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={remark}
                onChange={(e) => {
                  setRemark(e.target.value)
                  setErrors(prev => ({ ...prev, remark: '' }))
                }}
                placeholder="Enter Remark/Narration"
                className={`w-full min-h-[80px] p-3 bg-white border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins ${
                  errors.remark ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                }`}
              />
              {errors.remark && <span className="text-rose-500 text-xs mt-1 block">{errors.remark}</span>}
            </div>
          </div>
        </div>

        {/* ── Table Grid Card ── */}
        <div className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#dae8ff]">
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[30%] font-poppins">
                    Account Name <span className="text-rose-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[25%] font-poppins">
                    Sub Type <span className="text-rose-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[25%] font-poppins">
                    Ledger Comment
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[15%] font-poppins">
                    Amount <span className="text-rose-500">*</span>
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
                        options={transactionAccountHeads}
                        value={row.account_id}
                        onChange={(val) => {
                          handleAccountChange(index, val || '')
                          setErrors(prev => ({ ...prev, items: '', [`row_${index}_account`]: '' }))
                        }}
                        placeholder="Select Account"
                        isLoading={isTransactionLoading}
                        error={errors[`row_${index}_account`]}
                      />
                    </td>

                    {/* Sub Type Dropdown */}
                    <td className="p-3">
                      <div className="relative">
                        <Select2
                          options={row.subTypeOptions}
                          value={row.sub_type_id}
                          onChange={(val) => {
                            handleRowValueChange(index, 'sub_type_id', val || '')
                            setErrors(prev => ({ ...prev, [`row_${index}_sub_type`]: '' }))
                          }}
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

                    {/* Ledger Comment */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={row.ledger_comment}
                        onChange={(e) => handleRowValueChange(index, 'ledger_comment', e.target.value)}
                        placeholder="Ledger Comment"
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins"
                      />
                    </td>

                    {/* Amount Input */}
                    <td className="p-3">
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => {
                          handleRowValueChange(index, 'amount', e.target.value)
                          setErrors(prev => ({ ...prev, [`row_${index}_amount`]: '' }))
                        }}
                        placeholder="0.00"
                        step="any"
                        className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] text-right outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins ${
                          errors[`row_${index}_amount`] ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                        }`}
                      />
                      {errors[`row_${index}_amount`] && <span className="text-rose-500 text-[10px] mt-0.5 block text-right">{errors[`row_${index}_amount`]}</span>}
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

                {/* Dummy row with Add icon */}
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
                    <div className="h-[38px] px-3 bg-white text-[13px] flex items-center text-[#475569] font-medium select-none font-poppins">
                      Comment
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

          {/* Totals Row */}
          <div className="flex justify-end items-center gap-4 p-4 border-t border-gray-100 bg-gray-50/30">
            <span className="text-[13px] font-bold text-[#1e293b] font-poppins">Total:</span>
            <div className="w-[15%] mr-[5%]">
              <input
                type="text"
                readOnly
                value={grandTotal}
                className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-right font-bold text-[#1e293b] outline-none font-poppins"
              />
            </div>
          </div>
        </div>

        {/* ── Action Row ── */}
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
