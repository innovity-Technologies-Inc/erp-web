import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect, useMemo, useState } from 'react'
import { Plus, ArrowLeft, Calendar as CalendarIcon, Info, Save, PenLine, FileText, X } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Select2 } from '@/components/Select/Select2'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useSettings } from '@/hooks/useSettings'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency } from '@/utils/formatters'
import { clsx } from 'clsx'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { 
  useCustomerSelect2, 
  useEmployeeSelect2, 
  usePaymentMethodsSelect2, 
  useServiceSelect2,
  getService,
  useCreateServiceInvoice,
  useUpdateServiceInvoice
} from '../hooks/useService'
import { useMerchantDetails } from '../hooks/useSales'

const itemSchema = z.object({
  service_id: z.string().min(1, 'Service is required'),
  service_name: z.string().optional(),
  qty: z.coerce.number().min(1, 'Qty must be at least 1'),
  charge: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100).default(0),
  discount_value: z.coerce.number().default(0),
  vat: z.coerce.number().min(0).max(100).default(0),
  vat_amnt: z.coerce.number().default(0),
  total: z.coerce.number().default(0),
})

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Merchant is required'),
  employee_id: z.string().min(1, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(itemSchema).min(1, 'At least one service item is required'),
  details: z.string().optional(),
  invoice_discount: z.coerce.number().min(0).default(0),
  shipping_cost: z.coerce.number().min(0).default(0),
  paid_amount: z.coerce.number().min(0).default(0),
  payment_type_id: z.string().min(1, 'Payment type is required'),
  previous: z.coerce.number().default(0),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

// --- Sub-component for Service Item Row ---
const ServiceItemRow = ({ 
  index, 
  control, 
  register, 
  setValue, 
  remove, 
  canRemove, 
  serviceOptions, 
  allSelectedServiceIds, 
  trigger, 
  currency, 
  currencyPosition 
}: any) => {
  const serviceId = useWatch({ control, name: `items.${index}.service_id` })

  const filteredOptions = useMemo(() => {
    return serviceOptions.filter((opt: any) => 
      !allSelectedServiceIds.includes(String(opt.value)) || String(opt.value) === String(serviceId)
    );
  }, [serviceOptions, allSelectedServiceIds, serviceId]);

  const updateRowTotal = () => {
    // Get latest values directly from methods to ensure accuracy during service selection
    const currentItem = control._formValues.items[index]
    const q = Number(currentItem?.qty || 1)
    const c = Number(currentItem?.charge || 0)
    const dp = Number(currentItem?.discount || 0)
    const vp = Number(currentItem?.vat || 0)

    const subtotal = q * c
    const disVal = subtotal * (dp / 100)
    const vatVal = subtotal * (vp / 100)
    const total = subtotal - disVal

    setValue(`items.${index}.discount_value`, disVal)
    setValue(`items.${index}.vat_amnt`, vatVal)
    setValue(`items.${index}.total`, total)
    
    // Notify parent of item array changes to update summary
    trigger('items')
  }

  const handleServiceChange = async (val: string) => {
    if (!val) return
    
    try {
      const result = await getService(val)
      const service = (result as any).data || result

      if (service) {
        setValue(`items.${index}.service_id`, val)
        setValue(`items.${index}.charge`, Number(service.charge) || 0)
        setValue(`items.${index}.vat`, Number(service.service_vat) || 0)
        
        // Update row total immediately after service data is set
        updateRowTotal()
      }
    } catch (error) {
      console.error('Failed to fetch service details', error)
    }
  }

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <tr className="bg-white hover:bg-gray-50/50 transition-colors">
      <td className="px-2 py-2 border-r border-primary/10">
        <Controller
          control={control}
          name={`items.${index}.service_id`}
          render={({ field }) => (
            <Select2
              options={filteredOptions}
              value={field.value}
              onChange={(val) => handleServiceChange(val ? String(val) : '')}
              placeholder="Select service"
              variant="ghost"
              className="font-medium text-[#1e293b]"
              menuPortalTarget={document.body}
            />
          )}
        />
      </td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input
          type="number"
          min="1"
          onKeyDown={handleQtyKeyDown}
          {...register(`items.${index}.qty`, {
            valueAsNumber: true,
            onChange: (e: any) => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              setValue(`items.${index}.qty`, val);
              updateRowTotal();
            }
          })}
          className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
        />
      </td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input
          type="number"
          step="0.01"
          {...register(`items.${index}.charge`, {
            onChange: () => updateRowTotal()
          })}
          className="w-full text-right bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
        />
      </td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input
          type="number"
          {...register(`items.${index}.discount`, {
            onChange: () => updateRowTotal()
          })}
          className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
        />
      </td>
      <td className="px-2 py-2 text-right text-[13px] font-medium text-[#475569] bg-gray-50/30 border-r border-primary/10">
        {formatCurrency(useWatch({ control, name: `items.${index}.discount_value` }) || 0, '', 'right')}
      </td>
      <td className="px-2 py-2 border-r border-primary/10">
        <input
          type="number"
          {...register(`items.${index}.vat`, {
            onChange: () => updateRowTotal()
          })}
          className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
        />
      </td>
      <td className="px-2 py-2 text-right text-[13px] font-medium text-[#475569] bg-gray-50/30 border-r border-primary/10">
        {formatCurrency(useWatch({ control, name: `items.${index}.vat_amnt` }) || 0, '', 'right')}
      </td>
      <td className="px-2 py-2 text-right text-[13px] font-medium text-[#475569] border-r border-primary/10">
        {formatCurrency(useWatch({ control, name: `items.${index}.total` }) || 0, currency, currencyPosition).replace(currency, '').trim()}
      </td>
      <td className="px-2 py-2 text-center">
        <button
          type="button"
          onClick={() => remove(index)}
          disabled={!canRemove}
          className={clsx("text-[#64748b] transition-colors p-1", !canRemove ? "opacity-20 cursor-not-allowed" : "hover:text-rose-500")}
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </td>
    </tr>
  )
}

