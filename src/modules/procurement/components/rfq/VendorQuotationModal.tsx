import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Package,
  AlertCircle,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { useSubmitVendorQuotation } from '../../hooks/useRFQs'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/formatters'
import type { RFQ, RFQItem, RFQTerm, VendorQuotation, SubmitQuotationDto } from '../../api/types'
import { clsx } from 'clsx'

interface VendorQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  rfq: RFQ | null
  existingQuotation?: VendorQuotation | null
  onSuccess?: () => void
}

export const VendorQuotationModal = ({
  isOpen,
  onClose,
  rfq,
  existingQuotation,
  onSuccess,
}: VendorQuotationModalProps) => {
  const { user } = useAuthStore()
  const { showNotificationModal } = useUiStore()
  const { webSetting } = useSettings()
  const { mutate: submitQuotation, isPending: isSubmitting } = useSubmitVendorQuotation()

  const isVendorUser = user?.user_type === 'vendor'

  // Match vendor for logged in user or list of target vendors
  const targetVendors = useMemo(() => {
    if (!rfq) return []
    return rfq.target_vendors || rfq.targetVendors || []
  }, [rfq])

  const defaultVendor = useMemo(() => {
    if (existingQuotation?.vendor_id) {
      const match = targetVendors.find((tv) => tv.vendor_id === existingQuotation.vendor_id)
      if (match?.vendor) return match.vendor
    }
    if (isVendorUser) {
      const match = targetVendors.find(
        (tv) => tv.vendor?.email === user?.email || (tv.vendor as any)?.user_id === user?.id
      )
      if (match?.vendor) return match.vendor
    }
    return targetVendors[0]?.vendor || null
  }, [existingQuotation, isVendorUser, targetVendors, user])

  // Form State
  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('')
  const [quotationNo, setQuotationNo] = useState('')
  const [quotationDate, setQuotationDate] = useState('')
  const [validUntil, setValidUntil] = useState('')

  // Item prices map: { [rfq_item_id]: { unit_price: number | '', remarks: string } }
  const [itemPrices, setItemPrices] = useState<
    Record<number, { unit_price: number | ''; remarks: string }>
  >({})

  // Compliances map: { [rfq_term_id]: { compliance_value: string, vendor_remarks: string, term_library_id: number } }
  const [compliances, setCompliances] = useState<
    Record<number, { compliance_value: string; vendor_remarks: string; term_library_id: number }>
  >({})

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Automatically find quotation for current selected vendor or prop
  const currentQuotation = useMemo(() => {
    if (existingQuotation) return existingQuotation
    if (!selectedVendorId || !rfq?.quotations) return null
    return (
      (rfq.quotations || []).find(
        (q: any) => Number(q.vendor_id) === Number(selectedVendorId)
      ) || null
    )
  }, [existingQuotation, selectedVendorId, rfq?.quotations])

  // Initialize or Reset form when modal opens or vendor changes
  useEffect(() => {
    if (!isOpen || !rfq) return

    const initialVendorId = selectedVendorId || defaultVendor?.id || ''
    setSelectedVendorId(initialVendorId)

    const todayStr = new Date().toISOString().split('T')[0]
    const activeQuote =
      currentQuotation ||
      (initialVendorId && rfq.quotations
        ? (rfq.quotations || []).find(
            (q: any) => Number(q.vendor_id) === Number(initialVendorId)
          )
        : null)

    if (activeQuote) {
      setQuotationNo(activeQuote.quotation_no || '')
      setQuotationDate(
        activeQuote.quotation_date
          ? activeQuote.quotation_date.split('T')[0]
          : todayStr
      )
      setValidUntil(
        activeQuote.valid_until ? activeQuote.valid_until.split('T')[0] : ''
      )

      // Populate item rates from active quote
      const existingItemsMap: Record<number, { unit_price: number | ''; remarks: string }> = {}
      const quoteItems: any[] = activeQuote.items || []
      
      ;(rfq.items || []).forEach((item: RFQItem) => {
        if (!item.id) return
        const found = quoteItems.find(
          (qi) => qi.rfq_item_id === item.id || Number(qi.product_id) === Number(item.product_id)
        )
        if (found) {
          existingItemsMap[item.id] = {
            unit_price: found.unit_price !== undefined && found.unit_price !== null ? Number(found.unit_price) : '',
            remarks: found.remarks || '',
          }
        } else {
          existingItemsMap[item.id] = { unit_price: '', remarks: '' }
        }
      })
      setItemPrices(existingItemsMap)

      // Populate compliances from active quote
      const existingCompMap: Record<
        number,
        { compliance_value: string; vendor_remarks: string; term_library_id: number }
      > = {}
      const quoteCompliances: any[] = activeQuote.compliances || []
      const rfqTerms: RFQTerm[] = rfq.rfq_terms || (rfq as any).rfqTerms || []

      rfqTerms.forEach((term) => {
        if (!term.id) return
        const found = quoteCompliances.find(
          (qc) => qc.rfq_term_id === term.id || Number(qc.term_library_id) === Number(term.term_library_id)
        )
        const t = term.term
        let defaultVal = 'Agreed / Yes'
        if (t?.response_type === 'select' && Array.isArray(t.options) && t.options.length > 0) {
          defaultVal = t.options[0]
        } else if (t?.response_type === 'number') {
          defaultVal = ''
        } else if (t?.response_type === 'text') {
          defaultVal = ''
        }

        existingCompMap[term.id] = {
          compliance_value: found?.compliance_value !== undefined && found?.compliance_value !== null ? String(found.compliance_value) : defaultVal,
          vendor_remarks: found?.vendor_remarks || '',
          term_library_id: term.term_library_id,
        }
      })
      setCompliances(existingCompMap)
    } else {
      // Clean defaults
      const autoQuoNo = `QUO-${rfq.rfq_no ? rfq.rfq_no.replace(/[^a-zA-Z0-9]/g, '') : Date.now().toString().slice(-6)}`
      setQuotationNo(autoQuoNo)
      setQuotationDate(todayStr)
      setValidUntil(rfq.rfq_expiry_date ? rfq.rfq_expiry_date.split('T')[0] : '')

      const initialItemsMap: Record<number, { unit_price: number | ''; remarks: string }> = {}
      ;(rfq.items || []).forEach((item: RFQItem) => {
        if (item.id) {
          initialItemsMap[item.id] = { unit_price: '', remarks: '' }
        }
      })
      setItemPrices(initialItemsMap)

      const initialCompMap: Record<
        number,
        { compliance_value: string; vendor_remarks: string; term_library_id: number }
      > = {}
      const rfqTerms: RFQTerm[] = rfq.rfq_terms || (rfq as any).rfqTerms || []
      rfqTerms.forEach((term) => {
        if (term.id) {
          const t = term.term
          let defaultVal = 'Agreed / Yes'
          if (t?.response_type === 'select' && Array.isArray(t.options) && t.options.length > 0) {
            defaultVal = t.options[0]
          } else if (t?.response_type === 'boolean') {
            defaultVal = 'Agreed / Yes'
          } else if (t?.response_type === 'number') {
            defaultVal = ''
          } else if (t?.response_type === 'text') {
            defaultVal = ''
          }
          initialCompMap[term.id] = {
            compliance_value: defaultVal,
            vendor_remarks: '',
            term_library_id: term.term_library_id,
          }
        }
      })
      setCompliances(initialCompMap)
    }
    setFormErrors({})
  }, [isOpen, rfq, currentQuotation, defaultVendor, selectedVendorId])

  // Real-time calculations
  const grandTotal = useMemo(() => {
    if (!rfq?.items) return 0
    return rfq.items.reduce((sum, item) => {
      if (!item.id) return sum
      const price = Number(itemPrices[item.id]?.unit_price || 0)
      const qty = Number(item.quantity || 0)
      return sum + price * qty
    }, 0)
  }, [rfq?.items, itemPrices])

  const handleItemPriceChange = (itemId: number, value: string) => {
    const num = value === '' ? '' : parseFloat(value)
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        unit_price: isNaN(num as number) ? '' : num,
      },
    }))

    if (formErrors[`item_${itemId}`]) {
      setFormErrors((prev) => {
        const copy = { ...prev }
        delete copy[`item_${itemId}`]
        return copy
      })
    }
  }

  const handleItemRemarkChange = (itemId: number, remarks: string) => {
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        remarks,
      },
    }))
  }

  const handleComplianceChange = (
    termId: number,
    field: 'compliance_value' | 'vendor_remarks',
    value: string
  ) => {
    setCompliances((prev) => ({
      ...prev,
      [termId]: {
        ...prev[termId],
        [field]: value,
      },
    }))

    if (field === 'compliance_value' && formErrors[`term_${termId}`]) {
      setFormErrors((prev) => {
        const copy = { ...prev }
        delete copy[`term_${termId}`]
        return copy
      })
    }
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!selectedVendorId) {
      errors.vendor_id = 'Please select or link a valid vendor organization.'
    }

    if (!quotationNo.trim()) {
      errors.quotation_no = 'Quotation reference number is required.'
    }

    if (!quotationDate) {
      errors.quotation_date = 'Quotation date is required.'
    }

    if (validUntil && quotationDate && validUntil < quotationDate) {
      errors.valid_until = 'Validity date cannot be earlier than quotation date.'
    }

    const rfqItems = rfq?.items || []
    if (rfqItems.length === 0) {
      errors.items = 'No items found in this RFQ to quote.'
    }

    rfqItems.forEach((item) => {
      if (!item.id) return
      const priceEntry = itemPrices[item.id]
      if (!priceEntry || priceEntry.unit_price === '' || isNaN(Number(priceEntry.unit_price)) || Number(priceEntry.unit_price) <= 0) {
        errors[`item_${item.id}`] = 'Unit price is required and must be greater than 0.'
      }
    })

    // Validate Mandatory Terms & Conditions
    const rfqTerms: RFQTerm[] = rfq?.rfq_terms || (rfq as any)?.rfqTerms || []
    rfqTerms.forEach((term) => {
      if (term.is_mandatory && term.id) {
        const comp = compliances[term.id]
        const val = typeof comp?.compliance_value === 'string' ? comp.compliance_value.trim() : String(comp?.compliance_value || '')
        if (!val || val === '' || val === 'not_provided') {
          errors[`term_${term.id}`] = `Mandatory term "${term.term?.title || 'Clause'}" requires your compliance input.`
        }
      }
    })

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      showNotificationModal(
        'Required Information Missing',
        'Please complete all mandatory fields, item unit prices, and mandatory terms before submitting.',
        'warning'
      )
    }

    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !rfq) return

    const payload: SubmitQuotationDto = {
      vendor_id: Number(selectedVendorId),
      quotation_no: quotationNo.trim(),
      quotation_date: quotationDate,
      valid_until: validUntil || undefined,
      items: (rfq.items || []).map((item) => ({
        rfq_item_id: item.id!,
        unit_price: Number(itemPrices[item.id!]?.unit_price || 0),
        remarks: itemPrices[item.id!]?.remarks || undefined,
      })),
      compliances: Object.entries(compliances).map(([rfqTermId, comp]) => ({
        rfq_term_id: Number(rfqTermId),
        term_library_id: comp.term_library_id,
        compliance_value: comp.compliance_value,
        vendor_remarks: comp.vendor_remarks || undefined,
      })),
    }

    const targetUuid = rfq.uuid || String(rfq.id)

    submitQuotation(
      { uuid: targetUuid, data: payload },
      {
        onSuccess: () => {
          showNotificationModal(
            'Quotation Submitted Successfully!',
            `Your quotation "${payload.quotation_no}" for RFQ #${rfq.rfq_no} has been recorded in the system.`,
            'success'
          )
          onClose()
          if (onSuccess) onSuccess()
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.message || err.message || 'Failed to submit vendor quotation.'
          showNotificationModal('Submission Failed', msg, 'error')
        },
      }
    )
  }

  const currency = rfq?.currency || webSetting?.currency || '৳'
  const currencyPosition = webSetting?.currency_position || 'right'
  const rfqTerms: RFQTerm[] = rfq?.rfq_terms || (rfq as any)?.rfqTerms || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentQuotation ? 'Update Quotation / Bid' : 'Submit Quotation / Bid'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 font-poppins text-gray-700">
        {/* Top Info Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Request For Quotation</div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>{rfq?.rfq_no}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
                  Currency: {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-primary/20 sm:pl-4">
            <div className="text-xs text-gray-500 font-medium">Bid Cutoff Deadline</div>
            <div className="text-xs font-semibold text-rose-600 flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5" />
              <span>{rfq?.rfq_expiry_date ? rfq.rfq_expiry_date.split('T')[0] : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Vendor & Quotation Header Details */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-2xs">
          <h4 className="text-[13px] font-bold text-primary flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building2 className="w-4 h-4" />
            <span>Quotation Header Details</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vendor Selector */}
            <div>
              <FormField label="Vendor Organization" required error={formErrors.vendor_id}>
                {isVendorUser ? (
                  <div className="px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{defaultVendor?.name || user?.first_name || 'Your Company'}</span>
                  </div>
                ) : (
                  <select
                    value={selectedVendorId}
                    onChange={(e) => {
                      const vId = Number(e.target.value) || ''
                      setSelectedVendorId(vId)
                      if (formErrors.vendor_id) {
                        setFormErrors((prev) => {
                          const copy = { ...prev }
                          delete copy.vendor_id
                          return copy
                        })
                      }
                    }}
                    className={clsx(
                      'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                      formErrors.vendor_id ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                    )}
                  >
                    <option value="">-- Select Target Vendor --</option>
                    {targetVendors.map((tv) => (
                      <option key={tv.vendor_id} value={tv.vendor_id}>
                        {tv.vendor?.name} ({tv.vendor?.code})
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            </div>

            {/* Quotation Ref No */}
            <div>
              <FormField label="Quotation Ref Number" required error={formErrors.quotation_no}>
                <input
                  type="text"
                  placeholder="e.g. QUO-2026-001"
                  value={quotationNo}
                  onChange={(e) => {
                    setQuotationNo(e.target.value)
                    if (formErrors.quotation_no) {
                      setFormErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.quotation_no
                        return copy
                      })
                    }
                  }}
                  className={clsx(
                    'w-full px-3 py-2 bg-white border rounded-lg text-xs font-mono font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400',
                    formErrors.quotation_no ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                  )}
                />
              </FormField>
            </div>

            {/* Quotation Date */}
            <div>
              <FormField label="Quotation Date" required error={formErrors.quotation_date}>
                <input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => {
                    setQuotationDate(e.target.value)
                    if (formErrors.quotation_date) {
                      setFormErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.quotation_date
                        return copy
                      })
                    }
                  }}
                  className={clsx(
                    'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                    formErrors.quotation_date ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                  )}
                />
              </FormField>
            </div>

            {/* Valid Until Date */}
            <div>
              <FormField label="Quote Validity Until" error={formErrors.valid_until}>
                <input
                  type="date"
                  value={validUntil}
                  min={quotationDate}
                  onChange={(e) => {
                    setValidUntil(e.target.value)
                    if (formErrors.valid_until) {
                      setFormErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.valid_until
                        return copy
                      })
                    }
                  }}
                  className={clsx(
                    'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                    formErrors.valid_until ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                  )}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Section 2: Line Items Pricing */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-[13px] font-bold text-primary flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Items & Unit Pricing</span>
            </h4>
            <span className="text-[11px] text-gray-500 font-medium">
              {rfq?.items?.length || 0} items requested
            </span>
          </div>

          {formErrors.items && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formErrors.items}</span>
            </div>
          )}

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Item Description</th>
                  <th className="py-2.5 px-3 text-center w-24">Required Qty</th>
                  <th className="py-2.5 px-3 w-40">Unit Price ({currency}) *</th>
                  <th className="py-2.5 px-3 text-right w-36">Total ({currency})</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Item Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(rfq?.items || []).map((item, idx) => {
                  const itemId = item.id!
                  const priceEntry = itemPrices[itemId] || { unit_price: '', remarks: '' }
                  const qty = parseFloat(String(item.quantity)) || 0
                  const uPrice = parseFloat(String(priceEntry.unit_price)) || 0
                  const lineTotal = qty * uPrice
                  const itemErr = formErrors[`item_${itemId}`]

                  return (
                    <tr
                      key={itemId || idx}
                      className={clsx(
                        'hover:bg-slate-50/60 transition-colors',
                        itemErr ? 'bg-rose-50/20' : ''
                      )}
                    >
                      <td className="py-3 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">
                          {item.product?.name || item.item_description || `Product #${item.product_id}`}
                        </div>
                        {item.item_description && item.product?.name && (
                          <div className="text-[11px] text-gray-500">{item.item_description}</div>
                        )}
                        {item.remarks && (
                          <div className="text-[10px] text-gray-400 italic">Req: {item.remarks}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-gray-800">{qty}</span>{' '}
                        <span className="text-gray-500 text-[11px]">{item.unit?.name || 'Units'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={priceEntry.unit_price}
                            onChange={(e) => handleItemPriceChange(itemId, e.target.value)}
                            className={clsx(
                              'w-full px-3 py-1.5 bg-white border rounded-lg text-xs font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400',
                              itemErr ? 'border-rose-400 bg-rose-50/30' : 'border-gray-300'
                            )}
                          />
                        </div>
                        {itemErr && <div className="text-[10px] text-rose-500 mt-1 font-medium">{itemErr}</div>}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                        {lineTotal > 0 ? formatCurrency(lineTotal, currency, currencyPosition) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="Brand / condition / warranty"
                          value={priceEntry.remarks}
                          onChange={(e) => handleItemRemarkChange(itemId, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Grand Total Summary Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All prices should be inclusive of applicable delivery and local duties.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Total Quoted Amount:
              </span>
              <span className="text-lg font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                {formatCurrency(grandTotal, currency, currencyPosition)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Terms & Conditions Compliance (If Applicable) */}
        {rfqTerms.length > 0 && (
          <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-2xs">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <h4 className="text-[13px] font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Terms & Conditions Compliance</span>
              </h4>
              <span className="text-[11px] text-gray-500 font-medium">
                {rfqTerms.length} requirement(s)
              </span>
            </div>

            <div className="space-y-3">
              {rfqTerms.map((term, tIdx) => {
                const termId = term.id!
                const comp = compliances[termId] || {
                  compliance_value: 'Agreed / Yes',
                  vendor_remarks: '',
                  term_library_id: term.term_library_id,
                }
                const termTitle = term.term?.title || `Requirement #${tIdx + 1}`
                const termErr = formErrors[`term_${termId}`]

                return (
                  <div
                    key={termId || tIdx}
                    className={clsx(
                      'p-3.5 rounded-xl border grid grid-cols-1 md:grid-cols-12 gap-3 items-center transition-all',
                      termErr ? 'bg-rose-50/20 border-rose-300' : 'bg-gray-50/60 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="md:col-span-5">
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>{termTitle}</span>
                        {term.is_mandatory ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                            Mandatory *
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                            Optional
                          </span>
                        )}
                      </div>
                      {term.term?.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                          {term.term.description}
                        </p>
                      )}
                      {termErr && (
                        <div className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{termErr}</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      {term.term?.response_type === 'select' && Array.isArray(term.term.options) && term.term.options.length > 0 ? (
                        <select
                          value={comp.compliance_value}
                          onChange={(e) =>
                            handleComplianceChange(termId, 'compliance_value', e.target.value)
                          }
                          className={clsx(
                            'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                            termErr ? 'border-rose-400 bg-rose-50/30' : 'border-gray-300'
                          )}
                        >
                          <option value="">-- Select Option --</option>
                          {term.term.options.map((opt: string, optIdx: number) => (
                            <option key={optIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : term.term?.response_type === 'boolean' ? (
                        <select
                          value={comp.compliance_value}
                          onChange={(e) =>
                            handleComplianceChange(termId, 'compliance_value', e.target.value)
                          }
                          className={clsx(
                            'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                            termErr ? 'border-rose-400 bg-rose-50/30' : 'border-gray-300'
                          )}
                        >
                          <option value="Agreed / Yes">Agreed / Yes</option>
                          <option value="Declined / No">Declined / No</option>
                          <option value="Partially Agreed">Partially Agreed</option>
                        </select>
                      ) : term.term?.response_type === 'number' ? (
                        <input
                          type="number"
                          placeholder="e.g. 30"
                          value={comp.compliance_value}
                          onChange={(e) =>
                            handleComplianceChange(termId, 'compliance_value', e.target.value)
                          }
                          className={clsx(
                            'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400',
                            termErr ? 'border-rose-400 bg-rose-50/30' : 'border-gray-300'
                          )}
                        />
                      ) : term.term?.response_type === 'text' ? (
                        <input
                          type="text"
                          placeholder="Enter compliance details..."
                          value={comp.compliance_value}
                          onChange={(e) =>
                            handleComplianceChange(termId, 'compliance_value', e.target.value)
                          }
                          className={clsx(
                            'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400',
                            termErr ? 'border-rose-400 bg-rose-50/30' : 'border-gray-300'
                          )}
                        />
                      ) : (
                        <select
                          value={comp.compliance_value}
                          onChange={(e) =>
                            handleComplianceChange(termId, 'compliance_value', e.target.value)
                          }
                          className={clsx(
                            'w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                            termErr ? 'border-rose-400 bg-rose-50/30' : 'border-gray-300'
                          )}
                        >
                          <option value="Agreed / Yes">Agreed / Yes</option>
                          <option value="Partially Complied">Partially Complied</option>
                          <option value="Declined / No">Declined / No</option>
                        </select>
                      )}
                    </div>

                    <div className="md:col-span-4">
                      <input
                        type="text"
                        placeholder="Vendor compliance notes / remarks"
                        value={comp.vendor_remarks}
                        onChange={(e) =>
                          handleComplianceChange(termId, 'vendor_remarks', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{currentQuotation ? 'Update & Resubmit Bid' : 'Submit Formal Quotation'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}
