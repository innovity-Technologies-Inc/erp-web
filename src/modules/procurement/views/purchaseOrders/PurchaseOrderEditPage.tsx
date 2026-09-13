import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  FileText,
  Upload,
  Paperclip,
  Check,
  Building2,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  Save,
  ShoppingBag,
  Info,
  Calendar,
  Sparkles,
  ShieldCheck,
  X,
  FileCheck2,
  Download,
  Clock,
} from 'lucide-react'
import { purchaseOrderSchema, type PurchaseOrderFormValues } from '../../hooks/validation'
import { usePurchaseOrderDetails, useUpdatePurchaseOrder, usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { useCostCenters } from '../../hooks/useCostCenters'
import { useDepartments } from '@/modules/hrm'
import { useVendors } from '../../hooks/useVendors'
import { useRFQs, useRFQDetails } from '../../hooks/useRFQs'
import { useProductSelect2, useCategorySelect2 } from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { getProductData } from '@/modules/inventory/api/products.api'
import { useQuery } from '@tanstack/react-query'
import { Select2 } from '@/components/Select/Select2'
import { clsx } from 'clsx'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { useSettings } from '@/hooks/useSettings'
import { useCurrenciesDatatable } from '@/modules/settings/hooks/useCurrencies'
import { useGetTaxSetting, useGetVatTaxSetting } from '@/modules/account/hooks/useEin'
import { formatCurrency } from '@/utils/formatters'
import { LoadingState } from '@/components/Loading/LoadingState'

// --- Single PO Item Row Component ---
const POItemRow = ({
  control,
  register,
  index,
  remove,
  setValue,
  errors,
  productOptions,
  selectedProductIds,
  categoryOptions,
  unitOptions,
  trigger,
  currency,
  currencyPos,
}: {
  control: any
  register: any
  index: number
  remove: () => void
  setValue: any
  errors: any
  productOptions: any[]
  selectedProductIds: number[]
  categoryOptions: any[]
  unitOptions: any[]
  trigger: any
  currency: string
  currencyPos: string
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const productId = useWatch({ control, name: `items.${index}.product_id` })
  const quantity = useWatch({ control, name: `items.${index}.quantity` }) ?? 0
  const rate = useWatch({ control, name: `items.${index}.rate` }) ?? 0
  const vatPercentage = useWatch({ control, name: `items.${index}.vat_percentage` }) ?? 0
  const itemDescription = useWatch({ control, name: `items.${index}.item_description` })
  const hsCode = useWatch({ control, name: `items.${index}.hs_code` })
  const hasExtra = Boolean(itemDescription || hsCode)

  const filteredProductOptions = useMemo(() => {
    const currentId = Number(productId)
    return productOptions.filter((opt: any) => {
      const optVal = Number(opt.value)
      return optVal === currentId || !selectedProductIds.includes(optVal)
    })
  }, [productOptions, productId, selectedProductIds])

  const lineSubTotal = (Number(quantity) || 0) * (Number(rate) || 0)
  const lineVat = lineSubTotal * ((Number(vatPercentage) || 0) / 100)
  const lineTotal = lineSubTotal + lineVat

  const handleProductChange = async (val: any, opt?: any) => {
    const numVal = Number(val)
    setValue(`items.${index}.product_id`, numVal)
    trigger(`items.${index}.product_id`)

    if (opt?.category_id) {
      setValue(`items.${index}.category_id`, Number(opt.category_id))
      trigger(`items.${index}.category_id`)
    }
    if (opt?.unit_id) {
      setValue(`items.${index}.unit_id`, Number(opt.unit_id))
      trigger(`items.${index}.unit_id`)
    }
    if (opt?.price && (!rate || Number(rate) === 0)) {
      setValue(`items.${index}.rate`, parseFloat(opt.price) || 0)
      trigger(`items.${index}.rate`)
    }

    if (numVal && (!opt?.category_id || !opt?.unit_id)) {
      try {
        const prodData = await getProductData(numVal)
        const product = (prodData as any)?.response || (prodData as any)?.data || prodData
        if (product) {
          if (product.category_id) {
            setValue(`items.${index}.category_id`, Number(product.category_id))
            trigger(`items.${index}.category_id`)
          }
          if (product.unit_id) {
            setValue(`items.${index}.unit_id`, Number(product.unit_id))
            trigger(`items.${index}.unit_id`)
          }
          if (product.purchase_price && (!rate || Number(rate) === 0)) {
            setValue(`items.${index}.rate`, parseFloat(product.purchase_price) || 0)
            trigger(`items.${index}.rate`)
          }
        }
      } catch (err) {
        // Fallback
      }
    }
    trigger('items')
  }

  const rowError = errors?.items?.[index]

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', 'e', 'E'].includes(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      {/* Item Card Header */}
      <div className="flex items-center justify-between bg-gray-50/80 px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[13px] font-bold text-[#1e293b]">
            Item #{index + 1}
            {lineTotal > 0 && (
              <span className="ml-3 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {formatCurrency(lineTotal, currency, currencyPos)}
              </span>
            )}
          </span>
          {hasExtra && !isExpanded && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Specs Attached
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Hide Specifications' : 'Add / View Specifications'}
          >
            <span>{isExpanded ? 'Hide Specs' : 'Specs / Notes'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={remove}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all border border-rose-100/50 cursor-pointer"
            title="Remove Item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Item Body Grid */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          {/* Product Selection */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Product <span className="text-rose-500">*</span>
            </label>
            <Controller
              control={control}
              name={`items.${index}.product_id`}
              render={({ field }) => (
                <Select2
                  options={filteredProductOptions}
                  value={field.value}
                  onChange={(val, opt) => handleProductChange(val, opt)}
                  placeholder="Select Product..."
                  error={rowError?.product_id?.message as string}
                />
              )}
            />
          </div>

          {/* Category */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Category <span className="text-rose-500">*</span>
            </label>
            <Controller
              control={control}
              name={`items.${index}.category_id`}
              render={({ field }) => (
                <Select2
                  options={categoryOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val ? Number(val) : undefined)
                    trigger(`items.${index}.category_id`)
                  }}
                  placeholder="Category..."
                  error={rowError?.category_id?.message as string}
                />
              )}
            />
          </div>

          {/* Unit */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Unit <span className="text-rose-500">*</span>
            </label>
            <Controller
              control={control}
              name={`items.${index}.unit_id`}
              render={({ field }) => (
                <Select2
                  options={unitOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val ? Number(val) : undefined)
                    trigger(`items.${index}.unit_id`)
                  }}
                  placeholder="Unit..."
                  error={rowError?.unit_id?.message as string}
                />
              )}
            />
          </div>

          {/* Quantity */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Order Qty <span className="text-rose-500">*</span>
            </label>
            <input
              {...register(`items.${index}.quantity`, {
                valueAsNumber: true,
                onChange: () => trigger('items'),
              })}
              type="number"
              min="0.01"
              step="any"
              onKeyDown={handleNumericKeyDown}
              placeholder="0.00"
              className={clsx(
                'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] font-medium font-mono outline-none transition-all text-right',
                rowError?.quantity ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-200 focus:border-primary/50'
              )}
            />
            {rowError?.quantity && (
              <p className="text-[11px] text-rose-500 font-medium">{rowError.quantity.message}</p>
            )}
          </div>

          {/* Unit Rate */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Unit Rate ({currency}) <span className="text-rose-500">*</span>
            </label>
            <input
              {...register(`items.${index}.rate`, {
                valueAsNumber: true,
                onChange: () => trigger('items'),
              })}
              type="number"
              min="0"
              step="any"
              onKeyDown={handleNumericKeyDown}
              placeholder="0.00"
              className={clsx(
                'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] font-mono font-bold outline-none transition-all text-right text-emerald-700 focus:border-primary/50',
                rowError?.rate ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-200'
              )}
            />
            {rowError?.rate && (
              <p className="text-[11px] text-rose-500 font-medium">{rowError.rate.message}</p>
            )}
          </div>
        </div>

        {/* Expanded Specs & HS Code Accordion */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-3 animate-in fade-in duration-150">
            <div className="md:col-span-9 space-y-1">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                Item Specifications / Notes
              </label>
              <input
                {...register(`items.${index}.item_description`)}
                type="text"
                placeholder="Enter technical specifications, brand requirements, dimensions..."
                className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                HS Code (Optional)
              </label>
              <input
                {...register(`items.${index}.hs_code`)}
                type="text"
                placeholder="e.g. 8471.30.00"
                className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-mono outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main PurchaseOrderEditPage Component ---
export const PurchaseOrderEditPage = () => {
  const params = useParams({ strict: false }) as Record<string, string | undefined>
  const uuid = params.id || params.uuid || ''
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { currency, currencyPosition, webSetting } = useSettings()
  const activeCurrency = currency || '৳'
  const activeCurrencyPos = currencyPosition || 'right'

  // Master Queries
  const { data: poResponse, isLoading: isPoLoading } = usePurchaseOrderDetails(uuid)
  const { data: costCentersData } = useCostCenters({ per_page: 100 })
  const { data: departmentsData } = useDepartments({ all: true })
  const { data: vendorsData } = useVendors({ per_page: 200, status: 'approved' })
  const { data: rfqsData } = useRFQs({ per_page: 100, status: 'awarded' })
  const { data: productsData } = useProductSelect2()
  const { data: categoriesData } = useCategorySelect2()
  const { data: currenciesData } = useCurrenciesDatatable({ length: 100 })
  const { data: unitsData } = useQuery({
    queryKey: ['units', 'select2'],
    queryFn: () => getUnitSelect2(),
  })

  // Tax & EIN Dynamic Settings from Account Module
  const { data: vatTaxSettingData } = useGetVatTaxSetting()
  const { data: taxSettingsData } = useGetTaxSetting()

  // Dynamic VAT percentage calculated from Account EIN settings
  const dynamicVatRate = useMemo(() => {
    const taxes = taxSettingsData?.data || []
    if (taxes.length > 0) {
      const activeTaxes = taxes.filter((t) => t.is_show !== 0)
      const listToSum = activeTaxes.length > 0 ? activeTaxes : taxes
      return listToSum.reduce((acc, t) => acc + (parseFloat(String(t.default_value)) || 0), 0)
    }
    return 0
  }, [taxSettingsData])

  const po = poResponse?.response || (poResponse as any)?.data

  // Selected RFQ details query for pre-filling when user switches RFQ
  const [selectedRfqUuid, setSelectedRfqUuid] = useState<string>('')
  const {
    data: rfqDetailsResponse,
    isLoading: isRfqDetailsLoading,
    isFetching: isRfqDetailsFetching,
  } = useRFQDetails(selectedRfqUuid)
  const isRfqSyncing = Boolean(selectedRfqUuid && (isRfqDetailsLoading || isRfqDetailsFetching))
  const lastSyncedRfqId = useRef<number | null>(null)

  // Attachments State
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  // React Hook Form
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    trigger,
    formState: { errors, isDirty },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema) as any,
    defaultValues: {
      po_date: new Date().toISOString().split('T')[0],
      po_validity_date: '',
      currency: 'BDT',
      vat_percentage: 0,
      items: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = useWatch({ control, name: 'items' }) || []
  const watchedVat = useWatch({ control, name: 'vat_percentage' }) ?? dynamicVatRate
  const watchedRfqId = useWatch({ control, name: 'rfq_id' })

  const selectedProductIds = useMemo(() => {
    return (watchedItems || [])
      .map((item) => Number(item?.product_id))
      .filter((id) => !isNaN(id) && id > 0)
  }, [watchedItems])

  const { totalItemsCount, totalQuantity, subTotal, vatAmount, grandTotal } = useMemo(() => {
    let count = 0
    let totalQty = 0
    let sub = 0

    watchedItems.forEach((it) => {
      count++
      const q = parseFloat(String(it?.quantity)) || 0
      const r = parseFloat(String(it?.rate)) || 0
      totalQty += q
      sub += q * r
    })

    const vatPct = parseFloat(String(watchedVat)) || 0
    const vat = sub * (vatPct / 100)
    const total = sub + vat

    return {
      totalItemsCount: count,
      totalQuantity: totalQty,
      subTotal: sub,
      vatAmount: vat,
      grandTotal: total,
    }
  }, [watchedItems, watchedVat])

  // Populate data when PO loads
  useEffect(() => {
    if (po) {
      if (po.rfq_id) {
        lastSyncedRfqId.current = Number(po.rfq_id)
      }
      reset({
        po_date: po.po_date ? po.po_date.split('T')[0] : '',
        po_validity_date: po.po_validity_date ? po.po_validity_date.split('T')[0] : '',
        currency: po.currency || 'BDT',
        rfq_id: po.rfq_id ? Number(po.rfq_id) : undefined,
        vendor_id: po.vendor_id ? Number(po.vendor_id) : undefined,
        department_id: po.department_id ? Number(po.department_id) : undefined,
        cost_center_id: po.cost_center_id ? Number(po.cost_center_id) : undefined,
        payment_terms: po.payment_terms || '',
        delivery_terms: po.delivery_terms || '',
        vat_percentage: po.vat_percentage !== null && po.vat_percentage !== undefined ? Number(po.vat_percentage) : dynamicVatRate,
        items: (po.items || []).map((it: any) => ({
          product_id: Number(it.product_id),
          category_id: Number(it.category_id),
          unit_id: Number(it.unit_id),
          item_description: it.item_description || '',
          hs_code: it.hs_code || '',
          quantity: Number(it.quantity),
          rate: Number(it.rate),
          vat_percentage: Number(it.vat_percentage) || 0,
        })),
      })
    }
  }, [po, reset, dynamicVatRate])

  // Query existing POs to filter out already-linked RFQs (except the currently assigned RFQ to this PO)
  const { data: existingPOsResponse } = usePurchaseOrders({ per_page: 200 })
  const usedRfqIds = useMemo(() => {
    return new Set(
      (existingPOsResponse?.response || [])
        .filter((p: any) => p.uuid !== uuid && p.id !== po?.id)
        .map((p: any) => p.rfq_id)
        .filter((id: any) => id !== null && id !== undefined && id > 0)
    )
  }, [existingPOsResponse, uuid, po?.id])

  const rfqOptions = useMemo(() => {
    return (rfqsData?.response || [])
      .filter((r) => {
        const s = typeof r.status === 'object' && r.status !== null ? (r.status as any).value : r.status
        const isAwarded = s === 'awarded'
        const isAlreadyConvertedByOther = usedRfqIds.has(r.id)
        return (isAwarded && !isAlreadyConvertedByOther) || Number(r.id) === Number(po?.rfq_id)
      })
      .map((r) => ({
        value: r.id,
        label: `${r.rfq_no} - Awarded Tender`,
        uuid: r.uuid,
      }))
  }, [rfqsData, usedRfqIds, po?.rfq_id])

  // Sync details & line items when user selects a different RFQ on Edit page
  useEffect(() => {
    if (rfqDetailsResponse?.response && selectedRfqUuid) {
      const rfq = rfqDetailsResponse.response
      if (lastSyncedRfqId.current === Number(rfq.id)) {
        return
      }
      lastSyncedRfqId.current = Number(rfq.id)

      if (rfq.department_id) setValue('department_id', Number(rfq.department_id), { shouldValidate: true })
      if (rfq.cost_center_id) setValue('cost_center_id', Number(rfq.cost_center_id), { shouldValidate: true })
      if (rfq.currency) setValue('currency', rfq.currency, { shouldValidate: true })
      if (rfq.payment_terms) setValue('payment_terms', rfq.payment_terms)
      if (rfq.delivery_terms) setValue('delivery_terms', rfq.delivery_terms)

      // Find winning vendor quotation
      const quotations = rfq.quotations || []
      const winningQuote = quotations.find(
        (q: any) => {
          const s = typeof q.status === 'object' && q.status !== null ? q.status.value : q.status
          return s === 'selected'
        }
      )

      if (winningQuote?.vendor_id) {
        setValue('vendor_id', Number(winningQuote.vendor_id), { shouldValidate: true })
        if (winningQuote.payment_terms) setValue('payment_terms', winningQuote.payment_terms)
      } else if (rfq.target_vendors && rfq.target_vendors.length === 1) {
        setValue('vendor_id', Number(rfq.target_vendors[0].vendor_id), { shouldValidate: true })
      } else if (rfq.targetVendors && rfq.targetVendors.length === 1) {
        setValue('vendor_id', Number(rfq.targetVendors[0].vendor_id), { shouldValidate: true })
      }

      // Pre-populate line items from RFQ & winning quotation
      const sourceItems = rfq.items && rfq.items.length > 0 ? rfq.items : []
      if (sourceItems && sourceItems.length > 0) {
        const formattedItems = sourceItems.map((ri: any) => {
          const qi = (winningQuote?.items || []).find(
            (qItem: any) => Number(qItem.rfq_item_id) === Number(ri.id)
          )
          return {
            product_id: Number(ri.product_id),
            category_id: Number(ri.category_id || ri.product?.category_id),
            unit_id: Number(ri.unit_id || ri.product?.unit_id),
            item_description: ri.item_description || '',
            hs_code: '',
            quantity: Number(ri.quantity || 1),
            rate: Number(qi?.unit_price ?? ri.product?.purchase_price ?? 0),
            vat_percentage: 0,
          }
        })
        replace(formattedItems)
      }
      trigger()
    }
  }, [rfqDetailsResponse, selectedRfqUuid, setValue, replace, trigger])

  // Select Options
  const costCenterOptions = useMemo(() => {
    return (costCentersData?.response || []).map((cc) => ({
      value: cc.id,
      label: `${cc.code} - ${cc.name}`,
    }))
  }, [costCentersData])

  const departmentOptions = useMemo(() => {
    const list = departmentsData?.data || departmentsData?.response || []
    return list.map((d: any) => ({
      value: d.id,
      label: d.name,
    }))
  }, [departmentsData])

  const vendorOptions = useMemo(() => {
    return (vendorsData?.response || []).map((v) => ({
      value: v.id,
      label: `${v.name} (${v.code})`,
    }))
  }, [vendorsData])

  const productOptions = useMemo(() => {
    return (
      productsData?.map((p: any) => ({
        value: p.id,
        label: p.text,
        category_id: p.category_id,
        unit_id: p.unit_id,
        price: p.price,
      })) || []
    )
  }, [productsData])

  const categoryOptions = useMemo(() => {
    return categoriesData?.map((c: any) => ({ value: c.id, label: c.text })) || []
  }, [categoriesData])

  const unitOptions = useMemo(() => {
    return unitsData?.map((u: any) => ({ value: u.id, label: u.text })) || []
  }, [unitsData])

  const currencyOptions = useMemo(() => {
    const list = currenciesData?.data || []
    if (list.length === 0) {
      return []
    }
    return list.map((c: any) => ({
      value: c.currency_name || c.code || c.icon,
      label: c.icon ? `${c.currency_name || c.code} (${c.icon})` : (c.currency_name || c.code),
    }))
  }, [currenciesData])

  // File attachments handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Mutation
  const { mutate: updatePOMutate, isPending } = useUpdatePurchaseOrder()

  const onSubmit = (data: PurchaseOrderFormValues) => {
    const payload = {
      uuid,
      ...data,
      department_id: Number(data.department_id),
      cost_center_id: Number(data.cost_center_id),
      vendor_id: Number(data.vendor_id),
      rfq_id: data.rfq_id ? Number(data.rfq_id) : undefined,
      vat_percentage: Number(data.vat_percentage) || 0,
      items: data.items.map((it) => ({
        product_id: Number(it.product_id),
        category_id: Number(it.category_id),
        unit_id: Number(it.unit_id),
        item_description: it.item_description || '',
        hs_code: it.hs_code || '',
        quantity: Number(it.quantity),
        rate: Number(it.rate),
        vat_percentage: Number(it.vat_percentage) || 0,
      })),
      attachments: attachments.length > 0 ? attachments : undefined,
    }

    updatePOMutate(payload as any, {
      onSuccess: () => {
        showNotificationModal('Purchase Order Updated', `Purchase Order "${po?.po_no || uuid}" updated successfully.`, 'success')
        navigate({ to: '/procurement/purchase-orders' as any })
      },
      onError: (err: any) => {
        const backendErrors = err.response?.data?.errors
        if (backendErrors && typeof backendErrors === 'object') {
          Object.entries(backendErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
            setError(field as any, { type: 'server', message: msg })
          })
          const errorList = Object.entries(backendErrors)
            .map(([_, msgs]) => (Array.isArray(msgs) ? msgs.join(', ') : msgs))
            .join(' | ')
          showNotificationModal('Validation Failed', errorList || 'Please check highlighted fields.', 'error')
        } else {
          const msg = err.response?.data?.message || err.message || 'Failed to update Purchase Order.'
          showNotificationModal('Update Error', msg, 'error')
        }
      },
    })
  }

  const onInvalid = (validationErrors: any) => {
    console.error('Validation Errors:', validationErrors)
    setTimeout(() => {
      const errorElement = document.querySelector('.text-rose-500, .border-rose-500, .text-rose-600')
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleDiscard = () => {
    if (isDirty || attachments.length > 0) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/procurement/purchase-orders' as any })
    }
  }

  if (isPoLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <LoadingState message="Loading Purchase Order Details..." />
      </div>
    )
  }

  if (!po) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Purchase Order Not Found</h2>
          <p className="text-gray-500 text-xs mb-6">The requested Purchase Order does not exist or has been deleted.</p>
          <button
            onClick={() => navigate({ to: '/procurement/purchase-orders' as any })}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            Return to PO List
          </button>
        </div>
      </div>
    )
  }

  const currentStatus = typeof po.status === 'object' && po.status !== null ? po.status.value : po.status

  if (currentStatus && currentStatus !== 'draft') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <div className="p-3 bg-amber-50 rounded-full text-amber-500 w-fit mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Editing Restricted</h2>
          <p className="text-gray-500 text-xs mb-6">
            Purchase Order &quot;{po.po_no}&quot; is currently in &quot;<strong>{currentStatus}</strong>&quot; status. Only draft Purchase Orders can be directly edited.
          </p>
          <button
            onClick={() => navigate({ to: `/procurement/purchase-orders/view/${po.uuid}` as any })}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            View Purchase Order
          </button>
        </div>
      </div>
    )
  }

  const existingAttachments = po.attachments || []
  const backendBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-16 font-poppins text-[#475569]">
      {/* Top Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-xs font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            Edit Purchase Order <span className="font-mono text-primary font-bold text-base">({po.po_no})</span>
          </h1>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-[1600px] mx-auto pb-12">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (9 Cols) */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* Card 1: Order Header & Vendor Details */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <Info className="h-4 w-4" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Purchase Order Header</h2>
                </div>
                {watchedRfqId && (
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Linked to Awarded RFQ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Source RFQ Selection (Full Width on Top) */}
                <div className="md:col-span-12 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-primary" />
                      Select Awarded RFQ / Tender (Optional)
                    </label>
                    {isRfqSyncing ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                        <Clock className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        Processing & Syncing Tender Data...
                      </span>
                    ) : watchedRfqId ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                        Items, vendor, and terms synced from RFQ
                      </span>
                    ) : null}
                  </div>
                  <Controller
                    control={control}
                    name="rfq_id"
                    render={({ field }) => (
                      <Select2
                        options={rfqOptions}
                        value={field.value}
                        onChange={(val, opt) => {
                          field.onChange(val ? Number(val) : null)
                          if (opt?.uuid) {
                            setSelectedRfqUuid(opt.uuid)
                          } else {
                            const matched = (rfqsData?.response || []).find((r) => String(r.id) === String(val))
                            if (matched) setSelectedRfqUuid(matched.uuid)
                          }
                        }}
                        placeholder="Choose awarded RFQ to auto-populate winning quotation items & terms..."
                        error={errors.rfq_id?.message}
                      />
                    )}
                  />
                </div>

                {/* PO Date */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    PO Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register('po_date')}
                    type="date"
                    className={clsx(
                      'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:border-primary transition-all',
                      errors.po_date ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:ring-1 focus:ring-primary/30'
                    )}
                  />
                  {errors.po_date && <span className="text-rose-500 text-[11px] font-medium">{errors.po_date.message}</span>}
                </div>

                {/* PO Validity Date */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    PO Validity Date
                  </label>
                  <input
                    {...register('po_validity_date')}
                    type="date"
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Currency */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Currency
                  </label>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select2
                        options={currencyOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        placeholder="Select Currency"
                      />
                    )}
                  />
                </div>

                {/* Vendor Select */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Vendor / Supplier <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="vendor_id"
                    render={({ field }) => (
                      <Select2
                        options={vendorOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(Number(val))}
                        placeholder="Select Vendor"
                        error={errors.vendor_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Department */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="department_id"
                    render={({ field }) => (
                      <Select2
                        options={departmentOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(Number(val))}
                        placeholder="Select Department"
                        error={errors.department_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Cost Center */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Cost Center / Project <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="cost_center_id"
                    render={({ field }) => (
                      <Select2
                        options={costCenterOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(Number(val))}
                        placeholder="Select Cost Center"
                        error={errors.cost_center_id?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Line Items Table */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h2 className="text-[16px] font-bold text-[#1e293b] flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <Package className="h-4 w-4" />
                  </div>
                  Purchase Order Items
                </h2>
                <span className="text-xs text-gray-500 font-medium">
                  {totalItemsCount} item(s) • Total Quantity: {totalQuantity}
                </span>
              </div>

              {isRfqSyncing && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-800 font-semibold animate-pulse shadow-2xs">
                  <Clock className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <span>Processing & populating line items, quantities, and evaluated rates from awarded tender...</span>
                </div>
              )}

              {errors.items?.message && (
                <p className="text-rose-500 text-xs font-medium">{errors.items.message}</p>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <POItemRow
                    key={field.id}
                    control={control}
                    register={register}
                    index={index}
                    remove={() => remove(index)}
                    setValue={setValue}
                    errors={errors}
                    productOptions={productOptions}
                    selectedProductIds={selectedProductIds}
                    categoryOptions={categoryOptions}
                    unitOptions={unitOptions}
                    trigger={trigger}
                    currency={activeCurrency}
                    currencyPos={activeCurrencyPos}
                  />
                ))}

                <button
                  type="button"
                  onClick={() =>
                    append({
                      product_id: '' as any,
                      category_id: '' as any,
                      unit_id: '' as any,
                      quantity: 1,
                      rate: 0,
                      vat_percentage: 0,
                      item_description: '',
                      hs_code: '',
                    })
                  }
                  className="w-full py-4 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center gap-2 text-primary font-bold text-[14px] hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Card 3: Terms & Notes */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-5">
              <h2 className="text-[16px] font-bold text-[#1e293b] flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                  <FileText className="h-4 w-4" />
                </div>
                Terms & Delivery Notes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Payment Terms
                  </label>
                  <textarea
                    {...register('payment_terms')}
                    rows={3}
                    placeholder="e.g. 100% against delivery, 30 days credit, LC at sight..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Delivery Terms & Instructions
                  </label>
                  <textarea
                    {...register('delivery_terms')}
                    rows={3}
                    placeholder="e.g. Delivery to Central Warehouse, unloading included..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary & Actions (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6 sticky top-6 pb-12">
            {/* Supporting Documents / Attachments Card */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#1e293b]">Order Attachments</h3>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">
                  {existingAttachments.length + attachments.length}{' '}
                  {existingAttachments.length + attachments.length === 1 ? 'file' : 'files'}
                </span>
              </div>

              {/* Existing Attachments List */}
              {existingAttachments.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Existing Documents</p>
                  {existingAttachments.map((att: any, idx: number) => {
                    const fileUrl = att.file_url
                      ? (att.file_url.startsWith('http') ? att.file_url : `${backendBaseUrl}${att.file_url.startsWith('/') ? '' : '/'}${att.file_url}`)
                      : (att.file_path ? `${backendBaseUrl}/storage/${att.file_path}` : '#')

                    return (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <span className="truncate text-gray-700 font-medium text-[11px] max-w-[180px]" title={att.file_name || att.name}>
                          {att.file_name || att.name || `Attachment #${idx + 1}`}
                        </span>
                        {fileUrl !== '#' && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-gray-200 text-primary rounded transition-colors"
                            title="Download Attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* New Files Dropzone */}
              <div className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl p-4 text-center transition-colors bg-gray-50/50">
                <input
                  type="file"
                  id="po-attachments-sidebar-edit"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="po-attachments-sidebar-edit"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-1"
                >
                  <Upload className="w-6 h-6 text-primary/60" />
                  <span className="text-[12px] font-semibold text-primary">
                    Upload Additional Files
                  </span>
                  <span className="text-[10px] text-gray-400">
                    PDF, DOCX, XLSX, Images (Max 10MB)
                  </span>
                </label>
              </div>

              {/* Newly Added Files List */}
              {attachments.length > 0 && (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">New Files to Upload</p>
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs"
                    >
                      <span className="truncate text-emerald-950 font-medium text-[11px] max-w-[180px]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Blue Summary Card */}
            <div className="bg-[#1B4D90] rounded-xl p-5 shadow-lg text-white">
              <h3 className="text-[16px] font-bold mb-5 opacity-90">Purchase Order Summary</h3>

              <div className="space-y-4 mb-6 text-[14px]">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Total Line Items</span>
                  <span className="font-bold font-mono">{totalItemsCount}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Total Quantity</span>
                  <span className="font-bold font-mono">{totalQuantity}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Sub-Total</span>
                  <span className="font-bold font-mono">
                    {formatCurrency(subTotal, activeCurrency, activeCurrencyPos)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[14px] pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="opacity-80 font-medium">
                      VAT ({watchedVat}%)
                    </span>
                    {dynamicVatRate > 0 && watchedVat === dynamicVatRate && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded font-semibold">
                        Dynamic EIN
                      </span>
                    )}
                  </div>
                  <span className="font-bold font-mono">
                    {formatCurrency(vatAmount, activeCurrency, activeCurrencyPos)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">
                    Grand Total
                  </p>
                  <p className="text-[22px] font-black">
                    {formatCurrency(grandTotal, activeCurrency, activeCurrencyPos)}
                  </p>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wider">
                  Draft
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 h-[48px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[15px] shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit, onInvalid)}
                disabled={isPending}
                className="flex-1 h-[48px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[15px] cursor-pointer"
              >
                {isPending ? (
                  <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5" strokeWidth={3} />
                    <span>Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        title="Discard Changes"
        message="Are you sure you want to discard your changes? All unsaved inputs and items will be lost."
        confirmText="Discard Changes"
        variant="danger"
        onConfirm={() => {
          setIsDiscardModalOpen(false)
          navigate({ to: '/procurement/purchase-orders' as any })
        }}
        onClose={() => setIsDiscardModalOpen(false)}
      />
    </div>
  )
}

