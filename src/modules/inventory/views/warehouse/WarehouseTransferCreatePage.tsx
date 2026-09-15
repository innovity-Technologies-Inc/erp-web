import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Check, 
  Trash2, 
  Plus, 
  Info, 
  Package, 
  X,
  Calendar,
  Building2,
  FileText
} from 'lucide-react'
import { 
  useWarehouses, 
  useBatches, 
  useBatchProducts, 
  useBatchProductQty 
} from '../../hooks/useWarehouse'
import { useCreateWarehouseTransfer } from '../../hooks/useWarehouseTransfers'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { Select2 } from '@/components/Select/Select2'
import { useUiStore } from '@/store/useUiStore'

// ─── Zod Schema ─────────────────────────────────────────────────────────────

const transferItemSchema = z.object({
  product_id: z.any().refine((val) => val !== undefined && val !== null && val !== '' && val !== 0 && val !== '0', { message: 'Product is required' }),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  avl_qty: z.coerce.number().optional(),
})

const transferBatchSchema = z.object({
  batch_master_id: z.any().refine((val) => val !== undefined && val !== null && val !== '' && val !== 0 && val !== '0', { message: 'Batch is required' }),
  items: z.array(transferItemSchema).min(1, 'At least one item is required in batch'),
})

const warehouseTransferSchema = z.object({
  from_warehouse_id: z.any().refine((val) => val !== undefined && val !== null && val !== '' && val !== 0 && val !== '0', { message: 'Source warehouse is required' }),
  to_warehouse_id: z.any().refine((val) => val !== undefined && val !== null && val !== '' && val !== 0 && val !== '0', { message: 'Destination warehouse is required' }),
  transfer_date: z.string().min(1, 'Transfer date is required'),
  transfer_no: z.string().optional(),
  remarks: z.string().optional(),
  batches: z.array(transferBatchSchema).min(1, 'At least one batch is required'),
})

type WarehouseTransferFormValues = z.infer<typeof warehouseTransferSchema>

// ─── Sub-Component for Batch Item Rows ─────────────────────────────────────────

const ItemRow = ({ batchIndex, itemIndex, control, register, remove, canRemove, batchId, fromWarehouseId, usedProductIds, setValue }: any) => {
  const watchProductId = useWatch({ control, name: `batches.${batchIndex}.items.${itemIndex}.product_id` })
  const { data: products } = useBatchProducts(batchId)
  const { data: qtyData } = useBatchProductQty(batchId, watchProductId, fromWarehouseId)
  const { showNotificationModal } = useUiStore()

  useEffect(() => {
    if (qtyData) {
      setValue(`batches.${batchIndex}.items.${itemIndex}.avl_qty`, qtyData.available_qty || 0)
    }
  }, [qtyData, batchIndex, itemIndex, setValue])

  const productOptions = useMemo(() => {
    const allOptions = products?.map((p: any) => ({
      label: p.text,
      value: p.id
    })) || []
    
    // Filter out products used in other rows of the same batch
    return allOptions.filter((opt: any) => 
      !usedProductIds.includes(Number(opt.value)) || Number(opt.value) === Number(watchProductId)
    )
  }, [products, usedProductIds, watchProductId])

  const avlQty = useWatch({ control, name: `batches.${batchIndex}.items.${itemIndex}.avl_qty` })

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    if (val > avlQty) {
      setValue(`batches.${batchIndex}.items.${itemIndex}.quantity`, 0)
      showNotificationModal('Invalid Quantity', 'Transfer quantity exceeds available stock', 'error')
    }
  }

  return (
    <tr className="bg-white hover:bg-gray-50/50 transition-colors group">
      <td className="px-4 py-3">
        <Controller
          control={control}
          name={`batches.${batchIndex}.items.${itemIndex}.product_id`}
          render={({ field }) => (
            <Select2
              options={productOptions}
              value={field.value}
              onChange={(val) => {
                field.onChange(val)
                setValue(`batches.${batchIndex}.items.${itemIndex}.avl_qty`, 0)
                setValue(`batches.${batchIndex}.items.${itemIndex}.quantity`, 1)
              }}
              placeholder="Select product"
              isDisabled={!batchId}
              variant="ghost"
              className="text-[13px] font-medium"
            />
          )}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-[13px] font-medium text-gray-400">
          {avlQty || 0}
        </span>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          {...register(`batches.${batchIndex}.items.${itemIndex}.quantity`, { 
            valueAsNumber: true,
            onChange: handleQtyChange
          })}
          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] text-center outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569]"
          placeholder="Qty"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => canRemove && remove(itemIndex)}
          disabled={!canRemove}
          className={clsx(
            "p-1 transition-all flex items-center justify-center mx-auto",
            canRemove ? "hover:scale-110" : "opacity-20 cursor-not-allowed"
          )}
        >
          <div className={clsx(
            "w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm transition-colors",
            canRemove ? "bg-rose-500 hover:bg-rose-600" : "bg-gray-300"
          )}>
            <X className="h-4 w-4" strokeWidth={4} />
          </div>
        </button>
      </td>
    </tr>
  )
}

