import React, { useState, useEffect, useMemo } from 'react'
import {
  PackageCheck,
  Building2,
  Layers,
  X,
  CheckCircle2,
  Sparkles,
  MapPin,
  Grid,
} from 'lucide-react'
import { usePostGRN } from '../../hooks/useGRN'
import { useWarehouseZones } from '@/modules/inventory/hooks/useWarehouseZones'
import { useWarehouseRackBins } from '@/modules/inventory/hooks/useWarehouseRackBins'
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouse'
import { useUiStore } from '@/store/useUiStore'
import type { GRN } from '../../api/types'
import type { WarehouseZone } from '@/modules/inventory/api/warehouseZone.api'
import type { WarehouseRackBin } from '@/modules/inventory/api/warehouseRackBin.api'

interface GRNPutawayModalProps {
  isOpen: boolean
  onClose: () => void
  grn: GRN
  onSuccess?: () => void
}

interface ItemPutawayState {
  grn_item_id: number
  warehouse_id: number
  zone_id: number | ''
  rack_bin_id: number | ''
  location_aisle: string
  bin_shelf: string
}

export const GRNPutawayModal: React.FC<GRNPutawayModalProps> = ({
  isOpen,
  onClose,
  grn,
  onSuccess,
}) => {
  const { showNotificationModal } = useUiStore()
  const postMutation = usePostGRN()

  // Primary warehouse ID from first item allocation or default 1
  const primaryWarehouseId = useMemo(() => {
    const firstAlloc = grn.items?.[0]?.allocations?.[0]
    return firstAlloc?.warehouse_id || 1
  }, [grn])

  // Fetch Master Data for the specific warehouse
  const { data: zonesData, isLoading: isLoadingZones } = useWarehouseZones({
    warehouse_id: primaryWarehouseId,
    per_page: 200,
  })

  const { data: rackBinsData, isLoading: isLoadingRackBins } = useWarehouseRackBins({
    warehouse_id: primaryWarehouseId,
    per_page: 500,
  })

  const { data: warehousesData } = useWarehouses()

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

  const warehousesList = useMemo(() => {
    const raw = warehousesData as any
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.response?.data)) return raw.response.data
    if (Array.isArray(raw?.response)) return raw.response
    return []
  }, [warehousesData])

  const primaryWarehouseName = useMemo(() => {
    const wh = warehousesList.find((w: any) => Number(w.id) === Number(primaryWarehouseId))
    return wh?.name || wh?.text || `Warehouse #${primaryWarehouseId}`
  }, [warehousesList, primaryWarehouseId])

  // State per line item
  const [putawayItems, setPutawayItems] = useState<Record<number, ItemPutawayState>>({})

  // Bulk placement state
  const [bulkZoneId, setBulkZoneId] = useState<number | ''>('')
  const [bulkRackBinId, setBulkRackBinId] = useState<number | ''>('')

  // Initialize putaway items
  useEffect(() => {
    if (grn && grn.items) {
      const initial: Record<number, ItemPutawayState> = {}
      grn.items.forEach((item) => {
        if (item.id) {
          const existingAlloc = item.allocations?.[0]
          initial[item.id] = {
            grn_item_id: item.id,
            warehouse_id: existingAlloc?.warehouse_id || primaryWarehouseId,
            zone_id: '',
            rack_bin_id: '',
            location_aisle: existingAlloc?.location_aisle || '',
            bin_shelf: existingAlloc?.bin_shelf || '',
          }
        }
      })
      setPutawayItems(initial)
    }
  }, [grn, primaryWarehouseId])

  if (!isOpen) return null

  // Accepted line items only
  const acceptedItems = (grn.items || []).filter((it) => Number(it.accepted_quantity || 0) > 0)
  const totalAcceptedQty = acceptedItems.reduce(
    (sum, it) => sum + Number(it.accepted_quantity || 0),
    0
  )

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

  // Handle Zone Change for single item
  const handleItemZoneChange = (itemId: number, zoneIdStr: string) => {
    const zoneId = zoneIdStr ? Number(zoneIdStr) : ''
    const selectedZone = zonesList.find((z) => Number(z.id) === zoneId)

    setPutawayItems((prev) => {
      const current = prev[itemId]
      return {
        ...prev,
        [itemId]: {
          ...current,
          zone_id: zoneId,
          rack_bin_id: '', // reset bin when zone changes
          location_aisle: selectedZone?.zone_name || (zoneId ? `Zone #${zoneId}` : ''),
          bin_shelf: '',
        },
      }
    })
  }

  // Handle Rack/Bin Change for single item
  const handleItemRackBinChange = (itemId: number, rackBinIdStr: string) => {
    const rackBinId = rackBinIdStr ? Number(rackBinIdStr) : ''
    const matchedRb = rackBinsList.find((rb) => Number(rb.id) === rackBinId)

    setPutawayItems((prev) => {
      const current = prev[itemId]
      if (!matchedRb) {
        return {
          ...prev,
          [itemId]: {
            ...current,
            rack_bin_id: '',
            bin_shelf: '',
          },
        }
      }

      // Compose location text
      const zoneName = matchedRb.zone?.zone_name || current.location_aisle
      const binText = `Rack: ${matchedRb.rack || '—'} / Bin: ${matchedRb.bin || '—'}${
        matchedRb.shelf && matchedRb.shelf !== '0' ? ` (Shelf ${matchedRb.shelf})` : ''
      }`

      return {
        ...prev,
        [itemId]: {
          ...current,
          zone_id: matchedRb.zone_id || current.zone_id,
          rack_bin_id: rackBinId,
          location_aisle: zoneName || '',
          bin_shelf: matchedRb.barcode_value || binText,
        },
      }
    })
  }

  // Handle Free Text changes (fallback)
  const handleItemLocationChange = (
    itemId: number,
    field: 'location_aisle' | 'bin_shelf',
    val: string
  ) => {
    setPutawayItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val,
      },
    }))
  }

  // Handle Bulk Apply
  const handleApplyBulk = () => {
    if (!bulkZoneId && !bulkRackBinId) return

    const selectedZone = zonesList.find((z) => Number(z.id) === Number(bulkZoneId))
    const matchedRb = rackBinsList.find((rb) => Number(rb.id) === Number(bulkRackBinId))

    const zoneName = selectedZone?.zone_name || matchedRb?.zone?.zone_name || ''
    const binText = matchedRb
      ? matchedRb.barcode_value ||
        `Rack: ${matchedRb.rack || '—'} / Bin: ${matchedRb.bin || '—'}${
          matchedRb.shelf && matchedRb.shelf !== '0' ? ` (Shelf ${matchedRb.shelf})` : ''
        }`
      : ''

    setPutawayItems((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((k) => {
        const id = Number(k)
        updated[id] = {
          ...updated[id],
          zone_id: (matchedRb?.zone_id || bulkZoneId || '') as number | '',
          rack_bin_id: bulkRackBinId || '',
          location_aisle: zoneName || updated[id].location_aisle,
          bin_shelf: binText || updated[id].bin_shelf,
        }
      })
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payloadItems = Object.values(putawayItems).map((p) => ({
      grn_item_id: p.grn_item_id,
      warehouse_id: p.warehouse_id,
      rack_bin_id: p.rack_bin_id ? Number(p.rack_bin_id) : null,
      location_aisle: p.location_aisle?.trim() || null,
      bin_shelf: p.bin_shelf?.trim() || null,
    }))

    try {
      await postMutation.mutateAsync({
        uuid: grn.uuid,
        payload: {
          items: payloadItems,
        },
      })

      showNotificationModal(
        'Stock Inwarded Successfully',
        `Goods Receipt Note "${grn.grn_no}" has been posted. Stock has been credited into ${primaryWarehouseName} storage locations.`,
        'success'
      )

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      showNotificationModal(
        'Stock Inwarding Failed',
        err?.response?.data?.message || err.message || 'Failed to post GRN to inventory.',
        'error'
      )
    }
  }

  const hasMasterData = zonesList.length > 0 || rackBinsList.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 font-poppins">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0d7a50] shrink-0 border border-emerald-100/80 shadow-2xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">
                  Warehouse Putaway & Stock Inwarding
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-[#0d7a50] rounded-md border border-emerald-200">
                  {grn.grn_no}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Assign destination Zone, Rack, and Bin coordinates from warehouse master data to officially credit approved stock.
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
          {/* Quick Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Destination Warehouse
              </span>
              <span className="font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                <span className="truncate">{primaryWarehouseName}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Purchase Order
              </span>
              <span className="font-semibold text-gray-800 font-mono mt-0.5 block">
                {grn.purchaseOrder?.po_no || grn.purchase_order?.po_no || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Accepted Line Items
              </span>
              <span className="font-semibold text-gray-800 font-mono mt-0.5 block">
                {acceptedItems.length} item(s)
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Total Inward Qty
              </span>
              <span className="font-bold text-[#0d7a50] font-mono mt-0.5 block text-[13px]">
                {totalAcceptedQty.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Master Data Quick Bulk Assign Bar */}
          {acceptedItems.length > 1 && (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">Quick Bulk Placement:</span>
                  <span className="text-gray-500 text-[11.5px]">
                    Assign same Zone & Rack/Bin to all materials at once
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Bulk Zone */}
                <div className="sm:col-span-5">
                  <select
                    value={bulkZoneId}
                    onChange={(e) => {
                      const zId = e.target.value ? Number(e.target.value) : ''
                      setBulkZoneId(zId)
                      setBulkRackBinId('')
                    }}
                    className="w-full h-8.5 px-2.5 bg-white border border-blue-200 rounded-lg text-xs outline-none focus:border-blue-500 text-gray-800 font-medium"
                  >
                    <option value="">-- Select Master Zone (All) --</option>
                    {zonesList.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.zone_name} ({z.zone_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bulk Rack/Bin */}
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
                    className="w-full h-8.5 px-2.5 bg-white border border-blue-200 rounded-lg text-xs outline-none focus:border-blue-500 text-gray-800 font-medium"
                  >
                    <option value="">-- Select Master Rack / Bin --</option>
                    {bulkAvailableBins.map((rb) => (
                      <option key={rb.id} value={rb.id}>
                        {formatRackBinLabel(rb)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Apply Button */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleApplyBulk}
                    disabled={!bulkZoneId && !bulkRackBinId}
                    className="w-full h-8.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition text-xs cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <span>Apply All</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Putaway Checklist Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-gray-500" />
                <span>Storage Location per Material</span>
              </label>
              <span className="text-[11px] text-gray-400">
                Select Warehouse Zone and specific Rack / Bin grid location
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#dae8ff]/50 text-gray-700 text-[11px] font-bold border-b border-gray-200">
                    <th className="py-2.5 px-3.5 w-10 text-center">SL</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Product / Material</th>
                    <th className="py-2.5 px-2 text-center w-16">Unit</th>
                    <th className="py-2.5 px-3 text-right w-20">Inward Qty</th>
                    <th className="py-2.5 px-3 text-left w-24">Batch / Lot</th>
                    <th className="py-2.5 px-3 text-left w-48">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span>Warehouse Zone</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-left min-w-[220px]">
                      <div className="flex items-center gap-1">
                        <Grid className="w-3.5 h-3.5 text-gray-500" />
                        <span>Rack / Shelf / Bin</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {acceptedItems.map((item, idx) => {
                    const putaway = item.id ? putawayItems[item.id] : undefined
                    const batch = item.batches?.[0]
                    const resolvedName =
                      item.product?.name ||
                      item.poItem?.product?.name ||
                      `Product #${item.product_id}`

                    // Available rack bins for this specific item's selected zone
                    const itemAvailableBins = putaway?.zone_id
                      ? rackBinsList.filter(
                          (rb) => Number(rb.zone_id) === Number(putaway.zone_id)
                        )
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
                          {(item.product?.code || item.poItem?.product?.code) && (
                            <div className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                              SKU: {item.product?.code || item.poItem?.product?.code}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-500 font-medium">
                          {item.unit?.name || 'Units'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0d7a50]">
                          {Number(item.accepted_quantity).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-600 text-[11.5px]">
                          {batch?.batch_no || '—'}
                        </td>

                        {/* Zone Dropdown */}
                        <td className="py-2.5 px-3">
                          {zonesList.length > 0 ? (
                            <select
                              value={putaway?.zone_id || ''}
                              onChange={(e) =>
                                item.id && handleItemZoneChange(item.id, e.target.value)
                              }
                              className="w-full h-8.5 px-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-[#0d7a50] focus:ring-1 focus:ring-[#0d7a50]/20 outline-none font-medium truncate"
                            >
                              <option value="">General (No Zone)</option>
                              {zonesList.map((z) => (
                                <option key={z.id} value={z.id}>
                                  {z.zone_name} ({z.zone_code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={putaway?.location_aisle || ''}
                              onChange={(e) =>
                                item.id &&
                                handleItemLocationChange(
                                  item.id,
                                  'location_aisle',
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Zone A"
                              className="w-full h-8.5 px-2.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-[#0d7a50] focus:ring-1 focus:ring-[#0d7a50]/20 outline-none"
                            />
                          )}
                        </td>

                        {/* Rack / Bin Dropdown */}
                        <td className="py-2.5 px-3">
                          {rackBinsList.length > 0 ? (
                            <select
                              value={putaway?.rack_bin_id || ''}
                              onChange={(e) =>
                                item.id && handleItemRackBinChange(item.id, e.target.value)
                              }
                              className="w-full h-8.5 px-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-[#0d7a50] focus:ring-1 focus:ring-[#0d7a50]/20 outline-none font-medium truncate"
                            >
                              <option value="">General Receiving Floor</option>
                              {itemAvailableBins.map((rb) => (
                                <option key={rb.id} value={rb.id}>
                                  {formatRackBinLabel(rb)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={putaway?.bin_shelf || ''}
                              onChange={(e) =>
                                item.id &&
                                handleItemLocationChange(
                                  item.id,
                                  'bin_shelf',
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Rack 01 / Bin 04"
                              className="w-full h-8.5 px-2.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-[#0d7a50] focus:ring-1 focus:ring-[#0d7a50]/20 outline-none font-mono"
                            />
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Stock will be officially credited and made available for production & sales.
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
                disabled={postMutation.isPending}
                className="px-6 h-[38px] text-xs font-bold text-white bg-[#0d7a50] hover:bg-[#0a6642] disabled:opacity-50 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
              >
                {postMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    <span>Confirm & Inward Stock</span>
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

