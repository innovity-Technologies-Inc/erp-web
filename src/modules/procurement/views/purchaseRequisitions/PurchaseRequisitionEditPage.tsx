import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Package,
  FileText,
  Upload,
  X,
  User,
  Paperclip,
  Check,
  Download,
  AlertCircle,
} from 'lucide-react'
import {
  purchaseRequisitionSchema,
  type PurchaseRequisitionFormValues,
} from '../../hooks/validation'
import {
  usePurchaseRequisitionDetails,
  useUpdatePurchaseRequisition,
} from '../../hooks/usePurchaseRequisitions'
import { useCostCenters } from '../../hooks/useCostCenters'
import { useBudgetHeads } from '../../hooks/useBudgetHeads'
import { useDepartments } from '@/modules/hrm'
import {
  useProductSelect2,
  useCategorySelect2,
  useEmployeeSelect2,
} from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { getProductData } from '@/modules/inventory/api/products.api'
import { useQuery } from '@tanstack/react-query'
import { Select2 } from '@/components/Select/Select2'
import { clsx } from 'clsx'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/formatters'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useUiStore } from '@/store/useUiStore'
import { LoadingState } from '@/components/Loading/LoadingState'

// --- Single PR Item Row Component ---
const RequisitionItemRow = ({
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
  budgetHeadOptions,
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
  budgetHeadOptions: any[]
  trigger: any
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { currency, currencyPosition } = useSettings()

  const productId = useWatch({ control, name: `items.${index}.product_id` })
  const quantity = useWatch({ control, name: `items.${index}.quantity` }) || 0
  const estimatedRate = useWatch({ control, name: `items.${index}.estimated_rate` }) || 0

  const filteredProductOptions = useMemo(() => {
    const currentId = Number(productId)
    return productOptions.filter((opt: any) => {
      const optVal = Number(opt.value)
      return optVal === currentId || !selectedProductIds.includes(optVal)
    })
  }, [productOptions, productId, selectedProductIds])

  const rowEstimatedAmount = useMemo(() => {
    const q = parseFloat(String(quantity)) || 0
    const r = parseFloat(String(estimatedRate)) || 0
    return q * r
  }, [quantity, estimatedRate])

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
    if (opt?.price && (!estimatedRate || Number(estimatedRate) === 0)) {
      setValue(`items.${index}.estimated_rate`, parseFloat(opt.price) || 0)
      trigger(`items.${index}.estimated_rate`)
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
          if (product.price && (!estimatedRate || Number(estimatedRate) === 0)) {
            setValue(`items.${index}.estimated_rate`, parseFloat(product.price) || 0)
            trigger(`items.${index}.estimated_rate`)
          }
        }
      } catch (err) {
        // Fallback: product details couldn't be loaded
      }
    }
    trigger('items')
  }

  const rowErrors = errors?.items?.[index]

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
            {rowEstimatedAmount > 0 && (
              <span className="ml-3 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {formatCurrency(rowEstimatedAmount, currency, currencyPosition)}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-500"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
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
      <div className={clsx('p-4 transition-all duration-300', !isExpanded && 'hidden')}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Product Selection */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
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
                  placeholder="Select Product"
                  error={rowErrors?.product_id?.message as string}
                />
              )}
            />
          </div>

          {/* Category */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
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
                    field.onChange(val)
                    trigger(`items.${index}.category_id`)
                  }}
                  placeholder="Select Category"
                  error={rowErrors?.category_id?.message as string}
                />
              )}
            />
          </div>

          {/* Unit */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
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
                    field.onChange(val)
                    trigger(`items.${index}.unit_id`)
                  }}
                  placeholder="Select Unit"
                  error={rowErrors?.unit_id?.message as string}
                />
              )}
            />
          </div>

          {/* Budget Head */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
              Budget Head
            </label>
            <Controller
              control={control}
              name={`items.${index}.budget_head_id`}
              render={({ field }) => (
                <Select2
                  options={budgetHeadOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val)
                    trigger(`items.${index}.budget_head_id`)
                  }}
                  placeholder="Select Budget Head (Optional)"
                  error={rowErrors?.budget_head_id?.message as string}
                />
              )}
            />
          </div>

          {/* Quantity */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
              Qty <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.001"
              step="any"
              onKeyDown={handleNumericKeyDown}
              {...register(`items.${index}.quantity`, {
                valueAsNumber: true,
                onChange: () => trigger(`items.${index}.quantity`),
              })}
              className={clsx(
                'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] text-center font-bold outline-none transition-all',
                rowErrors?.quantity
                  ? 'border-rose-500 focus:ring-rose-500/10'
                  : 'border-gray-200 focus:ring-1 focus:ring-primary/30'
              )}
              placeholder="1"
            />
            {rowErrors?.quantity && (
              <span className="text-rose-500 text-[10px] font-medium block text-center mt-0.5">
                {rowErrors.quantity.message}
              </span>
            )}
          </div>

          {/* Estimated Rate */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
              Est. Rate ({currencyPosition === '0' ? currency : ''} {currencyPosition === '1' ? currency : ''}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              onKeyDown={handleNumericKeyDown}
              {...register(`items.${index}.estimated_rate`, {
                valueAsNumber: true,
                onChange: () => trigger(`items.${index}.estimated_rate`),
              })}
              className={clsx(
                'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] text-right font-bold outline-none transition-all',
                rowErrors?.estimated_rate
                  ? 'border-rose-500 focus:ring-rose-500/10'
                  : 'border-gray-200 focus:ring-1 focus:ring-primary/30'
              )}
              placeholder="0.00"
            />
            {rowErrors?.estimated_rate && (
              <span className="text-rose-500 text-[10px] font-medium block text-right mt-0.5">
                {rowErrors.estimated_rate.message}
              </span>
            )}
          </div>

          {/* Estimated Total Amount */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
              Total Amount
            </label>
            <div className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] flex items-center justify-end font-bold text-[#1e293b] cursor-not-allowed">
              {formatCurrency(rowEstimatedAmount, currency, currencyPosition)}
            </div>
          </div>

          {/* Item Description / Specifications */}
          <div className="md:col-span-12 space-y-1.5">
            <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
              Specification / Item Notes
            </label>
            <input
              type="text"
              {...register(`items.${index}.item_description`)}
              placeholder="Enter technical specifications, brand preferences, model number, or item notes..."
              className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main PurchaseRequisitionEditPage Component ---
export const PurchaseRequisitionEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false }) as { id: string }
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // Fetch Existing Purchase Requisition
  const { data: prResponse, isLoading: isFetching, isError } = usePurchaseRequisitionDetails(id)
  const pr = prResponse?.response || prResponse?.data || (prResponse as any)
  const { mutate: updatePR, isPending } = useUpdatePurchaseRequisition()

  // Dynamic Lookups
  const { data: departmentsData } = useDepartments({ all: true })
  const departmentOptions = useMemo(() => {
    const list = departmentsData?.data || departmentsData?.response || []
    return list.map((d: any) => ({ value: d.id, label: d.name }))
  }, [departmentsData])

  const { data: costCentersData } = useCostCenters({ per_page: 100 })
  const costCenterOptions = useMemo(() => {
    const list = costCentersData?.response || []
    return list.map((c: any) => ({ value: c.id, label: `${c.code} - ${c.name}` }))
  }, [costCentersData])

  const { data: budgetHeadsData } = useBudgetHeads({ per_page: 200 })
  const budgetHeadOptions = useMemo(() => {
    const list = budgetHeadsData?.response || []
    return list.map((b: any) => ({ value: b.id, label: `${b.code} - ${b.name}` }))
  }, [budgetHeadsData])

  const { data: productsData } = useProductSelect2()
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

  const { data: categoriesData } = useCategorySelect2()
  const categoryOptions = useMemo(() => {
    return categoriesData?.map((c: any) => ({ value: c.id, label: c.text })) || []
  }, [categoriesData])

  const { data: unitsData } = useQuery({
    queryKey: ['unit-select2'],
    queryFn: getUnitSelect2,
  })
  const unitOptions = useMemo(() => {
    return unitsData?.map((u: any) => ({ value: u.id, label: u.text })) || []
  }, [unitsData])

  const { data: employeesData } = useEmployeeSelect2()
  const employeeOptions = useMemo(() => {
    return (
      employeesData?.map((e: any) => {
        const fullName = e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim()
        return {
          value: fullName,
          label: fullName + (e.designation ? ` (${e.designation})` : ''),
          name: fullName,
          designation: e.designation || '',
          phone: e.phone || '',
          email: e.email || '',
          department_id: e.department_id || null,
        }
      }) || []
    )
  }, [employeesData])

  // Form Values from Backend PR
  const formValues = useMemo(() => {
    if (!pr || (!pr.id && !pr.uuid)) return undefined

    return {
      pr_date: pr.pr_date ? String(pr.pr_date).split('T')[0] : '',
      required_by_date: pr.required_by_date ? String(pr.required_by_date).split('T')[0] : '',
      priority: pr.priority || 'medium',
      procurement_type: pr.procurement_type || 'normal',
      is_emergency: !!pr.is_emergency,
      department_id: pr.department_id || undefined,
      cost_center_id: pr.cost_center_id || undefined,
      requisitioner_name: pr.requisitioner_name || '',
      designation: pr.designation || '',
      contact_no: pr.contact_no || '',
      email: pr.email || '',
      purpose_justification: pr.purpose_justification || '',
      remarks: pr.remarks || '',
      items: Array.isArray(pr.items) && pr.items.length > 0
        ? pr.items.map((it: any) => ({
            product_id: it.product_id,
            category_id: it.category_id,
            unit_id: it.unit_id,
            budget_head_id: it.budget_head_id || null,
            quantity: parseFloat(String(it.quantity)) || 1,
            estimated_rate: parseFloat(String(it.estimated_rate)) || 0,
            item_description: it.item_description || '',
          }))
        : [
            {
              product_id: undefined as any,
              category_id: undefined as any,
              unit_id: undefined as any,
              budget_head_id: null,
              quantity: 1,
              estimated_rate: 0,
              item_description: '',
            },
          ],
    }
  }, [pr])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    trigger,
    watch,
    formState: { errors, isDirty },
  } = useForm<PurchaseRequisitionFormValues>({
    resolver: zodResolver(purchaseRequisitionSchema) as any,
    values: formValues as any,
    defaultValues: {
      items: [
        {
          product_id: undefined as any,
          category_id: undefined as any,
          unit_id: undefined as any,
          item_description: '',
          budget_head_id: null,
          quantity: 1,
          estimated_rate: 0,
        },
      ],
    },
  })

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items',
  })

  const items = useWatch({ control, name: 'items' })
  const procurementType = watch('procurement_type')
  const isEmergency = procurementType === 'emergency'

  // Real-time Summary Calculations
  const { totalItemsCount, totalQuantity, totalEstimatedAmount } = useMemo(() => {
    let count = 0
    let totalQty = 0
    let totalEst = 0

    items?.forEach((item) => {
      count++
      const q = parseFloat(String(item.quantity)) || 0
      const r = parseFloat(String(item.estimated_rate)) || 0
      totalQty += q
      totalEst += q * r
    })

    return {
      totalItemsCount: count,
      totalQuantity: totalQty,
      totalEstimatedAmount: totalEst,
    }
  }, [items])

  // Track all selected product IDs to disallow duplicates across rows
  const selectedProductIds = useMemo(() => {
    return (items || [])
      .map((it: any) => Number(it?.product_id))
      .filter((id: number) => !isNaN(id) && id > 0)
  }, [items])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = (data: PurchaseRequisitionFormValues) => {
    if (!data.items || data.items.length === 0) {
      showNotificationModal('Error', 'Please add at least one item to the requisition.', 'error')
      return
    }

    const payload = {
      uuid: pr?.uuid || id,
      ...data,
      is_emergency: data.procurement_type === 'emergency' ? true : data.is_emergency,
      attachments: selectedFiles,
    }

    updatePR(payload as any, {
      onSuccess: (res) => {
        showNotificationModal(
          'Purchase Requisition Updated!',
          res.message || 'Purchase requisition updated successfully.',
          'success'
        )
        navigate({ to: '/procurement/purchase-requisitions' })
      },
      onError: (error: any) => {
        const backendErrors = error.response?.data?.errors
        if (backendErrors && typeof backendErrors === 'object') {
          Object.entries(backendErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
            setError(field as any, { type: 'server', message: msg })
          })

          const errorList = Object.entries(backendErrors)
            .map(([_, msgs]) => (Array.isArray(msgs) ? msgs.join(', ') : msgs))
            .join(' | ')

          showNotificationModal('Validation Failed', errorList || 'Please check the highlighted fields.', 'error')
        } else {
          const message = error.response?.data?.message || error.message || 'Failed to update purchase requisition.'
          showNotificationModal('Update Failed', message, 'error')
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
      navigate({ to: '/procurement/purchase-requisitions' })
    }
  }

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent Priority' },
  ]

  const procurementTypeOptions = [
    { value: 'normal', label: 'Normal Procurement' },
    { value: 'emergency', label: 'Emergency Procurement' },
  ]

  const itemsErrorMessage = errors.items?.message || (errors.items as any)?.root?.message

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center">
        <LoadingState message="Loading purchase requisition details..." />
      </div>
    )
  }

  if (isError || !pr) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Purchase Requisition Not Found</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-md">
          The purchase requisition you are attempting to edit could not be found or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: '/procurement/purchase-requisitions' })}
          className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md text-sm hover:opacity-90 transition-all cursor-pointer"
        >
          Back to Requisitions
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-16 font-poppins text-[#475569]">
      {/* Top Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleDiscard}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[20px] font-medium text-primary tracking-tight">
                  Edit Purchase Requisition
                </h1>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {pr.pr_no}
                </span>
                <span className="capitalize text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {pr.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-[1600px] mx-auto pb-12">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (9 Cols) */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* Card 1: Requisition Header */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#1e293b] mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <Info className="h-4 w-4" />
                </div>
                Requisition Header
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* PR Date */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    PR Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('pr_date')}
                    className={clsx(
                      'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:border-primary transition-all',
                      errors.pr_date ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:ring-1 focus:ring-primary/30'
                    )}
                  />
                  {errors.pr_date && <span className="text-rose-500 text-[11px] font-medium">{errors.pr_date.message}</span>}
                </div>

                {/* Required By Date */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Required By Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('required_by_date')}
                    className={clsx(
                      'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:border-primary transition-all',
                      errors.required_by_date ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:ring-1 focus:ring-primary/30'
                    )}
                  />
                  {errors.required_by_date && <span className="text-rose-500 text-[11px] font-medium">{errors.required_by_date.message}</span>}
                </div>

                {/* Priority */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <Select2
                        options={priorityOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val)
                          trigger('priority')
                        }}
                        placeholder="Select Priority"
                        error={errors.priority?.message as string}
                      />
                    )}
                  />
                </div>

                {/* Department */}
                <div className="md:col-span-6 space-y-1.5">
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
                        onChange={(val) => {
                          field.onChange(val)
                          trigger('department_id')
                        }}
                        placeholder="Select Department"
                        error={errors.department_id?.message as string}
                      />
                    )}
                  />
                </div>

                {/* Cost Center */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
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
                          field.onChange(val)
                          trigger('cost_center_id')
                        }}
                        placeholder="Select Cost Center"
                        error={errors.cost_center_id?.message as string}
                      />
                    )}
                  />
                </div>

                {/* Procurement Type (Emergency / Normal) */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Procurement Type <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="procurement_type"
                    render={({ field }) => (
                      <Select2
                        options={procurementTypeOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val)
                          setValue('is_emergency', val === 'emergency')
                          trigger('procurement_type')
                        }}
                        placeholder="Select Procurement Type"
                        error={errors.procurement_type?.message as string}
                      />
                    )}
                  />
                </div>

                {/* Attachments Upload */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Supporting Attachments
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[38px] px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-lg flex items-center gap-2 font-bold text-[13px] transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Files</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-400 font-medium leading-tight">
                        {selectedFiles.length > 0 ? (
                          <span className="text-emerald-600 font-bold">
                            {selectedFiles.length} new file{selectedFiles.length > 1 ? 's' : ''} added
                          </span>
                        ) : (
                          'PDF, Images, Word, Excel (Max. 10MB)'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Existing Attachments from Backend */}
                {Array.isArray(pr.attachments) && pr.attachments.length > 0 && (
                  <div className="md:col-span-12 space-y-1.5">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">
                      Existing Attachments
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {pr.attachments.map((att: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Paperclip className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold text-gray-800 truncate" title={att.file_name}>
                              {att.file_name}
                            </span>
                          </div>
                          {att.file_url && (
                            <a
                              href={att.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                              title="Download / View"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newly Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="md:col-span-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white border border-emerald-200 rounded-lg text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-1">
                            <Paperclip className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-gray-800 truncate" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors shrink-0"
                            title="Remove file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Requisitioner Details */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#1e293b] mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <User className="h-4 w-4" />
                </div>
                Requisitioner Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Requisitioner Name (Select2 from HRM) */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">
                    Requisitioner Name <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="requisitioner_name"
                    render={({ field }) => (
                      <Select2
                        options={employeeOptions}
                        value={field.value}
                        onChange={(val, opt) => {
                          field.onChange(val)
                          if (opt) {
                            if (opt.designation) setValue('designation', opt.designation)
                            if (opt.phone) setValue('contact_no', opt.phone)
                            if (opt.email) setValue('email', opt.email)
                            if (opt.department_id) setValue('department_id', opt.department_id)
                          }
                          trigger(['requisitioner_name', 'designation', 'contact_no', 'email', 'department_id'])
                        }}
                        placeholder="Select Requisitioner (from HRM)"
                        error={errors.requisitioner_name?.message as string}
                      />
                    )}
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Designation</label>
                  <input
                    type="text"
                    {...register('designation')}
                    placeholder="e.g. Procurement Officer, Engineer, Manager"
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Contact Number</label>
                  <input
                    type="text"
                    {...register('contact_no')}
                    placeholder="e.g. +880 17XXXXXXXX"
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#475569]">Official Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. requester@company.com"
                    className={clsx(
                      'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none focus:border-primary transition-all',
                      errors.email ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-200 focus:ring-1 focus:ring-primary/30'
                    )}
                  />
                  {errors.email && <span className="text-rose-500 text-[11px] font-medium">{errors.email.message}</span>}
                </div>
              </div>
            </div>

            {/* Card 3: Items Grid */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <Package className="h-4 w-4" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Requisition Items</h2>
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
                        budget_head_id: null,
                        quantity: 1,
                        estimated_rate: 0,
                      })
                    }
                    className="px-4 py-2 bg-[#1B4D90] text-white text-[13px] font-semibold rounded-lg hover:bg-[#153a80] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('items', [])}
                    className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                    title="Clear All Items"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {itemsErrorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[13px] font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{itemsErrorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                {itemFields.map((field, index) => (
                  <RequisitionItemRow
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
                    budgetHeadOptions={budgetHeadOptions}
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
                      budget_head_id: null,
                      quantity: 1,
                      estimated_rate: 0,
                    })
                  }
                  className="w-full py-4 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center gap-2 text-primary font-bold text-[14px] hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Card 4: Purpose & Notes */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-6">
              {/* Purpose / Justification */}
              <div>
                <h2 className="text-[16px] font-bold text-[#1e293b] mb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  Purpose & Justification
                </h2>
                <Controller
                  control={control}
                  name="purpose_justification"
                  render={({ field }) => (
                    <RichEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Explain the business purpose, project necessity, or justification for this requisition..."
                    />
                  )}
                />
              </div>

              {/* Special Remarks */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Special Remarks / Instructions
                </label>
                <textarea
                  {...register('remarks')}
                  rows={3}
                  placeholder="Any additional remarks or delivery instructions for procurement and stores..."
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary & Actions (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6 sticky top-6 pb-12">
            {/* Dark Blue Summary Card */}
            <div className="bg-[#1B4D90] rounded-xl p-5 shadow-lg text-white">
              <h3 className="text-[16px] font-bold mb-5 opacity-90">Requisition Summary</h3>

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
                  <span className="opacity-80 font-medium">Requisition Type</span>
                  <span
                    className={clsx(
                      'font-semibold px-2 py-0.5 rounded text-xs',
                      isEmergency
                        ? 'bg-rose-500/20 text-rose-200 border border-rose-300/30'
                        : 'bg-white/20 text-white'
                    )}
                  >
                    {isEmergency ? 'Emergency' : 'Normal'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">
                    Estimated Total
                  </p>
                  <p className="text-[22px] font-black">
                    {formatCurrency(totalEstimatedAmount, currency, currencyPosition)}
                  </p>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wider">
                  {pr.status || 'Draft'}
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
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/procurement/purchase-requisitions' })}
        title="Discard Changes?"
        message="You have unsaved changes in this purchase requisition. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
