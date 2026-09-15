import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, UserCheck, Calendar, ShieldCheck, X } from 'lucide-react'
import { useSubmitGRNQC } from '../../hooks/useGRN'
import { useUsers } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import type { GRN, GRNQCStatus } from '../../api/types'
import { clsx } from 'clsx'

interface GRNQCModalProps {
  isOpen: boolean
  onClose: () => void
  grn: GRN
  onSuccess?: () => void
}

export const GRNQCModal = ({ isOpen, onClose, grn, onSuccess }: GRNQCModalProps) => {
  const { user: currentUser } = useAuthStore()
  const { showNotificationModal } = useUiStore()
  const { data: usersData, isLoading: isLoadingUsers } = useUsers()
  const submitQCMutation = useSubmitGRNQC()

  const [inspectionDate, setInspectionDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  )
  const [inspectorId, setInspectorId] = useState<number>(
    () => currentUser?.id || grn.inspection_by_id || grn.received_by_id || 0
  )
  const [remarks, setRemarks] = useState<string>(grn.qc_remarks || '')
  const [itemStatuses, setItemStatuses] = useState<Record<number, 'passed' | 'rejected'>>({})

  const usersList = (usersData?.data || (usersData as any)?.response || []) as Array<{
    id: number
    name?: string
    first_name?: string
    last_name?: string
  }>

  useEffect(() => {
    if (grn) {
      setInspectionDate(
        grn.inspection_date
          ? grn.inspection_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      )
      setInspectorId(currentUser?.id || grn.inspection_by_id || grn.received_by_id || 0)
      setRemarks(grn.qc_remarks || '')

      const initialItemStatuses: Record<number, 'passed' | 'rejected'> = {}
      if (grn.items && grn.items.length > 0) {
        grn.items.forEach((item) => {
          if (item.id) {
            initialItemStatuses[item.id] = (item.qc_status as 'passed' | 'rejected') || 'passed'
          }
        })
      }
      setItemStatuses(initialItemStatuses)
    }
  }, [grn, currentUser])

  if (!isOpen) return null

  // Computed metrics
  const totalItems = grn.items?.length || 0
  const rejectedCount = useMemo(() => {
    return Object.values(itemStatuses).filter((s) => s === 'rejected').length
  }, [itemStatuses])
  const passedCount = totalItems - rejectedCount
  const isAllPassed = totalItems > 0 && rejectedCount === 0

  const handleItemStatusChange = (itemId: number, status: 'passed' | 'rejected') => {
    setItemStatuses((prev) => ({ ...prev, [itemId]: status }))
  }

  const handleSelectAll = (status: 'passed' | 'rejected') => {
    if (!grn.items) return
    const updated: Record<number, 'passed' | 'rejected'> = {}
    grn.items.forEach((item) => {
      if (item.id) {
        updated[item.id] = status
      }
    })
    setItemStatuses(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inspectorId) {
      showNotificationModal('Validation Error', 'Please select an inspecting officer / user.', 'error')
      return
    }

    if (!inspectionDate) {
      showNotificationModal('Validation Error', 'Please specify the inspection date.', 'error')
      return
    }

    const overallDecision = isAllPassed ? 'passed' : 'failed'

    const itemsPayload = grn.items?.map((item) => ({
      grn_item_id: item.id!,
      qc_status: itemStatuses[item.id!] || 'passed',
    })) || []

    try {
      await submitQCMutation.mutateAsync({
        uuid: grn.uuid,
        payload: {
          qc_result: overallDecision,
          qc_remarks: remarks || null,
          inspection_by_id: Number(inspectorId),
          inspection_date: inspectionDate,
          items: itemsPayload,
        },
      })

      showNotificationModal(
        'Quality Inspection Completed',
        overallDecision === 'passed'
          ? `GRN "${grn.grn_no}" passed Quality Control inspection and is now APPROVED for stock inwarding.`
          : `GRN "${grn.grn_no}" has ${rejectedCount} rejected item(s) and was marked as QC Failed/Quarantine.`,
        overallDecision === 'passed' ? 'success' : 'warning'
      )

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      showNotificationModal(
        'QC Submission Failed',
        err?.response?.data?.message || err.message || 'Failed to submit quality inspection.',
        'error'
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 font-poppins">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0d7a50] shrink-0 border border-emerald-100/80 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Quality Inspection</h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-primary rounded-md border border-blue-100">
                  {grn.grn_no}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Inspect physical items, record damages, and approve stock for warehouse storage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Context Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Purchase Order</span>
              <span className="font-bold text-gray-800 font-mono mt-0.5 block">
                {grn.purchaseOrder?.po_no || grn.purchase_order?.po_no || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Vendor / Supplier</span>
              <span className="font-semibold text-gray-800 truncate block mt-0.5">
                {grn.supplier?.name || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Delivery Challan</span>
              <span className="font-semibold text-gray-800 font-mono mt-0.5 block">
                {grn.delivery_challan_no || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Received Date</span>
              <span className="font-semibold text-gray-700 font-mono mt-0.5 block">
                {grn.delivery_date ? grn.delivery_date.split('T')[0] : '—'}
              </span>
            </div>
          </div>

          {/* Inspector and Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-gray-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                <span>Inspector / Quality Officer</span> <span className="text-rose-500">*</span>
              </label>
              <select
                value={inspectorId}
                onChange={(e) => setInspectorId(Number(e.target.value))}
                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none"
                required
              >
                <option value="">Select Inspector...</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User #${u.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Inspection Date</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none"
                required
              />
            </div>
          </div>

          {/* Line Items Inspection Checklist Table */}
          {grn.items && grn.items.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <label className="text-[13px] font-bold text-gray-800">
                    Item-Level Quality Checklist
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">({grn.items.length} items)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll('passed')}
                    className="text-[11.5px] text-emerald-700 hover:text-emerald-800 font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer border border-emerald-200"
                  >
                    Pass All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll('rejected')}
                    className="text-[11.5px] text-rose-700 hover:text-rose-800 font-bold px-2.5 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-200"
                  >
                    Reject All
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#dae8ff]/50 text-gray-700 text-[11px] font-bold border-b border-gray-200">
                      <th className="py-2.5 px-3.5 w-12 text-center">SL</th>
                      <th className="py-2.5 px-3">Product / Material</th>
                      <th className="py-2.5 px-3 text-center w-24">Unit</th>
                      <th className="py-2.5 px-3 text-right w-24">Received</th>
                      <th className="py-2.5 px-3 text-right w-24">Damaged</th>
                      <th className="py-2.5 px-3 text-right w-28">Net Accepted</th>
                      <th className="py-2.5 px-3.5 text-center w-36">QC Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {grn.items.map((item, idx) => {
                      const currentStatus = item.id ? itemStatuses[item.id] || 'passed' : 'passed'
                      return (
                        <tr key={item.id || item.po_item_id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2.5 px-3.5 text-gray-400 font-medium text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-gray-900">
                              {item.product?.name || item.poItem?.product?.name || `Product #${item.product_id}`}
                            </div>
                            {(item.product?.code || item.poItem?.product?.code) && (
                              <div className="text-[10.5px] text-gray-400 font-mono">
                                SKU: {item.product?.code || item.poItem?.product?.code}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-500 font-medium">
                            {item.unit?.name || 'Units'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-700">
                            {Number(item.received_quantity).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-600">
                            {Number(item.damaged_quantity || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0d7a50]">
                            {Number(item.accepted_quantity).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                              <button
                                type="button"
                                onClick={() => item.id && handleItemStatusChange(item.id, 'passed')}
                                className={clsx(
                                  'px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer',
                                  currentStatus === 'passed'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-gray-500 hover:text-gray-800'
                                )}
                              >
                                Pass
                              </button>
                              <button
                                type="button"
                                onClick={() => item.id && handleItemStatusChange(item.id, 'rejected')}
                                className={clsx(
                                  'px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer',
                                  currentStatus === 'rejected'
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'text-gray-500 hover:text-gray-800'
                                )}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Remarks Textarea */}
          <div className="space-y-1.5">
            <label className="block text-[12.5px] font-semibold text-gray-700">
              Inspection Notes / Quality Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Enter QC parameters, lab testing results, batch verification notes..."
              className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white outline-none"
            />
          </div>

          {/* Footer Actions with Live Decision Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
            {/* Live Computed Status Pill */}
            <div>
              {isAllPassed ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All items passed ({passedCount}/{totalItems}) — Approved for Inwarding</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{rejectedCount} item(s) rejected — Stock will be held in Quarantine</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-[38px] text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitQCMutation.isPending}
                className={clsx(
                  'px-6 h-[38px] text-xs font-bold text-white disabled:opacity-50 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2',
                  isAllPassed
                    ? 'bg-[#0d7a50] hover:bg-[#0a6642] shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                )}
              >
                {submitQCMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isAllPassed ? 'Approve & Pass Inspection' : 'Submit QC Findings'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
