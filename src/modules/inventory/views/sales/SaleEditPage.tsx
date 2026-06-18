import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  X,
  Info,
  ShoppingCart,
  FileText
} from 'lucide-react'
import { useNavigate, useParams, Link } from '@tanstack/react-router'
import { saleSchema, type SaleFormValues } from '../../hooks/validation'
import { 
  useWarehouses, 
  useMerchants, 
  useProductsSearch, 
  useProductBatchInfo, 
  useMerchantDetails,
  usePaymentMethods,
  useUpdateSale,
  useSaleDetails
} from '../../hooks/useSales'
import { Select2 } from '@/components/Select/Select2'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/formatters'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { LoadingState } from '@/components/Loading/LoadingState'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useUiStore } from '@/store/useUiStore'

// ─── Main Page Component ───────────────────────────────────────────────────────

export const SaleEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const saleId = id ? parseInt(id as string, 10) : null
  const { currency, currencyPosition } = useSettings()
  const showNotificationModal = useUiStore((state) => state.showNotificationModal)
  const [merchantSearch, setMerchantSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [isHydrating, setIsHydrating] = useState(true)

  const { data: warehousesData } = useWarehouses()
  const { data: merchantsData } = useMerchants(merchantSearch)
  const { data: paymentMethodsData } = usePaymentMethods()
  const { mutate: updateSaleMutation, isPending: isSaving } = useUpdateSale()
  
  // Fetch initial details
  const { data: saleDetails, isLoading: isLoadingDetails } = useSaleDetails(saleId)

  
  // Helper for consistent formatting within this component
  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors, isDirty },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      warehouse_id: undefined,
      customer_id: undefined,
      items: [],
      payment_type_id: undefined,
      payment_amount: 0,
      paid_amount: 0,
      invoice_discount: 0,
      shipping_cost: 0,
      previous: 0,
      grand_total: 0,
      due_amount: 0,
      total_discount: 0,
      details: ''
    },
  })

  // Prepopulate form data when saleDetails changes
  useEffect(() => {
    if (saleDetails && isHydrating) {
      const data = saleDetails
      
      const itemsSource = Array.isArray(data.InvoiceDetails) ? data.InvoiceDetails : 
                          Array.isArray(data.invoice_details) ? data.invoice_details : [];
      
      const formattedItems = itemsSource.map((item: any) => ({
        product_id: item.product_id,
        batch_master_id: item.batch_master_id,
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        discount_per: parseFloat(item.discount_per) || 0,
        discount: parseFloat(item.discount) || 0,
        vat_per: parseFloat(item.vat_amnt_per) || 0,
        vat_amnt: parseFloat(item.vat_amnt) || 0,
        total_price: parseFloat(item.total_price) || 0,
        // The backend returns 'available_qty' on the item, fallback to 0 if not present
        avl_qty: parseFloat(item.available_qty) || parseFloat(item.batchMaster?.avl_qty) || 0,
        // The backend returns the product relation, extract the unit from there
        unit: item.product?.unit?.unit_name || item.batchMaster?.unit || '',
        description: item.description || ''
      }))

      let detailsValue = ''
      
      const isObjectString = (val: any) => typeof val === 'string' && (val.includes('[object Object]') || val.startsWith('{') || val.startsWith('['));

      // In Laravel, the HTML string might be 'invoice_details' or 'invoice_details_text' depending on the serialization.
      if (typeof data.invoice_details === 'string' && !isObjectString(data.invoice_details)) {
        detailsValue = data.invoice_details
      } else if (typeof data.invoice_details_text === 'string') {
        detailsValue = data.invoice_details_text
      } else if (typeof data.details === 'string' && !isObjectString(data.details)) {
        detailsValue = data.details
      }
      
      if (typeof detailsValue !== 'string' || isObjectString(detailsValue)) {
        detailsValue = ''
      }
      
      reset({
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        warehouse_id: itemsSource?.[0]?.warehouse_id,
        customer_id: data.customer_id,
        items: formattedItems?.length ? formattedItems : [],
        payment_type_id: data.initial_payment_method_id ?? data.payment_type ?? undefined,
        payment_amount: parseFloat(data.payment_amount) || parseFloat(data.paid_amount) || 0,
        paid_amount: parseFloat(data.paid_amount) || 0,
        invoice_discount: parseFloat(data.invoice_discount) || 0,
        shipping_cost: parseFloat(data.shipping_cost) || 0,
        previous: parseFloat(data.prevous_due) || parseFloat(data.customer?.previous_due) || 0,
        grand_total: parseFloat(data.total_amount) || parseFloat(data.net_total) || 0,
        due_amount: parseFloat(data.due_amount) || 0,
        total_discount: parseFloat(data.total_discount) || 0,
        details: detailsValue
      })

      // Short delay to allow sub-components (batches, etc.) to start their queries
      // before we lift the loading curtain
      setTimeout(() => {
        setIsHydrating(false)
      }, 800)
    }
  }, [saleDetails, reset, isHydrating])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  // Watch everything required for totals calculation using useWatch for guaranteed reactivity
  const watchItems = useWatch({ control, name: 'items' })
  const invoice_discount = useWatch({ control, name: 'invoice_discount' })
  const shipping_cost = useWatch({ control, name: 'shipping_cost' })
  const paid_amount = useWatch({ control, name: 'paid_amount' })
  const payment_type_id = useWatch({ control, name: 'payment_type_id' })
  const previous = useWatch({ control, name: 'previous' })
  const watchWarehouseId = useWatch({ control, name: 'warehouse_id' })
  const watchCustomerId = useWatch({ control, name: 'customer_id' })

  const { data: selectedMerchantDetails } = useMerchantDetails(watchCustomerId)

  // 1. Warehouse Change Logic
  useEffect(() => {
    if (!watchWarehouseId) return
    const currentItems = getValues('items')
    // Don't auto-clear if we are editing and data is loading/just loaded
    if (saleDetails && isLoadingDetails) return

    // If warehouse changes dynamically after initial load
    if (currentItems.length > 1 || (currentItems.length === 1 && currentItems[0].product_id !== 0)) {
       // Only clear if the warehouse ID actually differs from the initial load
       if (saleDetails && watchWarehouseId === saleDetails.invoice_details?.[0]?.warehouse_id) return
       
      setValue('items', [{
        product_id: 0,
        batch_master_id: 0,
        quantity: 1,
        rate: 0,
        discount_per: 0,
        discount: 0,
        vat_per: 0,
        vat_amnt: 0,
        total_price: 0,
        avl_qty: 0,
        unit: '',
        description: ''
      }])
    }
  }, [watchWarehouseId, setValue, getValues, saleDetails, isLoadingDetails])

  // 2. Merchant Details Logic
  useEffect(() => {
    if (selectedMerchantDetails?.data) {
      // Only overwrite previous due if customer is changed manually from the originally loaded one
      if (saleDetails && watchCustomerId === saleDetails.customer_id) return
      setValue('previous', selectedMerchantDetails.data.previous_due || 0)
    }
  }, [selectedMerchantDetails, setValue, saleDetails, watchCustomerId])

  // 3. Credit Sale Logic
  useEffect(() => {
    if (payment_type_id === 0 || payment_type_id === '0') {
      setValue('paid_amount', 0)
    }
  }, [payment_type_id, setValue])

  // 4. SYNCHRONOUS Calculations Logic (Derived from useWatch values)
  const totals = useMemo(() => {
    let totalAmount = 0
    let totalItemDiscount = 0
    let totalVatAmount = 0

    watchItems?.forEach((item) => {
      const qty = Number(item.quantity) || 0
      const rate = Number(item.rate) || 0
      const discPer = Number(item.discount_per) || 0
      const vatPer = Number(item.vat_per) || 0

      const subtotal = qty * rate
      const discount = (subtotal * discPer) / 100
      const subtotalAfterDiscount = subtotal - discount
      const vatAmnt = (subtotalAfterDiscount * vatPer) / 100
      const totalPrice = subtotalAfterDiscount

      totalAmount += totalPrice
      totalItemDiscount += discount
      totalVatAmount += vatAmnt
    })

    const invDisc = Number(invoice_discount) || 0
    const shipCost = Number(shipping_cost) || 0
    const paidAmt = Number(paid_amount) || 0
    const prevDue = Number(previous) || 0

    const totalDiscount = totalItemDiscount + invDisc
    const grandTotal = totalAmount + shipCost - invDisc + totalVatAmount
    const dueAmount = grandTotal - paidAmt
    const totalBalance = dueAmount + prevDue

    return {
      subTotal: totalAmount,
      totalItemDiscount,
      totalVatAmount,
      totalDiscount,
      grandTotal,
      dueAmount,
      totalBalance
    }
  }, [watchItems, invoice_discount, shipping_cost, paid_amount, previous])

  // Keep form values in sync with derived totals for submission
  useEffect(() => {
    setValue('grand_total', totals.grandTotal)
    setValue('due_amount', totals.dueAmount)
    setValue('total_discount', totals.totalDiscount)
    setValue('payment_amount', paid_amount)
  }, [totals, paid_amount, setValue])

  const onSubmit = (data: SaleFormValues) => {
    if (!saleDetails?.uuid) return

    const validItems = data.items.filter(item => item.product_id !== 0 && item.batch_master_id !== 0)
    if (validItems.length === 0) return
    
    // Final recalculation to ensure payload is perfect and match backend keys
    const itemsWithCalculations = validItems.map(item => {
      const subtotal = (item.quantity || 0) * (item.rate || 0)
      const discount = (subtotal * (item.discount_per || 0)) / 100
      const vat = ((subtotal - discount) * (item.vat_per || 0)) / 100
      return {
        ...item,
        available_qty: item.avl_qty, // Backend expects available_qty
        discount,
        vat_amnt: vat,
        total_price: subtotal - discount
      }
    })

    const payload = {
      ...data,
      items: itemsWithCalculations,
      total_vat_amnt: totals.totalVatAmount,
      net_total: totals.grandTotal
    }

    updateSaleMutation({ uuid: saleDetails.uuid, data: payload }, {
      onSuccess: () => navigate({ to: '/inventory/sales' }),
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/sales' })
    }
  }

  const warehouseOptions = useMemo(() => {
    const rawData = warehousesData as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    return data.map((w: any) => ({ value: w.id, label: w.text || w.name })) || []
  }, [warehousesData])

  const merchantOptions = useMemo(() => {
    const rawData = merchantsData as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    return data.map((m: any) => ({ value: m.id, label: m.text || m.customer_name })) || []
  }, [merchantsData])

  const paymentTypeOptions = useMemo(() => {
    const rawData = paymentMethodsData as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    const options = data.map((p: any) => ({ value: p.id ?? p.head_code, label: p.text ?? p.head_name })) || []
    
    // Only add Credit Sale if id 0 doesn't already exist in the list
    if (!options.some((opt: any) => opt.value === 0 || opt.value === '0')) {
      return [{ value: 0, label: 'Credit Sale' }, ...options]
    }
    return options
  }, [paymentMethodsData])

  const updateItemCalculations = useCallback((index: number) => {
    // This is now mainly for row-level fields that might be watched locally
    // The grand totals are calculated synchronously in the 'totals' memo
    const item = getValues(`items.${index}`)
    const qty = Number(item.quantity) || 0
    const rate = Number(item.rate) || 0
    const discPer = Number(item.discount_per) || 0
    const vatPer = Number(item.vat_per) || 0

    const subtotal = qty * rate
    const discount = (subtotal * discPer) / 100
    const subtotalAfterDiscount = subtotal - discount
    const vatAmnt = (subtotalAfterDiscount * vatPer) / 100
    const totalPrice = subtotalAfterDiscount

    setValue(`items.${index}.discount`, discount)
    setValue(`items.${index}.vat_amnt`, vatAmnt)
    setValue(`items.${index}.total_price`, totalPrice)
    trigger('items')
  }, [getValues, setValue, trigger])

  const onInvalid = (errors: any) => {
    console.error('Validation Errors:', errors);
    setTimeout(() => {
      const errorElement = document.querySelector('.text-rose-500, .border-rose-500, .text-rose-600');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  const itemsErrorMessage = errors.items?.message || (errors.items as any)?.root?.message;

  if (isLoadingDetails) {
    return <LoadingState message="Loading sale details..." />
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/sales"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Edit Sales Transaction <span className="text-[#64748b] text-[14px]">[{saleDetails?.invoice_id}]</span></h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        <form id="sale-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          
          {/* Row 1: Sales Header */}
          <div className="bg-white rounded-xl border border-primary/20 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/5 rounded-lg text-primary">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-[16px] font-medium text-[#1e293b]">Sales Header</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Warehouse */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">Warehouse <span className="text-rose-500">*</span></label>
                <Controller
                  control={control}
                  name="warehouse_id"
                  render={({ field }) => (
                    <Select2
                      options={warehouseOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select warehouse"
                      error={errors.warehouse_id?.message as string}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
              </div>

              {/* Merchant Name */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">Merchant Name <span className="text-rose-500">*</span></label>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <Select2
                      options={merchantOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onInputChange={(val) => setMerchantSearch(val)}
                      placeholder="Enter merchant name"
                      error={errors.customer_id?.message as string}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">Phone</label>
                <input type="text"
                  readOnly
                  value={selectedMerchantDetails?.data?.customer_mobile || ''}
                  className="w-full h-[38px] px-3 bg-gray-50/50 border border-gray-200 rounded-lg text-[13px] outline-none text-[#64748b] font-medium hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">Date <span className="text-rose-500">*</span></label>
                <input type="date"
                  {...register('date')}
                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {errors.date && <span className="text-rose-500 text-[11px] font-medium">{errors.date.message}</span>}
              </div>
            </div>
          </div>

          {/* Row 2: Item Details */}
          <div className="bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <h2 className="text-[16px] font-medium text-[#1e293b]">Item Details</h2>
              </div>
              <button
                type="button"
                onClick={() => append({ 
                  product_id: 0, batch_master_id: 0, quantity: 1, rate: 0,
                  discount_per: 0, discount: 0, vat_per: 0, vat_amnt: 0, total_price: 0,
                  avl_qty: 0, unit: '', description: ''
                })}
                className="bg-[#1E3A5F] hover:bg-[#153a80] text-white px-4 py-2 rounded-lg flex items-center gap-2 h-9 text-[12px] font-medium transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-[#D0E1FB] text-[#475569] text-[11px] font-medium uppercase tracking-wider">
                    <th className="px-2 py-2 min-w-[250px] border-r border-primary/10">Item Information*</th>
                    <th className="px-2 py-2 min-w-[150px] border-r border-primary/10">Desc</th>
                    <th className="px-2 py-2 min-w-[180px] border-r border-primary/10">Batch No*</th>
                    <th className="px-2 py-2 text-center border-r border-primary/10">Av.Qty.</th>
                    <th className="px-2 py-2 text-center border-r border-primary/10">Unit</th>
                    <th className="px-2 py-2 min-w-[60px] text-center w-24 border-r border-primary/10">Qty*</th>
                    <th className="px-2 py-2 text-center w-28 border-r border-primary/10">Rate*</th>
                    <th className="px-2 py-2 text-center border-r border-primary/10">Per Pcs Rate</th>
                    <th className="px-2 py-2 text-center w-28 border-r border-primary/10">Discount (%)</th>
                    <th className="px-2 py-2 text-right w-32 border-r border-primary/10">Total</th>
                    <th className="px-2 py-2 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {fields.map((field, index) => (
                    <ItemRow 
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      setValue={setValue}
                      getValues={getValues}
                      remove={remove}
                      canRemove={fields.length > 1}
                      warehouseId={watchWarehouseId}
                      productSearch={productSearch}
                      setProductSearch={setProductSearch}
                      updateCalculations={() => updateItemCalculations(index)}
                      currency={currency}
                      currencyPosition={currencyPosition}
                      errors={errors}
                      trigger={trigger}
                      invoiceId={saleId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {itemsErrorMessage && (
              <div className="p-4 bg-rose-50 text-rose-600 text-xs font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                {itemsErrorMessage}
              </div>
            )}
          </div>

          {/* Row 3: Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pb-10">
            {/* Sale Details */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-primary/20 p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-[16px] font-medium text-[#1e293b]">Sale Details</h2>
              </div>
              <Controller
                control={control}
                name="details"
                render={({ field }) => (
                  <RichEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Enter special instructions or sale terms here..."
                  />
                )}
              />
            </div>

            {/* Payment Summary - Using totals (Derived State) directly for synchronous updates */}
            <div className="lg:col-span-3 bg-[#1B4D90] rounded-xl p-6 text-white shadow-md flex flex-col justify-between">
              <div>
                <h2 className="text-[14px] font-medium mb-6 opacity-90">Payment Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-[13px] text-blue-50/80 font-medium">Sub Total</span>
                    <span className="font-medium text-white text-[14px]">{formatValue(totals.subTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-[13px] text-blue-50/80 font-medium">Total Discount</span>
                    <span className="font-medium text-yellow-200 text-[14px]">- {formatValue(totals.totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-[13px] text-blue-50/80 font-medium">Previous Due</span>
                    <span className="font-medium text-white text-[14px]">{formatValue(previous)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-blue-50/80 font-medium">Tax (Vat 0%)</span>
                    <span className="font-medium text-white text-[14px]">{formatValue(totals.totalVatAmount)}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-medium">Grand Total</span>
                  <div className="flex items-end justify-between">
                    <span className="text-[24px] font-medium tracking-tight leading-none text-white">{formatValue(totals.grandTotal)}</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-medium backdrop-blur-sm border border-white/10 shadow-sm">Pending</span>
                  </div>
              </div>
            </div>

            {/* Calculations & Actions */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-primary/20 p-6 space-y-5 flex-1 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Sale Discount ({currency})</label>
                    <input type="number" {...register('invoice_discount', { valueAsNumber: true })} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all" placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Shipping Cost ({currency})</label>
                    <input type="number" {...register('shipping_cost', { valueAsNumber: true })} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-500">Paid Amount ({currency})</label>
                  <input 
                    type="number" 
                    {...register('paid_amount', { 
                      valueAsNumber: true,
                      onChange: (e: any) => {
                        const val = parseFloat(e.target.value) || 0;
                        const maxAllowed = totals.grandTotal;
                        
                        if (val > maxAllowed) {
                          showNotificationModal(
                            'Invalid Payment',
                            `Paid amount (${formatValue(val)}) cannot exceed the invoice total (${formatValue(maxAllowed)}).`,
                            'warning'
                          );
                          setValue('paid_amount', maxAllowed);
                          trigger('paid_amount');
                        }
                      }
                    })} 
                    disabled={payment_type_id === 0 || payment_type_id === '0'} 
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-primary hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-gray-500">Payment Type</label>
                  <Controller control={control} name="payment_type_id" render={({ field }) => ( 
                    <Select2 
                      options={paymentTypeOptions} 
                      value={field.value} 
                      onChange={(val) => {
                        field.onChange(val)
                        trigger('payment_type_id')
                      }} 
                      placeholder="Select payment type" 
                      error={errors.payment_type_id?.message as string}
                      menuPortalTarget={document.body} 
                    /> 
                  )} />
                </div>
                <div className="pt-2">
                  <div className="bg-[#fffcfb] p-3 rounded-lg border border-rose-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-rose-500 uppercase tracking-tight">Remaining Balance</span>
                    <div className="text-[18px] font-medium text-rose-600 leading-none">{formatValue(totals.totalBalance)}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={handleDiscard} className="px-6 h-10 bg-white border border-gray-200 text-[#64748b] font-medium rounded-lg hover:bg-gray-50 transition-all text-[13px] shadow-sm">Cancel</button>
                <button type="submit" form="sale-form" disabled={isSaving} className="px-8 h-10 bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[13px]">
                  {isSaving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check className="h-4 w-4" /> Update</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal isOpen={isDiscardModalOpen} onClose={() => setIsDiscardModalOpen(false)} onConfirm={() => navigate({ to: '/inventory/sales' })} title="Discard Changes?" message="You have unsaved changes. Are you sure you want to discard them?" confirmText="Yes, Discard" variant="danger" />
    </div>
  )
}

const ItemRow = ({ index, control, register, setValue, getValues, remove, canRemove, warehouseId, productSearch, setProductSearch, updateCalculations, currency, currencyPosition, errors, trigger, invoiceId }: any) => {
  const { data: productsData } = useProductsSearch(productSearch)
  const showNotificationModal = useUiStore((state) => state.showNotificationModal)
  
  // Use useWatch for guaranteed reactivity of all row-level fields
  const watchProductId = useWatch({ control, name: `items.${index}.product_id` })
  const qty = useWatch({ control, name: `items.${index}.quantity` })
  const rate = useWatch({ control, name: `items.${index}.rate` })
  const discPer = useWatch({ control, name: `items.${index}.discount_per` })
  const batchId = useWatch({ control, name: `items.${index}.batch_master_id` })
  const avlQty = useWatch({ control, name: `items.${index}.avl_qty` })
  const unit = useWatch({ control, name: `items.${index}.unit` })
  
  const { data: batchDataResponse } = useProductBatchInfo(watchProductId, warehouseId, invoiceId, 1)

  const productOptions = useMemo(() => {
    const rawData = productsData as any
    const data = Array.isArray(rawData) ? rawData : rawData?.data || []
    return data.map((p: any) => ({ value: p.id, label: p.product_name || p.text })) || []
  }, [productsData])

  const batchOptions = useMemo(() => {
    const batches = batchDataResponse?.data?.batchData || {}
    return Object.values(batches).map((b: any) => ({ value: b.id, label: b.text })) || []
  }, [batchDataResponse])

  const onProductChange = (val: any, fieldOnChange?: (v: any) => void) => {
    fieldOnChange?.(val)
    setValue(`items.${index}.product_id`, val, { shouldDirty: true })
    setValue(`items.${index}.batch_master_id`, 0, { shouldDirty: true })
    setValue(`items.${index}.avl_qty`, 0, { shouldDirty: true })
    setValue(`items.${index}.unit`, '', { shouldDirty: true })
    setValue(`items.${index}.rate`, 0, { shouldDirty: true })
    updateCalculations()
  }

  const onBatchChange = (val: any, fieldOnChange?: (v: any) => void) => {
    fieldOnChange?.(val)
    setValue(`items.${index}.batch_master_id`, val, { shouldDirty: true })
    const batches = batchDataResponse?.data?.batchData || {}
    const selectedBatch = batches[val]
    if (selectedBatch) {
      setValue(`items.${index}.avl_qty`, Number(selectedBatch.avl_qty) || 0, { shouldDirty: true })
      setValue(`items.${index}.unit`, selectedBatch.unit || '', { shouldDirty: true })
      setValue(`items.${index}.rate`, Number(selectedBatch.price) || 0, { shouldDirty: true })
    }
    updateCalculations()
  }

  // Automatically sync description, avl_qty and unit if they are missing but batch data is ready
  useEffect(() => {
    if (batchDataResponse?.data) {
      const batches = batchDataResponse.data.batchData || {}
      const selectedBatch = batches[batchId]
      
      // Auto-load product description
      if (batchDataResponse.data.product_details) {
        setValue(`items.${index}.description`, batchDataResponse.data.product_details)
      }

      if (selectedBatch) {
        setValue(`items.${index}.avl_qty`, Number(selectedBatch.avl_qty) || 0)
        setValue(`items.${index}.unit`, selectedBatch.unit || '')
        if (selectedBatch.price && !getValues(`items.${index}.rate`)) {
           setValue(`items.${index}.rate`, Number(selectedBatch.price) || 0)
           trigger(`items.${index}.rate`)
        }
      }
    }
  }, [batchDataResponse, batchId, index, setValue, getValues, trigger])

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
    return subtotal - discount
  }, [qty, rate, discPer])

  const rowErrors = errors.items?.[index]

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '.', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <tr className="bg-white hover:bg-gray-50/50 transition-colors">
      <td className="px-2 py-2 border-r border-primary/10">
        <Controller control={control} name={`items.${index}.product_id`} render={({ field }) => ( <Select2 options={productOptions} value={field.value} onChange={(v) => onProductChange(v, field.onChange)} onInputChange={(val) => setProductSearch(val)} placeholder="Select product" variant="ghost" className="font-medium text-[#1e293b]" isDisabled={!warehouseId} error={rowErrors?.product_id?.message as string} menuPortalTarget={document.body} /> )} />
      </td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input 
          {...register(`items.${index}.description`)} 
          readOnly 
          tabIndex={-1}
          className="w-full bg-transparent text-[13px] text-[#475569] outline-none font-medium placeholder:text-gray-300 transition-all cursor-default" 
          placeholder="Desc" 
        />
      </td>
      <td className="px-2 py-2 border-r border-primary/10">
        <Controller control={control} name={`items.${index}.batch_master_id`} render={({ field }) => ( <Select2 options={batchOptions} value={field.value} onChange={(v) => onBatchChange(v, field.onChange)} placeholder="Select Batch" variant="ghost" isDisabled={!watchProductId || !warehouseId} error={rowErrors?.batch_master_id?.message as string} menuPortalTarget={document.body} /> )} />
      </td>
      <td className="px-2 py-2 text-center text-[13px] text-[#94a3b8] font-medium bg-gray-50/30 border-r border-primary/10">{avlQty || '0.00'}</td>
      <td className="px-2 py-2 text-center text-[13px] text-[#94a3b8] font-medium bg-gray-50/30 border-r border-primary/10">{unit || 'Unit'}</td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input 
          type="number" 
          min="1" 
          step="1" 
          onKeyDown={handleQtyKeyDown}
          {...register(`items.${index}.quantity`, { 
            valueAsNumber: true, 
            onChange: (e: any) => {
              const val = parseFloat(e.target.value) || 0;
              const available = parseFloat(avlQty) || 0;
              
              if (val > available && available > 0) {
                showNotificationModal(
                  'Insufficient Stock',
                  `The entered quantity (${val}) exceeds the available stock (${available}).`,
                  'warning'
                );
                setValue(`items.${index}.quantity`, 1);
                updateCalculations();
                trigger(`items.${index}.quantity`);
                return;
              }

              const cleanVal = Math.max(1, parseInt(e.target.value) || 1);
              setValue(`items.${index}.quantity`, cleanVal);
              updateCalculations(); 
              trigger(`items.${index}.quantity`); 
            } 
          })} 
          className={clsx("w-full text-center bg-white border rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 outline-none text-[#1e293b]", rowErrors?.quantity ? "border-rose-500" : "border-gray-200")} 
        />
        {rowErrors?.quantity && <span className="text-[10px] text-rose-500 block text-center mt-0.5">{rowErrors.quantity.message as string}</span>}
      </td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input 
          type="number" 
          {...register(`items.${index}.rate`, { 
            valueAsNumber: true, 
            onChange: () => {
              updateCalculations();
              trigger(`items.${index}.rate`);
            } 
          })} 
          className={clsx("w-full text-center bg-white border rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 outline-none text-[#1e293b]", rowErrors?.rate ? "border-rose-500" : "border-gray-200")} 
        />
        {rowErrors?.rate && <span className="text-[10px] text-rose-500 block text-center mt-0.5">{rowErrors.rate.message as string}</span>}
      </td>
      <td className="px-2 py-2 text-center text-[13px] text-[#94a3b8] font-medium bg-gray-50/30 border-r border-primary/10">{perPcsRate.toFixed(2)}</td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input type="number" {...register(`items.${index}.discount_per`, { valueAsNumber: true, onChange: () => updateCalculations() })} className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]" />
      </td>
      <td className="px-2 py-2 text-right text-[13px] font-medium text-[#475569] border-r border-primary/10">{formatCurrency(rowTotalPrice, currency, currencyPosition).replace(currency, '').trim()}</td>
      <td className="px-2 py-2 text-center">
        <button type="button" onClick={() => canRemove && remove(index)} disabled={!canRemove} className={clsx("text-[#64748b] transition-colors p-1", !canRemove ? "opacity-20 cursor-not-allowed" : "hover:text-rose-500")}><X className="h-4.5 w-4.5" /></button>
      </td>
    </tr>
  )
}
