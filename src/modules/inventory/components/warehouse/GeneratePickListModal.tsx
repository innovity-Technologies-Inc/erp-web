import React, { useState, useEffect, useMemo } from 'react'
import {
  Boxes,
  Building2,
  MapPin,
  Grid,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { useCreatePickList } from '../../hooks/useWarehouseTransfers'
import { useWarehouseZones } from '../../hooks/useWarehouseZones'
import { useWarehouseRackBins } from '../../hooks/useWarehouseRackBins'
import type { WarehouseTransferDetail } from '../../api/warehouseTransfer.api'
import type { WarehouseZone } from '../../api/warehouseZone.api'
import type { WarehouseRackBin } from '../../api/warehouseRackBin.api'

interface GeneratePickListModalProps {
  isOpen: boolean
  onClose: () => void
  transfer: WarehouseTransferDetail | null
  onSuccess?: () => void
}

interface PickItemAllocationState {
  item_id: number
  product_id: number
  batch_master_id?: number | null
  quantity_requested: number
  zone_id: number | ''
  rack_bin_id: number | ''
}

export const GeneratePickListModal: React.FC<GeneratePickListModalProps> = ({
  isOpen,
  onClose,
  transfer,
  onSuccess,
}) => {
  const createPickListMutation = useCreatePickList()

  const sourceWarehouseId = transfer?.from_warehouse_id || transfer?.from_warehouse?.id || null

  // Fetch Master Data for the source warehouse
  const { data: zonesData } = useWarehouseZones(
    sourceWarehouseId ? { warehouse_id: sourceWarehouseId, per_page: 200 } : undefined
  )
  const { data: rackBinsData } = useWarehouseRackBins(
    sourceWarehouseId ? { warehouse_id: sourceWarehouseId, per_page: 500 } : undefined
  )

  // Normalize list data
  const zonesList: WarehouseZone[] = useMemo(() => {
    const raw = zonesData as any
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.response?.data)) return raw.response.data
    if (Array.isArray(raw?.response)) return raw.response
    return []
  }, [zonesData])

  const rackBinsList: WarehouseRackBin[] = useMemo(() => {
    const raw = rackBinsData as any
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.response?.data)) return raw.response.data
    if (Array.isArray(raw?.response)) return raw.response
    return []
  }, [rackBinsData])

  // State per line item
  const [allocations, setAllocations] = useState<Record<number, PickItemAllocationState>>({})

  // Bulk placement state
  const [bulkZoneId, setBulkZoneId] = useState<number | ''>('')
  const [bulkRackBinId, setBulkRackBinId] = useState<number | ''>('')

  // Initialize allocations whenever modal opens or transfer changes
  useEffect(() => {
    if (transfer && transfer.items) {
      const initial: Record<number, PickItemAllocationState> = {}
      transfer.items.forEach((it) => {
        const itemZoneId = it.rack_bin?.zone?.id || (it as any).rackBin?.zone?.id || ''
        const itemRackBinId = it.rack_bin_id || it.rack_bin?.id || (it as any).rackBin?.id || ''

        initial[it.id] = {
          item_id: it.id,
          product_id: it.product_id,
          batch_master_id: it.batch_master_id || null,
          quantity_requested: Number(it.quantity) || 0,
          zone_id: itemZoneId ? Number(itemZoneId) : '',
          rack_bin_id: itemRackBinId ? Number(itemRackBinId) : '',
        }
      })
      setAllocations(initial)
    }
  }, [transfer, isOpen])

  if (!isOpen || !transfer) return null

  const items = transfer.items || []
  const totalQty = items.reduce((sum, it) => sum + (parseFloat(String(it.quantity)) || 0), 0)

  // Filtered rack bins for bulk selection
  const bulkAvailableBins = bulkZoneId
    ? rackBinsList.filter((rb) => Number(rb.zone_id) === Number(bulkZoneId))
    : rackBinsList

  const formatRackBinLabel = (rb: WarehouseRackBin) => {
    const parts: string[] = []
    if (rb.zone?.zone_name && !bulkZoneId) {
      parts.push(rb.zone.zone_name)
    }
    if (rb.aisle && rb.aisle !== '0') {
      parts.push(`Aisle ${rb.aisle}`)
    }
    if (rb.rack) {
      parts.push(`Rack ${rb.rack}`)
    }
    if (rb.shelf && rb.shelf !== '0') {
      parts.push(`Shelf ${rb.shelf}`)
    }
    if (rb.bin) {
      parts.push(`Bin ${rb.bin}`)
    }

    const description = parts.join(' › ')
    return description || rb.barcode_value || `Location #${rb.id}`
  }

  const handleZoneChange = (itemId: number, zoneIdStr: string) => {
    const zoneId = zoneIdStr ? Number(zoneIdStr) : ''
    setAllocations((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        zone_id: zoneId,
        rack_bin_id: '', // reset rack bin when zone changes
      },
    }))
  }

  const handleRackBinChange = (itemId: number, rackBinIdStr: string) => {
    const rackBinId = rackBinIdStr ? Number(rackBinIdStr) : ''
    const matchedRb = rackBinsList.find((r) => Number(r.id) === rackBinId)

    setAllocations((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        zone_id: matchedRb?.zone_id || prev[itemId].zone_id,
        rack_bin_id: rackBinId,
      },
    }))
  }

  const handleApplyBulk = () => {
    if (!bulkZoneId && !bulkRackBinId) return

    setAllocations((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((k) => {
        const id = Number(k)
        updated[id] = {
          ...updated[id],
          zone_id: bulkZoneId || updated[id].zone_id,
          rack_bin_id: bulkRackBinId || updated[id].rack_bin_id,
        }
      })
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payloadItems = Object.values(allocations).map((a) => ({
      product_id: a.product_id,
      batch_master_id: a.batch_master_id || null,
      rack_bin_id: a.rack_bin_id ? Number(a.rack_bin_id) : null,
      quantity_requested: a.quantity_requested,
    }))

    createPickListMutation.mutate(
      {
        transferId: transfer.id,
        payload: {
          items: payloadItems,
        },
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess()
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 font-poppins">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 border border-indigo-100">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">
                  Generate Pick List & Shelf Allocation
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  {transfer.transfer_no}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Review suggested pick quantities and choose the specific physical shelf/bin for floor pickers.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Context Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Source Warehouse (Origin)
              </span>
              <span className="font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{transfer.from_warehouse?.name || 'Source Warehouse'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Destination Warehouse
              </span>
              <span className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="truncate">{transfer.to_warehouse?.name || 'Destination'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Line Items
              </span>
              <span className="font-semibold text-gray-800 font-mono mt-0.5 block">
                {items.length} material(s)
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Total Pick Quantity
              </span>
              <span className="font-bold text-indigo-600 font-mono mt-0.5 block text-[13px]">
                {totalQty.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick Bulk Placement Bar */}
          {items.length > 1 && zonesList.length > 0 && (
            <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">Quick Bulk Placement:</span>
                <span className="text-gray-500 text-[11.5px]">
                  Apply the same Zone & Rack/Bin to all materials
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                <div className="sm:col-span-5">
                  <select
                    value={bulkZoneId}
                    onChange={(e) => {
                      const zId = e.target.value ? Number(e.target.value) : ''
                      setBulkZoneId(zId)
                      setBulkRackBinId('')
                    }}
                    className="w-full h-8.5 px-2.5 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:border-indigo-500 text-gray-800 font-medium"
                  >
                    <option value="">-- All Master Zones --</option>
                    {zonesList.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zone_name} ({z.zone_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <select
                    value={bulkRackBinId}
                    onChange={(e) => {
                      const rbId = e.target.value ? Number(e.target.value) : ''
                      setBulkRackBinId(rbId)
                      if (rbId) {
                        const matched = rackBinsList.find((r) => Number(r.id) === rbId)
                        if (matched && matched.zone_id) {
                          setBulkZoneId(matched.zone_id)
                        }
                      }
                    }}
                    className="w-full h-8.5 px-2.5 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:border-indigo-500 text-gray-800 font-medium"
                  >
                    <option value="">-- Select Master Rack / Bin --</option>
                    {bulkAvailableBins.map((rb) => (
                      <option key={rb.id} value={rb.id}>
                        {formatRackBinLabel(rb)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleApplyBulk}
                    disabled={!bulkZoneId && !bulkRackBinId}
                    className="w-full h-8.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition text-xs cursor-pointer shadow-2xs flex items-center justify-center"
                  >
                    Apply All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Allocation Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-gray-500" />
                <span>Pick Allocation per Material</span>
              </label>
              <span className="text-[11px] text-gray-400">
                Floor pickers will follow the assigned Rack / Bin coordinates
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#dae8ff]/60 text-gray-700 text-[11px] font-bold border-b border-gray-200">
                    <th className="py-2.5 px-3.5 w-10 text-center">SL</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Product / Material</th>
                    <th className="py-2.5 px-3 w-28">Batch / Lot</th>
                    <th className="py-2.5 px-3 text-right w-24">Pick Qty</th>
                    <th className="py-2.5 px-3 text-left w-48">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span>Source Zone</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-left min-w-[220px]">
                      <div className="flex items-center gap-1">
                        <Grid className="w-3.5 h-3.5 text-gray-500" />
                        <span>Source Rack / Bin</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {items.map((item, idx) => {
                    const alloc = allocations[item.id]
                    const resolvedName =
                      item.product?.product_name || `Product #${item.product_id}`
                    const batchNo = item.batch_master?.batch_no || '—'

                    // Available rack bins for item selected zone
                    const itemAvailableBins = alloc?.zone_id
                      ? rackBinsList.filter((rb) => Number(rb.zone_id) === Number(alloc.zone_id))
                      : rackBinsList

                    return (
                      <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 px-3.5 text-gray-400 font-medium text-center">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-gray-900 leading-tight">
                            {resolvedName}
                          </div>
                          {item.product?.product_model && (
                            <div className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                              Model: {item.product.product_model}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {batchNo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-[13px]">
                          {Number(item.quantity).toFixed(2)}
                        </td>

                        {/* Zone Dropdown */}
                        <td className="py-2.5 px-3">
                          {zonesList.length > 0 ? (
                            <select
                              value={alloc?.zone_id || ''}
                              onChange={(e) => handleZoneChange(item.id, e.target.value)}
                              className="w-full h-8.5 px-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none font-medium truncate"
                            >
                              <option value="">General (All Zones)</option>
                              {zonesList.map((z) => (
                                <option key={z.id} value={z.id}>
                                  {z.zone_name} ({z.zone_code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">
                              General Warehouse Floor
                            </span>
                          )}
                        </td>

                        {/* Rack / Bin Dropdown */}
                        <td className="py-2.5 px-3">
                          {rackBinsList.length > 0 ? (
                            <select
                              value={alloc?.rack_bin_id || ''}
                              onChange={(e) => handleRackBinChange(item.id, e.target.value)}
                              className="w-full h-8.5 px-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none font-medium truncate"
                            >
                              <option value="">General Storage Floor</option>
                              {itemAvailableBins.map((rb) => (
                                <option key={rb.id} value={rb.id}>
                                  {formatRackBinLabel(rb)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">
                              No Master Bins Configured
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Information & Confirmation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Pick list with specific shelf allocations will be created for floor pickers.
              </span>
            </div>

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
                disabled={createPickListMutation.isPending}
                className="px-6 h-[38px] text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
              >
                {createPickListMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Boxes className="w-4 h-4" />
                    <span>Generate Pick List</span>
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
