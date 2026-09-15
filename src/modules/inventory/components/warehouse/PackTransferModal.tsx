import React, { useState, useEffect } from 'react'
import {
  X,
  PackageCheck,
  Scale,
  Box,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import type { WarehousePickListDetail, WarehouseTransferDetail } from '../../api/warehouseTransfer.api'
import { useCreatePackingSlip } from '../../hooks/useWarehouseTransfers'

interface PackTransferModalProps {
  isOpen: boolean
  onClose: () => void
  pickList: WarehousePickListDetail | null
  transfer: WarehouseTransferDetail | null
  onSuccess?: () => void
}

export const PackTransferModal: React.FC<PackTransferModalProps> = ({
  isOpen,
  onClose,
  pickList,
  transfer,
  onSuccess,
}) => {
  const { mutate: createPackingSlip, isPending: isCreating } = useCreatePackingSlip()

  const [grossWeight, setGrossWeight] = useState('')
  const [boxDimensions, setBoxDimensions] = useState('')
  const [pickedQuantities, setPickedQuantities] = useState<Record<number, string>>({})
  const [isScannedMap, setIsScannedMap] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (pickList?.items) {
      const initialQtys: Record<number, string> = {}
      const initialScanned: Record<number, boolean> = {}
      pickList.items.forEach((item) => {
        initialQtys[item.product_id] = String(item.quantity_requested)
        initialScanned[item.product_id] = true
      })
      setPickedQuantities(initialQtys)
      setIsScannedMap(initialScanned)
      setGrossWeight('')
      setBoxDimensions('')
    }
  }, [pickList, isOpen])

  if (!isOpen || !pickList) return null

  const items = pickList.items || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const packItems = items.map((item) => ({
      product_id: item.product_id,
      quantity_picked: parseFloat(pickedQuantities[item.product_id] || String(item.quantity_requested)) || 0,
      is_scanned: isScannedMap[item.product_id] ?? true,
    }))

    createPackingSlip(
      {
        pick_list_id: pickList.id,
        gross_weight: grossWeight ? parseFloat(grossWeight) : null,
        box_dimensions: boxDimensions || null,
        items: packItems,
      },
      {
        onSuccess: () => {
          onClose()
          if (onSuccess) onSuccess()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full flex flex-col font-poppins animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Packing Station & Verification</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Carton packaging for Transfer #{transfer?.transfer_no || '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Carton Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Gross Weight (kg) <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 15.50"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Box Dimensions <span className="text-gray-400 font-normal">(L x W x H cm)</span>
              </label>
              <div className="relative">
                <Box className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. 40 x 30 x 20 cm"
                  value={boxDimensions}
                  onChange={(e) => setBoxDimensions(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Line Items Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Verify Line Items ({items.length})
              </span>
              <span className="text-[11px] text-gray-400">
                Confirm picked quantities match physical boxes
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#dae8ff] text-[11px] font-bold text-[#003671] uppercase tracking-wider sticky top-0">
                    <th className="px-3.5 py-2 text-center w-10">#</th>
                    <th className="px-3.5 py-2">Product Description</th>
                    <th className="px-3.5 py-2">Allocated Shelf</th>
                    <th className="px-3.5 py-2 text-right w-24">Req. Qty</th>
                    <th className="px-3.5 py-2 text-right w-28">Packed Qty</th>
                    <th className="px-3.5 py-2 text-center w-16">Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[12px]">
                  {items.map((item, idx) => {
                    const reqQty = parseFloat(String(item.quantity_requested)) || 0
                    const currentQty = pickedQuantities[item.product_id] ?? String(reqQty)
                    const isScanned = isScannedMap[item.product_id] ?? true
                    const zone = item.rack_bin?.zone?.zone_name || 'Zone'
                    const bin = item.rack_bin?.bin || item.rack_bin?.rack || 'Bin'

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60">
                        <td className="px-3.5 py-2 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="px-3.5 py-2 font-semibold text-gray-900">
                          <div>{item.product?.product_name || `Product #${item.product_id}`}</div>
                          {item.batch_master?.batch_no && (
                            <div className="text-[10px] text-gray-500 font-mono">Batch: {item.batch_master.batch_no}</div>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-gray-600">
                          {zone} / {bin}
                        </td>
                        <td className="px-3.5 py-2 text-right font-mono font-bold text-gray-700">
                          {reqQty.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            max={reqQty}
                            value={currentQty}
                            onChange={(e) => {
                              const val = e.target.value
                              setPickedQuantities((prev) => ({ ...prev, [item.product_id]: val }))
                            }}
                            className="w-20 text-right px-2 py-0.5 border border-gray-300 rounded font-mono text-xs font-bold text-emerald-700 focus:ring-1 focus:ring-primary outline-none"
                          />
                        </td>
                        <td className="px-3.5 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isScanned}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setIsScannedMap((prev) => ({ ...prev, [item.product_id]: checked }))
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{isCreating ? 'Generating Slip...' : 'Create Packing Slip & Verify'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
