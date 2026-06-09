import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Check, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Package, 
  FileText, 
  Upload, 
  X,
  AlertCircle
} from 'lucide-react'
import { 
  purchaseSchema, type PurchaseFormValues 
} from '../../hooks/validation'
import { 
  useStorePurchase, 
  useVendorProductsSelect2, 
  usePaymentMethodsSelect2, 
  useCheckChalanNo, 
  useCheckBatchNo,
  useWarehouseStock,
  useRetrieveProductData
} from '../../hooks/usePurchases'
import { useVendorSelect2 } from '../../hooks/useSuppliers'
import { useWarehouseSelect2 } from '../../hooks/useWarehouse'
import { Select2 } from '@/components/Select/Select2'
import { clsx } from 'clsx'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/formatters'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useUiStore } from '@/store/useUiStore'

// --- Custom Hook for Debouncing ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// --- Nested Warehouse Row Component ---
const WarehouseRow = ({
  control,
  index,
  wIndex,
  itemId,
  warehouseOptions,
  allSelectedWarehouses,
  register,
  removeWarehouse,
  appendWarehouse,
  isLast,
  hasMultiple
}: {
  control: any;
  index: number;
  wIndex: number;
  itemId: number;
  warehouseOptions: any[];
  allSelectedWarehouses: number[];
  register: any;
  removeWarehouse: (i: number) => void;
  appendWarehouse: (data: any) => void;
  isLast: boolean;
  hasMultiple: boolean;
}) => {
  const warehouseId = useWatch({
    control,
    name: `items.${index}.warehouses.${wIndex}.warehouse_id`
  });

  const { data: stockData } = useWarehouseStock(itemId, warehouseId);

  const filteredOptions = useMemo(() => {
    return warehouseOptions.filter(opt => 
      !allSelectedWarehouses.includes(Number(opt.value)) || Number(opt.value) === Number(warehouseId)
    );
  }, [warehouseOptions, allSelectedWarehouses, warehouseId]);

  return (
    <div className="grid grid-cols-12 gap-4 items-center px-2">
      <div className="col-span-6">
        <Controller
          control={control}
          name={`items.${index}.warehouses.${wIndex}.warehouse_id`}
          render={({ field }) => (
            <Select2
              options={filteredOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select warehouse"
              className="bg-white"
            />
          )}
        />
      </div>
      <div className="col-span-2 flex justify-center">
        <span className="text-[13px] font-bold text-gray-400">
          {stockData?.stock || 0}
        </span>
      </div>
      <div className="col-span-2">
        <input 
          type="number" 
          step="0.01" 
          {...register(`items.${index}.warehouses.${wIndex}.quantity`)} 
          className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-center font-bold outline-none focus:ring-1 focus:ring-primary/30" 
        />
      </div>
      <div className="col-span-2 flex justify-center gap-2">
        {hasMultiple && (
          <button 
            type="button" 
            onClick={() => removeWarehouse(wIndex)} 
            className="p-1.5 bg-white border border-rose-100 text-rose-500 rounded-full shadow-sm hover:bg-rose-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        )}
        {isLast && (
          <button 
            type="button" 
            onClick={() => appendWarehouse({ warehouse_id: undefined as any, quantity: 1 })} 
            className="p-1.5 bg-white border border-blue-100 text-primary rounded-full shadow-sm hover:bg-blue-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
}

// --- Nested ItemRow Component ---
const PurchaseItemRow = ({ 
  control, register, index, remove, supplierId, setValue, getValues, errors, warehouses, allSelectedItems
}: { 
  control: any, register: any, index: number, remove: () => void, supplierId: number, setValue: any, getValues: any, errors: any, warehouses: any[], allSelectedItems: number[]
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { showNotificationModal } = useUiStore()

  const { fields: warehouseFields, append: appendWarehouse, remove: removeWarehouse } = useFieldArray({
    control,
    name: `items.${index}.warehouses`
  })

  const itemId = useWatch({ control, name: `items.${index}.item_id` })
  const rate = useWatch({ control, name: `items.${index}.rate` }) || 0
  const discountPercent = useWatch({ control, name: `items.${index}.discount_percent` }) || 0
  const warehouseItems = useWatch({ control, name: `items.${index}.warehouses` }) || []

  const allSelectedWarehouses = useMemo(() => 
    warehouseItems.map((w: any) => Number(w.warehouse_id)).filter(Boolean),
    [warehouseItems]
  );

  // Derived Product List based on selected supplier
  const { data: vendorProducts } = useVendorProductsSelect2(supplierId)
  
  const productOptions = useMemo(() => {
    const options = vendorProducts?.map((p: any) => ({ value: p.id, label: p.text })) || [];
    return options.filter((opt: any) => 
      !allSelectedItems.includes(Number(opt.value)) || Number(opt.value) === Number(itemId)
    );
  }, [vendorProducts, allSelectedItems, itemId])
  
  const warehouseOptions = useMemo(() => 
    warehouses?.map((w: any) => ({ value: w.id, label: w.text })) || [], [warehouses]
  )

  // Fetch product specific data (rate, stock) when item changes
  const { data: productData } = useRetrieveProductData(supplierId, itemId);

  const prevProductDataRef = useRef(productData);
  useEffect(() => {
    if (productData !== prevProductDataRef.current) {
      prevProductDataRef.current = productData;
      if (productData) {
         setValue(`items.${index}.rate`, productData.supplier_price || 0)
      }
    }
  }, [productData, setValue, index])

  const stock = productData?.total_product || 0;

  // Real-time Row Calculation Display
  const { rowTotal, rowDiscount } = useMemo(() => {
    let totalQty = 0;
    warehouseItems.forEach((w: any) => {
      totalQty += (parseFloat(String(w.quantity)) || 0)
    })
    
    const subtotal = totalQty * parseFloat(String(rate))
    const discountValue = subtotal * (parseFloat(String(discountPercent)) / 100)
    const netTotal = subtotal - discountValue

    return { rowTotal: netTotal, rowDiscount: discountValue }
  }, [rate, discountPercent, warehouseItems])

  // Sync to form for submission
  useEffect(() => {
    setValue(`items.${index}.discount_value`, parseFloat(rowDiscount.toFixed(2)))
    setValue(`items.${index}.total`, parseFloat(rowTotal.toFixed(2)))
  }, [rowTotal, rowDiscount, setValue, index])

  const handleItemChange = (val: any) => {
    if (allSelectedItems.includes(Number(val)) && Number(val) !== Number(itemId)) {
      showNotificationModal('Duplicate Item', 'Same item not allowed in multiple rows.', 'error');
      return;
    }
    setValue(`items.${index}.item_id`, val);
    setValue(`items.${index}.rate`, 0); // Explicitly reset rate so we know it's a new item (in case productData is cached)
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Item Card Header */}
      <div className="flex items-center justify-between bg-gray-50/50 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[14px] font-bold text-[#1e293b]">Item Details #{index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          <button type="button" onClick={remove} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all border border-rose-100/50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={clsx("p-2 transition-all duration-300", !isExpanded && "hidden")}>
        {/* Main Item Row */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 mb-6">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Item <span className="text-rose-500">*</span></label>
            <Controller
              control={control}
              name={`items.${index}.item_id`}
              render={({ field }) => (
                <Select2
                  options={productOptions}
                  value={field.value}
                  onChange={handleItemChange}
                  placeholder="Select"
                  isDisabled={!supplierId}
                  className={errors?.items?.[index]?.item_id ? "border-rose-500" : ""}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Stock</label>
            <div className="w-full h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-[13px] flex items-center justify-center font-bold text-[#1e293b] cursor-not-allowed">
              {stock}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Expiry Date</label>
            <input type="date" {...register(`items.${index}.expiry_date`)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Rate ($) <span className="text-rose-500">*</span></label>
            <input type="number" step="0.01" {...register(`items.${index}.rate`)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 text-center font-medium" placeholder="0.00" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Discount</label>
            <input type="number" step="0.01" {...register(`items.${index}.discount_percent`)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 text-center font-medium" placeholder="0" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Dis. Amount</label>
            <div className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] flex items-center justify-center font-bold text-gray-500 cursor-not-allowed">
              {getValues(`items.${index}.discount_value`) || '0.00'}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">T. Amount</label>
            <div className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] flex items-center justify-center font-bold text-[#1e293b] cursor-not-allowed">
              {getValues(`items.${index}.total`) || '0.00'}
            </div>
          </div>
        </div>

        {/* Nested Warehouse Table */}
        <div className="bg-[#dae8ff]/30 rounded-2xl border border-[#dae8ff] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-[#dae8ff]/50 border-b border-[#dae8ff]">
            <div className="col-span-6 text-[11px] font-black text-[#1e4ba1] uppercase tracking-widest">Warehouse <span className="text-rose-500">*</span></div>
            <div className="col-span-2 text-center text-[11px] font-black text-[#1e4ba1] uppercase tracking-widest">Stock</div>
            <div className="col-span-2 text-center text-[11px] font-black text-[#1e4ba1] uppercase tracking-widest">Qty*</div>
            <div className="col-span-2 text-center text-[11px] font-black text-[#1e4ba1] uppercase tracking-widest">Action</div>
          </div>
          
          <div className="p-3 space-y-3">
            {warehouseFields.map((wField, wIndex) => (
              <WarehouseRow
                key={wField.id}
                control={control}
                index={index}
                wIndex={wIndex}
                itemId={itemId}
                warehouseOptions={warehouseOptions}
                allSelectedWarehouses={allSelectedWarehouses}
                register={register}
                removeWarehouse={removeWarehouse}
                appendWarehouse={appendWarehouse}
                isLast={wIndex === warehouseFields.length - 1}
                hasMultiple={warehouseFields.length > 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Page Component ---
export const PurchaseCreatePage = () => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const { mutate: storePurchase, isPending } = useStorePurchase()
  const { showNotificationModal } = useUiStore()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Lookups
  const { data: vendors } = useVendorSelect2()
  const { data: warehouses } = useWarehouseSelect2()
  const { data: paymentMethods } = usePaymentMethodsSelect2()

  const vendorOptions = useMemo(() => vendors?.map((v: any) => ({ value: v.id, label: v.text })) || [], [vendors])
  const paymentMethodOptions = useMemo(() => paymentMethods?.map((p: any) => ({ value: p.id, label: p.text })) || [], [paymentMethods])

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors, isDirty } } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues: {
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_discount: 0,
      paid_amount: 0,
      items: [{ item_id: undefined as any, rate: 0, discount_percent: 0, discount_value: 0, total: 0, warehouses: [{ warehouse_id: undefined as any, quantity: 1 }] }]
    }
  })

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  })

  const supplierId = watch('supplier_id')
  const purchaseDiscount = watch('purchase_discount') || 0
  const paidAmount = watch('paid_amount') || 0
  const items = watch('items')
  const invoiceFile = watch('invoice_file')
  const chalanNo = watch('chalan_no')
  const batchNo = watch('batch_no')

  const allSelectedItems = useMemo(() => 
    items?.map((item: any) => Number(item.item_id)).filter(Boolean) || [],
    [items]
  );

  // Debounced Checks
  const debouncedChalanNo = useDebounce(chalanNo, 500)
  const debouncedBatchNo = useDebounce(batchNo, 500)
  const { data: chalanCheck } = useCheckChalanNo(debouncedChalanNo)
  const { data: batchCheck } = useCheckBatchNo(debouncedBatchNo)

  // Global Calculations
  const { subTotal, totalItemDiscount, grandTotal, dueAmount } = useMemo(() => {
    let sub = 0
    let itemDisc = 0
    
    items?.forEach(item => {
      let qty = 0;
      item.warehouses?.forEach((w: any) => {
        qty += (parseFloat(String(w.quantity)) || 0);
      });
      const r = parseFloat(String(item.rate)) || 0;
      const dp = parseFloat(String(item.discount_percent)) || 0;
      
      const itemSub = qty * r;
      const idv = itemSub * (dp / 100);

      sub += itemSub;
      itemDisc += idv;
    })

    const globalDisc = parseFloat(String(purchaseDiscount)) || 0
    const grand = sub - itemDisc - globalDisc // Grand total is sum of item subtotals - item discounts - global discount
    const paid = parseFloat(String(paidAmount)) || 0
    const due = grand - paid

    return { subTotal: sub, totalItemDiscount: itemDisc, grandTotal: grand, dueAmount: due }
  }, [items, purchaseDiscount, paidAmount])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const { ref: fileInputHookRef, ...invoiceFileRegister } = register('invoice_file')

  const onSubmit = (data: PurchaseFormValues) => {
    if (chalanCheck?.chalan_no) {
      showNotificationModal('Chalan Error', 'Chalan No Already Exists!', 'error');
      return;
    }
    if (batchCheck?.batch_no) {
      showNotificationModal('Batch Error', 'Batch No Already Exists!', 'error');
      return;
    }

    const formData = new FormData()
    formData.append('supplier_id', String(data.supplier_id))
    formData.append('purchase_date', data.purchase_date)
    formData.append('chalan_no', data.chalan_no)
    if (data.details) formData.append('purchase_details', data.details)
    if (data.invoice_file?.[0]) formData.append('invoice_file', data.invoice_file[0])

    formData.append('total_amount', String(subTotal))
    formData.append('purchase_discount', String(data.purchase_discount))
    formData.append('total_discount', String(totalItemDiscount + parseFloat(String(data.purchase_discount))))
    formData.append('grand_total', String(grandTotal))
    formData.append('paid_amount', String(data.paid_amount))
    formData.append('due_amount', String(dueAmount))
    if (data.payment_type_id) formData.append('payment_type_id', String(data.payment_type_id))
    formData.append('payment_amount', String(data.paid_amount))

    let flatIndex = 0;
    data.items.forEach((item) => {
      item.warehouses.forEach((w) => {
        formData.append(`items[${flatIndex}][item_id]`, String(item.item_id))
        formData.append(`items[${flatIndex}][warehouse_id]`, String(w.warehouse_id))
        formData.append(`items[${flatIndex}][batch_no]`, data.batch_no)
        formData.append(`items[${flatIndex}][quantity]`, String(w.quantity))
        formData.append(`items[${flatIndex}][rate]`, String(item.rate))
        if (item.expiry_date) formData.append(`items[${flatIndex}][expiry_date]`, item.expiry_date)
        formData.append(`items[${flatIndex}][discount_percent]`, String(item.discount_percent))
        formData.append(`items[${flatIndex}][discount_value]`, String(item.discount_value))
        formData.append(`items[${flatIndex}][total]`, String(item.total))
        flatIndex++;
      })
    })

    storePurchase(formData, {
      onSuccess: () => navigate({ to: '/inventory/purchase' })
    })
  }

  const handleDiscard = () => {
    if (isDirty) setIsDiscardModalOpen(true)
    else navigate({ to: '/inventory/purchase' })
  }

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
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Add Purchase</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-9 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#1e293b] mb-6 flex items-center gap-2">
                 <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Info className="h-4 w-4" /></div>
                 Purchase Header
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Vendor <span className="text-rose-500">*</span></label>
                  <Controller control={control} name="supplier_id" render={({ field }) => (
                    <Select2 options={vendorOptions} value={field.value} onChange={(val) => {
                      field.onChange(val);
                      setValue('items', [{ item_id: undefined as any, rate: 0, discount_percent: 0, discount_value: 0, total: 0, warehouses: [{ warehouse_id: undefined as any, quantity: 1 }] }]);
                    }} placeholder="Select vendor" className={errors.supplier_id ? "border-rose-500" : ""} />
                  )} />
                  {errors.supplier_id && <span className="text-rose-500 text-[11px] font-medium">{errors.supplier_id.message}</span>}
                </div>
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Purchase Date <span className="text-rose-500">*</span></label>
                  <input type="date" {...register('purchase_date')} className={clsx("w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:border-primary", errors.purchase_date ? "border-rose-500" : "border-gray-200")} />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Chalan No <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input 
                      type="text" 
                      {...register('chalan_no')} 
                      placeholder="Enter chalan number" 
                      className={clsx(
                        "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:border-primary", 
                        errors.chalan_no || chalanCheck?.chalan_no ? "border-rose-500" : "border-gray-200"
                      )} 
                    />
                    {chalanCheck?.chalan_no && (
                      <div className="absolute -bottom-5 left-0 text-[11px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Chalan No Already Exists!
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Batch No <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input 
                      type="text" 
                      {...register('batch_no')} 
                      placeholder="Enter batch number" 
                      className={clsx(
                        "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:border-primary",
                        errors.batch_no || batchCheck?.batch_no ? "border-rose-500" : "border-gray-200"
                      )} 
                    />
                    {batchCheck?.batch_no && (
                      <div className="absolute -bottom-5 left-0 text-[11px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Batch No Already Exists!
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-4 space-y-1.5">
                   <label className="text-[13px] font-semibold text-[#475569]">Invoice Upload</label>
                   <div className="flex items-center gap-3">
                      <button type="button" onClick={handleUploadClick} className="h-[38px] px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-lg flex items-center gap-2 font-bold text-[13px] transition-all shadow-md active:scale-95 shrink-0">
                        Upload
                        <div className="p-0.5 bg-white/20 rounded">
                           <Upload className="h-3.5 w-3.5" />
                        </div>
                      </button>
                      <input 
                        type="file" 
                        {...invoiceFileRegister}
                        ref={(e) => {
                          fileInputHookRef(e)
                          fileInputRef.current = e
                        }}
                        accept=".pdf,.jpg,.png,.jpeg" 
                        className="hidden" 
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-medium leading-tight">
                           {invoiceFile?.[0] ? (
                             <span className="text-primary font-bold truncate max-w-[150px] block">
                               {invoiceFile[0].name}
                             </span>
                           ) : (
                             <>PNG, JPG or WEBP<br/>(Max. 2MB)</>
                           )}
                        </span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-primary/10 p-2 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Package className="h-4 w-4" /></div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Item Details</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => appendItem({ item_id: undefined as any, rate: 0, discount_percent: 0, discount_value: 0, total: 0, warehouses: [{ warehouse_id: undefined as any, quantity: 1 }] })} className="px-4 py-2 bg-[#1e293b] text-white text-[13px] font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm">
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                  <button type="button" onClick={() => setValue('items', [])} className="p-2 bg-rose-50 text-rose-500 rounded-lg border border-rose-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {errors.items && typeof errors.items.message === 'string' && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[13px] font-medium">
                  {errors.items.message}
                </div>
              )}

              <div className="space-y-4">
                 {itemFields.map((field, index) => (
                    <PurchaseItemRow
                       key={field.id}
                       control={control}
                       register={register}
                       index={index}
                       remove={() => removeItem(index)}
                       supplierId={supplierId}
                       setValue={setValue}
                       getValues={getValues}
                       errors={errors}
                       warehouses={warehouses}
                       allSelectedItems={allSelectedItems}
                    />
                 ))}
                 
                 <button 
                    type="button" 
                    onClick={() => appendItem({ item_id: undefined as any, rate: 0, discount_percent: 0, discount_value: 0, total: 0, warehouses: [{ warehouse_id: undefined as any, quantity: 1 }] })}
                    className="w-full py-4 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center gap-2 text-primary font-bold text-[14px] hover:bg-primary/5 hover:border-primary/40 transition-all group"
                 >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    Add Item
                 </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm flex flex-col">
               <h2 className="text-[16px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><FileText className="h-4 w-4" /></div>
                  Purchase Details & Notes
               </h2>
               <Controller
                 control={control}
                 name="details"
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

          <div className="lg:col-span-3 flex flex-col gap-6 sticky top-6">
            <div className="bg-primary rounded-xl p-4 shadow-lg text-white">
               <h3 className="text-[16px] font-bold mb-6 opacity-90">Payment Summary</h3>
               <div className="space-y-4 mb-6 text-[14px]">
                 <div className="flex justify-between items-center text-[15px]">
                    <span className="opacity-80 font-medium">Sub Total</span>
                    <span className="font-bold">{formatCurrency(subTotal, currency, currencyPosition)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[15px]">
                    <span className="opacity-80 font-medium">Total Discount</span>
                    <span className="font-bold text-rose-300">- {formatCurrency(totalItemDiscount, currency, currencyPosition)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[15px]">
                    <span className="opacity-80 font-medium">Tax (Vat 0%)</span>
                    <span className="font-bold">{formatCurrency(0, currency, currencyPosition)}</span>
                 </div>
               </div>
               <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                 <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">Grand Total</p>
                    <p className="text-[24px] font-black">{formatCurrency(grandTotal, currency, currencyPosition)}</p>
                 </div>
                 <div className="px-3 py-1 bg-white/20 rounded-md text-[11px] font-bold">
                    Pending
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm space-y-5">
               <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Purchase Discount ({currencyPosition === '0' ? currency : ''} {currencyPosition === '1' ? currency : ''})</label>
                  <input type="number" step="0.01" {...register('purchase_discount')} className="w-full h-[40px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary text-right font-medium" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Paid Amount ({currencyPosition === '0' ? currency : ''} {currencyPosition === '1' ? currency : ''})</label>
                  <input type="number" step="0.01" {...register('paid_amount')} className="w-full h-[40px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary text-right font-medium" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Payment Type</label>
                  <span className="text-[11px] text-rose-500 font-medium">* Select Payment Method</span>
                  <Controller control={control} name="payment_type_id" render={({ field }) => (
                    <Select2 options={paymentMethodOptions} value={field.value} onChange={field.onChange} placeholder="Select payment type" />
                  )} />
               </div>
               <div className="pt-4 mt-2 border-t border-gray-100">
                  <p className="text-[12px] font-bold text-rose-500 mb-1">Remaining Balance</p>
                  <div className="w-full h-[40px] px-3 bg-rose-50 border border-rose-100 rounded-lg text-[14px] flex items-center justify-end font-bold text-rose-600">
                     {formatCurrency(dueAmount, currency, currencyPosition)}
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-2">
               <button type="button" onClick={handleDiscard} className="flex-1 h-[48px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[15px] shadow-sm">
                 Cancel
               </button>
               <button type="button" onClick={handleSubmit(onSubmit)} disabled={isPending} className="flex-1 h-[48px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[15px]">
                 {isPending ? (
                   <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <><Check className="h-5 w-5" strokeWidth={3} /> Save</>
                 )}
               </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/purchase' })}
        title="Discard Purchase?"
        message="You have unsaved changes. Are you sure you want to discard this purchase?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
