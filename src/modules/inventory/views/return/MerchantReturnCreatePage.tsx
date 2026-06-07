import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { 
  ArrowLeft, 
  Package, 
  AlertCircle, 
  FileText, 
  Check, 
  ShoppingCart,
  Plus,
  X,
} from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useStoreInvoiceReturn, useInvoiceSelect2 } from '../../hooks/useReturn'
import { 
  useSaleDetails, 
  useProductsSearch, 
  useProductBatchInfo,
  usePaymentMethods 
} from '../../hooks/useSales'
import { LoadingState } from '@/components/Loading/LoadingState'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'

interface ReturnItem {
  invoice_detail_id: number
  item_id: number
  item_name: string
  sold_qty: number
  already_returned: number
  available_return: number
  batch_no: string
  rate: number
  return_quantity: number | ''
  deduction_percent: number | ''
  deduction_value: number
  total: number
  selected: boolean
}

export const MerchantReturnCreatePage = () => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  
  const [invoiceId, setInvoiceId] = useState<number | string>('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | string | null>(null)
  const [selectedInvoiceLabel, setSelectedInvoiceLabel] = useState('')
  
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('')
  const { data: invoiceOptions = [] } = useInvoiceSelect2(invoiceSearchTerm)
  
  const { data: invoiceData, isLoading: isFetchingInvoice, isError } = useSaleDetails(selectedInvoiceId as number)
  const { mutate: storeReturn, isPending: isSaving } = useStoreInvoiceReturn()

  // Combined options ensures the selected invoice is always visible in the dropdown
  const select2Options = useMemo(() => {
    const options = invoiceOptions.map((opt: any) => ({ value: opt.id, label: opt.text }))
    if (selectedInvoiceId && !options.find(o => o.value === selectedInvoiceId)) {
      options.unshift({ value: selectedInvoiceId, label: selectedInvoiceLabel })
    }
    return options
  }, [invoiceOptions, selectedInvoiceId, selectedInvoiceLabel])

  const onInvoiceChange = (val: any) => {
    setInvoiceId(val)
    const selected = invoiceOptions.find((opt: any) => opt.id === val)
    if (selected) {
      setSelectedInvoiceLabel(selected.text)
    }
  }

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])
  const [usablity, setUsablity] = useState<'1' | '3'>('1')
  const [reason, setReason] = useState('')
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  // ─── New Sale (Exchange) Setup ───────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState('')
  const { data: paymentMethodsData } = usePaymentMethods()
  
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      items: [] as any[],
      sale_invoice_discount: 0,
      shipping_cost: 0,
      paid_amount: 0,
      sale_payment_type_id: '',
      sale_details: ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchExchangeItems = useWatch({ control, name: 'items' })
  const sale_invoice_discount = useWatch({ control, name: 'sale_invoice_discount' })
  const shipping_cost = useWatch({ control, name: 'shipping_cost' })
  const paid_amount = useWatch({ control, name: 'paid_amount' })

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (invoiceId) {
      setSelectedInvoiceId(invoiceId)
    } else {
      setSelectedInvoiceId(null)
      setReturnItems([])
    }
  }, [invoiceId])
  
  useEffect(() => {
    if (invoiceData) {
      const details = invoiceData.invoice_details || []
      const newItems = details.map((detail: any) => ({
        invoice_detail_id: detail.id,
        item_id: detail.product_id,
        item_name: detail.product?.product_name || '',
        sold_qty: Number(detail.quantity) || 0,
        already_returned: Number(detail.return_quantity) || 0,
        available_return: (Number(detail.quantity) || 0) - (Number(detail.return_quantity) || 0),
        batch_no: detail.batch_master?.batch_no || '',
        rate: Number(detail.rate) || 0,
        return_quantity: '',
        deduction_percent: 0,
        deduction_value: 0,
        total: 0,
        selected: false
      }))
      setReturnItems(newItems)
      
      // Initialize with one empty exchange row if items are loaded
      if (fields.length === 0) {
        append({
          product_id: 0, batch_master_id: 0, quantity: 1, rate: 0,
          discount_per: 0, total_price: 0, avl_qty: 0, unit: '', description: ''
        }, { shouldFocus: false })
      }
    }
  }, [invoiceData, append, fields.length])

  // ─── Calculations ────────────────────────────────────────────────────────────

  const calculateReturnRow = (item: ReturnItem, returnQty: number, dedPercent: number) => {
    const subtotal = returnQty * item.rate
    const dedValue = subtotal * (dedPercent / 100)
    return {
      deduction_value: dedValue,
      total: subtotal - dedValue
    }
  }

  const handleReturnItemChange = (index: number, field: keyof ReturnItem, value: any) => {
    const newItems = [...returnItems]
    const item = newItems[index]
    
    if (field === 'selected') {
      item.selected = value
      if (!value) {
        item.return_quantity = ''
        const calcs = calculateReturnRow(item, 0, Number(item.deduction_percent) || 0)
        item.deduction_value = calcs.deduction_value
        item.total = calcs.total
      }
    } else {
      (item as any)[field] = value
      
      if (field === 'return_quantity' || field === 'deduction_percent') {
        const retQty = field === 'return_quantity' ? Number(value) : Number(item.return_quantity)
        const dedPer = field === 'deduction_percent' ? Number(value) : Number(item.deduction_percent)
        
        if (retQty > item.available_return) {
          showNotificationModal('Error', 'Return quantity cannot exceed available return quantity!', 'error')
          item.return_quantity = ''
          const calcs = calculateReturnRow(item, 0, dedPer)
          item.deduction_value = calcs.deduction_value
          item.total = calcs.total
        } else {
          const calcs = calculateReturnRow(item, retQty || 0, dedPer || 0)
          item.deduction_value = calcs.deduction_value
          item.total = calcs.total
        }
      }
    }
    setReturnItems(newItems)
  }

  const returnTotals = useMemo(() => {
    const selected = returnItems.filter(i => i.selected)
    const deduction = selected.reduce((sum, item) => sum + item.deduction_value, 0)
    const total = selected.reduce((sum, item) => sum + item.total, 0)
    return { deduction, total }
  }, [returnItems])

  const hasReturnSelected = useMemo(() => returnItems.some(i => i.selected), [returnItems])

  const exchangeTotals = useMemo(() => {
    let subTotal = 0
    watchExchangeItems?.forEach((item: any) => {
      const qty = Number(item.quantity) || 0
      const rate = Number(item.rate) || 0
      const discPer = Number(item.discount_per) || 0
      const subtotal = qty * rate
      const discount = (subtotal * discPer) / 100
      subTotal += (subtotal - discount)
    })

    const invDisc = Number(sale_invoice_discount) || 0
    const shipCost = Number(shipping_cost) || 0
    const grandTotal = subTotal + shipCost - invDisc

    return { subTotal, grandTotal }
  }, [watchExchangeItems, sale_invoice_discount, shipping_cost])

  const netBalance = useMemo(() => {
    const returnTotal = returnTotals.total
    const newTotal = exchangeTotals.grandTotal
    const currentPaid = Number(paid_amount) || 0
    
    let dueAmount = 0
    let changeAmount = 0
    let isPaidReadonly = false

    if (returnTotal >= newTotal) {
      dueAmount = 0
      changeAmount = returnTotal - newTotal
      isPaidReadonly = true
    } else {
      dueAmount = newTotal - returnTotal - currentPaid
      changeAmount = 0
      isPaidReadonly = false
    }

    return { dueAmount, changeAmount, isPaidReadonly }
  }, [returnTotals.total, exchangeTotals.grandTotal, paid_amount])

  // Sync paid amount if readonly
  useEffect(() => {
    if (netBalance.isPaidReadonly) {
      setValue('paid_amount', 0)
    }
  }, [netBalance.isPaidReadonly, setValue])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const onSubmit = (data: any) => {
    const selectedReturnItems = returnItems.filter(i => i.selected)
    if (selectedReturnItems.length === 0) {
      showNotificationModal('Error', 'Please select at least one item to return', 'error')
      return
    }

    let hasReturnError = false
    selectedReturnItems.forEach((item, index) => {
      if ((Number(item.return_quantity) || 0) <= 0) {
        showNotificationModal('Error', `Return Row ${index + 1}: Return quantity must be greater than 0`, 'error')
        hasReturnError = true
      }
    })
    if (hasReturnError) return

    const exchangeItems = data.items.filter((item: any) => item.product_id !== 0 && item.batch_master_id !== 0)
    
    // Check if new sale exists but payment type is missing
    if (exchangeItems.length > 0 && !data.sale_payment_type_id) {
       showNotificationModal('Error', 'Please select a payment type for the exchange', 'error')
       return
    }

    const payload = {
      warehouse_id: invoiceData?.invoice_details?.[0]?.warehouse_id,
      invoice_id: invoiceData?.id,
      reason: reason,
      usablity: usablity,
      return_items: selectedReturnItems.map(item => ({
        invoice_detail_id: item.invoice_detail_id,
        return_quantity: Number(item.return_quantity),
        rate: item.rate,
        batch_no: item.batch_no,
        deduction_percent: Number(item.deduction_percent),
        deduction_value: item.deduction_value,
        total: item.total
      })),
      total_deduction: returnTotals.deduction,
      new_items: exchangeItems.map((item: any) => ({
        item_id: item.product_id,
        batch_master_id: item.batch_master_id,
        qty: item.quantity,
        rate: item.rate,
        discount: (item.quantity * item.rate * item.discount_per) / 100,
        total: item.total_price
      })),
      sale_details: data.sale_details,
      net_total: exchangeTotals.grandTotal,
      paid_amount: data.paid_amount,
      due_amount: netBalance.dueAmount,
      change_amount: netBalance.changeAmount,
      payment_type_id: data.sale_payment_type_id
    }

    storeReturn(payload as any)
  }

  const handleDiscard = () => {
    if (isDirty || returnItems.some(i => i.selected)) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/return/merchant' })
    }
  }

  const paymentTypeOptions = useMemo(() => {
    const rawData = paymentMethodsData as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    const options = data.map((p: any) => ({ value: p.id || p.head_code, label: p.text || p.head_name })) || []
    return [{ value: 0, label: 'Credit Sale' }, ...options]
  }, [paymentMethodsData])

  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/return/merchant"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Return From Merchant</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Step 1: Return Header */}
        <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
          <h2 className="text-[18px] font-bold text-[#1e293b] mb-6 flex items-center gap-2">
             <div className="text-[#1e4ba1]"><FileText className="h-5 w-5" /></div>
             Return Header
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">
                Invoice No <span className="text-rose-500">*</span>
              </label>
              <Select2
                options={select2Options}
                value={invoiceId}
                onChange={onInvoiceChange}
                onInputChange={setInvoiceSearchTerm}
                placeholder="Search Invoice..."
                className="font-medium"
              />
            </div>
            <div className="md:col-span-3 space-y-1.5">
               <label className="text-[13px] font-semibold text-[#475569]">Warehouse Name</label>
               <input 
                 type="text" 
                 value={invoiceData?.invoice_details?.[0]?.warehouse?.name || ''} 
                 disabled 
                 className="w-full h-[42px] px-3 bg-[#f1f5f9] border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] cursor-not-allowed" 
               />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Merchant Name</label>
              <input 
                type="text" 
                value={invoiceData?.customer?.customer_name || ''} 
                disabled 
                className="w-full h-[42px] px-3 bg-[#f1f5f9] border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] cursor-not-allowed whitespace-nowrap overflow-hidden text-ellipsis" 
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Date</label>
              <input 
                type="text" 
                value={invoiceData?.date ? new Date(invoiceData.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''} 
                disabled 
                className="w-full h-[42px] px-3 bg-[#f1f5f9] border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        {isFetchingInvoice ? (
          <LoadingState message="Fetching invoice details..." />
        ) : isError ? (
          <div className="bg-white rounded-xl border border-primary/10 p-10 shadow-sm text-center flex flex-col items-center text-rose-500">
            <AlertCircle className="w-10 h-10 mb-2" />
            <h2 className="text-[18px] font-medium">Error loading invoice. Please try again.</h2>
          </div>
        ) : !invoiceData ? (
          <div className="bg-white rounded-xl border border-primary/10 p-10 shadow-sm text-center flex flex-col items-center">
            <FileText className="w-10 h-10 text-gray-300 mb-2" />
            <h2 className="text-[18px] font-medium text-gray-400">Please Enter Invoice Number and Return Qty From Merchant!</h2>
          </div>
        ) : (
          <>
            {/* Step 2: Return Items */}
            <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-3 border-b border-gray-50">
                <div className="p-1.5 bg-[#f1f5f9] rounded-lg text-[#1e293b]"><Package className="h-5 w-5" /></div>
                <h2 className="text-[18px] font-bold text-[#1e293b]">Return Items</h2>
              </div>
              
              <div className="p-4">
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-[#dae8ff] text-[12px] font-bold text-[#003671] uppercase tracking-wider text-center">
                        <th className="px-4 py-4 w-[80px]">Return</th>
                        <th className="px-4 py-4 text-left">Product Name</th>
                        <th className="px-4 py-4 w-[100px]">Sold Qty</th>
                        <th className="px-4 py-4 w-[120px]">Already Return</th>
                        <th className="px-4 py-4 w-[140px]">Available Return</th>
                        <th className="px-4 py-4 w-[100px]">Batch No</th>
                        <th className="px-4 py-4 w-[120px]">Return Qty*</th>
                        <th className="px-4 py-4 w-[120px]">Unit Price</th>
                        <th className="px-4 py-4 w-[120px]">Deduction(%)</th>
                        <th className="px-4 py-4 w-[120px]">Dis. Value</th>
                        <th className="px-4 py-4 w-[120px] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] font-medium text-[#475569] bg-white text-center divide-y divide-gray-50">
                      {returnItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              className="w-5 h-5 text-[#059669] rounded border-gray-300 focus:ring-[#059669] cursor-pointer mx-auto block accent-[#059669]"
                              checked={item.selected}
                              onChange={(e) => handleReturnItemChange(idx, 'selected', e.target.checked)}
                            />
                          </td>
                          <td className="px-4 py-4 text-left">
                            <span className="text-gray-400 font-medium truncate max-w-[250px] block" title={item.item_name}>{item.item_name}</span>
                          </td>
                          <td className="px-4 py-4 text-gray-500 font-bold">{item.sold_qty}</td>
                          <td className="px-4 py-4 text-gray-400">{item.already_returned}</td>
                          <td className="px-4 py-4 text-gray-400">{item.available_return}</td>
                          <td className="px-4 py-4 text-gray-500 font-bold">{item.batch_no || '0'}</td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              value={item.return_quantity}
                              onChange={(e) => handleReturnItemChange(idx, 'return_quantity', e.target.value)}
                              disabled={!item.selected}
                              className="w-full h-[38px] px-2 bg-white border border-gray-200 rounded text-center outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed font-bold"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-4 text-gray-500 font-bold">
                            {formatValue(item.rate)}
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.deduction_percent}
                              onChange={(e) => handleReturnItemChange(idx, 'deduction_percent', e.target.value)}
                              disabled={!item.selected}
                              className="w-full h-[38px] px-2 bg-white border border-gray-200 rounded text-center outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed font-bold"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-4 text-center text-[#1e4ba1] font-bold">
                            {formatValue(item.deduction_value).replace(currency, '').trim()}
                          </td>
                          <td className="px-4 py-4 text-right pr-6 text-[#1e4ba1] font-bold">
                            {formatValue(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Step 2.1: Return Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {/* Usability & Reason Card */}
              <div className="md:col-span-6 bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col md:flex-row items-start gap-8">
                <div className="space-y-4 min-w-[200px]">
                  <label className="text-[14px] font-bold text-[#475569]">Usablity</label>
                  <div className="flex flex-row items-center gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={clsx(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        usablity === '1' ? "border-primary bg-primary" : "border-gray-300 group-hover:border-gray-400"
                      )}>
                        {usablity === '1' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input type="radio" value="1" checked={usablity === '1'} onChange={(e) => setUsablity(e.target.value as '1')} className="hidden" />
                      <span className={clsx("text-[14px] font-medium transition-colors", usablity === '1' ? "text-[#1e293b] font-bold" : "text-gray-400")}>Adjust With Stock</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={clsx(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        usablity === '3' ? "border-primary bg-primary" : "border-gray-300 group-hover:border-gray-400"
                      )}>
                        {usablity === '3' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input type="radio" value="3" checked={usablity === '3'} onChange={(e) => setUsablity(e.target.value as '3')} className="hidden" />
                      <span className={clsx("text-[14px] font-medium transition-colors", usablity === '3' ? "text-[#1e293b] font-bold" : "text-gray-400")}>Wastage</span>
                    </label>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="text-[14px] font-bold text-[#475569]">Reason</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the reason for this return..."
                    className="w-full h-[60px] p-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>

              {/* Counts Card (Blue) */}
              <div className="md:col-span-3 bg-[#1e4ba1] rounded-xl p-6 shadow-md text-white flex flex-col justify-center gap-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[14px] opacity-70 font-medium">Total Items</span>
                    <span className="text-[16px] font-bold">{returnItems.filter(i => i.selected).length} Products</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[14px] opacity-70 font-medium">Return Quantity</span>
                    <span className="text-[16px] font-bold">
                      {returnItems.reduce((sum, item) => sum + (item.selected ? (Number(item.return_quantity) || 0) : 0), 0)} Units
                    </span>
                 </div>
              </div>

              {/* Totals Card */}
              <div className="md:col-span-3 bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col justify-center gap-6">
                 <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[14px] font-medium">Total Deduction</span>
                    <span className="text-[16px] font-bold">{formatValue(returnTotals.deduction).replace(currency, '').trim()}</span>
                 </div>
                 <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[14px] font-medium">Refund Value</span>
                    <span className="text-[16px] font-bold">{formatValue(returnTotals.total).replace(currency, '').trim()}</span>
                 </div>
              </div>
            </div>

            {/* Step 3: Reorder / New Order Section */}
            <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
               <div className="p-5 flex items-center justify-between border-b border-gray-50 bg-white">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-[#f1f5f9] rounded-lg text-[#1e293b]"><ShoppingCart className="h-5 w-5" /></div>
                   <h2 className="text-[18px] font-bold text-[#1e293b]">Reorder / New Order</h2>
                 </div>
                 <button
                   type="button"
                   disabled={!hasReturnSelected}
                   onClick={() => append({ 
                     product_id: 0, batch_master_id: 0, quantity: 1, rate: 0,
                     discount_per: 0, total_price: 0, avl_qty: 0, unit: '', description: ''
                   }, { shouldFocus: false })}
                   className="bg-[#0f2d5c] hover:bg-[#0a1e3d] text-white px-5 py-2 rounded-lg flex items-center gap-2 text-[13px] font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Plus className="h-4 w-4" strokeWidth={3} />
                   Add Item
                 </button>
               </div>

               <div className="p-4">
                 <div className="overflow-x-auto rounded-xl border border-gray-100">
                   <table className="w-full text-left border-collapse min-w-[1200px]">
                     <thead>
                       <tr className="bg-[#dae8ff] text-[#003671] text-[12px] font-bold uppercase tracking-wider text-center">
                         <th className="px-4 py-4 border-b border-gray-200 text-left">Item Information*</th>
                         <th className="px-4 py-4 border-b border-gray-200">Desc</th>
                         <th className="px-4 py-4 border-b border-gray-200">Batch No*</th>
                         <th className="px-4 py-4 border-b border-gray-200">Av.Qty.</th>
                         <th className="px-4 py-4 border-b border-gray-200">Unit</th>
                         <th className="px-4 py-4 border-b border-gray-200 w-28">Qty*</th>
                         <th className="px-4 py-4 border-b border-gray-200 w-32">Rate*</th>
                         <th className="px-4 py-4 border-b border-gray-200">Per Pcs Rate</th>
                         <th className="px-4 py-4 border-b border-gray-200 w-28">Dis (%)</th>
                         <th className="px-4 py-4 border-b border-gray-200 w-32 text-right">Total</th>
                         <th className="px-4 py-4 border-b border-gray-200 w-20">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {fields.map((field, index) => (
                         <ExchangeItemRow 
                           key={field.id}
                           index={index}
                           control={control}
                           register={register}
                           setValue={setValue}
                           remove={remove}
                           canRemove={fields.length > 0}
                           warehouseId={invoiceData?.invoice_details?.[0]?.warehouse_id}
                           productSearch={productSearch}
                           setProductSearch={setProductSearch}
                           currency={currency}
                           currencyPosition={currencyPosition}
                           hasReturnSelected={hasReturnSelected}
                         />
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>

            {/* Step 4: Final Summary & Totals */}
            <form id="return-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
               {/* Left: Sale Details */}
               <div className="lg:col-span-5 flex flex-col gap-6">
                 <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col h-full min-h-[350px]">
                    <h2 className="text-[16px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                       <div className="text-[#1e4ba1]"><FileText className="h-5 w-5" /></div>
                       Sale Details
                    </h2>
                    <div className="flex-1 flex flex-col">
                       <Controller
                         control={control}
                         name="sale_details"
                         render={({ field }) => (
                           <RichEditor 
                             value={field.value || ''} 
                             onChange={field.onChange} 
                             placeholder="Enter special instructions or purchase terms here..."
                           />
                         )}
                       />
                    </div>
                 </div>
               </div>

               {/* Center: Payment Summary (Blue Card) */}
               <div className="lg:col-span-3">
                 <div className="bg-[#1e4ba1] rounded-2xl p-7 shadow-xl text-white h-full flex flex-col justify-between relative overflow-hidden">
                    <div className="space-y-6">
                      <h3 className="text-[18px] font-bold tracking-tight">Payment Summary</h3>
                      
                      <div className="space-y-5 text-[14px]">
                        <div className="flex justify-between items-center opacity-70">
                          <span className="font-medium">Sub Total</span>
                          <span className="font-bold">{formatValue(exchangeTotals.subTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-70">
                          <span className="font-medium">Total Discount</span>
                          <span className="font-bold">- {formatValue((exchangeTotals.subTotal * (Number(sale_invoice_discount) || 0)) / 100)}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-70">
                          <span className="font-medium">Previous Due</span>
                          <span className="font-bold">{formatValue(0)}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-70">
                          <span className="font-medium">Tax (Vat 0%)</span>
                          <span className="font-bold">{formatValue(0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                       <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-1">GRAND TOTAL</p>
                            <p className="text-[28px] font-black tracking-tighter leading-none">{formatValue(exchangeTotals.grandTotal)}</p>
                          </div>
                          <span className="px-4 py-1.5 bg-white/10 rounded-lg text-[11px] font-black uppercase tracking-wider">Pending</span>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Right: Billing Form & Actions */}
               <div className="lg:col-span-4 flex flex-col gap-6">
                 <div className="bg-white rounded-xl border border-primary/10 p-6 space-y-5 shadow-sm">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">Sale Discount (%)</label>
                       <input type="number" {...register('sale_invoice_discount', { valueAsNumber: true })} className="w-full h-[42px] px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-[13px] font-bold text-gray-700 text-right outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all" placeholder="0.00" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">Shipping Cost ($)</label>
                       <input type="number" {...register('shipping_cost', { valueAsNumber: true })} className="w-full h-[42px] px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-[13px] font-bold text-gray-700 text-right outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all" placeholder="0.00" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">Paid Amount ($)</label>
                     <input 
                       type="number" 
                       {...register('paid_amount', { valueAsNumber: true })} 
                       disabled={netBalance.isPaidReadonly}
                       className="w-full h-[45px] px-4 bg-[#f8fafc] border border-gray-200 rounded-lg text-[15px] font-bold text-gray-900 text-right outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all disabled:bg-gray-50" 
                       placeholder="0.00" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">Payment Type</label>
                     <Controller 
                       control={control} 
                       name="sale_payment_type_id" 
                       render={({ field }) => ( 
                         <Select2 options={paymentTypeOptions} value={field.value} onChange={field.onChange} placeholder="Select payment type" className="font-medium" /> 
                       )} 
                     />
                   </div>
                   <div className="pt-2">
                      <label className={clsx(
                        "text-[13px] font-bold mb-1 block",
                        netBalance.changeAmount > 0 ? "text-emerald-600" : "text-rose-500"
                      )}>
                        {netBalance.changeAmount > 0 ? 'Change Amount' : 'Remaining Due'}
                      </label>
                      <div className={clsx(
                        "w-full h-[45px] px-4 rounded-lg flex items-center justify-end",
                        netBalance.changeAmount > 0 ? "bg-emerald-50/30 border border-emerald-100" : "bg-[#fff1f2]/30 border border-rose-100"
                      )}>
                         <span className={clsx(
                           "text-[18px] font-black tracking-tight",
                           netBalance.changeAmount > 0 ? "text-emerald-600" : "text-rose-600"
                         )}>
                           {formatValue(netBalance.changeAmount > 0 ? netBalance.changeAmount : netBalance.dueAmount)}
                         </span>
                      </div>
                   </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={handleDiscard} 
                      className="flex-1 h-[52px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[15px] shadow-sm active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      form="return-form"
                      disabled={isSaving} 
                      className="flex-[2] h-[52px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50 text-[15px] active:scale-95"
                    >
                      {isSaving ? (
                        <div className="h-5 w-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Check className="h-6 w-6" strokeWidth={3} /> Return</>
                      )}
                    </button>
                 </div>
               </div>
            </form>
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/return/merchant' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard this return?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}

const ExchangeItemRow = ({ index, control, register, setValue, remove, canRemove, warehouseId, productSearch, setProductSearch, currency, currencyPosition, hasReturnSelected }: any) => {
  const { data: productsData } = useProductsSearch(productSearch)
  
  const watchProductId = useWatch({ control, name: `items.${index}.product_id` })
  const qty = useWatch({ control, name: `items.${index}.quantity` })
  const rate = useWatch({ control, name: `items.${index}.rate` })
  const discPer = useWatch({ control, name: `items.${index}.discount_per` })
  const batchId = useWatch({ control, name: `items.${index}.batch_master_id` })
  const avlQty = useWatch({ control, name: `items.${index}.avl_qty` })
  const unit = useWatch({ control, name: `items.${index}.unit` })
  
  const { data: batchDataResponse } = useProductBatchInfo(watchProductId, warehouseId)

  const productOptions = useMemo(() => {
    const rawData = productsData as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    return data.map((p: any) => ({ value: p.id, label: p.product_name || p.text })) || []
  }, [productsData])

  const batchOptions = useMemo(() => {
    const batches = batchDataResponse?.data?.batchData || {}
    return Object.values(batches).map((b: any) => ({ value: b.id, label: b.text })) || []
  }, [batchDataResponse])

  const onProductChange = (val: any) => {
    setValue(`items.${index}.product_id`, val)
    setValue(`items.${index}.batch_master_id`, 0)
    setValue(`items.${index}.avl_qty`, 0)
    setValue(`items.${index}.unit`, '')
    setValue(`items.${index}.rate`, 0)
    setValue(`items.${index}.description`, '')
  }

  const onBatchChange = (val: any) => {
    setValue(`items.${index}.batch_master_id`, val)
    const batches = batchDataResponse?.data?.batchData || {}
    const selectedBatch = batches[val]
    if (selectedBatch) {
      setValue(`items.${index}.avl_qty`, Number(selectedBatch.avl_qty) || 0)
      setValue(`items.${index}.unit`, selectedBatch.unit || '')
      setValue(`items.${index}.rate`, Number(selectedBatch.price) || 0)
      setValue(`items.${index}.description`, batchDataResponse?.data?.product_details || '')
    }
  }

  const perPcsRate = useMemo(() => {
    const r = Number(rate) || 0
    const batches = batchDataResponse?.data?.batchData || {}
    const noOfQty = Number(batches[batchId]?.no_of_qty) || 1
    return r / noOfQty
  }, [rate, batchId, batchDataResponse])

  const rowTotalPrice = useMemo(() => {
    const q = Number(qty) || 0
    const r = Number(rate) || 0
    const d = Number(discPer) || 0
    const subtotal = q * r
    const discount = (subtotal * d) / 100
    const total = subtotal - discount
    setValue(`items.${index}.total_price`, total)
    return total
  }, [qty, rate, discPer, setValue, index])

  return (
    <tr className="bg-white hover:bg-gray-50/50 transition-colors text-center">
      <td className="px-2 py-3 text-left">
        <Controller 
          control={control} 
          name={`items.${index}.product_id`} 
          render={({ field }) => ( 
            <Select2 
              options={productOptions} 
              value={field.value} 
              onChange={onProductChange} 
              onInputChange={(val) => setProductSearch(val)} 
              placeholder="Search product..." 
              variant="ghost" 
              className="font-bold text-[#1e293b]" 
              menuPortalTarget={document.body}
              isDisabled={!hasReturnSelected}
            /> 
          )} 
        />
      </td>
      <td className="px-2 py-3">
        <input {...register(`items.${index}.description`)} className="w-full bg-transparent text-[12px] text-[#475569] outline-none font-medium placeholder:text-gray-300 text-center" placeholder="..." />
      </td>
      <td className="px-2 py-3">
        <Controller control={control} name={`items.${index}.batch_master_id`} render={({ field }) => ( <Select2 options={batchOptions} value={field.value} onChange={onBatchChange} placeholder="Select Batch" variant="ghost" isDisabled={!watchProductId} menuPortalTarget={document.body} /> )} />
      </td>
      <td className="px-2 py-3 text-[13px] text-gray-400 font-bold">{avlQty || '0.00'}</td>
      <td className="px-2 py-3 text-[13px] text-gray-400 font-bold">{unit || 'Unit'}</td>
      <td className="px-2 py-3">
        <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 text-[13px] font-black focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all outline-none text-[#1e293b]" />
      </td>
      <td className="px-2 py-3">
        <input type="number" {...register(`items.${index}.rate`, { valueAsNumber: true })} className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 text-[13px] font-black focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all outline-none text-[#1e293b]" />
      </td>
      <td className="px-2 py-3 text-[12px] text-gray-400 font-medium">{perPcsRate.toFixed(2)}</td>
      <td className="px-2 py-3">
        <input type="number" {...register(`items.${index}.discount_per`, { valueAsNumber: true })} className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5 text-[13px] font-black focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all outline-none text-[#1e293b]" />
      </td>
      <td className="px-2 py-3 text-right pr-4 text-[14px] font-black text-[#1e4ba1]">{formatCurrency(rowTotalPrice, currency, currencyPosition).replace(currency, '').trim()}</td>
      <td className="px-2 py-3 text-center">
        <button type="button" onClick={() => canRemove && remove(index)} disabled={!canRemove} className={clsx("text-[#64748b] transition-colors p-1 rounded-full hover:bg-rose-50", !canRemove ? "opacity-10 cursor-not-allowed" : "hover:text-rose-500")}><X className="h-4 w-4" strokeWidth={3} /></button>
      </td>
    </tr>
  )
}
