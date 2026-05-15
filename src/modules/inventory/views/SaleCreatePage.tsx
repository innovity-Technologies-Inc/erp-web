import { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Undo2, 
  Check, 
  X,
  Info,
  ShoppingCart,
  Receipt,
  CreditCard,
  User,
  Package,
  Calendar,
  Phone,
  Store,
  Wallet
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { saleSchema, type SaleFormValues } from '../hooks/validation'
import { 
  useWarehouses, 
  useMerchants, 
  useProductsSearch, 
  useProductBatchInfo, 
  useMerchantDetails,
  usePaymentMethods,
  useCreateSale
} from '../hooks/useSales'
import { Select2 } from '@/components/Select/Select2'
import { useSettings } from '@/hooks/useSettings'
import { clsx } from 'clsx'
import { formatCurrency } from '@/utils/formatters'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'

export const SaleCreatePage = () => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const [merchantSearch, setMerchantSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const { data: warehousesData } = useWarehouses()
  const { data: merchantsData } = useMerchants(merchantSearch)
  const { data: productsData } = useProductsSearch(productSearch)
  const { data: paymentMethodsData } = usePaymentMethods()
  const { mutate: createSaleMutation, isPending: isSaving } = useCreateSale()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      warehouse_id: undefined,
      customer_id: undefined,
      items: [{
        product_id: 0,
        batch_master_id: 0,
        quantity: 1,
        rate: 0,
        discount_per: 0,
        discount: 0,
        vat_per: 0,
        vat_amnt: 0,
        total_price: 0,
      }],
      payment_type_id: undefined,
      payment_amount: 0,
      paid_amount: 0,
      invoice_discount: 0,
      shipping_cost: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchItems = watch('items')
  const watchWarehouseId = watch('warehouse_id')
  const watchCustomerId = watch('customer_id')
  const watchInvoiceDiscount = watch('invoice_discount')
  const watchShippingCost = watch('shipping_cost')
  const watchPaidAmount = watch('paid_amount')

  const { data: selectedMerchantDetails } = useMerchantDetails(watchCustomerId)

  // Calculations
  const subTotal = useMemo(() => {
    return watchItems.reduce((acc, item) => acc + (item.total_price || 0), 0)
  }, [watchItems])

  const totalItemDiscount = useMemo(() => {
    return watchItems.reduce((acc, item) => acc + (item.discount || 0), 0)
  }, [watchItems])

  const grandTotal = useMemo(() => {
    return subTotal - (watchInvoiceDiscount || 0) + (watchShippingCost || 0)
  }, [subTotal, watchInvoiceDiscount, watchShippingCost])

  const dueAmount = useMemo(() => {
    return Math.max(0, grandTotal - (watchPaidAmount || 0))
  }, [grandTotal, watchPaidAmount])

  useEffect(() => {
    setValue('grand_total', grandTotal)
    setValue('due_amount', dueAmount)
    setValue('total_discount', totalItemDiscount + (watchInvoiceDiscount || 0))
  }, [grandTotal, dueAmount, totalItemDiscount, watchInvoiceDiscount, setValue])

  useEffect(() => {
    if (selectedMerchantDetails?.data) {
      setValue('previous', selectedMerchantDetails.data.previous_due || 0)
    }
  }, [selectedMerchantDetails, setValue])

  const onSubmit = (data: SaleFormValues) => {
    createSaleMutation(data, {
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
    return warehousesData?.data?.map((w: any) => ({ value: w.id, label: w.name })) || []
  }, [warehousesData])

  const merchantOptions = useMemo(() => {
    return merchantsData?.data?.map((m: any) => ({ value: m.id, label: m.customer_name })) || []
  }, [merchantsData])

  const productOptions = useMemo(() => {
    return productsData?.data?.map((p: any) => ({ value: p.id, label: p.product_name })) || []
  }, [productsData])

  const paymentTypeOptions = useMemo(() => {
    const options = paymentMethodsData?.data?.map((p: any) => ({ value: p.id, label: p.head_name })) || []
    return [{ value: 0, label: 'Credit Sale' }, ...options]
  }, [paymentMethodsData])

  // Helper to update item totals
  const updateItemCalculations = (index: number) => {
    const item = getValues(`items.${index}`)
    const qty = item.quantity || 0
    const rate = item.rate || 0
    const discPer = item.discount_per || 0
    const vatPer = item.vat_per || 0

    const discount = (qty * rate * discPer) / 100
    const subTotal = (qty * rate) - discount
    const vatAmnt = (subTotal * vatPer) / 100
    const totalPrice = subTotal + vatAmnt

    setValue(`items.${index}.discount`, discount)
    setValue(`items.${index}.vat_amnt`, vatAmnt)
    setValue(`items.${index}.total_price`, totalPrice)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDiscard}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-[#1e293b]">New Sales Transaction</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button
              onClick={() => navigate({ to: '/inventory/sales' })}
              className="px-6 h-10 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <form id="sale-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-6">
          
          {/* Main Form Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            
            {/* Purchase Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[#1e293b]">Purchase Header</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Warehouse */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" />
                    Warehouse <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="warehouse_id"
                    render={({ field }) => (
                      <Select2
                        options={warehouseOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select warehouse"
                        error={errors.warehouse_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Merchant Name */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Merchant Name <span className="text-rose-500">*</span>
                  </label>
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
                        error={errors.customer_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Payment Type (Select only, specific for header?) */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    Payment Type
                  </label>
                  <Controller
                    control={control}
                    name="payment_type_id"
                    render={({ field }) => (
                      <Select2
                        options={paymentTypeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select payment type"
                      />
                    )}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedMerchantDetails?.data?.customer_mobile || ''}
                    className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none text-gray-500"
                    placeholder="01xxxxxxxxx"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                  {errors.date && <span className="text-rose-500 text-xs">{errors.date.message}</span>}
                </div>
              </div>
            </div>

            {/* Item Details Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#1e293b]">Item Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => append({ 
                    product_id: 0, 
                    batch_master_id: 0, 
                    quantity: 1, 
                    rate: 0,
                    discount_per: 0,
                    discount: 0,
                    vat_per: 0,
                    vat_amnt: 0,
                    total_price: 0
                  })}
                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2 rounded-lg flex items-center gap-2 h-9 text-[13px] font-medium transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eff6ff] text-[#1e4ba1] text-[12px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 min-w-[250px]">Item Information <span className="text-rose-500">*</span></th>
                      <th className="px-4 py-3 min-w-[150px]">Desc</th>
                      <th className="px-4 py-3 min-w-[180px]">Batch No <span className="text-rose-500">*</span></th>
                      <th className="px-4 py-3 text-center">Av.Qty.</th>
                      <th className="px-4 py-3 text-center">Unit</th>
                      <th className="px-4 py-3 text-center w-24">Qty <span className="text-rose-500">*</span></th>
                      <th className="px-4 py-3 text-center w-28">Rate <span className="text-rose-500">*</span></th>
                      <th className="px-4 py-3 text-center">Per Pcs Rate</th>
                      <th className="px-4 py-3 text-center w-28">Discount (%)</th>
                      <th className="px-4 py-3 text-right w-32">Total</th>
                      <th className="px-4 py-3 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fields.map((field, index) => (
                      <ItemRow 
                        key={field.id}
                        index={index}
                        control={control}
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
                        watch={watch}
                        remove={remove}
                        warehouseId={watchWarehouseId}
                        updateCalculations={() => updateItemCalculations(index)}
                        errors={errors}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              
              {errors.items && !Array.isArray(errors.items) && (
                <div className="p-4 bg-rose-50 text-rose-500 text-sm flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {errors.items.message}
                </div>
              )}
            </div>

            {/* Sale Details Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Receipt className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[#1e293b]">Sale Details</h2>
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-primary transition-all">
                {/* Simplified Editor Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-1">
                   <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 font-bold text-sm px-2">B</button>
                   <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 italic text-sm px-2">I</button>
                   <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 underline text-sm px-2">U</button>
                   <div className="w-px h-6 bg-gray-300 mx-1"></div>
                   <button type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-600 text-sm px-2">List</button>
                </div>
                <textarea
                  {...register('details')}
                  className="w-full h-40 p-4 text-[14px] outline-none resize-none"
                  placeholder="Enter special instructions or purchase terms here..."
                />
              </div>
            </div>
          </div>

          {/* Side Summary Section */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            
            {/* Payment Summary Box */}
            <div className="bg-[#1e4ba1] rounded-2xl p-6 text-white shadow-xl shadow-[#1e4ba1]/20">
              <h2 className="text-lg font-semibold mb-6">Payment Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-blue-100">
                  <span className="text-[14px]">Sub Total</span>
                  <span className="font-medium">{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-100">
                  <span className="text-[14px]">Total Discount</span>
                  <span className="font-medium text-rose-300">-{formatCurrency(totalItemDiscount + (watchInvoiceDiscount || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-blue-100">
                  <span className="text-[14px]">Previous Due</span>
                  <span className="font-medium">{formatCurrency(watch('previous') || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-100">
                  <span className="text-[14px]">Tax (Vat 0%)</span>
                  <span className="font-medium">{formatCurrency(0)}</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-1">
                   <span className="text-[12px] uppercase tracking-widest text-blue-200 opacity-70">GRAND TOTAL</span>
                   <div className="flex items-end justify-between">
                     <span className="text-2xl font-bold">{formatCurrency(grandTotal)}</span>
                     <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">Pending</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Calculations Form Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
               {/* Sale Discount */}
               <div className="space-y-2">
                 <label className="text-[13px] font-semibold text-gray-600">Sale Discount ({currency})</label>
                 <input
                    type="number"
                    {...register('invoice_discount', { valueAsNumber: true })}
                    className="w-full h-[38px] px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all font-medium text-gray-700"
                    placeholder="0.00"
                  />
               </div>

               {/* Shipping Cost */}
               <div className="space-y-2">
                 <label className="text-[13px] font-semibold text-gray-600">Shipping Cost ({currency})</label>
                 <input
                    type="number"
                    {...register('shipping_cost', { valueAsNumber: true })}
                    className="w-full h-[38px] px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all font-medium text-gray-700"
                    placeholder="0.00"
                  />
               </div>

               {/* Paid Amount */}
               <div className="space-y-2">
                 <label className="text-[13px] font-semibold text-gray-600">Paid Amount ({currency})</label>
                 <input
                    type="number"
                    {...register('paid_amount', { valueAsNumber: true })}
                    className="w-full h-[38px] px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all font-bold text-emerald-600"
                    placeholder="0.00"
                  />
               </div>

               {/* Payment Type */}
               <div className="space-y-2">
                 <label className="text-[13px] font-semibold text-gray-600">Payment Type</label>
                 <Controller
                    control={control}
                    name="payment_type_id"
                    render={({ field }) => (
                      <Select2
                        options={paymentTypeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select payment type"
                        variant="solid"
                      />
                    )}
                  />
               </div>

               {/* Remaining Balance */}
               <div className="pt-4 border-t border-gray-100 space-y-1">
                 <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Remaining Balance</span>
                 <div className="text-xl font-bold text-rose-500 flex items-center justify-end">
                    {formatCurrency(dueAmount)}
                 </div>
               </div>
            </div>

            {/* Final Actions */}
            <div className="flex items-center gap-3">
               <button
                 type="button"
                 onClick={handleDiscard}
                 className="flex-1 h-12 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 form="sale-form"
                 disabled={isSaving}
                 className="flex-[1.5] h-12 bg-[#10b981] hover:bg-[#059669] text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isSaving ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Save
                    </>
                 )}
               </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/sales' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}

// ─── Row Component ────────────────────────────────────────────────────────────

const ItemRow = ({ 
  index, 
  control, 
  register, 
  setValue, 
  getValues, 
  watch, 
  remove, 
  warehouseId,
  updateCalculations,
  errors 
}: any) => {
  const [productSearch, setProductSearch] = useState('')
  const { data: productsData } = useProductsSearch(productSearch)
  
  const watchProductId = watch(`items.${index}.product_id`)
  const { data: batchDataResponse } = useProductBatchInfo(watchProductId, warehouseId)

  const productOptions = useMemo(() => {
    return productsData?.data?.map((p: any) => ({ value: p.id, label: p.product_name })) || []
  }, [productsData])

  const batchOptions = useMemo(() => {
    const batches = batchDataResponse?.data?.batchData || {}
    return Object.values(batches).map((b: any) => ({ value: b.id, label: b.text })) || []
  }, [batchDataResponse])

  // When product or batch changes, update row fields
  const onProductChange = (val: any) => {
    setValue(`items.${index}.product_id`, val)
    setValue(`items.${index}.batch_master_id`, 0)
    setValue(`items.${index}.avl_qty`, 0)
    setValue(`items.${index}.unit`, '')
    setValue(`items.${index}.rate`, 0)
    updateCalculations()
  }

  const onBatchChange = (val: any) => {
    setValue(`items.${index}.batch_master_id`, val)
    const batches = batchDataResponse?.data?.batchData || {}
    const selectedBatch = batches[val]
    if (selectedBatch) {
      setValue(`items.${index}.avl_qty`, selectedBatch.avl_qty)
      setValue(`items.${index}.unit`, selectedBatch.unit)
      setValue(`items.${index}.rate`, selectedBatch.price)
      updateCalculations()
    }
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <Controller
          control={control}
          name={`items.${index}.product_id`}
          render={({ field }) => (
            <Select2
              options={productOptions}
              value={field.value}
              onChange={onProductChange}
              onInputChange={(val) => setProductSearch(val)}
              placeholder="Select product name"
              variant="ghost"
              className="font-semibold"
            />
          )}
        />
      </td>
      <td className="px-4 py-3">
        <input
          {...register(`items.${index}.description`)}
          className="w-full bg-transparent text-[13px] text-gray-600 outline-none"
          placeholder="Desc"
        />
      </td>
      <td className="px-4 py-3">
        <Controller
          control={control}
          name={`items.${index}.batch_master_id`}
          render={({ field }) => (
            <Select2
              options={batchOptions}
              value={field.value}
              onChange={onBatchChange}
              placeholder="Select Batch"
              variant="ghost"
              isDisabled={!watchProductId || !warehouseId}
            />
          )}
        />
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-500 font-medium bg-gray-50/30">
        {watch(`items.${index}.avl_qty`) || '0.00'}
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-500 font-medium bg-gray-50/30">
        {watch(`items.${index}.unit`) || 'Unit'}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          {...register(`items.${index}.quantity`, { 
            valueAsNumber: true,
            onChange: updateCalculations 
          })}
          className="w-full text-center bg-white border border-gray-200 rounded-md py-1 text-[13px] font-bold focus:border-primary outline-none"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          {...register(`items.${index}.rate`, { 
            valueAsNumber: true,
            onChange: updateCalculations 
          })}
          className="w-full text-center bg-white border border-gray-200 rounded-md py-1 text-[13px] font-bold focus:border-primary outline-none"
        />
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-500 font-medium bg-gray-50/30">
        {watch(`items.${index}.rate`) || '0.00'}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          {...register(`items.${index}.discount_per`, { 
            valueAsNumber: true,
            onChange: updateCalculations 
          })}
          className="w-full text-center bg-white border border-gray-200 rounded-md py-1 text-[13px] font-medium focus:border-primary outline-none"
        />
      </td>
      <td className="px-4 py-3 text-right text-[13px] font-bold text-[#1e293b]">
        {formatCurrency(watch(`items.${index}.total_price`) || 0)}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => index > 0 && remove(index)}
          className={clsx(
            "p-1.5 rounded-lg transition-all",
            index === 0 ? "opacity-30 cursor-not-allowed text-gray-400" : "text-rose-500 hover:bg-rose-50 hover:scale-110"
          )}
          disabled={index === 0}
        >
          <X className="h-5 w-5" />
        </button>
      </td>
    </tr>
  )
}
