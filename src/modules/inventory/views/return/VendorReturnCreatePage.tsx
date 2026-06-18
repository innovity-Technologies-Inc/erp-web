import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Package, 
  AlertCircle, 
  FileText, 
  Check, 
  AlertTriangle 
} from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useStoreSupplierReturn } from '../../hooks/useReturn'
import { usePurchaseSelect2, usePurchaseData, usePaymentMethodsSelect2 } from '../../hooks/usePurchases'
import { LoadingState } from '@/components/Loading/LoadingState'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { vendorReturnSchema, type VendorReturnFormValues } from '../../hooks/validation'
import { clsx } from 'clsx'

export const VendorReturnCreatePage = () => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const { data: purchaseOptions = [] } = usePurchaseSelect2(searchTerm)
  const { data: paymentMethods = [] } = usePaymentMethodsSelect2()
  
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors, isDirty },
  } = useForm<VendorReturnFormValues>({
    resolver: zodResolver(vendorReturnSchema) as any,
    defaultValues: {
      return_date: new Date().toISOString().split('T')[0],
      items: [],
      total_deduction: 0,
      grand_total: 0
    },
  })

  const { fields, replace: replaceItems } = useFieldArray({
    control,
    name: 'items',
  })

  const watchPurchaseId = useWatch({ control, name: 'purchase_id' })
  const watchItems = useWatch({ control, name: 'items' })

  const { 
    data: purchaseDataResponse, 
    isLoading: isFetchingPurchase, 
    isError, 
    error: purchaseError 
  } = usePurchaseData(watchPurchaseId)

  const { mutate: storeReturn, isPending: isSaving } = useStoreSupplierReturn()

  // Load items when purchase details are fetched
  useEffect(() => {
    if (purchaseDataResponse) {
      const purchase = (purchaseDataResponse as any)?.data || purchaseDataResponse;
      if (!purchase?.id) {
        replaceItems([])
        showNotificationModal('Error', 'Data not found!', 'error')
        return
      }
      
      setValue('supplier_id', purchase.supplier_id)

      const details = purchase.product_purchase_details || purchase.productPurchaseDetails || [];
      const newItems = details.map((detail: any) => ({
        purchase_detail_id: detail.id,
        item_id: detail.product_id,
        product_name: detail.product?.product_name || '',
        quantity: Number(detail.quantity) || 0,
        available_quantity: Number(detail.batch_product?.available_quantity || detail.batchProduct?.available_quantity) || 0,
        batch_no: detail.batch_master?.batch_no || detail.batchMaster?.batch_no || '',
        rate: Number(detail.rate) || 0,
        return_quantity: 0,
        deduction_percent: 0,
        deduction_value: 0,
        total: 0,
        selected: false
      }))
      
      replaceItems(newItems)
    } else {
        replaceItems([])
    }
  }, [purchaseDataResponse, setValue, replaceItems, showNotificationModal])

  // Recalculate row and totals when quantities change
  const updateRowCalculations = useCallback((index: number) => {
    const item = getValues(`items.${index}`)
    const retQty = Number(item.return_quantity) || 0
    const dedPer = Number(item.deduction_percent) || 0
    const rate = Number(item.rate) || 0

    const subtotal = retQty * rate
    const dedValue = subtotal * (dedPer / 100)
    const total = subtotal - dedValue

    setValue(`items.${index}.deduction_value`, parseFloat(dedValue.toFixed(2)))
    setValue(`items.${index}.total`, parseFloat(total.toFixed(2)))
    
    // Recalculate grand totals
    const allItems = getValues('items')
    const selectedItems = allItems.filter(i => i.selected)
    const totalDed = selectedItems.reduce((sum, i) => sum + (Number(i.deduction_value) || 0), 0)
    const totalGrand = selectedItems.reduce((sum, i) => sum + (Number(i.total) || 0), 0)

    setValue('total_deduction', parseFloat(totalDed.toFixed(2)))
    setValue('grand_total', parseFloat(totalGrand.toFixed(2)))
    
    trigger(`items.${index}.return_quantity`)
    trigger('items')
  }, [getValues, setValue, trigger])

  // Update totals when selection changes
  const handleSelectionChange = (index: number, selected: boolean) => {
    setValue(`items.${index}.selected`, selected)
    if (!selected) {
        setValue(`items.${index}.return_quantity`, 0)
        updateRowCalculations(index)
    } else {
        updateRowCalculations(index)
    }
  }

  const onInvalid = (errors: any) => {
    console.error('Validation Errors:', errors);
    setTimeout(() => {
      const errorElement = document.querySelector('.text-rose-500, .border-rose-500, .text-rose-600');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  const onSubmit = (data: VendorReturnFormValues) => {
    const selectedItems = data.items.filter(i => i.selected)
    
    const payload = {
      ...data,
      items: selectedItems
    }

    storeReturn(payload, {
      onSuccess: () => {
        navigate({ to: '/inventory/return/vendor' })
      }
    })
  }

  const handleDiscard = () => {
    if (isDirty || watchItems.some(i => i.selected)) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/return/vendor' })
    }
  }

  const purchase = (purchaseDataResponse as any)?.data || purchaseDataResponse

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
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
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Return To Vendor</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-6">
            {/* Return Header */}
            <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><FileText className="h-4 w-4" /></div>
                Return Header
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                    Invoice No <span className="text-rose-500">*</span>
                </label>
                <Controller
                    control={control}
                    name="purchase_id"
                    render={({ field }) => (
                        <Select2
                            options={purchaseOptions.map((opt: any) => ({ value: opt.id, label: opt.text }))}
                            value={field.value}
                            onChange={(val) => {
                                field.onChange(val)
                                trigger('purchase_id')
                            }}
                            onInputChange={setSearchTerm}
                            placeholder="Enter invoice number"
                            error={errors.purchase_id?.message as string}
                        />
                    )}
                />
                </div>
                <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Vendor</label>
                <input 
                    type="text" 
                    value={purchase?.supplier?.supplier_name || ''} 
                    disabled 
                    className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-gray-500 cursor-not-allowed" 
                />
                </div>
                <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Purchase Date</label>
                <input 
                    type="text" 
                    value={purchase?.purchase_date || ''} 
                    disabled 
                    className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-gray-500 cursor-not-allowed" 
                />
                </div>
                <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Chalan No</label>
                <input 
                    type="text" 
                    value={purchase?.chalan_no || ''} 
                    disabled 
                    className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-gray-500 cursor-not-allowed" 
                />
                </div>
                <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                    Payment Type <span className="text-rose-500">*</span>
                </label>
                <Controller
                    control={control}
                    name="payment_type_id"
                    render={({ field }) => (
                        <Select2 
                            options={paymentMethods.map((opt: any) => ({ value: opt.id, label: opt.text }))} 
                            value={field.value} 
                            onChange={(val) => {
                                field.onChange(val)
                                trigger('payment_type_id')
                            }} 
                            placeholder="Select Payment Type" 
                            error={errors.payment_type_id?.message as string}
                        />
                    )}
                />
                </div>
            </div>
            </div>

            {isFetchingPurchase ? (
            <LoadingState message="Fetching invoice details..." />
            ) : isError ? (
            <div className="bg-white rounded-xl border border-primary/10 p-10 shadow-sm text-center flex flex-col items-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                <h2 className="text-[18px] font-medium text-rose-500">
                {(() => {
                    const errorData = (purchaseError as any)?.response?.data;
                    const errors = errorData?.errors;
                    if (typeof errors === 'string') return errors;
                    if (typeof errors === 'object' && errors !== null) {
                    const firstKey = Object.keys(errors)[0];
                    if (firstKey) {
                        const firstVal = errors[firstKey];
                        return Array.isArray(firstVal) ? String(firstVal[0]) : String(firstVal);
                    }
                    }
                    const msg = errorData?.message;
                    if (typeof msg === 'string') return msg;
                    if (typeof msg === 'object' && msg !== null) {
                        const firstKey = Object.keys(msg)[0];
                        if (firstKey) {
                        const firstVal = msg[firstKey];
                        return Array.isArray(firstVal) ? String(firstVal[0]) : String(firstVal);
                        }
                        return JSON.stringify(msg);
                    }
                    return 'Error loading data.';
                })()}
                </h2>
            </div>
            ) : !purchase ? (
            <div className="bg-white rounded-xl border border-primary/10 p-10 shadow-sm text-center flex flex-col items-center">
                <FileText className="w-10 h-10 text-gray-300 mb-2" />
                <h2 className="text-[18px] font-medium text-gray-400">Please Enter Invoice Number and Return Qty to Vendor!</h2>
                {errors.items?.root?.message && <span className="text-rose-500 text-[13px] font-bold mt-2">{errors.items.root.message}</span>}
            </div>
            ) : (
            <>
                <div className="bg-white rounded-xl border border-primary/10 p-2 shadow-sm">
                <div className="flex items-center justify-between mb-4 px-2 pt-2">
                    <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Package className="h-4 w-4" /></div>
                    <h2 className="text-[16px] font-bold text-[#1e293b]">Return Items</h2>
                    </div>
                </div>
                {errors.items?.root?.message && (
                    <div className="mx-2 mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[13px] font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.items.root.message}
                    </div>
                )}
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-[#dae8ff] text-[12px] font-bold text-[#003671] uppercase tracking-wider text-center">
                        <th className="px-4 py-3 border-b border-gray-200 w-[60px]">Return</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-left">Product Name<span className="text-rose-500">*</span></th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Purchase Qty</th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Available Qty</th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Batch No</th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Return Qty<span className="text-rose-500">*</span></th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Unit Price</th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[100px]">Deduction(%)</th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Dis. Value</th>
                        <th className="px-4 py-3 border-b border-gray-200 w-[120px] text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-[13px] font-medium text-[#475569] bg-white text-center">
                        {fields.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No items available</td>
                        </tr>
                        ) : (
                        fields.map((item, idx) => {
                            const rowError = errors.items?.[idx];
                            return (
                                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 text-center align-middle">
                                    <input
                                    type="checkbox"
                                    className="w-[20px] h-[20px] text-[#059669] rounded border-gray-300 focus:ring-[#059669] cursor-pointer mx-auto block accent-[#059669]"
                                    {...register(`items.${idx}.selected`)}
                                    onChange={(e) => handleSelectionChange(idx, e.target.checked)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-left">
                                    <span className="text-gray-500">{item.product_name}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {item.available_quantity}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {item.batch_no}
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                    type="number"
                                    step="1"
                                    onKeyDown={(e) => { if (['-', '.', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                                    {...register(`items.${idx}.return_quantity`, {
                                        valueAsNumber: true,
                                        onChange: (e: any) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setValue(`items.${idx}.return_quantity`, val);
                                            updateRowCalculations(idx);
                                        }
                                    })}
                                    disabled={!watchItems[idx]?.selected}
                                    className={clsx(
                                        "w-full h-[34px] px-2 bg-white border rounded-lg text-center outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed",
                                        rowError?.return_quantity ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30"
                                    )}
                                    placeholder="0"
                                    />
                                    {rowError?.return_quantity && <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{rowError.return_quantity.message}</span>}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {formatCurrency(item.rate, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    {...register(`items.${idx}.deduction_percent`, {
                                        valueAsNumber: true,
                                        onChange: () => updateRowCalculations(idx)
                                    })}
                                    disabled={!watchItems[idx]?.selected}
                                    className="w-full h-[34px] px-2 bg-white border border-gray-200 rounded-lg text-center outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center text-[#1e4ba1] font-semibold">
                                    {formatCurrency(watchItems[idx]?.deduction_value || 0, currency, currencyPosition)}
                                </td>
                                <td className="px-4 py-3 text-right pr-4 text-[#1e4ba1] font-semibold">
                                    {formatCurrency(watchItems[idx]?.total || 0, currency, currencyPosition)}
                                </td>
                                </tr>
                            )
                        })
                        )}
                    </tbody>
                    </table>
                </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-start pb-10">
                <div className="lg:col-span-8 flex flex-col h-full">
                    <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm h-full flex flex-col">
                    <h2 className="text-[16px] font-bold text-[#1e293b] mb-6 flex items-center gap-2">
                        <div className="text-[#1e4ba1]"><AlertTriangle className="h-5 w-5" /></div>
                        Reason for Return
                    </h2>
                    <div className="space-y-6 flex-1 flex flex-col">
                        <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#475569]">Primary Category</label>
                        <Controller
                            control={control}
                            name="primary_category"
                            render={({ field }) => (
                                <Select2 
                                    options={[
                                    {value: 'defective', label: 'Defective Product'}, 
                                    {value: 'wrong_item', label: 'Wrong Item Shipped'}, 
                                    {value: 'other', label: 'Other'}
                                    ]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select primary category"
                                />
                            )}
                        />
                        </div>
                        <div className="space-y-1.5 flex-1 flex flex-col">
                        <label className="text-[13px] font-semibold text-[#475569]">Detailed Description</label>
                        <div className="flex-1 min-h-[200px]">
                            <Controller
                                control={control}
                                name="details"
                                render={({ field }) => (
                                    <RichEditor 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder="Enter special instructions or return terms here..."
                                    />
                                )}
                            />
                        </div>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-[#1e4ba1] rounded-xl p-6 shadow-lg text-white">
                    <h3 className="text-[18px] font-medium mb-6 opacity-90 border-b border-white/10 pb-4">Return Summary</h3>
                    <div className="space-y-4 mb-6 text-[14px]">
                        <div className="flex justify-between items-center">
                        <span className="opacity-80">Total Items</span>
                        <span className="font-semibold">{watchItems.filter(i => i.selected).length} Products</span>
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="opacity-80">Return Quantity</span>
                        <span className="font-semibold">{watchItems.filter(i => i.selected).reduce((sum, item) => sum + (Number(item.return_quantity) || 0), 0)} Units</span>
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="opacity-80">Subtotal Refund</span>
                        <span className="font-semibold">{formatCurrency((watchItems.filter(i => i.selected).reduce((sum, i) => sum + (Number(i.total) || 0), 0)) + (watchItems.filter(i => i.selected).reduce((sum, i) => sum + (Number(i.deduction_value) || 0), 0)), currency, currencyPosition)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="opacity-80">Restocking Fee</span>
                        <span className="font-bold text-rose-300">-{formatCurrency(watchItems.filter(i => i.selected).reduce((sum, i) => sum + (Number(i.deduction_value) || 0), 0), currency, currencyPosition)}</span>
                        </div>
                    </div>
                    <div className="pt-5 border-t border-white/20 flex justify-between items-center">
                        <p className="text-[14px] font-bold uppercase tracking-wider opacity-80">Net Vendor Refund</p>
                        <p className="text-[20px] font-bold">{formatCurrency(watchItems.filter(i => i.selected).reduce((sum, i) => sum + (Number(i.total) || 0), 0), currency, currencyPosition)}</p>
                    </div>
                    </div>

                    <div className="flex gap-4">
                    <button 
                        type="button" 
                        onClick={handleDiscard} 
                        className="flex-1 h-[48px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[15px] shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving || !purchase} 
                        className="flex-1 h-[48px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[15px]"
                    >
                        {isSaving ? (
                        <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                        <><Check className="h-5 w-5" strokeWidth={3} /> Return</>
                        )}
                    </button>
                    </div>
                </div>
                </div>
            </>
            )}
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/return/vendor' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard this return?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
