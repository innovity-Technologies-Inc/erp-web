import { useEffect, useState, useMemo, useCallback } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { 
  ArrowLeft, 
  FileText, 
  Check, 
  PlusCircle,
  XCircle,
  Box,
  Plus,
  Info,
  Trash2,
  Briefcase
} from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { quotationSchema, type QuotationFormValues } from './schema'
import { formatCurrency } from '@/utils/formatters'
import { 
  useWarehouses, 
  useMerchants, 
  useProductsSearch, 
  usePaymentMethods 
} from '../../../hooks/useSales'
import { useServiceSelect2 } from '../../../hooks/useQuotation'
import { apiClient } from '@/api/client'
import { clsx } from 'clsx'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'

interface QuotationFormProps {
  initialData?: any
  onSubmit: (data: QuotationFormValues) => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit' | 'invoice'
}

export const QuotationForm = ({ initialData, onSubmit, isSubmitting, mode = 'create' }: QuotationFormProps) => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const [merchantSearch, setMerchantSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  // Queries
  const { data: warehouses } = useWarehouses()
  const { data: merchants } = useMerchants(merchantSearch)
  const { data: products } = useProductsSearch(productSearch)
  const { data: services } = useServiceSelect2(serviceSearch)
  const { data: paymentMethods } = usePaymentMethods()

  const defaultValues: Partial<QuotationFormValues> = {
    warehouse_id: '',
    customer_id: '',
    quotdate: new Date().toISOString().split('T')[0],
    expire_date: new Date().toISOString().split('T')[0],
    quot_description: '',
    sale_items: [
      { product_id: '', batch_master_id: '', quantity: 1, rate: 0, discount_per: 0, discount: 0, vat_per: 0, vat_amnt: 0, total_price: 0, available_qty: 0, unit: '', description: '' }
    ],
    selectService: false,
    service_items: [],
    quot_dis_item: 0,
    quot_dis_service: 0,
    item_total_amount: 0,
    item_total_discount: 0,
    item_total_vat: 0,
    service_total_amount: 0,
    service_total_discount: 0,
    service_total_vat: 0,
    sale_payment_amount: 0,
    sale_payment_type_id: '',
    service_payment_amount: 0,
    service_payment_type_id: '',
  }

  const methods = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: initialData || defaultValues,
  })

  const { control, setValue, handleSubmit, register, watch, formState: { errors } } = methods

  const saleFields = useFieldArray({ control, name: 'sale_items' })
  const serviceFields = useFieldArray({ control, name: 'service_items' })

  // Watches
  const watchWarehouse = useWatch({ control, name: 'warehouse_id' })
  const watchCustomer = useWatch({ control, name: 'customer_id' })
  const watchSaleItems = useWatch({ control, name: 'sale_items' }) || []
  const watchServiceItems = useWatch({ control, name: 'service_items' }) || []
  const watchSelectService = useWatch({ control, name: 'selectService' })
  const watchQuotDisItem = useWatch({ control, name: 'quot_dis_item' }) || 0
  const watchQuotDisService = useWatch({ control, name: 'quot_dis_service' }) || 0
  const watchPaymentTypeId = useWatch({ control, name: 'sale_payment_type_id' })

  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  // ------------------ Merchant Phone ------------------
  const [customerPhone, setCustomerPhone] = useState('')
  useEffect(() => {
    if (watchCustomer) {
      apiClient.get(`/inventory/merchant/get-data/${watchCustomer}`).then(res => {
        setCustomerPhone(res.data?.data?.customer_mobile || '')
      })
    } else {
      setCustomerPhone('')
    }
  }, [watchCustomer])

  // ------------------ Options Mapping ------------------
  const warehouseOptions = useMemo(() => {
    const rawData = warehouses as any
    const dataList = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.results || []
    return dataList.map((w: any) => ({ value: w.id, label: w.text || w.warehouse_name }))
  }, [warehouses])

  const merchantOptions = useMemo(() => {
    const opts = merchants?.data ? merchants.data.map((m: any) => ({ value: m.id, label: m.customer_name })) : []
    if (initialData?.customer_id && initialData?._merchant_fallback) {
       if (!opts.find((o: any) => String(o.value) === String(initialData.customer_id))) {
          opts.unshift({ value: initialData.customer_id, label: initialData._merchant_fallback })
       }
    }
    return opts
  }, [merchants, initialData])

  const productOptions = useMemo(() => {
    const rawData = products as any
    const dataList = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.results || []
    const opts = dataList.map((p: any) => ({ value: p.id, label: p.product_name || p.text }))
    
    initialData?.sale_items?.forEach((item: any) => {
       if (item.product_id && item._product_fallback) {
         if (!opts.find((o: any) => String(o.value) === String(item.product_id))) {
           opts.push({ value: item.product_id, label: item._product_fallback })
         }
       }
    })
    return opts
  }, [products, initialData])

  const serviceOptions = useMemo(() => {
    const rawData = services as any
    const dataList = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.results || []
    const opts = dataList.map((s: any) => ({ value: s.id, label: s.text || s.service_name }))
    
    initialData?.service_items?.forEach((item: any) => {
       if (item.service_id && item._service_fallback) {
         if (!opts.find((o: any) => String(o.value) === String(item.service_id))) {
           opts.push({ value: item.service_id, label: item._service_fallback })
         }
       }
    })
    return opts
  }, [services, initialData])

  const paymentOptions = useMemo(() => {
    const rawData = paymentMethods as any
    const dataList = Array.isArray(rawData) ? rawData : rawData?.data || []
    return dataList.map((p: any) => ({ value: p.id, label: p.text || p.name }))
  }, [paymentMethods])

  // ------------------ Calculations ------------------
  const updateSaleTotals = useCallback(() => {
    const items = methods.getValues('sale_items') || []
    let totalAmount = 0
    let totalItemDiscount = 0
    let totalVatAmount = 0

    items.forEach(item => {
      totalAmount += Number(item.total_price) || 0
      totalItemDiscount += Number(item.discount) || 0
      totalVatAmount += Number(item.vat_amnt) || 0
    })

    const invoiceDiscount = Number(methods.getValues('quot_dis_item')) || 0
    const totalDiscount = totalItemDiscount + invoiceDiscount
    const grandTotal = totalAmount - invoiceDiscount + totalVatAmount

    setValue('item_total_discount', totalDiscount)
    setValue('item_total_vat', totalVatAmount)
    setValue('item_total_amount', grandTotal)
    if (mode === 'invoice') {
      setValue('sale_payment_amount', grandTotal)
    }
  }, [methods, setValue, mode])

  const updateServiceTotals = useCallback(() => {
    const items = methods.getValues('service_items') || []
    let totalAmount = 0
    let totalItemDiscount = 0
    let totalVatAmount = 0

    items.forEach(item => {
      totalAmount += Number(item.total) || 0
      totalItemDiscount += Number(item.discount_value) || 0
      totalVatAmount += Number(item.vat_amnt) || 0
    })

    const invoiceDiscount = Number(methods.getValues('quot_dis_service')) || 0
    const totalDiscount = totalItemDiscount + invoiceDiscount
    const grandTotal = totalAmount - invoiceDiscount + totalVatAmount

    setValue('service_total_discount', totalDiscount)
    setValue('service_total_vat', totalVatAmount)
    setValue('service_total_amount', grandTotal)
    if (mode === 'invoice') {
      setValue('service_payment_amount', grandTotal)
    }
  }, [methods, setValue, mode])

  useEffect(() => {
    updateSaleTotals()
  }, [watchQuotDisItem, updateSaleTotals])

  useEffect(() => {
    updateServiceTotals()
  }, [watchQuotDisService, updateServiceTotals])

  const handleDiscard = () => {
    setIsDiscardModalOpen(true)
  }

  const toggleService = () => {
    const current = methods.getValues('selectService')
    setValue('selectService', !current)
    if (!current && serviceFields.fields.length === 0) {
      serviceFields.append({ service_id: '', qty: 1, charge: 0, discount: 0, discount_value: 0, vat: 0, vat_amnt: 0, total: 0 })
      updateServiceTotals()
    } else if (current) {
        // Clear services if closing
        serviceFields.remove()
        updateServiceTotals()
    }
  }

  const handleSubmitForm = (data: QuotationFormValues) => {
    if (mode === 'invoice') {
      if (!data.sale_payment_type_id) {
        methods.setError('sale_payment_type_id', { type: 'manual', message: 'Payment method is required' })
        return
      }
    }
    onSubmit(data)
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            {mode === 'create' ? 'Add Quotation' : mode === 'invoice' ? 'Add Quotation to Invoice' : 'Edit Quotation'}
          </h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        <form id="quotation-form" onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
          
          {/* Section 1: Quotation Header */}
          <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
              <div className="text-[#1e4ba1]">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-[18px] font-semibold text-[#1e293b]">Quotation Header</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-medium">Warehpuse <span className="text-rose-500">*</span></label>
                <Controller
                  control={control}
                  name="warehouse_id"
                  render={({ field }) => (
                    <Select2
                      options={warehouseOptions}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        saleFields.replace([{ product_id: '', batch_master_id: '', quantity: 1, rate: 0, discount_per: 0, discount: 0, vat_per: 0, vat_amnt: 0, total_price: 0, available_qty: 0, unit: '', description: '' }])
                        updateSaleTotals()
                      }}
                      placeholder="Select warehouse"
                      error={errors.warehouse_id?.message}
                      className="h-11"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium">Merchant name <span className="text-rose-500">*</span></label>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <Select2
                      options={merchantOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onInputChange={(val) => setMerchantSearch(val)}
                      placeholder="Select Merchant"
                      error={errors.customer_id?.message}
                      className="h-11"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium">Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  readOnly
                  className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none text-[#64748b] font-medium"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium">Quotation Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  {...register('quotdate')}
                  className={clsx(
                    "w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.quotdate && "border-rose-500"
                  )}
                  placeholder="Select return date"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium">Expiry Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  {...register('expire_date')}
                  className={clsx(
                    "w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.expire_date && "border-rose-500"
                  )}
                  placeholder="Select return date"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium">Details</label>
                <input
                  type="text"
                  {...register('quot_description')}
                  className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Details"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items Quotation */}
          <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="text-[#1e4ba1]">
                  <Box className="h-5 w-5" />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1e293b]">Items Quotation</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  saleFields.append({ product_id: '', batch_master_id: '', quantity: 1, rate: 0, discount_per: 0, discount: 0, vat_per: 0, vat_amnt: 0, total_price: 0, available_qty: 0, unit: '', description: '' })
                }}
                className="bg-[#0f2d5c] hover:bg-[#153a80] text-white px-5 py-2 rounded-lg flex items-center gap-2 h-10 text-[13px] font-medium transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </button>
            </div>

            <div className="px-4 py-4">
               <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead>
                      <tr className="bg-[#dae8ff] text-[#003671] text-[12px] font-bold uppercase tracking-wider">
                        <th className="px-3 py-4 text-center border-r border-white/50 w-12">Sl</th>
                        <th className="px-3 py-4 border-r border-white/50 min-w-[250px]">Item Information<span className="text-rose-500">*</span></th>
                        <th className="px-3 py-4 border-r border-white/50">Desc</th>
                        <th className="px-3 py-4 border-r border-white/50 min-w-[200px]">Batch No<span className="text-rose-500">*</span></th>
                        <th className="px-3 py-4 text-center border-r border-white/50">Av. Qty.</th>
                        <th className="px-3 py-4 text-center border-r border-white/50">Unit</th>
                        <th className="px-3 py-4 text-center border-r border-white/50 w-24">Qty<span className="text-rose-500">*</span></th>
                        <th className="px-3 py-4 text-center border-r border-white/50 w-28">Rate<span className="text-rose-500">*</span></th>
                        <th className="px-3 py-4 text-center border-r border-white/50 w-28">Per Pcs Rate</th>
                        <th className="px-3 py-4 text-center border-r border-white/50 w-24">Dis (%)</th>
                        <th className="px-3 py-4 text-right border-r border-white/50">Total</th>
                        <th className="px-3 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {saleFields.fields.map((field, index) => (
                        <SaleItemRow 
                          key={field.id}
                          index={index}
                          control={control}
                          register={register}
                          setValue={setValue}
                          getValues={methods.getValues}
                          remove={saleFields.remove}
                          append={saleFields.append}
                          canRemove={saleFields.fields.length > 1}
                          warehouseId={watchWarehouse}
                          updateCalculations={updateSaleTotals}
                          setProductSearch={setProductSearch}
                          productOptions={productOptions}
                          mode={mode}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
               </div>
            </div>
            {errors.sale_items && !Array.isArray(errors.sale_items) && (
              <div className="p-4 bg-rose-50 text-rose-600 text-xs font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                {errors.sale_items.message}
              </div>
            )}
          </div>

          {/* Item Summary and Toggle Service Button Row */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1 pt-2">
               {!watchSelectService && (
                <button
                  type="button"
                  onClick={toggleService}
                  className="px-6 h-12 bg-[#004ba0] hover:bg-[#003c80] text-white font-medium rounded-lg transition-all shadow-md flex items-center gap-2 text-[14px]"
                >
                  <Plus className="h-5 w-5" />
                  Add Service Quotation
                </button>
               )}
            </div>

            <div className="w-full lg:w-[400px]">
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
                {/* Sale Discount Row */}
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[14px] font-medium text-gray-500">Sale Discount</label>
                  <div className="w-32">
                    <input 
                      type="number" 
                      step="any" 
                      {...register('quot_dis_item', { valueAsNumber: true })} 
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[14px] outline-none text-right font-medium text-[#475569] focus:ring-1 focus:ring-primary/30 transition-all" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>

                {/* Total Discount Row */}
                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <label className="text-[14px] font-medium text-gray-500">Total Discount</label>
                  <span className="text-[16px] font-bold text-gray-900">
                    {formatValue(watchSaleItems.reduce((acc, item) => acc + (Number(item.discount) || 0), 0) + (Number(watchQuotDisItem) || 0))}
                  </span>
                </div>

                {/* Grand Total Bar */}
                <div className="bg-[#dae8ff] p-4 rounded-lg flex items-center justify-between">
                  <span className="text-[15px] font-bold text-[#1e4ba1]">Grand Total</span>
                  <span className="text-[20px] font-black text-[#1e4ba1] tracking-tight">{formatValue(watch('item_total_amount') || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Service Quotation - Styled exactly as Items Quotation */}
          {watchSelectService && (
            <>
              <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-4 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="text-[#1e4ba1]">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#1e293b]">Service Quotation</h2>
                  </div>
                  <div className="flex items-center gap-2">
                      <button
                          type="button"
                          onClick={() => {
                              serviceFields.append({ service_id: '', qty: 1, charge: 0, discount: 0, discount_value: 0, vat: 0, vat_amnt: 0, total: 0 })
                          }}
                          className="bg-[#0f2d5c] hover:bg-[#153a80] text-white px-5 py-2 rounded-lg flex items-center gap-2 h-10 text-[13px] font-medium transition-all shadow-sm"
                      >
                          <Plus className="h-4 w-4" />
                          Add Row
                      </button>
                      <button
                          type="button"
                          onClick={toggleService}
                          className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors border border-transparent shadow-sm"
                          title="Remove Section"
                      >
                          <Trash2 className="h-5 w-5" />
                      </button>
                  </div>
                </div>

                <div className="px-4 py-4">
                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[1000px]">
                              <thead>
                                  <tr className="bg-[#dae8ff] text-[#003671] text-[12px] font-bold uppercase tracking-wider">
                                      <th className="px-3 py-4 text-center border-r border-white/50 w-12">Sl</th>
                                      <th className="px-3 py-4 border-r border-white/50 w-[30%]">Service Name<span className="text-rose-500">*</span></th>
                                      <th className="px-3 py-4 text-center border-r border-white/50 w-[15%]">Qty<span className="text-rose-500">*</span></th>
                                      <th className="px-3 py-4 text-center border-r border-white/50 w-[15%]">Charge<span className="text-rose-500">*</span></th>
                                      <th className="px-3 py-4 text-center border-r border-white/50 w-[10%]">Disc (%)</th>
                                      <th className="px-3 py-4 text-right border-r border-white/50 w-[15%]">Total</th>
                                      <th className="px-3 py-4 text-center">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {serviceFields.fields.map((field, index) => (
                                      <ServiceItemRow 
                                          key={field.id}
                                          index={index}
                                          control={control}
                                          register={register}
                                          setValue={setValue}
                                          remove={serviceFields.remove}
                                          append={serviceFields.append}
                                          canRemove={serviceFields.fields.length > 1}
                                          updateCalculations={updateServiceTotals}
                                          setServiceSearch={setServiceSearch}
                                          serviceOptions={serviceOptions}
                                      />
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                </div>
              </div>

              {/* Service Summary and Bottom Action Row - Mirroring Item Pattern */}
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                <div className="flex-1 pt-2">
                  {/* This area is empty to match the layout of the top section when service is enabled */}
                </div>

                <div className="w-full lg:w-[400px]">
                  <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
                    {/* Service Discount Row */}
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-[14px] font-medium text-gray-500">Service Discount</label>
                      <div className="w-32">
                        <input 
                          type="number" 
                          step="any" 
                          {...register('quot_dis_service', { valueAsNumber: true })} 
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[14px] outline-none text-right font-medium text-[#475569] focus:ring-1 focus:ring-primary/30 transition-all" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>

                    {/* Total Discount Row */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <label className="text-[14px] font-medium text-gray-500">Total Discount</label>
                      <span className="text-[16px] font-bold text-gray-900">
                        {formatValue(watchServiceItems.reduce((acc, item) => acc + (Number(item.discount_value) || 0), 0) + (Number(watchQuotDisService) || 0))}
                      </span>
                      </div>

                      {/* Grand Total Bar */}
                      <div className="bg-[#dae8ff] p-4 rounded-lg flex items-center justify-between">
                      <span className="text-[15px] font-bold text-[#1e4ba1]">Grand Total</span>
                      <span className="text-[20px] font-black text-[#1e4ba1] tracking-tight">{formatValue(watch('service_total_amount') || 0)}</span>
                      </div>
                      </div>
                      </div>
                      </div>

            </>
          )}

          {/* Add to Invoice Special Fields */}
          {mode === 'invoice' && (
            <div className="flex justify-end pt-4">
              <div className="w-full lg:w-[400px]">
                <div className="bg-white rounded-xl border border-primary/20 shadow-sm p-6 space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-primary uppercase tracking-wider">Payment Details</label>
                    <Controller
                      control={control}
                      name="sale_payment_type_id"
                      render={({ field }) => (
                        <Select2
                          options={paymentOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select payment method"
                          error={errors.sale_payment_type_id?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Item Paid</label>
                      <input 
                        type="number" 
                        step="any" 
                        disabled={!watchPaymentTypeId}
                        {...register('sale_payment_amount', { valueAsNumber: true })} 
                        className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-bold text-primary hover:border-gray-300 focus:ring-1 focus:ring-primary/30 disabled:bg-gray-50" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Service Paid</label>
                      <input 
                        type="number" 
                        step="any" 
                        disabled={!watchPaymentTypeId || !watchSelectService}
                        {...register('service_payment_amount', { valueAsNumber: true })} 
                        className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-bold text-primary hover:border-gray-300 focus:ring-1 focus:ring-primary/30 disabled:bg-gray-50" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 w-full lg:w-[400px]">
                  <button 
                      type="button" 
                      onClick={handleDiscard} 
                      className="flex-1 h-12 bg-white border border-gray-200 text-[#64748b] font-medium rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm active:scale-95"
                  >
                      Cancel
                  </button>
                  <button 
                      type="submit" 
                      form="quotation-form" 
                      disabled={isSubmitting} 
                      className="flex-[2] h-12 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px] active:scale-95"
                  >
                      {isSubmitting ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                      <>
                          <Check className="h-6 w-6" /> 
                          {mode === 'edit' ? 'Update' : mode === 'invoice' ? 'Confirm' : 'Save'}
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
        onConfirm={() => navigate({ to: '/inventory/quotation' })} 
        title="Discard Changes?" 
        message="You have unsaved changes. Are you sure you want to discard them?" 
        confirmText="Yes, Discard" 
        variant="danger" 
      />
    </div>
  )
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

const SaleItemRow = ({ index, control, register, setValue, getValues, remove, append, canRemove, warehouseId, updateCalculations, setProductSearch, productOptions, mode }: any) => {
  const watchProductId = useWatch({ control, name: `sale_items.${index}.product_id` })
  const qty = useWatch({ control, name: `sale_items.${index}.quantity` })
  const rate = useWatch({ control, name: `sale_items.${index}.rate` })
  const discPer = useWatch({ control, name: `sale_items.${index}.discount_per` })
  const avlQty = useWatch({ control, name: `sale_items.${index}.available_qty` })
  const unit = useWatch({ control, name: `sale_items.${index}.unit` })
  
  const [batchOptions, setBatchOptions] = useState<any[]>([])
  const [batchPrice, setBatchPrice] = useState(0)

  useEffect(() => {
    if (watchProductId && warehouseId) {
      apiClient.get(`/inventory/products/get-invoice-info/${watchProductId}?warehouse_id=${warehouseId}&with_zero_qty=${mode === 'invoice' ? 1 : 0}`)
        .then(res => {
          const batches = res.data?.data?.batchData || {}
          const mappedBatches = Object.values(batches).map((b: any) => ({ value: b.id, label: b.text, ...b }))
          setBatchOptions(mappedBatches)
          
          const currentDesc = getValues(`sale_items.${index}.description`)
          if (!currentDesc) {
            setValue(`sale_items.${index}.description`, res.data?.data?.product_details || '')
          }

          // In Edit mode, if we already have a batch ID selected, update the row details from the loaded batch info
          const currentBatchId = getValues(`sale_items.${index}.batch_master_id`)
          if (currentBatchId) {
            const selectedBatch = mappedBatches.find(b => String(b.value) === String(currentBatchId))
            if (selectedBatch) {
                setValue(`sale_items.${index}.available_qty`, Number(selectedBatch.avl_qty) || 0)
                setValue(`sale_items.${index}.unit`, selectedBatch.unit || '')
                setBatchPrice(Number(selectedBatch.price) || 0)
            }
          }
        })
    } else {
      setBatchOptions([])
    }
  }, [watchProductId, warehouseId, mode, index, setValue, getValues])

  const onProductChange = (val: any) => {
    setValue(`sale_items.${index}.product_id`, val)
    setValue(`sale_items.${index}.batch_master_id`, '')
    setValue(`sale_items.${index}.available_qty`, 0)
    setValue(`sale_items.${index}.unit`, '')
    setValue(`sale_items.${index}.rate`, 0)
    setValue(`sale_items.${index}.description`, '')
    setBatchPrice(0)
    updateCalculations()
  }

  const onBatchChange = (val: any) => {
    setValue(`sale_items.${index}.batch_master_id`, val)
    const selectedBatch = batchOptions.find(b => b.value === val)
    if (selectedBatch) {
      setValue(`sale_items.${index}.available_qty`, Number(selectedBatch.avl_qty) || 0)
      setValue(`sale_items.${index}.unit`, selectedBatch.unit || '')
      setValue(`sale_items.${index}.rate`, Number(selectedBatch.price) || 0)
      setBatchPrice(Number(selectedBatch.price) || 0)
    }
    updateRowTotal()
  }

  const updateRowTotal = useCallback(() => {
    const q = Number(qty) || 0
    const r = Number(rate) || 0
    const d = Number(discPer) || 0
    const subtotal = q * r
    const discount = (subtotal * d) / 100
    const total = subtotal - discount
    
    setValue(`sale_items.${index}.discount`, discount)
    setValue(`sale_items.${index}.total_price`, total)
    updateCalculations()
  }, [qty, rate, discPer, index, setValue, updateCalculations])

  useEffect(() => {
    updateRowTotal()
  }, [updateRowTotal])

  return (
    <tr className="bg-white hover:bg-gray-50/50 transition-colors">
      <td className="p-2 text-center text-[13px] text-gray-400 font-medium border-r border-primary/5">{index + 1}</td>
      <td className="p-2 border-r border-primary/5 min-w-[220px]">
        <Controller 
          control={control} 
          name={`sale_items.${index}.product_id`} 
          render={({ field }) => ( 
            <Select2 
              options={productOptions} 
              value={field.value} 
              onChange={onProductChange} 
              onInputChange={(val) => setProductSearch(val)} 
              placeholder="Select product" 
              variant="ghost"
              className="text-[13px] font-medium"
              isDisabled={!warehouseId} 
              menuPortalTarget={document.body} 
            /> 
          )} 
        />
      </td>
      <td className="p-2 border-r border-primary/5">
        <input {...register(`sale_items.${index}.description`)} className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-[#475569] outline-none font-medium placeholder:text-gray-300" placeholder="Desc" />
      </td>
      <td className="p-2 border-r border-primary/5 min-w-[180px]">
        <Controller 
          control={control} 
          name={`sale_items.${index}.batch_master_id`} 
          render={({ field }) => ( 
            <Select2 
              options={batchOptions} 
              value={field.value} 
              onChange={onBatchChange} 
              placeholder="Select batch" 
              variant="ghost"
              className="text-[13px]"
              isDisabled={!watchProductId || !warehouseId} 
              menuPortalTarget={document.body} 
            /> 
          )} 
        />
      </td>
      <td className="p-2 text-center text-[13px] text-gray-400 font-medium border-r border-primary/5">{Number(avlQty).toFixed(2)}</td>
      <td className="p-2 text-center text-[13px] text-gray-400 font-medium border-r border-primary/5">{unit || 'Unit'}</td>
      <td className="p-2 border-r border-primary/5">
        <input type="number" step="any" {...register(`sale_items.${index}.quantity`, { valueAsNumber: true })} className="w-full h-11 text-center bg-white border border-gray-200 rounded-lg text-[13px] font-bold focus:ring-1 focus:ring-primary/30 outline-none text-[#1e293b]" />
      </td>
      <td className="p-2 border-r border-primary/5">
        <input type="number" step="any" {...register(`sale_items.${index}.rate`, { valueAsNumber: true })} className="w-full h-11 text-center bg-white border border-gray-200 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-primary/30 outline-none text-[#1e293b]" placeholder="0.00" />
      </td>
      <td className="p-2 text-center text-[13px] text-gray-300 font-medium border-r border-primary/5">{batchPrice.toFixed(2)}</td>
      <td className="p-2 border-r border-primary/5">
        <input type="number" step="any" {...register(`sale_items.${index}.discount_per`, { valueAsNumber: true })} className="w-full h-11 text-center bg-white border border-gray-200 rounded-lg text-[13px] font-medium focus:ring-1 focus:ring-primary/30 outline-none text-[#1e293b]" />
      </td>
      <td className="p-2 text-right text-[14px] font-bold text-[#1e4ba1] border-r border-primary/5">
        {formatCurrency(qty * rate * (1 - discPer/100), '', '').trim()}
      </td>
      <td className="p-2">
        <div className="flex items-center justify-center gap-2">
          {canRemove && (
             <button type="button" onClick={() => remove(index)} className="text-rose-500 hover:scale-110 transition-all">
                <XCircle className="h-6 w-6" />
             </button>
          )}
          <button 
            type="button" 
            onClick={() => append({ product_id: '', batch_master_id: '', quantity: 1, rate: 0, discount_per: 0, discount: 0, vat_per: 0, vat_amnt: 0, total_price: 0, available_qty: 0, unit: '', description: '' })} 
            className="text-[#1e4ba1] hover:scale-110 transition-all"
          >
            <PlusCircle className="h-6 w-6 fill-[#dae8ff]" />
          </button>
        </div>
      </td>
    </tr>
  )
}

const ServiceItemRow = ({ index, control, register, setValue, remove, append, canRemove, updateCalculations, setServiceSearch, serviceOptions }: any) => {
  const qty = useWatch({ control, name: `service_items.${index}.qty` })
  const charge = useWatch({ control, name: `service_items.${index}.charge` })
  const discPer = useWatch({ control, name: `service_items.${index}.discount` })

  const onServiceChange = (val: any) => {
    setValue(`service_items.${index}.service_id`, val)
    if (val) {
      apiClient.get(`/inventory/service/${val}`).then(res => {
        const sInfo = res.data?.data
        if (sInfo) {
          setValue(`service_items.${index}.charge`, Number(sInfo.charge) || 0)
          setValue(`service_items.${index}.vat`, Number(sInfo.service_vat) || 0)
        }
      })
    }
    updateRowTotal()
  }

  const updateRowTotal = useCallback(() => {
    const q = Number(qty) || 0
    const r = Number(charge) || 0
    const d = Number(discPer) || 0
    const subtotal = q * r
    const discount = (subtotal * d) / 100
    const total = subtotal - discount
    
    setValue(`service_items.${index}.discount_value`, discount)
    setValue(`service_items.${index}.total`, total)
    updateCalculations()
  }, [qty, charge, discPer, index, setValue, updateCalculations])

  useEffect(() => {
    updateRowTotal()
  }, [updateRowTotal])

  return (
    <tr className="bg-white hover:bg-gray-50/50 transition-colors text-[13px]">
      <td className="p-2 text-center text-gray-400 font-medium border-r border-primary/5">{index + 1}</td>
      <td className="p-2 border-r border-primary/10">
        <Controller 
          control={control} 
          name={`service_items.${index}.service_id`} 
          render={({ field }) => ( 
            <Select2 
              options={serviceOptions} 
              value={field.value} 
              onChange={onServiceChange} 
              onInputChange={(val) => setServiceSearch(val)} 
              placeholder="Select service" 
              variant="ghost"
              className="text-[13px]"
              menuPortalTarget={document.body} 
            /> 
          )} 
        />
      </td>
      <td className="p-2 border-r border-primary/10">
        <input type="number" step="any" {...register(`service_items.${index}.qty`, { valueAsNumber: true })} className="w-full h-11 text-center bg-white border border-gray-200 rounded-lg outline-none font-medium hover:border-gray-300 focus:ring-1 focus:ring-primary/30" />
      </td>
      <td className="p-2 border-r border-primary/10">
        <input type="number" step="any" {...register(`service_items.${index}.charge`, { valueAsNumber: true })} className="w-full h-11 text-center bg-white border border-gray-200 rounded-lg outline-none font-medium hover:border-gray-300 focus:ring-1 focus:ring-primary/30" />
      </td>
      <td className="p-2 border-r border-primary/10">
        <input type="number" step="any" {...register(`service_items.${index}.discount`, { valueAsNumber: true })} className="w-full h-11 text-center bg-white border border-gray-200 rounded-lg outline-none font-medium hover:border-gray-300 focus:ring-1 focus:ring-primary/30" />
      </td>
      <td className="p-2 text-right font-bold text-[#1e4ba1] border-r border-primary/10">{formatCurrency(qty * charge * (1 - discPer/100), '', '').trim()}</td>
      <td className="p-2">
         <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={() => remove(index)} disabled={!canRemove} className={clsx("transition-all", !canRemove ? "opacity-20 cursor-not-allowed" : "text-rose-500 hover:scale-110")}>
                <XCircle className="h-6 w-6" />
            </button>
            <button 
                type="button" 
                onClick={() => append({ service_id: '', qty: 1, charge: 0, discount: 0, discount_value: 0, vat: 0, vat_amnt: 0, total: 0 })} 
                className="text-[#1e4ba1] hover:scale-110 transition-all"
            >
                <PlusCircle className="h-6 w-6 fill-[#dae8ff]" />
            </button>
        </div>
      </td>
    </tr>
  )
}
