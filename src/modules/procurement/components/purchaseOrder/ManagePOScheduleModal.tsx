import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Calendar,
  Truck,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Save,
  Package,
  Clock,
  Layers,
} from 'lucide-react'
import { useSavePOSchedules } from '../../hooks/usePurchaseOrders'
import { useUiStore } from '@/store/useUiStore'
import { formatDate } from '@/utils/formatters'
import type { PurchaseOrder, PurchaseOrderItem } from '../../api/types'
import { clsx } from 'clsx'

interface ScheduleBatchDraft {
  id?: number
  schedule_no?: string
  planned_delivery_date: string
  planned_quantity: number
}

interface ItemScheduleState {
  itemId: number
  productName: string
  categoryName: string
  unitName: string
  orderedQty: number
  batches: ScheduleBatchDraft[]
}

interface ManagePOScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  po: PurchaseOrder
  onSuccess?: () => void
}

export const ManagePOScheduleModal: React.FC<ManagePOScheduleModalProps> = ({
  isOpen,
  onClose,
  po,
  onSuccess,
}) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: saveSchedulesMutate, isPending } = useSavePOSchedules()

  // Default date to fall back on
  const defaultDate = useMemo(() => {
    if (po.po_validity_date) return po.po_validity_date.split('T')[0]
    if (po.po_date) return po.po_date.split('T')[0]
    return new Date().toISOString().split('T')[0]
  }, [po.po_validity_date, po.po_date])

  // Local state for all line items and their batches
  const [itemsScheduleState, setItemsScheduleState] = useState<ItemScheduleState[]>([])

  // Initialize schedule batches from PO items & existing schedules
  useEffect(() => {
    if (!isOpen || !po?.items || po.items.length === 0) return

    const initial: ItemScheduleState[] = po.items.map((item: PurchaseOrderItem) => {
      const pName = item.product?.name || item.product?.product_name || `Item #${item.id}`
      const cName = item.category?.name || item.category?.category_name || ''
      const uName = item.unit?.name || item.unit?.unit_name || item.unit?.code || 'Units'
      const orderedQty = Number(item.quantity) || 0

      // Match existing schedules for this line item
      const itemSchedules = (po.schedules || []).filter(
        (s) => Number(s.purchase_order_item_id) === Number(item.id)
      )

      let batches: ScheduleBatchDraft[] = []

      if (itemSchedules.length > 0) {
        batches = itemSchedules.map((s, idx) => ({
          id: s.id,
          schedule_no: s.schedule_no || `SCH-${idx + 1}`,
          planned_delivery_date: s.planned_delivery_date ? s.planned_delivery_date.split('T')[0] : defaultDate,
          planned_quantity: Number(s.planned_quantity) || 0,
        }))
      } else {
        // Default single batch with 100% quantity
        batches = [
          {
            schedule_no: 'SCH-1',
            planned_delivery_date: defaultDate,
            planned_quantity: orderedQty,
          },
        ]
      }

      return {
        itemId: item.id,
        productName: pName,
        categoryName: cName,
        unitName: uName,
        orderedQty,
        batches,
      }
    })

    setItemsScheduleState(initial)
  }, [isOpen, po?.id, po?.uuid, defaultDate])

  // Batch management helpers (Immutable updaters)
  const handleBatchDateChange = (itemIdx: number, batchIdx: number, date: string) => {
    setItemsScheduleState((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIdx) return item
        return {
          ...item,
          batches: item.batches.map((b, bIdx) =>
            bIdx === batchIdx ? { ...b, planned_delivery_date: date } : b
          ),
        }
      })
    )
  }

  const handleBatchQtyChange = (itemIdx: number, batchIdx: number, qty: number) => {
    setItemsScheduleState((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIdx) return item
        return {
          ...item,
          batches: item.batches.map((b, bIdx) =>
            bIdx === batchIdx ? { ...b, planned_quantity: isNaN(qty) ? 0 : qty } : b
          ),
        }
      })
    )
  }

  const handleAddBatch = (itemIdx: number) => {
    setItemsScheduleState((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIdx) return item
        const currentSum = item.batches.reduce((sum, b) => sum + (Number(b.planned_quantity) || 0), 0)
        const remaining = Math.max(0, item.orderedQty - currentSum)
        const nextBatchNo = `SCH-${item.batches.length + 1}`

        return {
          ...item,
          batches: [
            ...item.batches,
            {
              schedule_no: nextBatchNo,
              planned_delivery_date: defaultDate,
              planned_quantity: remaining > 0 ? remaining : 0,
            },
          ],
        }
      })
    )
  }

  const handleRemoveBatch = (itemIdx: number, batchIdx: number) => {
    setItemsScheduleState((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIdx) return item
        if (item.batches.length <= 1) return item
        const filtered = item.batches.filter((_, bIdx) => bIdx !== batchIdx)
        const renumbered = filtered.map((b, bIdx) => ({
          ...b,
          schedule_no: `SCH-${bIdx + 1}`,
        }))
        return {
          ...item,
          batches: renumbered,
        }
      })
    )
  }

  const handleResetSingleBatch = (itemIdx: number) => {
    setItemsScheduleState((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIdx) return item
        return {
          ...item,
          batches: [
            {
              schedule_no: 'SCH-1',
              planned_delivery_date: defaultDate,
              planned_quantity: item.orderedQty,
            },
          ],
        }
      })
    )
  }

  // Validation across all items
  const validationSummary = useMemo(() => {
    let allValid = true
    let totalItems = itemsScheduleState.length
    let validItemsCount = 0
    const errors: string[] = []

    itemsScheduleState.forEach((item, idx) => {
      const sum = item.batches.reduce((acc, b) => acc + (Number(b.planned_quantity) || 0), 0)
      const diff = Math.round((item.orderedQty - sum) * 100) / 100

      // Check dates
      const missingDates = item.batches.some((b) => !b.planned_delivery_date)
      const zeroQty = item.batches.some((b) => (Number(b.planned_quantity) || 0) <= 0)

      if (Math.abs(diff) > 0.001) {
        allValid = false
        errors.push(`Item #${idx + 1} (${item.productName}): Scheduled ${sum}/${item.orderedQty} (mismatch of ${Math.abs(diff)})`)
      } else if (missingDates) {
        allValid = false
        errors.push(`Item #${idx + 1} (${item.productName}): All batches must have a planned delivery date.`)
      } else if (zeroQty) {
        allValid = false
        errors.push(`Item #${idx + 1} (${item.productName}): Batch quantities must be greater than 0.`)
      } else {
        validItemsCount++
      }
    })

    return {
      allValid,
      totalItems,
      validItemsCount,
      errors,
    }
  }, [itemsScheduleState])

  // Save schedules mutation
  const handleSave = () => {
    if (!validationSummary.allValid) {
      showNotificationModal(
        'Schedule Validation Error',
        validationSummary.errors[0] || 'Please ensure all items have matching scheduled quantities.',
        'error'
      )
      return
    }

    const payloadSchedules: Array<{
      purchase_order_item_id: number
      planned_delivery_date: string
      planned_quantity: number
    }> = []

    itemsScheduleState.forEach((item) => {
      item.batches.forEach((b) => {
        payloadSchedules.push({
          purchase_order_item_id: item.itemId,
          planned_delivery_date: b.planned_delivery_date,
          planned_quantity: Number(b.planned_quantity),
        })
      })
    })

    saveSchedulesMutate(
      {
        uuid: po.uuid,
        data: { schedules: payloadSchedules },
      },
      {
        onSuccess: () => {
          showNotificationModal(
            'Delivery Schedule Saved',
            `Delivery schedule for PO "${po.po_no}" has been saved successfully.`,
            'success'
          )
          if (onSuccess) onSuccess()
          onClose()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to save delivery schedule.'
          showNotificationModal('Save Error', msg, 'error')
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60 shadow-2xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-gray-900">
                  Manage Delivery Schedule
                </h3>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {po.po_no}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Configure delivery batches and planned delivery dates for each order line item.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Item Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {itemsScheduleState.map((item, itemIdx) => {
            const sum = item.batches.reduce((acc, b) => acc + (Number(b.planned_quantity) || 0), 0)
            const diff = Math.round((item.orderedQty - sum) * 100) / 100
            const isMatched = Math.abs(diff) < 0.001
            const isUnder = diff > 0.001
            const isOver = diff < -0.001

            return (
              <div
                key={item.itemId}
                className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden"
              >
                {/* Item Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white border border-gray-200 rounded-lg text-primary">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-gray-900">
                        {item.productName}
                      </span>
                      {item.categoryName && (
                        <span className="text-[11px] text-gray-500 ml-2">
                          ({item.categoryName})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-[12px] font-bold text-gray-700 font-mono bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                      Ordered: {item.orderedQty} {item.unitName}
                    </span>

                    {/* Progress Badge */}
                    {isMatched && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3" />
                        {sum}/{item.orderedQty} Scheduled (100%)
                      </span>
                    )}
                    {isUnder && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        {sum}/{item.orderedQty} ({diff} {item.unitName} Remaining)
                      </span>
                    )}
                    {isOver && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3 h-3" />
                        {sum}/{item.orderedQty} (Exceeds by {Math.abs(diff)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Batches Table for this Item */}
                <div className="p-4 space-y-3 bg-[#fafbfc]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      Delivery Milestones ({item.batches.length})
                    </span>

                    <div className="flex items-center gap-2">
                      {item.batches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleResetSingleBatch(itemIdx)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Reset to 1 Batch
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddBatch(itemIdx)}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Split / Add Batch
                      </button>
                    </div>
                  </div>

                  {/* Batch Rows */}
                  <div className="space-y-2">
                    {item.batches.map((batch, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200/80 shadow-2xs"
                      >
                        {/* Milestone Badge */}
                        <div className="w-24 shrink-0 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            Milestone
                          </label>
                          <div className="h-[36px] flex items-center">
                            <span className="text-[11px] font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center">
                              {batch.schedule_no || `SCH-${bIdx + 1}`}
                            </span>
                          </div>
                        </div>

                        {/* Planned Date */}
                        <div className="flex-1 min-w-[170px] space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            Planned Delivery Date <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={batch.planned_delivery_date}
                            onChange={(e) => handleBatchDateChange(itemIdx, bIdx, e.target.value)}
                            className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-lg text-[12px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                          />
                        </div>

                        {/* Planned Quantity */}
                        <div className="w-40 shrink-0 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            Batch Qty ({item.unitName}) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={batch.planned_quantity || ''}
                            onChange={(e) => handleBatchQtyChange(itemIdx, bIdx, parseFloat(e.target.value))}
                            placeholder="0.00"
                            className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-lg text-[12px] font-mono font-bold text-right outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                          />
                        </div>

                        {/* Delete Action */}
                        <div className="shrink-0 space-y-1">
                          <label className="text-[10px] font-bold text-transparent uppercase tracking-wider block select-none">
                            Action
                          </label>
                          <div className="h-[36px] flex items-center">
                            {item.batches.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveBatch(itemIdx, bIdx)}
                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove this batch"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <div className="w-8" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-slate-50/60 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Items Status:
            </span>
            <span
              className={clsx(
                'text-xs font-bold px-2.5 py-0.5 rounded-full border',
                validationSummary.allValid
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              {validationSummary.validItemsCount} / {validationSummary.totalItems} Items Fully Scheduled
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !validationSummary.allValid}
              className={clsx(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm',
                validationSummary.allValid && !isPending
                  ? 'bg-[#0d7a50] hover:bg-[#0b6442]'
                  : 'bg-gray-400 cursor-not-allowed opacity-70'
              )}
            >
              <Save className="h-4 w-4" />
              {isPending ? 'Saving Schedule...' : 'Save Delivery Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
