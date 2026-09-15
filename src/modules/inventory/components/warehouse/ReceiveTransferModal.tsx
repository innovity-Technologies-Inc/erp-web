import { useState, useEffect, useMemo } from 'react'
import { X, PackageCheck, Building2, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { useWarehouseTransfer, useReceiveWarehouseTransfer } from '../../hooks/useWarehouseTransfers'
import { useWarehouseRackBins } from '../../hooks/useWarehouseRackBins'
import { Select2 } from '@/components/Select/Select2'

interface ReceiveTransferModalProps {
  isOpen: boolean
  onClose: () => void
  transferId: number | null
}

export const ReceiveTransferModal = ({ isOpen, onClose, transferId }: ReceiveTransferModalProps) => {
  const { data: transfer, isLoading } = useWarehouseTransfer(transferId)
  const { mutate: receiveTransfer, isPending } = useReceiveWarehouseTransfer()

  // Load rack bins for destination warehouse
  const { data: rackBinsResponse } = useWarehouseRackBins({
    per_page: 200,
    status: 'active',
  })

  const destWarehouseId = transfer?.to_warehouse_id

  const availableRackBins = useMemo(() => {
    const raw = (rackBinsResponse as any)?.response?.data || (rackBinsResponse as any)?.data?.data || (rackBinsResponse as any)?.data || []
    const bins = Array.isArray(raw) ? raw : []
    // filter bins belonging to destination warehouse if zone has warehouse_id
    return bins.filter((b: any) => !destWarehouseId || !b.zone?.warehouse_id || Number(b.zone.warehouse_id) === Number(destWarehouseId))
  }, [rackBinsResponse, destWarehouseId])

  const binOptions = useMemo(() => {
    return [
      { label: 'No Specific Bin (General Stock)', value: '' },
      ...availableRackBins.map((b: any) => ({
        label: `${b.zone?.zone_name || 'Zone'} - Aisle:${b.aisle || '-'} Rack:${b.rack || '-'} Shelf:${b.shelf || '-'} Bin:${b.bin || '-'} (${b.barcode_value || ''})`,
        value: String(b.id),
      })),
    ]
  }, [availableRackBins])

  const [receivedItems, setReceivedItems] = useState<{ [productId: number]: { qty: number; to_rack_bin_id: string } }>({})

  useEffect(() => {
    if (transfer?.items) {
      const initial: { [productId: number]: { qty: number; to_rack_bin_id: string } } = {}
      transfer.items.forEach((item) => {
        initial[item.product_id] = {
          qty: Number(item.quantity) || 0,
          to_rack_bin_id: item.to_rack_bin_id ? String(item.to_rack_bin_id) : '',
        }
      })
      setReceivedItems(initial)
    }
  }, [transfer])

  if (!isOpen) return null

  const handleQtyChange = (productId: number, val: number) => {
    setReceivedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        qty: Math.max(0, val),
      },
    }))
  }

  const handleBinChange = (productId: number, binId: string) => {
    setReceivedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        to_rack_bin_id: binId,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferId) return

    const payload = {
      items: Object.entries(receivedItems).map(([prodId, val]) => ({
        product_id: Number(prodId),
        received_quantity: Number(val.qty),
        to_rack_bin_id: val.to_rack_bin_id ? Number(val.to_rack_bin_id) : null,
      })),
    }

    receiveTransfer(
      { id: transferId, payload },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Receive Warehouse Transfer #{transfer?.transfer_no || '...'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Receiving into: <span className="font-semibold text-gray-800">{transfer?.to_warehouse?.name || 'Destination Warehouse'}</span>
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">Loading transfer items...</div>
          ) : (
            <>
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  Please verify physical quantities received at the destination warehouse and assign target Rack/Bin locations. This action will add stock into destination inventory and post an inbound ledger receipt.
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" /> Transfer Items Receipt Verification
                </h4>

                <div className="space-y-4">
                  {transfer?.items?.map((item, index) => {
                    const currentVal = receivedItems[item.product_id] || { qty: item.quantity, to_rack_bin_id: '' }
                    return (
                      <div key={item.id} className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-gray-900">{item.product?.product_name || `Product #${item.product_id}`}</div>
                              <div className="text-xs text-gray-500 font-mono">
                                Batch: {item.batch_master?.batch_no || 'N/A'} | Dispatched Qty: <span className="font-semibold text-gray-800">{item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-5">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                              Received Quantity <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={Number(item.quantity)}
                              value={currentVal.qty}
                              onChange={(e) => handleQtyChange(item.product_id, parseFloat(e.target.value) || 0)}
                              className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                              required
                            />
                          </div>

                          <div className="md:col-span-7">
                            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                              Destination Rack & Bin Location
                            </label>
                            <Select2
                              options={binOptions}
                              value={currentVal.to_rack_bin_id}
                              onChange={(val) => handleBinChange(item.product_id, String(val))}
                              placeholder="Select storage rack/bin"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Footer inside form */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isPending ? 'Receiving Stock...' : 'Confirm Receipt & Allocate Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
