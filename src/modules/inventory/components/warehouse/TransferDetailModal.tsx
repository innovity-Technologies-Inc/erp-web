import { X, Building2, Package, ArrowRight, Calendar, User, FileText, CheckCircle2, Clock, Truck, Ban } from 'lucide-react'
import { clsx } from 'clsx'
import { useWarehouseTransfer } from '../../hooks/useWarehouseTransfers'
import { formatDate } from '@/utils/formatters'

interface TransferDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transferId: number | null
}

export const TransferDetailModal = ({ isOpen, onClose, transferId }: TransferDetailModalProps) => {
  const { data: transfer, isLoading } = useWarehouseTransfer(transferId)

  if (!isOpen) return null

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending Dispatch
          </span>
        )
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-xs font-semibold">
            <Truck className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            Dispatched (In Transit)
          </span>
        )
      case 'received':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Completed (Received)
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full text-xs font-semibold">
            <Ban className="w-3.5 h-3.5 text-rose-500" />
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg text-gray-900">
                  Transfer #{transfer?.transfer_no || '...'}
                </h3>
                {getStatusBadge(transfer?.status)}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Created on {transfer?.transfer_date ? formatDate(transfer.transfer_date) : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">Loading transfer details...</div>
          ) : !transfer ? (
            <div className="py-12 text-center text-rose-500">Failed to load transfer details.</div>
          ) : (
            <>
              {/* Warehouse Route Card */}
              <div className="bg-linear-to-r from-blue-50/60 via-indigo-50/30 to-purple-50/60 border border-blue-100/80 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white shadow-xs border border-blue-200/70 flex items-center justify-center text-blue-600 font-bold text-sm">
                    FROM
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Source Warehouse</div>
                    <div className="font-bold text-gray-900 text-base flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {transfer.from_warehouse?.name || 'Source'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">Code: {transfer.from_warehouse?.warehouse_code || '—'}</div>
                  </div>
                </div>

                <div className="flex flex-col items-center px-4">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-primary">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase mt-1 tracking-widest">TRANSFER</span>
                </div>

                <div className="flex items-center gap-3.5 text-right">
                  <div>
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Destination Warehouse</div>
                    <div className="font-bold text-gray-900 text-base flex items-center gap-1.5 justify-end mt-0.5">
                      {transfer.to_warehouse?.name || 'Destination'}
                      <Building2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-500 font-mono">Code: {transfer.to_warehouse?.warehouse_code || '—'}</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white shadow-xs border border-indigo-200/70 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    TO
                  </div>
                </div>
              </div>

              {/* Meta information row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5">
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Transfer Date
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {transfer.transfer_date ? formatDate(transfer.transfer_date) : '—'}
                  </div>
                </div>
                <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5">
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400" /> Total Items
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {transfer.items?.length || 0} product(s)
                  </div>
                </div>
                <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5">
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" /> Remarks
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-1 truncate" title={transfer.remarks || ''}>
                    {transfer.remarks || 'No remarks'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Transfer Items Breakdown
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Batch</th>
                        <th className="px-4 py-3">Source Location</th>
                        <th className="px-4 py-3">Dest Location</th>
                        <th className="px-4 py-3 text-right">Transfer Qty</th>
                        <th className="px-4 py-3 text-right">Received Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {transfer.items?.map((item, idx) => {
                        const sourceLoc = item.rack_bin
                          ? `${item.rack_bin.zone?.zone_name || 'Zone'} (${item.rack_bin.aisle || ''}-${item.rack_bin.rack || ''}-${item.rack_bin.bin || ''})`
                          : 'General'
                        const destLoc = item.to_rack_bin
                          ? `${item.to_rack_bin.zone?.zone_name || 'Zone'} (${item.to_rack_bin.aisle || ''}-${item.to_rack_bin.rack || ''}-${item.to_rack_bin.bin || ''})`
                          : '—'
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">{item.product?.product_name || `Product #${item.product_id}`}</div>
                              {item.product?.product_model && (
                                <div className="text-[11px] text-gray-500">Model: {item.product.product_model}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-600">
                              {item.batch_master?.batch_no || '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{sourceLoc}</td>
                            <td className="px-4 py-3 text-gray-600">{destLoc}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {Number(item.quantity).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {Number(item.received_quantity).toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
