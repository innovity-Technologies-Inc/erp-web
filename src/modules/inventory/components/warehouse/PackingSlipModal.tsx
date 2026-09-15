import React from 'react'
import {
  X,
  Printer,
  PackageCheck,
  Calendar,
  Building2,
  CheckCircle2,
  FileText,
  User,
  Scale,
  Box,
  Truck
} from 'lucide-react'
import type { WarehousePickListDetail, WarehouseTransferDetail, WarehousePackingSlipDetail } from '../../api/warehouseTransfer.api'
import { formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'

interface PackingSlipModalProps {
  isOpen: boolean
  onClose: () => void
  packingSlip: WarehousePackingSlipDetail | null
  pickList: WarehousePickListDetail | null
  transfer: WarehouseTransferDetail | null
}

export const PackingSlipModal: React.FC<PackingSlipModalProps> = ({
  isOpen,
  onClose,
  packingSlip,
  pickList,
  transfer,
}) => {
  const { webSetting, companyInformation } = useSettings()

  if (!isOpen || !packingSlip) return null

  const handlePrint = () => {
    const printContent = document.getElementById('printable-packslip-content')
    if (!printContent) return

    let iframe = document.getElementById('wms-pack-print-frame') as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'wms-pack-print-frame'
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
          <title>Packing Slip - ${packingSlip.packing_no}</title>
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

  const items = pickList?.items || []
  const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(String(item.quantity_picked || item.quantity_requested)) || 0), 0)

  const logoUrl = webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url || undefined

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col font-poppins">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-gray-900">Warehouse Packing Slip</h3>
                <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {packingSlip.packing_no}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Verified Carton Package for Transfer #{transfer?.transfer_no || '—'}
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
        <div id="printable-packslip-content" className="p-6 overflow-y-auto space-y-6">
          
          {/* Slip Brand & Header */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-5">
            <div>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 object-contain mb-2" />
              ) : (
                <div className="text-primary font-bold text-xl tracking-tight mb-1">
                  {webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH ERP'}
                </div>
              )}
              <p className="text-xs text-gray-400 font-medium">Warehouse Management System • Packing Station</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider rounded-md mb-2">
                OFFICIAL PACKING SLIP
              </span>
              <div className="text-xs text-gray-600 space-y-1 font-medium">
                <div><span className="text-gray-400">Slip No:</span> <strong className="font-mono text-gray-900">{packingSlip.packing_no}</strong></div>
                <div><span className="text-gray-400">Pick List Ref:</span> <strong className="font-mono text-gray-800">{pickList?.pick_no || '—'}</strong></div>
                <div><span className="text-gray-400">Date:</span> <strong className="text-gray-800">{formatDate(packingSlip.created_at || new Date().toISOString())}</strong></div>
              </div>
            </div>
          </div>

          {/* Package Dimension & Weight Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-400 font-medium block">Transfer Ref:</span>
              <span className="font-bold text-gray-900 font-mono">{transfer?.transfer_no || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Origin Warehouse:</span>
              <span className="font-bold text-gray-800">{transfer?.from_warehouse?.name || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block flex items-center gap-1">
                <Scale className="w-3 h-3 text-emerald-600" /> Gross Weight:
              </span>
              <span className="font-bold text-emerald-700">
                {packingSlip.gross_weight ? `${packingSlip.gross_weight} kg` : 'Not recorded'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block flex items-center gap-1">
                <Box className="w-3 h-3 text-indigo-600" /> Dimensions:
              </span>
              <span className="font-bold text-indigo-700">
                {packingSlip.box_dimensions || 'Standard Carton'}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#dae8ff] text-[11px] font-bold text-[#003671] uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-center w-10">#</th>
                  <th className="px-4 py-2.5">Product Description</th>
                  <th className="px-4 py-2.5">Batch / Expiry</th>
                  <th className="px-4 py-2.5">Picked Location</th>
                  <th className="px-4 py-2.5 text-right">Packed Qty</th>
                  <th className="px-4 py-2.5 text-center w-24">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[12px]">
                {items.map((item, idx) => {
                  const qty = parseFloat(String(item.quantity_picked || item.quantity_requested)) || 0
                  const zone = item.rack_bin?.zone?.zone_name || 'Zone'
                  const bin = item.rack_bin?.bin || item.rack_bin?.rack || 'Bin'

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">
                        <div>{item.product?.product_name || `Product #${item.product_id}`}</div>
                        {item.product?.product_model && (
                          <div className="text-[10px] text-gray-400 font-normal">Model: {item.product.product_model}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-gray-700">
                        {item.batch_master?.batch_no || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {zone} / {bin}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                        {qty.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-gray-900 border-t border-gray-200">
                  <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider text-gray-500 text-[11px]">
                    Total Packed Items:
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-800 text-sm">
                    {totalQuantity.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures for Floor Handover */}
          <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-dashed border-gray-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-bold text-gray-800">Packed & Verified By</p>
              <p className="text-[10px] text-gray-400">Packing Station Operator</p>
            </div>
            <div>
              <div className="border-t border-dashed border-gray-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-bold text-gray-800">Loaded & Handed Over By</p>
              <p className="text-[10px] text-gray-400">Dispatch Supervisor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
