import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  FileText,
  Upload,
  X,
  Paperclip,
  Check,
  AlertCircle,
  Users,
  Calendar,
  Building2,
  ShieldCheck,
  Award,
  Layers,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { rfqSchema, type RFQFormValues } from '../../hooks/validation'
import { useCreateRFQ } from '../../hooks/useRFQs'
import { useCostCenters } from '../../hooks/useCostCenters'
import { useDepartments } from '@/modules/hrm'
import { useVendors } from '../../hooks/useVendors'
import { useTermsLibrary } from '../../hooks/useTermsLibrary'
import { useRFQEvaluationTemplates } from '../../hooks/useRFQEvaluationTemplates'
import { usePurchaseRequisitions } from '../../hooks/usePurchaseRequisitions'
import { useProductSelect2, useCategorySelect2 } from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { getProductData } from '@/modules/inventory/api/products.api'
import { useQuery } from '@tanstack/react-query'
import { Select2 } from '@/components/Select/Select2'
import { clsx } from 'clsx'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useUiStore } from '@/store/useUiStore'
import { useSettings } from '@/hooks/useSettings'
import { useCurrenciesDatatable } from '@/modules/settings/hooks/useCurrencies'

// --- Line Item Row Component ---
const RFQItemRow = ({
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const productId = useWatch({ control, name: `items.${index}.product_id` })
  const itemDescription = useWatch({ control, name: `items.${index}.item_description` })
  const remarks = useWatch({ control, name: `items.${index}.remarks` })
  const hasExtraContent = Boolean(itemDescription || remarks)

  const filteredProductOptions = useMemo(() => {
    const currentId = Number(productId)
    return productOptions.filter((opt: any) => {
      const optVal = Number(opt.value)
      return optVal === currentId || !selectedProductIds.includes(optVal)
    })
  }, [productOptions, productId, selectedProductIds])

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

    if (numVal && (!opt?.category_id || !opt?.unit_id)) {
      try {
        const res: any = await getProductData(numVal)
        const product = res?.data || res?.response || res
        if (product) {
          if (product.category_id) {
            setValue(`items.${index}.category_id`, Number(product.category_id))
            trigger(`items.${index}.category_id`)
          }
          if (product.unit_id) {
            setValue(`items.${index}.unit_id`, Number(product.unit_id))
            trigger(`items.${index}.unit_id`)
          }
        }
      } catch (err) {
        // Product fetch fallback
      }
    }
    trigger('items')
  }

  const rowErrors = errors?.items?.[index]

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-3 transition-all">
      {/* Item Card Header */}
      <div className="flex items-center justify-between bg-gray-50/80 px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white border border-gray-200 rounded-md shadow-xs">
            <Package className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[13px] font-bold text-[#1e293b]">
            Item #{index + 1}
          </span>
          {hasExtraContent && !isExpanded && (
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
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={remove}
            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Remove Item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Core Line: Product, Category, Unit, Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          {/* Product Select */}
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
                  error={rowErrors?.product_id?.message}
                />
              )}
            />
          </div>

          {/* Category */}
          <div className="md:col-span-3 space-y-1">
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
                  error={rowErrors?.category_id?.message}
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
                  error={rowErrors?.unit_id?.message}
                />
              )}
            />
          </div>

          {/* Required Quantity */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Required Qty <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              {...register(`items.${index}.quantity`, {
                valueAsNumber: true,
                onChange: () => trigger('items'),
              })}
              placeholder="0.00"
              className={clsx(
                'w-full h-[40px] px-3 bg-white border rounded-lg text-[13px] font-medium font-mono outline-none transition-all',
                rowErrors?.quantity
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-gray-200 focus:border-primary/50'
              )}
            />
            {rowErrors?.quantity && (
              <p className="text-[11px] text-rose-500 font-medium">
                {rowErrors.quantity.message}
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Drawer: Technical Specifications & Remarks */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                Technical Specification / Description
              </label>
              <textarea
                {...register(`items.${index}.item_description`)}
                rows={2}
                placeholder="Detailed specs, brand, model, dimensions, materials required..."
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] outline-none focus:border-primary/50 resize-none font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                Line Remarks / Notes
              </label>
              <textarea
                {...register(`items.${index}.remarks`)}
                rows={2}
                placeholder="Special packing, delivery, or warranty notes for this item..."
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[12px] outline-none focus:border-primary/50 resize-none font-sans"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main RFQ Create Page ---
export const RFQCreatePage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // Global Settings & Currencies
  const { webSetting } = useSettings()
  const { data: currenciesData } = useCurrenciesDatatable({ length: 100 })

  // Mutations & Queries
  const { mutate: createRFQMutate, isPending } = useCreateRFQ()
  const { data: deptResponse } = useDepartments({ all: true })
  const { data: costCentersResponse } = useCostCenters({ per_page: 200 })
  const { data: approvedPRsResponse } = usePurchaseRequisitions({ status: 'approved', unassigned_rfq: true, per_page: 100 })
  const { data: vendorsResponse } = useVendors({ per_page: 200, status: 'approved' })
  const { data: termsResponse } = useTermsLibrary({ per_page: 200, is_active: true })
  const { data: templatesResponse } = useRFQEvaluationTemplates({ per_page: 100 })

  // Inventory Select2 Lookups
  const { data: productsData } = useProductSelect2()
  const { data: categoriesData } = useCategorySelect2()
  const { data: unitsData } = useQuery({
    queryKey: ['select2', 'units'],
    queryFn: getUnitSelect2,
  })

  // Format Dropdown Options & Active Currency Display
  const activeCurrencyInfo = useMemo(() => {
    if (!webSetting?.currency) return null
    const list = currenciesData?.data || []
    const match = list.find(
      (c: any) =>
        c.currency_name?.toLowerCase() === webSetting.currency?.toLowerCase() ||
        c.icon === webSetting.currency ||
        String(c.id) === String(webSetting.currency)
    )
    if (match) {
      return {
        value: match.currency_name || match.icon,
        display: match.icon ? `${match.currency_name} (${match.icon})` : match.currency_name,
      }
    }
    return {
      value: webSetting.currency,
      display: webSetting.currency,
    }
  }, [webSetting?.currency, currenciesData])

  const currencyOptions = useMemo(() => {
    const list = currenciesData?.data || []
    return list.map((c: any) => ({
      value: c.currency_name || c.icon,
      label: c.icon ? `${c.currency_name} (${c.icon})` : c.currency_name,
    }))
  }, [currenciesData])

  const deptOptions = useMemo(() => {
    const list = deptResponse?.data || deptResponse?.response || []
    return list.map((d: any) => ({ value: d.id, label: d.name }))
  }, [deptResponse])

  const costCenterOptions = useMemo(() => {
    const list = costCentersResponse?.response || []
    return list.map((c: any) => ({ value: c.id, label: `${c.code} - ${c.name}` }))
  }, [costCentersResponse])

  const prOptions = useMemo(() => {
    const list = approvedPRsResponse?.response || []
    return [
      { value: '', label: 'None (Direct RFQ without PR)' },
      ...list.map((pr: any) => ({
        value: pr.id,
        label: `${pr.pr_no} (${pr.requisitioner_name || 'PR'}) - ${pr.items?.length || 0} items`,
        uuid: pr.uuid,
        department_id: pr.department_id,
        cost_center_id: pr.cost_center_id,
        purpose_justification: pr.purpose_justification,
        items: pr.items,
      })),
    ]
  }, [approvedPRsResponse])

  const vendorList = useMemo(() => {
    return vendorsResponse?.response || []
  }, [vendorsResponse])

  const vendorOptions = useMemo(() => {
    return vendorList.map((v: any) => ({
      value: v.id,
      label: `${v.vendor_name || v.name} (${v.vendor_code || v.code || 'Vendor'})`,
      email: v.email,
      phone: v.phone || v.mobile,
      category: v.category?.name,
    }))
  }, [vendorList])

  const termsList = useMemo(() => {
    return termsResponse?.response || []
  }, [termsResponse])

  const templateList = useMemo(() => {
    return templatesResponse?.response || []
  }, [templatesResponse])

  const templateOptions = useMemo(() => {
    return [
      { value: '', label: 'None (Standard Evaluation)' },
      ...templateList.map((t: any) => ({
        value: t.id,
        label: `${t.name} (Tech: ${t.technical_weightage}%, Comm: ${t.commercial_weightage}%)`,
      })),
    ]
  }, [templateList])

  const productOptions = useMemo(() => {
    return (
      productsData?.map((p: any) => ({
        value: p.id,
        label: p.text || p.name,
        category_id: p.category_id,
        unit_id: p.unit_id,
      })) || []
    )
  }, [productsData])

  const categoryOptions = useMemo(() => {
    return (
      categoriesData?.map((c: any) => ({
        value: c.id,
        label: c.text || c.name,
      })) || []
    )
  }, [categoriesData])

  const unitOptions = useMemo(() => {
    return (
      unitsData?.map((u: any) => ({
        value: u.id,
        label: u.text || u.name,
      })) || []
    )
  }, [unitsData])

  // Today's Date
  const todayStr = new Date().toISOString().split('T')[0]

  // Form Setup
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    trigger,
    formState: { errors, isDirty },
  } = useForm<RFQFormValues>({
    resolver: zodResolver(rfqSchema) as any,
    defaultValues: {
      purchase_requisition_id: undefined,
      rfq_date: todayStr,
      rfq_expiry_date: '',
      expected_delivery_date: '',
      department_id: undefined as any,
      cost_center_id: undefined as any,
      evaluation_template_id: undefined,
      currency: webSetting?.currency || '',
      payment_terms: '',
      delivery_terms: '',
      purpose_justification: '',
      target_vendor_ids: [],
      terms: [],
      items: [
        {
          product_id: undefined as any,
          category_id: undefined as any,
          unit_id: undefined as any,
          item_description: '',
          quantity: '' as any,
          remarks: '',
        },
      ],
    },
  })

  // Sync currency from global settings when loaded
  useEffect(() => {
    if (activeCurrencyInfo?.value) {
      setValue('currency', activeCurrencyInfo.value)
    } else if (webSetting?.currency) {
      setValue('currency', webSetting.currency)
    }
  }, [activeCurrencyInfo, webSetting?.currency, setValue])

  const { fields: itemFields, append: appendItem, remove: removeItem, replace: replaceItems } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = useWatch({ control, name: 'items' })
  const watchedVendors = useWatch({ control, name: 'target_vendor_ids' }) || []
  const watchedTerms = useWatch({ control, name: 'terms' }) || []
  const watchedPRId = useWatch({ control, name: 'purchase_requisition_id' })
  const watchedTemplateId = useWatch({ control, name: 'evaluation_template_id' })

  // Active Evaluation Template Info
  const selectedTemplate = useMemo(() => {
    if (!watchedTemplateId) return null
    return templateList.find((t: any) => Number(t.id) === Number(watchedTemplateId)) || null
  }, [watchedTemplateId, templateList])

  // Handle Selected PR Auto-Fill
  const handlePRSelect = (prId: any, prOption?: any) => {
    if (!prId || !prOption || prId === '') {
      setValue('purchase_requisition_id', undefined)
      // Reset items back to fresh empty row when PR is deselected
      replaceItems([
        {
          product_id: undefined as any,
          category_id: undefined as any,
          unit_id: undefined as any,
          item_description: '',
          quantity: '' as any,
          remarks: '',
        },
      ])
      trigger('items')
      return
    }

    const numPrId = Number(prId)
    setValue('purchase_requisition_id', numPrId)
    trigger('purchase_requisition_id')

    if (prOption.department_id) {
      setValue('department_id', Number(prOption.department_id))
      trigger('department_id')
    }
    if (prOption.cost_center_id) {
      setValue('cost_center_id', Number(prOption.cost_center_id))
      trigger('cost_center_id')
    }
    if (prOption.purpose_justification) {
      setValue('purpose_justification', prOption.purpose_justification)
    }

    // Auto populate items from PR
    if (prOption.items && Array.isArray(prOption.items) && prOption.items.length > 0) {
      const mappedItems = prOption.items.map((item: any) => ({
        purchase_requisition_item_id: item.id,
        product_id: Number(item.product_id),
        category_id: Number(item.category_id),
        unit_id: Number(item.unit_id),
        item_description: item.item_description || '',
        quantity: parseFloat(String(item.quantity)) || 1,
        remarks: item.remarks || '',
      }))
      replaceItems(mappedItems)
      trigger('items')
    }
  }

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Terms Clauses Helpers
  const toggleTermSelection = (termId: number) => {
    const current = [...watchedTerms]
    const existingIndex = current.findIndex((t) => Number(t.term_library_id) === termId)
    if (existingIndex > -1) {
      current.splice(existingIndex, 1)
    } else {
      current.push({ term_library_id: termId, is_mandatory: true })
    }
    setValue('terms', current)
    trigger('terms')
  }

  const toggleTermMandatory = (termId: number) => {
    const current = [...watchedTerms]
    const target = current.find((t) => Number(t.term_library_id) === termId)
    if (target) {
      target.is_mandatory = !target.is_mandatory
      setValue('terms', current)
    }
  }

  // Form Submit Handler
  const onSubmit = (data: RFQFormValues) => {
    const payload = {
      ...data,
      attachments: selectedFiles,
    }

    createRFQMutate(payload as any, {
      onSuccess: (res) => {
        showNotificationModal(
          'RFQ Created!',
          res.message || 'Draft Request For Quotation created successfully.',
          'success'
        )
        navigate({ to: '/procurement/rfqs' })
      },
      onError: (error: any) => {
        const backendErrors = error.response?.data?.errors
        if (backendErrors && typeof backendErrors === 'object') {
          Object.entries(backendErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
            setError(field as any, { type: 'server', message: msg })
          })

          const errorList = Object.entries(backendErrors)
            .map(([field, msgs]) => (Array.isArray(msgs) ? msgs.join(', ') : msgs))
            .join(' | ')

          showNotificationModal('Validation Failed', errorList || 'Please check highlighted fields.', 'error')
        } else {
          const message = error.response?.data?.message || error.message || 'Failed to create RFQ.'
          showNotificationModal('Creation Failed', message, 'error')
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
    if (isDirty || selectedFiles.length > 0) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/procurement/rfqs' })
    }
  }

  // Summary Metrics
  const totalItemsCount = watchedItems?.length || 0
  const totalQuantity = useMemo(() => {
    return (watchedItems || []).reduce((sum, item) => sum + (parseFloat(String(item?.quantity)) || 0), 0)
  }, [watchedItems])

  const selectedProductIds = useMemo(() => {
    return (watchedItems || [])
      .map((it: any) => Number(it?.product_id))
      .filter((id: number) => !isNaN(id) && id > 0)
  }, [watchedItems])

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
            Create Request For Quotation (RFQ)
          </h1>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="max-w-[1600px] mx-auto pb-12">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (9 Cols) */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* Card 1: Basic Information */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Basic Information</h2>
                </div>
                {watchedPRId && (
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Linked to PR
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PR Selection (Full Width on Top) */}
                <div className="md:col-span-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-primary" />
                      Select Approved Purchase Requisition (Optional)
                    </label>
                    {watchedPRId && (
                      <span className="text-[11px] font-bold text-emerald-600">
                        ✓ Items and department auto-populated from PR
                      </span>
                    )}
                  </div>
                  <Controller
                    control={control}
                    name="purchase_requisition_id"
                    render={({ field }) => (
                      <Select2
                        options={prOptions}
                        value={field.value}
                        onChange={(val, opt) => handlePRSelect(val, opt)}
                        placeholder="Choose approved PR to auto-populate items & specs..."
                        error={errors.purchase_requisition_id?.message}
                      />
                    )}
                  />
                </div>

                {/* RFQ Date */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
                    RFQ Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('rfq_date')}
                    className="w-full h-[40px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary/50"
                  />
                  {errors.rfq_date && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.rfq_date.message}</p>
                  )}
                </div>

                {/* Bid Deadline */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
                    Bid Submission Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('rfq_expiry_date')}
                    className="w-full h-[40px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary/50"
                  />
                  {errors.rfq_expiry_date && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.rfq_expiry_date.message}</p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="department_id"
                    render={({ field }) => (
                      <Select2
                        options={deptOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val ? Number(val) : undefined)
                          trigger('department_id')
                        }}
                        placeholder="Select Department..."
                        error={errors.department_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Cost Center */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
                    Cost Center <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="cost_center_id"
                    render={({ field }) => (
                      <Select2
                        options={costCenterOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val ? Number(val) : undefined)
                          trigger('cost_center_id')
                        }}
                        placeholder="Select Cost Center..."
                        error={errors.cost_center_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Expected Delivery Date */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    {...register('expected_delivery_date')}
                    className="w-full h-[40px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-primary/50"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
                    Currency
                  </label>
                  {activeCurrencyInfo ? (
                    <input
                      type="text"
                      readOnly
                      value={activeCurrencyInfo.display}
                      className="w-full h-[40px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 outline-none cursor-not-allowed uppercase"
                    />
                  ) : (
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field }) => (
                        <Select2
                          options={currencyOptions}
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          placeholder="Select Currency..."
                          error={errors.currency?.message}
                        />
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Invited Target Vendors */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1e293b]">Invited Target Vendors</h2>
                    <p className="text-[11px] text-gray-400">Select suppliers who will receive this RFQ for competitive quotation</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {watchedVendors.length} {watchedVendors.length === 1 ? 'Vendor Selected' : 'Vendors Selected'}
                </span>
              </div>

              <div className="space-y-3">
                <Controller
                  control={control}
                  name="target_vendor_ids"
                  render={({ field }) => (
                    <Select2
                      isMulti
                      options={vendorOptions}
                      value={field.value}
                      onChange={(val) => {
                        const vals = Array.isArray(val) ? val.map((v: any) => Number(v)) : []
                        field.onChange(vals)
                        trigger('target_vendor_ids')
                      }}
                      placeholder="Search and select approved vendors..."
                      error={errors.target_vendor_ids?.message}
                    />
                  )}
                />

                {/* Selected Vendors Badges Grid */}
                {watchedVendors.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    {watchedVendors.map((vId) => {
                      const vendor = vendorOptions.find((opt) => Number(opt.value) === Number(vId))
                      if (!vendor) return null
                      return (
                        <div
                          key={vId}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-[13px] font-bold text-gray-800 truncate">{vendor.label}</p>
                            <p className="text-[11px] text-gray-500 truncate">{vendor.email || vendor.phone || 'No direct contact'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = watchedVendors.filter((id) => Number(id) !== Number(vId))
                              setValue('target_vendor_ids', next)
                              trigger('target_vendor_ids')
                            }}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>



            {/* Card 4: Line Items & Specifications */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1e293b]">Line Items & Specifications</h2>
                    <p className="text-[11px] text-gray-400">Specify goods, materials, or services requested from vendors</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      appendItem({
                        product_id: undefined as any,
                        category_id: undefined as any,
                        unit_id: undefined as any,
                        item_description: '',
                        quantity: '' as any,
                        remarks: '',
                      })
                    }
                    className="px-4 py-2 bg-[#1B4D90] text-white text-[13px] font-semibold rounded-lg hover:bg-[#153a80] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => replaceItems([])}
                    className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                    title="Clear All Items"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {errors.items && typeof errors.items.message === 'string' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[13px] font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.items.message}</span>
                </div>
              )}

              <div className="space-y-4">
                {itemFields.map((field, index) => (
                  <RFQItemRow
                    key={field.id}
                    control={control}
                    register={register}
                    index={index}
                    remove={() => removeItem(index)}
                    setValue={setValue}
                    errors={errors}
                    productOptions={productOptions}
                    selectedProductIds={selectedProductIds}
                    categoryOptions={categoryOptions}
                    unitOptions={unitOptions}
                    trigger={trigger}
                  />
                ))}

                <button
                  type="button"
                  onClick={() =>
                    appendItem({
                      product_id: undefined as any,
                      category_id: undefined as any,
                      unit_id: undefined as any,
                      item_description: '',
                      quantity: '' as any,
                      remarks: '',
                    })
                  }
                  className="w-full py-4 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center gap-2 text-primary font-bold text-[14px] hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                  Add Line Item
                </button>
              </div>
            </div>

            {/* Card 5: Terms & Conditions Library Picker */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1e293b]">Terms & Conditions Library Clauses</h2>
                    <p className="text-[11px] text-gray-400">Select standard compliance clauses for supplier compliance</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                  {watchedTerms.length} Clauses Attached
                </span>
              </div>

              {termsList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No terms found in library.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto p-1">
                  {termsList.map((clause: any) => {
                    const isSelected = watchedTerms.some((t) => Number(t.term_library_id) === Number(clause.id))
                    const currentEntry = watchedTerms.find((t) => Number(t.term_library_id) === Number(clause.id))
                    const isMandatory = currentEntry?.is_mandatory ?? true

                    return (
                      <div
                        key={clause.id}
                        className={clsx(
                          'p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2',
                          isSelected
                            ? 'bg-teal-50/50 border-teal-300 shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTermSelection(Number(clause.id))}
                            className="mt-1 h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded">
                                {clause.code}
                              </span>
                              <span className="text-[13px] font-bold text-gray-900 truncate">
                                {clause.title}
                              </span>
                            </div>
                            {clause.description && (
                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                                {clause.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center justify-between pt-2 border-t border-teal-100 text-xs">
                            <span className="text-gray-500 text-[11px] capitalize">
                              Type: <strong className="text-gray-700">{clause.type}</strong>
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isMandatory}
                                onChange={() => toggleTermMandatory(Number(clause.id))}
                                className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-[11px] font-semibold text-teal-900">
                                Mandatory Compliance
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Card 6: Evaluation Template & Scoring Setup */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1e293b]">Evaluation Template & Scoring Scheme</h2>
                    <p className="text-[11px] text-gray-400">Select criteria template to score supplier quotations in the Comparative Statement</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Controller
                  control={control}
                  name="evaluation_template_id"
                  render={({ field }) => (
                    <Select2
                      options={templateOptions}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val ? Number(val) : undefined)
                        trigger('evaluation_template_id')
                      }}
                      placeholder="Select Evaluation Template (Optional)..."
                      error={errors.evaluation_template_id?.message}
                    />
                  )}
                />

                {selectedTemplate && (
                  <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 text-[13px]">
                        {selectedTemplate.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          Technical: {selectedTemplate.technical_weightage}%
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Commercial: {selectedTemplate.commercial_weightage}%
                        </span>
                      </div>
                    </div>

                    {selectedTemplate.criteria && selectedTemplate.criteria.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                          Scoring Criteria Breakdown ({selectedTemplate.criteria.length} criteria):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedTemplate.criteria.map((c: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100 text-xs"
                            >
                              <span className="font-medium text-gray-700 truncate pr-2">{c.name}</span>
                              <span className="font-mono font-bold text-purple-700 shrink-0">
                                {c.max_score} pts ({c.category})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card 7: Scope of Work / Tender Notes */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                  <FileText className="h-4 w-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Scope of Work & Tender Notes</h2>
              </div>

              <div>
                <Controller
                  control={control}
                  name="purpose_justification"
                  render={({ field }) => (
                    <RichEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Explain the background, project scope, submission rules, and bidding instructions..."
                    />
                  )}
                />
              </div>
            </div>

          </div>

          {/* Right Column: Attachments, Summary & Action Bar (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6 sticky top-6 pb-12">
            
            {/* Card: Tender Documents & Attachments Dropzone */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#1e293b]">Tender Documents</h3>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                </span>
              </div>

              <div className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl p-4 text-center transition-colors bg-gray-50/50">
                <input
                  type="file"
                  id="rfq-file-upload-sidebar"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="rfq-file-upload-sidebar"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-1"
                >
                  <Upload className="w-6 h-6 text-primary/60" />
                  <span className="text-[12px] font-semibold text-primary">
                    Upload BOQ / Drawings / Specs
                  </span>
                  <span className="text-[10px] text-gray-400">
                    PDF, DOCX, XLSX, Images (Max 10MB)
                  </span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="truncate text-gray-700 font-medium text-[11px] max-w-[180px]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
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
              <h3 className="text-[16px] font-bold mb-5 opacity-90">RFQ Summary</h3>

              <div className="space-y-4 mb-6 text-[14px]">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Sourcing Mode</span>
                  <span className="font-bold">
                    {watchedPRId ? 'PR Requisition' : 'Direct RFQ'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Line Items</span>
                  <span className="font-bold font-mono">{totalItemsCount}</span>
                </div>

                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Total Quantity</span>
                  <span className="font-bold font-mono">{totalQuantity}</span>
                </div>

                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Invited Vendors</span>
                  <span className="font-bold font-mono">{watchedVendors.length}</span>
                </div>

                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Terms Clauses</span>
                  <span className="font-bold font-mono">{watchedTerms.length}</span>
                </div>

                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-80 font-medium">Evaluation Template</span>
                  <span className="font-bold text-xs truncate max-w-[120px]">
                    {selectedTemplate ? selectedTemplate.name : 'Standard'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">
                    Initial Status
                  </p>
                  <p className="text-[18px] font-black text-amber-300">
                    Draft
                  </p>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wider">
                  Ready to Create
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 h-[48px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[15px] shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-[48px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[15px] cursor-pointer"
              >
                {isPending ? (
                  <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5" strokeWidth={3} />
                    <span>Save</span>
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
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/procurement/rfqs' })}
        title="Discard RFQ Draft?"
        message="You have unsaved changes in this Request For Quotation. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
