import React, { useState } from 'react'
import {
  X,
  Truck,
  Building2,
  PackageCheck,
  AlertTriangle,
  FileText
} from 'lucide-react'
import type { WarehouseTransferDetail, WarehousePackingSlipDetail } from '../../api/warehouseTransfer.api'
import { useDispatchWarehouseTransfer } from '../../hooks/useWarehouseTransfers'

interface DispatchTransferModalProps {
  isOpen: boolean
  onClose: () => void
  transfer: WarehouseTransferDetail | null
  packingSlip: WarehousePackingSlipDetail | null
  onSuccess?: () => void
}

export const DispatchTransferModal: React.FC<DispatchTransferModalProps> = ({
  isOpen,
  onClose,
  transfer,
  packingSlip,
  onSuccess,
}) => {
  const { mutate: dispatchTransfer, isPending: isDispatching } = useDispatchWarehouseTransfer()

  const [transporterName, setTransporterName] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')

  if (!isOpen || !transfer) return null

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()

    dispatchTransfer(transfer.id, {
      onSuccess: () => {
        onClose()
        if (onSuccess) onSuccess()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full flex flex-col font-poppins animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Dispatch Transfer Order</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Transfer #{transfer.transfer_no}
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

        {/* Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          
          {/* Transfer Summary Card */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Source Warehouse:</span>
              <span className="font-bold text-gray-900">{transfer.from_warehouse?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Destination Warehouse:</span>
              <span className="font-bold text-gray-900">{transfer.to_warehouse?.name || '—'}</span>
            </div>
            {packingSlip && (
              <div className="flex items-center justify-between pt-1 border-t border-blue-200/60">
                <span className="text-gray-500 font-medium">Verified Packing Slip:</span>
                <span className="font-mono font-bold text-emerald-700">{packingSlip.packing_no}</span>
              </div>
            )}
          </div>

          {/* Notice Alert */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Dispatching will immediately <strong>deduct physical stock</strong> from the source warehouse and post an official SCM Issue transaction. Status will update to <strong>In Transit</strong>.
            </p>
          </div>

          {/* Transporter Details */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Transporter / Carrier Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. In-house Logistics / Courier Name"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Vehicle Registration Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dhaka Metro-TA 11-2233"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDispatching}
              className="px-5 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>{isDispatching ? 'Dispatching Stock...' : 'Confirm Dispatch & Stock Issue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
