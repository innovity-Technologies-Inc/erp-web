import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect, useMemo, useState } from 'react'
import { Plus, ArrowLeft, Calendar as CalendarIcon, Info, Save, PenLine, FileText, X } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Select2 } from '@/components/Select/Select2'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useSettings } from '@/hooks/useSettings'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency } from '@/utils/formatters'
import { clsx } from 'clsx'
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

interface ServiceInvoiceFormProps {
  initialData?: any
  isEdit?: boolean
}

export const ServiceInvoiceForm = ({ initialData, isEdit = false }: ServiceInvoiceFormProps) => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const { mutate: createInvoice, isPending: isCreating } = useCreateServiceInvoice()
  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateServiceInvoice()

  // Select2 Search Terms
  const [customerSearch, setCustomerSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')

  // Queries
  const { data: customers } = useCustomerSelect2(customerSearch)
  const { data: employees } = useEmployeeSelect2(employeeSearch)
  const { data: paymentMethods } = usePaymentMethodsSelect2()
  const { data: services } = useServiceSelect2(serviceSearch)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<InvoiceFormValues>({
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

  // Sync form with initialData if it arrives late or changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')
  const watchedInvoiceDiscount = watch('invoice_discount')
  const watchedShippingCost = watch('shipping_cost')
  const watchedPaidAmount = watch('paid_amount')
  const watchedPrevious = watch('previous')
  const watchedCustomerId = watch('customer_id')
  const watchedEmployeeId = watch('employee_id')

  // Fetch Merchant Details for Previous Balance
  const { data: merchantDetails } = useMerchantDetails(watchedCustomerId ? Number(watchedCustomerId) : null)

  // Memoized Options to prevent selected items from disappearing
  const customerOptions = useMemo(() => {
    const opts = (customers || []).map(c => ({ value: String(c.id), label: c.text }))
    
    // Add current selection if not in the list
    if (watchedCustomerId) {
      const exists = opts.find(o => o.value === String(watchedCustomerId))
      if (!exists) {
        if (merchantDetails?.data) {
          opts.push({ value: String(watchedCustomerId), label: merchantDetails.data.customer_name || merchantDetails.data.text })
        } else if (isEdit && initialData?.customer) {
          opts.push({ value: String(watchedCustomerId), label: initialData.customer.customer_name || initialData.customer.text })
        } else if (isEdit) {
          // Fallback if we have the ID but not the object yet
          opts.push({ value: String(watchedCustomerId), label: `Merchant ID: ${watchedCustomerId}` })
        }
      }
    }
    return opts
  }, [customers, watchedCustomerId, merchantDetails, isEdit, initialData])

  const employeeOptions = useMemo(() => {
    const opts = (employees || []).map(e => ({ value: String(e.id), label: e.text }))
    
    // Add current selection if not in the list
    if (watchedEmployeeId) {
      const exists = opts.find(o => o.value === String(watchedEmployeeId))
      if (!exists) {
        if (isEdit && initialData?.employee) {
          const name = initialData.employee.first_name 
            ? `${initialData.employee.first_name} ${initialData.employee.last_name || ''}`.trim()
            : initialData.employee.text
          opts.push({ value: String(watchedEmployeeId), label: name || `Employee ID: ${watchedEmployeeId}` })
        } else if (isEdit) {
          // Fallback
          opts.push({ value: String(watchedEmployeeId), label: `Employee ID: ${watchedEmployeeId}` })
        }
      }
    }
    return opts
  }, [employees, watchedEmployeeId, isEdit, initialData])

  const serviceOptions = useMemo(() => {
    const opts = (services || []).map(s => ({ value: String(s.id), label: s.text }))
    
    // Add services from items (especially for edit mode) if not in the list
    if (isEdit && initialData?.service_invoice_details) {
      initialData.service_invoice_details.forEach((detail: any) => {
        if (detail.service_id && !opts.find(o => o.value === String(detail.service_id))) {
          opts.push({ 
            value: String(detail.service_id), 
            label: detail.service?.service_name || 'Selected Service' 
          })
        }
      })
    }
    return opts
  }, [services, isEdit, initialData])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Invoice Form Errors:', errors)
    }
  }, [errors])

  useEffect(() => {
    if (merchantDetails?.data && !isEdit) {
      setValue('previous', Number(merchantDetails.data.balance) || 0)
    }
  }, [merchantDetails, setValue, isEdit])

  // Real-time Calculations
  const totals = useMemo(() => {
    let subTotal = 0
    let totalDiscount = 0
    let totalVat = 0

    watchedItems.forEach((item) => {
      const rowSubtotal = (item.qty || 0) * (item.charge || 0)
      const rowDiscount = rowSubtotal * ((item.discount || 0) / 100)
      const rowVat = rowSubtotal * ((item.vat || 0) / 100)
      
      subTotal += rowSubtotal
      totalDiscount += rowDiscount
      totalVat += rowVat
    })

    const grandTotal = subTotal - (totalDiscount + Number(watchedInvoiceDiscount || 0)) + totalVat + Number(watchedShippingCost || 0)
    const netTotal = grandTotal - Number(watchedPrevious || 0)
    const remainingBalance = grandTotal - (Number(watchedPaidAmount || 0) + Number(watchedPrevious || 0))

    return {
      subTotal,
      totalDiscount: totalDiscount + Number(watchedInvoiceDiscount || 0),
      totalVat,
      grandTotal,
      netTotal,
      remainingBalance
    }
  }, [watchedItems, watchedInvoiceDiscount, watchedShippingCost, watchedPaidAmount, watchedPrevious])

  const handleServiceChange = async (index: number, serviceId: string) => {
    if (!serviceId) return
    
    try {
      const result = await getService(serviceId)
      if (result.success) {
        const service = result.data
        setValue(`items.${index}.charge`, service.charge)
        setValue(`items.${index}.vat`, service.service_vat || 0)
        updateRowTotal(index)
      }
    } catch (error) {
      console.error('Failed to fetch service details', error)
    }
  }

  const updateRowTotal = (index: number) => {
    const item = watchedItems[index]
    const qty = Number(item.qty || 0)
    const charge = Number(item.charge || 0)
    const discountPercent = Number(item.discount || 0)
    const vatPercent = Number(item.vat || 0)

    const subtotal = qty * charge
    const disVal = subtotal * (discountPercent / 100)
    const vatVal = subtotal * (vatPercent / 100)
    const total = subtotal - disVal

    setValue(`items.${index}.discount_value`, disVal)
    setValue(`items.${index}.vat_amnt`, vatVal)
    setValue(`items.${index}.total`, total)
  }

  const { notify } = useUiStore()

  const onSubmit = (values: InvoiceFormValues) => {
    const payload = {
      ...values,
      grand_total: totals.grandTotal,
      total_vat_amnt: totals.totalVat,
      total_discount: totals.totalDiscount,
      due_amount: totals.remainingBalance,
      net_total: totals.netTotal,
      payment_amount: values.paid_amount,
      payment_type_id: [values.payment_type_id], // Backend expects array for index access
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

  const onInvalid = (errors: any) => {
    console.log('Invoice Validation Errors:', errors)
    notify('Please check the form for errors', 'error')
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* Page Header */}
        <div className="max-w-[1600px] mx-auto pb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/inventory/service-invoice"
              className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </Link>
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
              {isEdit ? 'Edit Service Invoice' : 'New Service Invoice'}
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-primary/20 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/5 rounded-lg text-primary">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-[16px] font-medium text-[#1e293b]">Service Invoice Header</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">
                  Merchant <span className="text-rose-500">*</span>
                </label>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <Select2
                      options={customerOptions}
                      value={field.value}
                      onChange={(val) => field.onChange(val ? String(val) : '')}
                      onInputChange={setCustomerSearch}
                      placeholder="Select merchant by name / phone no"
                      error={errors.customer_id?.message}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <Controller
                  control={control}
                  name="employee_id"
                  render={({ field }) => (
                    <Select2
                      options={employeeOptions}
                      value={field.value}
                      onChange={(val) => field.onChange(val ? String(val) : '')}
                      onInputChange={setEmployeeSearch}
                      placeholder="Type employee name to search"
                      error={errors.employee_id?.message}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-gray-500">
                  ETD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {errors.date && <span className="text-rose-500 text-[11px] font-medium">{errors.date.message}</span>}
              </div>
            </div>
          </div>

          {/* Items Table Card */}
          <div className="bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h2 className="text-[16px] font-medium text-[#1e293b]">Service Items</h2>
              </div>
              <button
                type="button"
                onClick={() => append({ service_id: '', qty: 1, charge: 0, discount: 0, discount_value: 0, vat: 0, vat_amnt: 0, total: 0 })}
                className="bg-primary hover:bg-[#153a80] text-white px-4 py-2 rounded-lg flex items-center gap-2 h-9 text-[12px] font-medium transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Item
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
                    <tr key={field.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                      <td className="px-2 py-2 border-r border-primary/10">
                        <Controller
                          control={control}
                          name={`items.${index}.service_id`}
                          render={({ field }) => (
                            <Select2
                              options={serviceOptions}
                              value={field.value}
                              onChange={(val) => {
                                const strVal = val ? String(val) : ''
                                field.onChange(strVal)
                                handleServiceChange(index, strVal)
                              }}
                              onInputChange={setServiceSearch}
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
                          {...register(`items.${index}.qty`)}
                          onChange={(e) => {
                             register(`items.${index}.qty`).onChange(e)
                             updateRowTotal(index)
                          }}
                          className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
                        />
                      </td>
                      <td className="px-2 py-2 border-r border-primary/10">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.charge`)}
                          onChange={(e) => {
                             register(`items.${index}.charge`).onChange(e)
                             updateRowTotal(index)
                          }}
                          className="w-full text-right bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
                        />
                      </td>
                      <td className="px-2 py-2 border-r border-primary/10">
                        <input
                          type="number"
                          {...register(`items.${index}.discount`)}
                          onChange={(e) => {
                             register(`items.${index}.discount`).onChange(e)
                             updateRowTotal(index)
                          }}
                          className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
                        />
                      </td>
                      <td className="px-2 py-2 text-right text-[13px] font-medium text-[#475569] bg-gray-50/30 border-r border-primary/10">
                        {formatCurrency(watch(`items.${index}.discount_value`), '', 'right')}
                      </td>
                      <td className="px-2 py-2 border-r border-primary/10">
                        <input
                          type="number"
                          {...register(`items.${index}.vat`)}
                          onChange={(e) => {
                             register(`items.${index}.vat`).onChange(e)
                             updateRowTotal(index)
                          }}
                          className="w-full text-center bg-white border border-gray-200 rounded-md py-1.5 text-[13px] font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all outline-none text-[#1e293b]"
                        />
                      </td>
                      <td className="px-2 py-2 text-right text-[13px] font-medium text-[#475569] bg-gray-50/30 border-r border-primary/10">
                        {formatCurrency(watch(`items.${index}.vat_amnt`), '', 'right')}
                      </td>
                      <td className="px-2 py-2 text-right text-[13px] font-medium text-[#475569] border-r border-primary/10">
                        {formatCurrency(watch(`items.${index}.total`), currency, currencyPosition).replace(currency, '').trim()}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className={clsx("text-[#64748b] transition-colors p-1", fields.length === 1 ? "opacity-20 cursor-not-allowed" : "hover:text-rose-500")}
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.items && !Array.isArray(errors.items) && (
              <div className="p-4 bg-rose-50 text-rose-600 text-xs font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                {errors.items.message}
              </div>
            )}
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pb-10">
            {/* Sale Details (Left) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-primary/20 p-6 flex flex-col shadow-sm">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-[16px] font-medium text-[#1e293b]">Sale Details</h2>
              </div>
              <RichEditor
                value={watch('details') || ''}
                onChange={(val) => setValue('details', val)}
                placeholder="Enter special instructions or purchase terms here..."
              />
            </div>

            {/* Payment Summary (Middle) */}
            <div className="lg:col-span-3 bg-primary rounded-xl p-6 text-white shadow-md flex flex-col justify-between">
              <div>
                <h2 className="text-[14px] font-medium mb-6 opacity-90">Payment Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-[13px] text-blue-50/80 font-medium">Sub Total</span>
                    <span className="font-medium text-white text-[14px]">{formatCurrency(totals.subTotal, currency, currencyPosition)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-[13px] text-blue-50/80 font-medium">Total Discount</span>
                    <span className="font-medium text-yellow-200 text-[14px]">- {formatCurrency(totals.totalDiscount, currency, currencyPosition)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-[13px] text-blue-50/80 font-medium">Total EIN</span>
                    <span className="font-medium text-white text-[14px]">{formatCurrency(totals.totalVat, currency, currencyPosition)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-[13px] text-blue-50/80 font-medium">Previous Due</span>
                    <span className="font-medium text-white text-[14px]">{formatCurrency(watchedPrevious, currency, currencyPosition)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-blue-50/80 font-medium">Net Total</span>
                    <span className="font-medium text-white text-[14px]">{formatCurrency(totals.netTotal, currency, currencyPosition)}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-medium">Grand Total</span>
                  <div className="flex items-end justify-between">
                    <span className="text-[24px] font-medium tracking-tight leading-none text-white">{formatCurrency(totals.grandTotal, currency, currencyPosition)}</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-medium backdrop-blur-sm border border-white/10 shadow-sm">Pending</span>
                  </div>
              </div>
            </div>

            {/* Calculations (Right) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-primary/20 p-6 space-y-5 flex-1 shadow-sm">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Service Dis ({currencyPosition === '0' ? currency : ''} {currencyPosition === '1' ? currency : ''})</label>
                      <input
                        type="number"
                        {...register('invoice_discount')}
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Shipping Cost ({currencyPosition === '0' ? currency : ''} {currencyPosition === '1' ? currency : ''})</label>
                      <input
                        type="number"
                        {...register('shipping_cost')}
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                        placeholder="0.00"
                      />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Paid Amount ({currencyPosition === '0' ? currency : ''} {currencyPosition === '1' ? currency : ''})</label>
                    <input
                      type="number"
                      {...register('paid_amount')}
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-primary hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="0.00"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">
                      Payment Type <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="payment_type_id"
                      render={({ field }) => (
                        <Select2
                          options={paymentMethods?.map(p => ({ value: p.id, label: p.text })) || []}
                          value={field.value}
                          onChange={(val) => field.onChange(val ? String(val) : '')}
                          placeholder="Select payment type"
                          error={errors.payment_type_id?.message}
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                 </div>

                 <div className="pt-2">
                    <div className="bg-[#fffcfb] p-3 rounded-lg border border-rose-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-rose-500 uppercase tracking-tight">Remaining Balance</span>
                      <div className="text-[18px] font-medium text-rose-600 leading-none">
                         {formatCurrency(totals.remainingBalance, currency, currencyPosition)}
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate({ to: '/inventory/service-invoice' })}
                    className="px-6 h-10 bg-white border border-gray-200 text-[#64748b] font-medium rounded-lg hover:bg-gray-50 transition-all text-[13px] shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-8 h-10 bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[13px]"
                  >
                    {isCreating || isUpdating ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {isEdit ? <PenLine className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        <span>{isEdit ? 'Update Invoice' : 'Save Invoice'}</span>
                      </>
                    )}
                  </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