// ─── Sub-Component for Batch Cards ─────────────────────────────────────────────

const BatchCard = ({ index, control, register, removeBatch, fromWarehouseId, canRemoveBatch, appendBatch, usedBatchIds, setValue }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `batches.${index}.items`
  })

  const watchBatchId = useWatch({ control, name: `batches.${index}.batch_master_id` })
  const watchedItems = useWatch({ control, name: `batches.${index}.items` }) || []
  const { data: batches } = useBatches(fromWarehouseId)

  const usedProductIds = useMemo(() => {
    return watchedItems
      .map((item: any) => Number(item.product_id))
      .filter((id: number) => !isNaN(id))
  }, [watchedItems])

  const batchOptions = useMemo(() => {
    const allOptions = batches?.map((b: any) => ({
      label: b.text,
      value: b.id
    })) || []

    // Filter out batches used in other BatchCards
    return allOptions.filter((opt: any) => 
      !usedBatchIds.includes(Number(opt.value)) || Number(opt.value) === Number(watchBatchId)
    )
  }, [batches, usedBatchIds, watchBatchId])

  return (
    <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-[#f8fafc]">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-[#003671]" strokeWidth={2.5} />
          <span className="font-semibold text-[16px] text-[#1e293b]">Batch Details</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={appendBatch}
            className="flex items-center gap-2 px-4 h-9 bg-[#1E3A5F] hover:bg-[#153a80] text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Add Batch
          </button>
          
          {canRemoveBatch && (
            <button
              type="button"
              onClick={() => removeBatch(index)}
              className="p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors text-rose-500 border border-rose-100"
              title="Remove Batch"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[#475569]">Batch <span className="text-rose-500">*</span></label>
          <Controller
            control={control}
            name={`batches.${index}.batch_master_id`}
            render={({ field }) => (
              <Select2
                options={batchOptions}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val)
                  // Reset items when batch changes
                  setValue(`batches.${index}.items`, [{ product_id: undefined as any, quantity: 1, avl_qty: 0 }])
                }}
                placeholder="Select batch"
                isDisabled={!fromWarehouseId}
              />
            )}
          />
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#dae8ff] text-[12px] font-bold text-[#003671] uppercase tracking-wider">
                <th className="px-4 py-3">Product*</th>
                <th className="px-4 py-3 text-center w-24">Stock</th>
                <th className="px-4 py-3 text-center w-32">Qty*</th>
                <th className="px-4 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fields.map((field, itemIdx) => (
                <ItemRow
                  key={field.id}
                  batchIndex={index}
                  itemIndex={itemIdx}
                  control={control}
                  register={register}
                  remove={remove}
                  canRemove={fields.length > 1}
                  batchId={watchBatchId}
                  fromWarehouseId={fromWarehouseId}
                  usedProductIds={usedProductIds}
                  setValue={setValue}
                />
              ))}
            </tbody>
          </table>
          <div 
            onClick={() => append({ product_id: undefined as any, quantity: 1, avl_qty: 0 })}
            className="p-4 bg-white border-t border-dashed border-gray-300 flex items-center justify-center cursor-pointer group hover:bg-gray-50/50 transition-all m-4 border-2 rounded-xl"
          >
             <div className="flex items-center gap-2 text-[#003671] font-bold text-[14px] group-hover:scale-105 transition-transform">
                <Plus className="h-5 w-5" strokeWidth={3} />
                Add Item
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const WarehouseTransferCreatePage = () => {
  const navigate = useNavigate()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  
  const { data: warehouses } = useWarehouses()
  const { mutate: storeTransfer, isPending: isSaving } = useCreateWarehouseTransfer()
  const { showNotificationModal } = useUiStore()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<WarehouseTransferFormValues>({
    resolver: zodResolver(warehouseTransferSchema) as any,
    defaultValues: {
      from_warehouse_id: undefined as any,
      to_warehouse_id: undefined as any,
      transfer_date: new Date().toISOString().split('T')[0],
      transfer_no: '',
      remarks: '',
      batches: [{
        batch_master_id: undefined as any,
        items: [{ product_id: undefined as any, quantity: 1, avl_qty: 0 }]
      }]
    }
  })

  const { fields: batchFields, append: appendBatch, remove: removeBatch } = useFieldArray({
    control,
    name: 'batches'
  })

  const fromWarehouseId = useWatch({ control, name: 'from_warehouse_id' })
  const watchedBatches = useWatch({ control, name: 'batches' }) || []

  const usedBatchIds = useMemo(() => {
    return watchedBatches
      .map((b: any) => Number(b?.batch_master_id))
      .filter((id: number) => !isNaN(id))
  }, [watchedBatches])

  const warehouseOptions = useMemo(() => {
    return warehouses?.map((w: any) => ({
      label: w.text,
      value: w.id
    })) || []
  }, [warehouses])

  const toWarehouseOptions = useMemo(() => {
    return warehouseOptions.filter((opt: any) => Number(opt.value) !== Number(fromWarehouseId))
  }, [warehouseOptions, fromWarehouseId])

  const onSubmit = (data: WarehouseTransferFormValues) => {
    const flatItems: any[] = []
    const duplicateCheckSet = new Set<string>()

    for (const batch of data.batches) {
      for (const item of batch.items) {
        const key = `${batch.batch_master_id}-${item.product_id}`
        if (duplicateCheckSet.has(key)) {
          showNotificationModal('Duplicate Entry', 'Same product not allowed in the same batch', 'error')
          return
        }
        duplicateCheckSet.add(key)

        flatItems.push({
          batch_master_id: batch.batch_master_id,
          product_id: item.product_id,
          quantity: item.quantity
        })
      }
    }

    const payload = {
      from_warehouse_id: data.from_warehouse_id,
      to_warehouse_id: data.to_warehouse_id,
      transfer_date: data.transfer_date,
      transfer_no: data.transfer_no || undefined,
      remarks: data.remarks,
      items: flatItems
    }

    storeTransfer(payload, {
      onSuccess: () => {
        navigate({ to: '/inventory/warehouse/stock-movement' })
      },
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/warehouse/stock-movement' })
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center justify-between">
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
              New Warehouse Transfer
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Details */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-primary/10 p-4 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                  <Info className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <h2 className="font-semibold text-[16px] text-[#1e293b]">Transfer Details</h2>
              </div>

              <div className="space-y-7 mt-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#475569]">From Warehouse <span className="text-rose-500">*</span></label>
                  <Controller
                    control={control}
                    name="from_warehouse_id"
                    render={({ field }) => (
                      <Select2
                        options={warehouseOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val)
                          setValue('batches', [{
                            batch_master_id: undefined as any,
                            items: [{ product_id: undefined as any, quantity: 1, avl_qty: 0 }]
                          }])
                          setValue('to_warehouse_id', undefined as any)
                        }}
                        placeholder="Select warehouse"
                        error={errors.from_warehouse_id?.message as string}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#475569]">To Warehouse <span className="text-rose-500">*</span></label>
                  <Controller
                    control={control}
                    name="to_warehouse_id"
                    render={({ field }) => (
                      <Select2
                        options={toWarehouseOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select warehouse"
                        isDisabled={!fromWarehouseId}
                        error={errors.to_warehouse_id?.message as string}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#475569]">Transfer Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    {...register('transfer_date')}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569]"
                  />
                  {errors.transfer_date && (
                    <span className="text-rose-500 text-[11px] font-medium">{errors.transfer_date.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#475569]">Reference / Transfer No</label>
                  <input
                    {...register('transfer_no')}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                    placeholder="e.g. TRF-2026-001 (Auto if empty)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#475569]">Remark</label>
                  <textarea
                    {...register('remarks')}
                    rows={4}
                    className="w-full p-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Batches */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex-1">
                {batchFields.map((field, index) => (
                  <BatchCard
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    removeBatch={removeBatch}
                    fromWarehouseId={fromWarehouseId}
                    canRemoveBatch={batchFields.length > 1}
                    usedBatchIds={usedBatchIds}
                    setValue={setValue}
                    appendBatch={() => appendBatch({ 
                      batch_master_id: undefined as any, 
                      items: [{ product_id: undefined as any, quantity: 1, avl_qty: 0 }] 
                    })}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px]"
                >
                  {isSaving ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Check className="h-5 w-5" strokeWidth={3} /> Save</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/warehouse/stock-movement' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
