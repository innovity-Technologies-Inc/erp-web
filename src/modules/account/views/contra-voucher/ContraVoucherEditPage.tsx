import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Plus, X, Check, Loader2 } from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { LoadingState } from '@/components/Loading/LoadingState'
import { useUiStore } from '@/store/useUiStore'
import { 
  useReverseAccountHeadsSelect2, 
  useContraVoucherDetails,
  useUpdateContraVoucher 
} from '../../hooks/useContraVoucher'

interface ActiveRow {
  key: string
  account_id: string
  ledger_comment: string
  debit: string
  credit: string
}

export const ContraVoucherEditPage = () => {
  const navigate = useNavigate()
  const { uuid } = useParams({ from: '/_authenticated/account/voucher/contra/edit/$uuid' })
  const { showNotificationModal } = useUiStore()

  // Queries & Mutations
  const { data: reverseAccountHeads = [], isLoading: isReverseLoading } = useReverseAccountHeadsSelect2()
  const { data: record, isLoading: isRecordLoading } = useContraVoucherDetails(uuid)
  const { mutate: updateContraVoucher, isPending: isSaving } = useUpdateContraVoucher()

  // Form States
  const [contraAccountHead, setContraAccountHead] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [remark, setRemark] = useState<string>('')

  const [activeRows, setActiveRows] = useState<ActiveRow[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate from record
  useEffect(() => {
    if (record && !isInitialized) {
      setDate(record.v_date || '')
      setRemark(record.narration || '')

      const items = record.items || []

      // In a Contra Voucher, identifying the counter head
      let counterRow = items.find(item => item.ledger_comment === 'Contra Entry')
      if (!counterRow && items.length > 0) {
        counterRow = items[items.length - 1]
      }

      if (counterRow) {
        setContraAccountHead(String(counterRow.coa_id))
      }

      const otherRows = counterRow 
        ? items.filter(item => item.id !== counterRow!.id) 
        : items

      const mappedRows = otherRows.map(item => ({
        key: Math.random().toString(),
        account_id: String(item.coa_id),
        ledger_comment: item.ledger_comment || '',
        debit: parseFloat(item.debit) > 0 ? String(parseFloat(item.debit)) : '',
        credit: parseFloat(item.credit) > 0 ? String(parseFloat(item.credit)) : ''
      }))

      if (mappedRows.length > 0) {
        setActiveRows(mappedRows)
      } else {
        setActiveRows([
          {
            key: Math.random().toString(),
            account_id: '',
            ledger_comment: '',
            debit: '',
            credit: ''
          }
        ])
      }

      setIsInitialized(true)
    }
  }, [record, isInitialized])

  const handleBack = () => {
    navigate({ to: '/account/voucher/contra' })
  }

  // Row operations
  const handleAddRow = () => {
    setActiveRows(prev => [
      ...prev,
      {
        key: Math.random().toString(),
        account_id: '',
        ledger_comment: '',
        debit: '',
        credit: ''
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

  const handleRowValueChange = (index: number, field: 'account_id' | 'ledger_comment' | 'debit' | 'credit', value: string) => {
    setActiveRows(prev => prev.map((row, idx) => {
      if (idx !== index) return row
      return { ...row, [field]: value }
    }))
  }

  // Running totals
  const totalDebit = useMemo(() => {
    return activeRows.reduce((sum, r) => sum + (parseFloat(r.debit) || 0), 0).toFixed(2)
  }, [activeRows])

  const totalCredit = useMemo(() => {
    return activeRows.reduce((sum, r) => sum + (parseFloat(r.credit) || 0), 0).toFixed(2)
  }, [activeRows])

  const handleUpdate = () => {
    const newErrors: Record<string, string> = {}
    if (!contraAccountHead) newErrors.contraAccountHead = 'Reverse Account Head is required.'
    if (!date) newErrors.date = 'Date is required.'
    if (!remark) newErrors.remark = 'Remark is required.'

    let hasValidItems = false
    activeRows.forEach((row, idx) => {
      if (row.account_id) {
        const dr = parseFloat(row.debit) || 0
        const cr = parseFloat(row.credit) || 0
        if (dr <= 0 && cr <= 0) {
          newErrors[`row_${idx}_amount`] = 'Please enter either a Debit or Credit amount.'
        } else {
          hasValidItems = true
        }
      } else if (row.debit || row.credit || row.ledger_comment) {
        newErrors[`row_${idx}_account`] = 'Account Name is required.'
      }
    })

    if (!hasValidItems && !newErrors.items) {
      newErrors.items = 'Please add at least one complete entry with account and debit/credit.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const itemsPayload = activeRows
      .filter(row => row.account_id && ((parseFloat(row.debit) || 0) > 0 || (parseFloat(row.credit) || 0) > 0))
      .map(row => ({
        account_id: row.account_id,
        ledger_comment: row.ledger_comment || null,
        debit: parseFloat(row.debit) || 0,
        credit: parseFloat(row.credit) || 0
      }))

    updateContraVoucher({
      uuid,
      contra_account_head: contraAccountHead,
      date,
      remark,
      items: itemsPayload
    }, {
      onSuccess: () => {
        navigate({ to: '/account/voucher/contra' })
      }
    })
  }

  if (isRecordLoading) {
    return <LoadingState message="Loading voucher details..." />
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Header */}
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
            Edit Contra Voucher
          </h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* ── Contra Voucher Header Card ── */}
        <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm space-y-6">
          {/* ── Voucher Header Title ── */}
          <div className="border-l-[3.5px] border-[#0052cc] pl-3 py-0.5">
            <h2 className="text-[16px] font-bold text-[#1e293b] font-poppins">
              Voucher Header
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Voucher Type */}
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Voucher Type
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="Contra"
                  className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] font-poppins"
                />
              </div>

              {/* Reverse Account Head */}
              <div>
                <label className="block text-[13px] font-semibold text-[#475569] mb-2 font-poppins">
                  Reverse Account Head <span className="text-rose-500">*</span>
                </label>
                <Select2
                  options={reverseAccountHeads}
                  value={contraAccountHead}
                  onChange={(val) => {
                    setContraAccountHead(val)
                    setErrors(prev => ({ ...prev, contraAccountHead: '' }))
                  }}
                  placeholder="Select Reverse Account Head"
                  error={errors.contraAccountHead}
                  isLoading={isReverseLoading}
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

        {/* Grid table */}
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
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[35%] font-poppins">
                    Ledger Comment
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[12%] font-poppins">
                    Debit <span className="text-rose-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-bold text-[#003671] uppercase tracking-wider w-[12%] font-poppins">
                    Credit <span className="text-rose-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-center text-[6%] font-bold text-[#003671] uppercase tracking-wider w-[6%] font-poppins">
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
                        options={reverseAccountHeads}
                        value={row.account_id}
                        onChange={(val) => {
                          handleRowValueChange(index, 'account_id', val || '')
                          setErrors(prev => ({ ...prev, items: '', [`row_${index}_account`]: '' }))
                        }}
                        placeholder="Select Account"
                        isLoading={isReverseLoading}
                        error={errors[`row_${index}_account`]}
                      />
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

                    {/* Debit */}
                    <td className="p-3">
                      <input
                        type="number"
                        value={row.debit}
                        onChange={(e) => {
                          handleRowValueChange(index, 'debit', e.target.value)
                          setErrors(prev => ({ ...prev, [`row_${index}_amount`]: '' }))
                        }}
                        placeholder="0.00"
                        step="any"
                        className={`w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] text-right outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569] font-poppins ${
                          errors[`row_${index}_amount`] ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200'
                        }`}
                      />
                    </td>

                    {/* Credit */}
                    <td className="p-3">
                      <input
                        type="number"
                        value={row.credit}
                        onChange={(e) => {
                          handleRowValueChange(index, 'credit', e.target.value)
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

                {/* Dummy Row with Add Button */}
                <tr>
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

          {/* Totals Footer Row */}
          <div className="flex justify-end items-center gap-6 p-4 border-t border-gray-100 bg-gray-50/30">
            <span className="text-[13px] font-bold text-[#1e293b] font-poppins">Totals:</span>
            
            <div className="w-[12%]">
              <input
                type="text"
                readOnly
                value={totalDebit}
                className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-right font-bold text-[#1e293b] outline-none font-poppins"
              />
            </div>

            <div className="w-[12%] mr-[6%]">
              <input
                type="text"
                readOnly
                value={totalCredit}
                className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] text-right font-bold text-[#1e293b] outline-none font-poppins"
              />
            </div>
          </div>
        </div>

        {/* Action button row */}
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