interface ServiceInvoiceFormProps {
  initialData?: any
  isEdit?: boolean
}

export const ServiceInvoiceForm = ({ initialData, isEdit = false }: ServiceInvoiceFormProps) => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const { mutate: createInvoice, isPending: isCreating } = useCreateServiceInvoice()
  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateServiceInvoice()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  // Select2 Search Terms
  const [customerSearch, setCustomerSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [serviceSearch] = useState('')

  // Queries
  const { data: customers } = useCustomerSelect2(customerSearch)
  const { data: employees } = useEmployeeSelect2(employeeSearch)
  const { data: paymentMethods } = usePaymentMethodsSelect2()
  const { data: services } = useServiceSelect2(serviceSearch)

  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as any,
    shouldFocusError: false,
    defaultValues: initialData || {
      customer_id: '',
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ service_id: '', qty: 1, charge: 0, discount: 0, discount_value: 0, vat: 0, vat_amnt: 0, total: 0 }],
      invoice_discount: 0,
      shipping_cost: 0,
      paid_amount: 0,
      previous: 0,
      details: '',
      payment_type_id: '',
    }
  })

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    formState: { errors }
  } = methods

  // Sync form with initialData
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  // Watch for real-time summary updates
  const watchedItems = useWatch({ control, name: 'items' })
  const watchedInvoiceDiscount = useWatch({ control, name: 'invoice_discount' })
  const watchedShippingCost = useWatch({ control, name: 'shipping_cost' })
  const watchedPaidAmount = useWatch({ control, name: 'paid_amount' })
  const watchedPrevious = useWatch({ control, name: 'previous' })
  const watchedCustomerId = useWatch({ control, name: 'customer_id' })
  const watchedEmployeeId = useWatch({ control, name: 'employee_id' })

  const allSelectedServiceIds = useMemo(() => 
    watchedItems?.map((item: any) => String(item.service_id)).filter(Boolean) || [],
    [watchedItems]
  );

  // Fetch Merchant Details for Previous Balance
  const { data: merchantDetails } = useMerchantDetails(watchedCustomerId ? Number(watchedCustomerId) : null)

  const customerOptions = useMemo(() => {
    const opts = (customers || []).map(c => ({ value: String(c.id), label: c.text }))
    if (watchedCustomerId && !opts.find(o => o.value === String(watchedCustomerId))) {
       if (merchantDetails?.data) opts.push({ value: String(watchedCustomerId), label: merchantDetails.data.customer_name || merchantDetails.data.text })
       else if (isEdit && initialData?.customer) opts.push({ value: String(watchedCustomerId), label: initialData.customer.customer_name || initialData.customer.text })
    }
    return opts
  }, [customers, watchedCustomerId, merchantDetails, isEdit, initialData])

  const employeeOptions = useMemo(() => {
    const opts = (employees || []).map(e => ({ value: String(e.id), label: e.text }))
    if (watchedEmployeeId && !opts.find(o => o.value === String(watchedEmployeeId))) {
      if (isEdit && initialData?.employee) {
        const name = initialData.employee.first_name ? `${initialData.employee.first_name} ${initialData.employee.last_name || ''}`.trim() : initialData.employee.text
        opts.push({ value: String(watchedEmployeeId), label: name })
      }
    }
    return opts
  }, [employees, watchedEmployeeId, isEdit, initialData])

  const serviceOptions = useMemo(() => {
    const opts = (services || []).map(s => ({ value: String(s.id), label: s.text }))
    if (isEdit && initialData?.service_invoice_details) {
      initialData.service_invoice_details.forEach((detail: any) => {
        if (detail.service_id && !opts.find(o => o.value === String(detail.service_id))) {
          opts.push({ value: String(detail.service_id), label: detail.service?.service_name || 'Selected Service' })
        }
      })
    }
    return opts
  }, [services, isEdit, initialData])

  useEffect(() => {
    if (merchantDetails?.data && !isEdit) {
      setValue('previous', Number(merchantDetails.data.balance) || 0)
    }
  }, [merchantDetails, setValue, isEdit])

  // Real-time Summary Calculations
  const totals = useMemo(() => {
    let subTotal = 0
    let itemDiscount = 0
    let totalVat = 0

    watchedItems?.forEach((item: any) => {
      const q = Number(item.qty || 0)
      const c = Number(item.charge || 0)
      const dp = Number(item.discount || 0)
      const vp = Number(item.vat || 0)

      const rowSubtotal = q * c
      const rowDiscount = rowSubtotal * (dp / 100)
      const rowVat = rowSubtotal * (vp / 100)
      
      subTotal += rowSubtotal
      itemDiscount += rowDiscount
      totalVat += rowVat
    })

    const totalDiscount = itemDiscount + Number(watchedInvoiceDiscount || 0)
    const grandTotal = subTotal - totalDiscount + totalVat + Number(watchedShippingCost || 0)
    const netTotal = grandTotal + Number(watchedPrevious || 0)
    const remainingBalance = netTotal - Number(watchedPaidAmount || 0)

    return { subTotal, totalDiscount, totalVat, grandTotal, netTotal, remainingBalance }
  }, [watchedItems, watchedInvoiceDiscount, watchedShippingCost, watchedPaidAmount, watchedPrevious])

  const { showNotificationModal } = useUiStore()

  const onSubmit = (values: InvoiceFormValues) => {
    const payload = {
      ...values,
      grand_total: totals.grandTotal,
      total_vat_amnt: totals.totalVat,
      total_discount: totals.totalDiscount,
      due_amount: totals.remainingBalance,
      net_total: totals.netTotal,
      payment_amount: values.paid_amount,
      payment_type_id: [values.payment_type_id],
    }

    if (isEdit) {
      updateInvoice({ id: initialData.uuid, data: payload }, {
        onSuccess: () => navigate({ to: '/inventory/service-invoice' })
      })
    } else {
      createInvoice(payload, {
        onSuccess: () => navigate({ to: '/inventory/service-invoice' })
      })
    }
  }

  const handleDiscard = () => {
    if (!isEdit) setIsDiscardModalOpen(true)
    else navigate({ to: '/inventory/service-invoice' })
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="max-w-[1600px] mx-auto pb-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleDiscard} className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium">
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </button>
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
              {isEdit ? 'Edit Service Invoice' : 'New Service Invoice'}
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-primary/20 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/5 rounded-lg text-primary"><Info className="h-5 w-5" /></div>
              <h2 className="text-[16px] font-medium text-[#1e293b]">Service Invoice Header</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">Merchant <span className="text-rose-500">*</span></label>
                <Controller control={control} name="customer_id" render={({ field }) => (
                  <Select2 options={customerOptions} value={field.value} onChange={(val) => field.onChange(val ? String(val) : '')} onInputChange={setCustomerSearch} placeholder="Select merchant" error={errors.customer_id?.message} menuPortalTarget={document.body} />
                )} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">Employee <span className="text-rose-500">*</span></label>
                <Controller control={control} name="employee_id" render={({ field }) => (
                  <Select2 options={employeeOptions} value={field.value} onChange={(val) => field.onChange(val ? String(val) : '')} onInputChange={setEmployeeSearch} placeholder="Select employee" error={errors.employee_id?.message} menuPortalTarget={document.body} />
                )} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">Date <span className="text-rose-500">*</span></label>
                <input type="date" {...register('date')} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-[#475569] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg text-primary"><CalendarIcon className="w-5 h-5" /></div>
                <h2 className="text-[16px] font-medium text-[#1e293b]">Service Items</h2>
              </div>
              <button type="button" onClick={() => append({ service_id: '', qty: 1, charge: 0, discount: 0, discount_value: 0, vat: 0, vat_amnt: 0, total: 0 })} className="bg-[#1B4D90] hover:bg-[#153a80] text-white px-4 py-2 rounded-lg flex items-center gap-2 h-9 text-[12px] font-medium transition-all shadow-sm">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#475569] text-[11px] font-medium uppercase tracking-wider">
                    <th className="px-2 py-2 min-w-[250px] border-r border-primary/10">Service Name*</th>
                    <th className="px-2 py-2 text-center w-24 border-r border-primary/10">Qty*</th>
                    <th className="px-2 py-2 text-center w-32 border-r border-primary/10">Charge*</th>
                    <th className="px-2 py-2 text-center w-24 border-r border-primary/10">Dis (%)</th>
                    <th className="px-2 py-2 text-right w-28 border-r border-primary/10">Dis. Value</th>
                    <th className="px-2 py-2 text-center w-24 border-r border-primary/10">EIN (%)</th>
                    <th className="px-2 py-2 text-right w-28 border-r border-primary/10">EIN Value</th>
                    <th className="px-2 py-2 text-right w-32 border-r border-primary/10">Total</th>
                    <th className="px-2 py-2 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {fields.map((field, index) => (
                    <ServiceItemRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      setValue={setValue}
                      remove={remove}
                      canRemove={fields.length > 1}
                      serviceOptions={serviceOptions}
                      allSelectedServiceIds={allSelectedServiceIds}
                      trigger={trigger}
                      currency={currency}
                      currencyPosition={currencyPosition}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pb-10">
            <div className="lg:col-span-5 bg-white rounded-xl border border-primary/20 p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-2 bg-primary/5 rounded-lg text-primary"><FileText className="h-5 w-5" /></div>
                <h2 className="text-[16px] font-medium text-[#1e293b]">Sale Details</h2>
              </div>
              <RichEditor value={methods.watch('details') || ''} onChange={(val) => setValue('details', val)} placeholder="Enter details..." />
            </div>

            <div className="lg:col-span-3 bg-[#1B4D90] rounded-xl p-6 text-white shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-[14px] font-medium mb-6 opacity-90">Payment Summary</h2>
                <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-[13px] opacity-80">Sub Total</span><span>{formatCurrency(totals.subTotal, currency, currencyPosition)}</span></div>
                <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-[13px] opacity-80">Total Discount</span><span className="text-yellow-200">- {formatCurrency(totals.totalDiscount, currency, currencyPosition)}</span></div>
                <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-[13px] opacity-80">Total EIN</span><span>{formatCurrency(totals.totalVat, currency, currencyPosition)}</span></div>
                <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-[13px] opacity-80">Previous Due</span><span>{formatCurrency(watchedPrevious, currency, currencyPosition)}</span></div>
                <div className="flex justify-between"><span className="text-[13px] opacity-80 font-bold">Net Total</span><span className="font-bold">{formatCurrency(totals.netTotal, currency, currencyPosition)}</span></div>
              </div>
              <div className="pt-6">
                <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-medium block mb-1">Grand Total</span>
                <span className="text-[28px] font-bold tracking-tight">{formatCurrency(totals.grandTotal, currency, currencyPosition)}</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-primary/20 p-6 space-y-5 flex-1 shadow-sm">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Invoice Dis</label>
                      <input type="number" {...register('invoice_discount', { onChange: () => trigger('items') })} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-[#475569] outline-none" placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Shipping Cost</label>
                      <input type="number" {...register('shipping_cost', { onChange: () => trigger('items') })} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-[#475569] outline-none" placeholder="0.00" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Paid Amount</label>
                    <input
                      type="number"
                      step="any"
                      {...register('paid_amount', { 
                        valueAsNumber: true,
                        onChange: (e: any) => {
                          const val = parseFloat(e.target.value) || 0;
                          const maxAllowed = totals.grandTotal;

                          if (val < 0) {
                            setValue('paid_amount', 0);
                            trigger('items');
                            return;
                          }

                          if (val > maxAllowed) {
                            showNotificationModal(
                              'Invalid Payment',
                              `Paid amount (${formatCurrency(val, currency, currencyPosition)}) cannot exceed the invoice total (${formatCurrency(maxAllowed, currency, currencyPosition)}).`,
                              'warning'
                            );
                            setValue('paid_amount', maxAllowed);
                          }
                          trigger('items');
                        }
                      })}
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-primary outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="0.00"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Payment Type*</label>
                    <Controller control={control} name="payment_type_id" render={({ field }) => (
                      <Select2 options={paymentMethods?.map(p => ({ value: p.id, label: p.text })) || []} value={field.value} onChange={(val) => field.onChange(val ? String(val) : '')} placeholder="Select" error={errors.payment_type_id?.message} menuPortalTarget={document.body} />
                    )} />
                 </div>
                 <div className="pt-2">
                    <div className="bg-[#fffcfb] p-3 rounded-lg border border-rose-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-rose-500 uppercase">Remaining Balance</span>
                      <div className="text-[20px] font-bold text-rose-600 tracking-tight">{formatCurrency(totals.remainingBalance, currency, currencyPosition)}</div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={handleDiscard} className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm">Cancel</button>
                  <button type="submit" disabled={isCreating || isUpdating} className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px]">
                    {isCreating || isUpdating ? <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <>{isEdit ? <PenLine className="h-5 w-5" /> : <Save className="h-5 w-5" />}<span>{isEdit ? 'Update' : 'Save'}</span></>}
                  </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      <ConfirmationModal isOpen={isDiscardModalOpen} onClose={() => setIsDiscardModalOpen(false)} onConfirm={() => navigate({ to: '/inventory/service-invoice' })} title="Discard Changes?" message="You have unsaved changes. Are you sure you want to discard this invoice?" confirmText="Yes, Discard" variant="danger" />
    </div>
  )
}
