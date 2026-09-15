import React from 'react'
import {
  X,
  Printer,
  Boxes,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react'
import type { WarehousePickListDetail, WarehouseTransferDetail } from '../../api/warehouseTransfer.api'
import { formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'

interface PickListModalProps {
  isOpen: boolean
  onClose: () => void
  pickList: WarehousePickListDetail | null
  transfer: WarehouseTransferDetail | null
}

export const PickListModal: React.FC<PickListModalProps> = ({
  isOpen,
  onClose,
  pickList,
  transfer,
}) => {
  const { webSetting, companyInformation } = useSettings()

  if (!isOpen || !pickList) return null

  const handlePrint = () => {
    const printContent = document.getElementById('printable-picklist-content')
    if (!printContent) return

    let iframe = document.getElementById('wms-print-frame') as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'wms-print-frame'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
    }

    const doc = iframe.contentWindow?.document
    if (!doc) return

    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n')

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Picking Slip - ${pickList.pick_no}</title>
          ${styleTags}
          <style>
            @page { size: portrait; margin: 10mm; }
            body { 
              background-color: white !important; 
              padding: 10px !important; 
              margin: 0 !important;
              font-family: 'Poppins', sans-serif !important; 
              color: #334155 !important;
            }
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
          </style>
        </head>
        <body>
          <div class="p-2 space-y-5">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    }, 300)
  }

  const items = pickList.items || []
  const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(String(item.quantity_requested)) || 0), 0)

  const logoUrl = webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url || undefined

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col font-poppins">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-gray-900">Warehouse Picking Slip</h3>
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                  {pickList.pick_no}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Route & batch allocations for Transfer #{transfer?.transfer_no || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Content Area */}
        <div id="printable-picklist-content" className="p-6 overflow-y-auto space-y-6">
          
          {/* Slip Brand & Order Header */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-5">
            <div>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 object-contain mb-2" />
              ) : (
                <div className="text-primary font-bold text-xl tracking-tight mb-1">
                  {webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH ERP'}
                </div>
              )}
              <p className="text-xs text-gray-400 font-medium">Warehouse Management System • Shelf Picking Slip</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md uppercase tracking-wider mb-1.5 border border-indigo-200/60">
                OFFICIAL PICKING SLIP
              </span>
              <div className="font-mono text-sm font-bold text-gray-900">{pickList.pick_no}</div>
              <div className="text-xs text-gray-500 mt-1">
                Generated: {formatDate(pickList.created_at || new Date().toISOString())}
              </div>
            </div>
          </div>

          {/* Transfer & Warehouse Meta */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-gray-200/80 text-xs">
            <div>
              <span className="text-gray-400 font-medium block mb-1">Source Warehouse (Pick Origin):</span>
              <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span>{transfer?.from_warehouse?.name || 'Source Warehouse'}</span>
              </div>
              <div className="text-gray-500 mt-0.5 font-mono">
                Code: {transfer?.from_warehouse?.warehouse_code || '—'}
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-medium block mb-1">Destination Target:</span>
              <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{transfer?.to_warehouse?.name || 'Destination Warehouse'}</span>
              </div>
              <div className="text-gray-500 mt-0.5">
                Transfer Ref: <span className="font-mono font-bold text-primary">{transfer?.transfer_no || '—'}</span>
              </div>
            </div>
          </div>

          {/* Pick Items & Suggested Locations Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Shelf Locations & Batch Picking Path</span>
              </h4>
              <span className="text-xs text-gray-400 font-mono font-semibold">
                {items.length} Allocations
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#dae8ff] text-[11px] font-bold text-[#003671] uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-center w-10">#</th>
                    <th className="px-3 py-2.5">Shelf Location (Zone ➔ Bin)</th>
                    <th className="px-3 py-2.5">Product Details</th>
                    <th className="px-3 py-2.5">Batch / Expiry</th>
                    <th className="px-3 py-2.5 text-right">Pick Qty</th>
                    <th className="px-3 py-2.5 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                        No pick items allocated.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const qty = parseFloat(String(item.quantity_requested)) || 0
                      const hasRackBin = !!(item.rack_bin?.zone?.zone_name || item.rack_bin?.bin || item.rack_bin?.rack || item.rack_bin?.aisle)
                      const zone = item.rack_bin?.zone?.zone_name || transfer?.from_warehouse?.name || 'Source Warehouse'
                      const bin = item.rack_bin?.bin
                        ? `Bin ${item.rack_bin.bin}`
                        : item.rack_bin?.rack
                        ? `Rack ${item.rack_bin.rack}`
                        : 'General Storage Floor'
                      const aisle = item.rack_bin?.aisle && item.rack_bin.aisle !== '0' ? `Aisle ${item.rack_bin.aisle}` : ''
                      const rack = item.rack_bin?.rack ? `Rack ${item.rack_bin.rack}` : ''

                      return (
                        <tr key={item.id || idx} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 text-center font-bold text-gray-400">{idx + 1}</td>
                          
                          {/* Location with High-Visibility Badge */}
                          <td className="px-3 py-2.5">
                            {hasRackBin ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg font-bold text-[11px]">
                                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{zone} ➔ {bin}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium text-[11px]">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{zone} ➔ General Floor</span>
                              </div>
                            )}
                            {(aisle || rack) && (
                              <div className="text-[10px] text-gray-400 font-medium mt-0.5 pl-1">
                                {[aisle, rack].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>

                          {/* Product Details */}
                          <td className="px-3 py-2.5 font-semibold text-gray-900">
                            <div>{item.product?.product_name || `Product #${item.product_id}`}</div>
                            {item.product?.product_model && (
                              <div className="text-[10px] text-gray-400 font-normal">Model: {item.product.product_model}</div>
                            )}
                          </td>

                          {/* Batch & Expiry */}
                          <td className="px-3 py-2.5">
                            <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                              {item.batch_master?.batch_no || '—'}
                            </span>
                            {item.batch_master?.expiry_date && (
                              <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                                Exp: {formatDate(item.batch_master.expiry_date)}
                              </div>
                            )}
                          </td>

                          {/* Requested Quantity */}
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700 text-sm">
                            {qty.toFixed(2)}
                          </td>

                          {/* Status Badge */}
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Allocated
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-gray-800 border-t border-gray-200">
                    <td colSpan={4} className="px-3 py-2.5 text-right text-xs uppercase tracking-wider text-gray-500">
                      Total Units to Pick:
                    </td>
                    <td className="px-3 py-2.5 text-right text-blue-800 font-mono font-bold text-sm">
                      {totalQuantity.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Physical Signatures Block for Floor Pickers */}
          <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-8">
            <div className="text-center pt-6">
              <div className="border-t border-dashed border-gray-400 w-3/4 mx-auto mb-1"></div>
              <p className="text-xs font-bold text-gray-800">Picked By (Warehouse Staff)</p>
              <p className="text-[10px] text-gray-400">Signature & Date</p>
            </div>

            <div className="text-center pt-6">
              <div className="border-t border-dashed border-gray-400 w-3/4 mx-auto mb-1"></div>
              <p className="text-xs font-bold text-gray-800">Verified By (Packing Supervisor)</p>
              <p className="text-[10px] text-gray-400">Signature & Stamp</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
