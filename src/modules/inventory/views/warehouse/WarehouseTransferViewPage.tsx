import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from '@tanstack/react-router'
import { 
  ArrowLeft, 
  Printer, 
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  Package, 
  Truck, 
  PackageCheck, 
  Ban, 
  MapPin, 
  CheckCircle2, 
  Globe,
  Layers,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Check,
  X,
  Boxes,
  Scale,
  Box,
  ChevronRight,
  Send,
  AlertTriangle
} from 'lucide-react'
import { 
  useWarehouseTransfer, 
  useCancelWarehouseTransfer,
  useCreatePickList
} from '../../hooks/useWarehouseTransfers'
import { usePermissions } from '@/hooks/usePermissions'
import { useSettings } from '@/hooks/useSettings'
import { ReceiveTransferModal } from '../../components/warehouse/ReceiveTransferModal'
import { PickListModal } from '../../components/warehouse/PickListModal'
import { GeneratePickListModal } from '../../components/warehouse/GeneratePickListModal'
import { PackingSlipModal } from '../../components/warehouse/PackingSlipModal'
import { PackTransferModal } from '../../components/warehouse/PackTransferModal'
import { DispatchTransferModal } from '../../components/warehouse/DispatchTransferModal'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { LoadingState } from '@/components/Loading/LoadingState'
import { formatDate } from '@/utils/formatters'
import { clsx } from 'clsx'

export const WarehouseTransferViewPage = () => {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/_authenticated/inventory/warehouse/stock-movement/view/$id' })
  const { companyInformation, webSetting } = useSettings()
  const { hasAnyPermission } = usePermissions()

  const canPick = hasAnyPermission(['pick_warehouse_transfer', 'edit_warehouse', 'manage_warehouse'])
  const canPack = hasAnyPermission(['pack_warehouse_transfer', 'edit_warehouse', 'manage_warehouse'])
  const canDispatch = hasAnyPermission(['dispatch_warehouse_transfer', 'edit_warehouse', 'manage_warehouse'])
  const canReceive = hasAnyPermission(['receive_warehouse_transfer', 'edit_warehouse', 'manage_warehouse'])
  const canCancel = hasAnyPermission(['cancel_warehouse_transfer', 'edit_warehouse', 'manage_warehouse'])

  const transferId = id ? parseInt(id as string, 10) : null
  const { data: transfer, isLoading, refetch } = useWarehouseTransfer(transferId)
  const { mutate: cancelTransfer, isPending: isCancelling } = useCancelWarehouseTransfer()
  const { mutate: createPickList, isPending: isGeneratingPickList } = useCreatePickList()

  // Resolved user names
  const creatorName = transfer?.creator?.name || 
    (transfer?.creator?.first_name ? `${transfer.creator.first_name} ${transfer.creator.last_name || ''}`.trim() : '') ||
    transfer?.creator_name || 
    'Warehouse Staff'

  const receiverName = transfer?.receiver?.name || 
    (transfer?.receiver?.first_name ? `${transfer.receiver.first_name} ${transfer.receiver.last_name || ''}`.trim() : '') ||
    'Store In-charge'

  // Modals state
  const [isPickGenerateModalOpen, setIsPickGenerateModalOpen] = useState(false)
  const [isPickModalOpen, setIsPickModalOpen] = useState(false)
  const [isPackModalOpen, setIsPackModalOpen] = useState(false)
  const [isPackingSlipModalOpen, setIsPackingSlipModalOpen] = useState(false)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  const items = useMemo(() => transfer?.items || [], [transfer])

  const totalRequested = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseFloat(String(item.quantity)) || 0), 0)
  }, [items])

  const totalReceived = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseFloat(String(item.received_quantity)) || 0), 0)
  }, [items])

  const latestPickList = useMemo(() => {
    return transfer?.pick_lists && transfer.pick_lists.length > 0 ? transfer.pick_lists[0] : null
  }, [transfer])

  const latestPackingSlip = useMemo(() => {
    return latestPickList?.packing_slips && latestPickList.packing_slips.length > 0
      ? latestPickList.packing_slips[0]
      : null
  }, [latestPickList])

  // Determine current active workflow stage (1 to 5)
  const currentStage = useMemo(() => {
    if (transfer?.status === 'cancelled') return 0
    if (transfer?.status === 'received') return 5
    if (transfer?.status === 'dispatched') return 4
    if (latestPackingSlip) return 3
    if (latestPickList) return 2
    return 1
  }, [transfer, latestPickList, latestPackingSlip])

  const handlePrint = () => {
    window.print()
  }

  const handleConfirmCancel = () => {
    if (transferId) {
      cancelTransfer(transferId, {
        onSuccess: () => setIsCancelConfirmOpen(false),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <LoadingState message="Loading transfer details..." />
      </div>
    )
  }

  if (!transfer || !transfer.id) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">Transfer Not Found</h2>
          <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">
            The requested warehouse transfer could not be found or has been removed from the system.
          </p>
          <button 
            onClick={() => navigate({ to: '/inventory/warehouse/stock-movement' })}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Return to Transfer List
          </button>
        </div>
      </div>
    )
  }

  const logoUrl = webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url || undefined

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0 text-[#475569]">
      
      {/* Top Header Controls (Hidden on Print) */}
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-6 print:hidden gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/warehouse/stock-movement"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Transfer Order Details</h1>
            {transfer.transfer_no && (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {transfer.transfer_no}
              </span>
            )}
          </div>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Print Order Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Order</span>
          </button>

          {/* Cancel Transfer (Only if pending & permitted) */}
          {transfer.status === 'pending' && canCancel && (
            <button
              type="button"
              onClick={() => setIsCancelConfirmOpen(true)}
              className="px-4 py-2 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              <span>Cancel Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container: Left Document + Right Vertical WMS Workflow Pipeline */}
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-5 items-start pb-12 print:block print:p-0 print:m-0">
        
        {/* Left Column: Pristine Transfer Document */}
        <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:m-0 print:max-w-none">
          
          {/* Document Header Section */}
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 print:flex-row print:items-center print:p-4 border-b border-gray-100">
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 object-contain print:h-10"
                />
              ) : (
                <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight print:text-xl">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white print:w-8 print:h-8">
                    <Globe className="w-6 h-6 print:w-5 print:h-5" />
                  </div>
                  {webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH ERP'}
                </div>
              )}
            </div>

            <div className="text-right">
              <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2 print:text-[18px] print:mb-1">
                Transfer Order #{transfer.transfer_no}
              </h2>
              <div className="flex items-center justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-3 flex-wrap sm:flex-nowrap print:flex-nowrap">
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <User className="w-4 h-4 text-primary print:w-3.5 print:h-3.5 shrink-0" />
                  <span>Created By: <strong className="text-gray-800 font-semibold">{creatorName}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5 shrink-0" />
                  <span>Transfer Date: {formatDate(transfer.transfer_date)}</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <Clock className="w-4 h-4 text-primary print:w-3.5 print:h-3.5 shrink-0" />
                  <span>Time: {new Date(transfer.created_at || new Date()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Info Cards (Origin & Destination Warehouse) */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 p-6 pb-4 print:p-4 print:gap-4 border-b border-gray-100">
            
            {/* Origin Warehouse */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#1e4ba1] text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Dispatch From (Source Warehouse)
                </span>
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e4ba1] print:p-1.5">
                  <Building2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-3 print:text-[16px] print:mb-2">
                {transfer.from_warehouse?.name || 'Source Warehouse'}
              </h3>

              <div className="space-y-2 print:space-y-1 text-[13px] text-gray-500 font-medium">
                <div className="flex items-center gap-3 print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Warehouse Code:</span>
                  <span className="font-mono text-gray-900 font-semibold">{transfer.from_warehouse?.warehouse_code || '—'}</span>
                </div>
                <div className="flex items-center gap-3 print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Movement Type:</span>
                  <span className="text-gray-800 font-medium">Inter-Warehouse Transfer</span>
                </div>
              </div>
            </div>

            {/* Destination Warehouse */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Receive At (Destination Warehouse)
                </span>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700 print:p-1.5">
                  <ShieldCheck className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-3 print:text-[16px] print:mb-2">
                {transfer.to_warehouse?.name || 'Destination Warehouse'}
              </h3>

              <div className="space-y-2 print:space-y-1 text-[13px] text-gray-500 font-medium">
                <div className="flex items-center gap-3 print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Warehouse Code:</span>
                  <span className="font-mono text-gray-900 font-semibold">{transfer.to_warehouse?.warehouse_code || '—'}</span>
                </div>
                <div className="flex items-center gap-3 print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Target Location:</span>
                  <span className="text-gray-800 font-medium">Designated Putaway Bin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table Section */}
          <div className="p-6 pb-4 print:p-4 print:pb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span>Transferred Products & Allocations ({items.length})</span>
              </h4>
              {latestPickList && (
                <span className="font-mono text-xs font-semibold text-gray-500">
                  Pick List: <strong className="text-indigo-700">{latestPickList.pick_no}</strong>
                </span>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs print:border-gray-300 print:rounded-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#dae8ff] text-[12px] font-bold text-[#003671] uppercase tracking-wider print:bg-[#dae8ff] print:text-[#003671] print:text-[10px]">
                    <th className="px-4 py-3 text-center w-12 print:px-2 print:py-1.5">#</th>
                    <th className="px-4 py-3 print:px-2 print:py-1.5">Product Description</th>
                    <th className="px-4 py-3 print:px-2 print:py-1.5">Batch Number</th>
                    <th className="px-4 py-3 print:px-2 print:py-1.5">Source Bin</th>
                    <th className="px-4 py-3 print:px-2 print:py-1.5">Destination Bin</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap print:px-2 print:py-1.5">Requested Qty</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap print:px-2 print:py-1.5">Received Qty</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap print:px-2 print:py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px] print:divide-gray-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-400 font-medium">
                        No line items found in this transfer record.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const reqQty = parseFloat(String(item.quantity)) || 0
                      const recQty = parseFloat(String(item.received_quantity)) || 0
                      const isFullyReceived = recQty >= reqQty && reqQty > 0

                      return (
                        <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors print:bg-white">
                          <td className="px-4 py-3 text-center font-bold text-gray-400 print:px-2 print:py-1.5">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 print:px-2 print:py-1.5">
                            <div>{item.product?.product_name || `Product #${item.product_id}`}</div>
                            {item.product?.product_model && (
                              <div className="text-[11px] text-gray-400 font-normal print:text-[9px]">Model: {item.product.product_model}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap print:px-2 print:py-1.5">
                            <span className="font-mono text-xs font-semibold bg-gray-100 px-2.5 py-1 rounded text-gray-700 print:bg-gray-50 print:text-[10px]">
                              {item.batch_master?.batch_no || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 print:px-2 print:py-1.5 print:text-[10px]">
                            {item.rack_bin ? (
                              <span>{item.rack_bin.zone?.zone_name || 'Zone'} / {item.rack_bin.bin || item.rack_bin.rack || 'Bin'}</span>
                            ) : (
                              <span className="text-gray-400">Default Bin</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 print:px-2 print:py-1.5 print:text-[10px]">
                            {item.to_rack_bin ? (
                              <span className="text-emerald-700 font-medium">{item.to_rack_bin.zone?.zone_name || 'Zone'} / {item.to_rack_bin.bin || item.to_rack_bin.rack}</span>
                            ) : (
                              <span className="text-gray-400 italic">Pending Putaway</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800 whitespace-nowrap print:px-2 print:py-1.5">
                            {reqQty.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap print:px-2 print:py-1.5">
                            {recQty.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap print:px-2 print:py-1.5">
                            {transfer.status === 'received' || isFullyReceived ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 print:hidden shrink-0" /> Received
                              </span>
                            ) : transfer.status === 'dispatched' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                <Truck className="w-3.5 h-3.5 print:hidden shrink-0" /> In Transit
                              </span>
                            ) : latestPackingSlip ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 print:hidden shrink-0" /> Verified
                              </span>
                            ) : latestPickList ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                <Boxes className="w-3.5 h-3.5 print:hidden shrink-0" /> Picked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                <Clock className="w-3.5 h-3.5 print:hidden shrink-0" /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f8fafc] font-bold text-gray-800 border-t border-gray-200 print:bg-gray-50 print:border-gray-300">
                    <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-500 print:px-2 print:py-1.5 print:text-[10px]">Total Quantities:</td>
                    <td className="px-4 py-3 text-right text-blue-700 font-bold print:px-2 print:py-1.5">{totalRequested.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-bold print:px-2 print:py-1.5">{totalReceived.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Commercial Notes & Remarks */}
          {transfer.remarks && (
            <div className="px-6 pb-6 print:px-4 print:pb-4 print:break-inside-avoid">
              <div className="bg-[#f8fafc] p-4 rounded-xl border border-gray-200 print:bg-white print:border-gray-300 print:p-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 print:text-[10px]">
                  <FileText className="w-4 h-4 text-primary print:hidden" />
                  <span>Transfer Instructions & Remarks</span>
                </h4>
                <p className="text-[13px] text-gray-700 leading-relaxed font-medium print:text-[11px]">
                  {transfer.remarks}
                </p>
              </div>
            </div>
          )}

          {/* Physical Signatures & Approvals (Print Sign-Off) */}
          <div className="p-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-6 print:grid-cols-3 print:pt-6 print:gap-4 print:break-inside-avoid">
            <div className="text-center pt-8 print:pt-4">
              <div className="border-t border-dashed border-gray-400 w-3/4 mx-auto mb-1.5"></div>
              <p className="text-[12px] font-bold text-gray-800 print:text-[11px]">Prepared By</p>
              <p className="text-[10px] text-gray-600 font-semibold print:text-[9px]">{creatorName}</p>
              <p className="text-[9px] text-gray-400 print:text-[8px]">Warehouse Staff / Requestor</p>
            </div>

            <div className="text-center pt-8 print:pt-4">
              <div className="border-t border-dashed border-gray-400 w-3/4 mx-auto mb-1.5"></div>
              <p className="text-[12px] font-bold text-gray-800 print:text-[11px]">Dispatched By</p>
              <p className="text-[10px] text-gray-400 print:text-[9px]">Source Warehouse In-Charge</p>
            </div>

            <div className="text-center pt-8 print:pt-4">
              <div className="border-t border-dashed border-gray-400 w-3/4 mx-auto mb-1.5"></div>
              <p className="text-[12px] font-bold text-gray-800 print:text-[11px]">Received & Verified By</p>
              <p className="text-[10px] text-gray-600 font-semibold print:text-[9px]">{transfer.status === 'received' ? receiverName : '—'}</p>
              <p className="text-[9px] text-gray-400 print:text-[8px]">Destination Warehouse In-Charge</p>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek & Compact WMS Lifecycle Sidebar (Sticky on scroll) */}
        <div className="w-full lg:w-[250px] xl:w-[270px] shrink-0 sticky top-6 print:hidden space-y-3">
          
          {/* Main Card: WMS Workflow Progress & Action Box */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 space-y-3">
            
            {/* Card Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-primary/10 text-primary rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">WMS Lifecycle</h3>
                  <p className="text-[9px] text-gray-400">Transfer Stages</p>
                </div>
              </div>

              <span className={clsx(
                'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border',
                transfer.status === 'received' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                transfer.status === 'dispatched' ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse' :
                latestPackingSlip ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                latestPickList ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                transfer.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                'bg-amber-50 text-amber-800 border-amber-200'
              )}>
                {transfer.status === 'received' ? 'Completed' :
                 transfer.status === 'dispatched' ? 'In Transit' :
                 latestPackingSlip ? 'Packed' :
                 latestPickList ? 'Pick Ready' :
                 transfer.status === 'cancelled' ? 'Cancelled' :
                 'Pending Pick'}
              </span>
            </div>

            {/* Next Action Context Card */}
            {transfer.status !== 'cancelled' && transfer.status !== 'received' && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                      Required Action:
                    </span>
                    <p className="text-[11px] font-bold text-gray-900 mt-0.5">
                      {currentStage === 1 && 'Generate Pick List'}
                      {currentStage === 2 && 'Floor Pick & Verify'}
                      {currentStage === 3 && 'Dispatch Vehicle'}
                      {currentStage === 4 && 'Destination Putaway'}
                    </p>
                  </div>
                </div>

                {/* Primary Trigger Buttons */}
                <div className="pt-1.5 border-t border-slate-200/80 flex flex-col gap-1.5">
                  {/* Stage 1: Generate Pick List */}
                  {currentStage === 1 && canPick && (
                    <button
                      type="button"
                      onClick={() => setIsPickGenerateModalOpen(true)}
                      disabled={isGeneratingPickList}
                      className="w-full py-1.5 bg-primary hover:bg-primary/90 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Generate Pick List</span>
                    </button>
                  )}

                  {/* Stage 2: Picked -> Pack & Verify */}
                  {currentStage === 2 && (
                    <div className={clsx('grid gap-1.5', canPack ? 'grid-cols-2' : 'grid-cols-1')}>
                      <button
                        type="button"
                        onClick={() => setIsPickModalOpen(true)}
                        className="py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-[10.5px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Pick Slip</span>
                      </button>
                      {canPack && (
                        <button
                          type="button"
                          onClick={() => setIsPackModalOpen(true)}
                          className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <PackageCheck className="w-3 h-3" />
                          <span>Pack Items</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Stage 3: Packed -> Dispatch */}
                  {currentStage === 3 && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsPickModalOpen(true)}
                          className="py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Boxes className="w-3 h-3 text-indigo-600" />
                          <span>Pick Slip</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPackingSlipModalOpen(true)}
                          className="py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <PackageCheck className="w-3 h-3 text-emerald-600" />
                          <span>Pack Slip</span>
                        </button>
                      </div>

                      {canDispatch && (
                        <button
                          type="button"
                          onClick={() => setIsDispatchModalOpen(true)}
                          className="w-full py-1.5 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Stock</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Stage 4: In Transit -> Receive */}
                  {currentStage === 4 && canReceive && (
                    <button
                      type="button"
                      onClick={() => setIsReceiveModalOpen(true)}
                      className="w-full py-1.5 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Receive & Putaway</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Vertical Multi-Stage Timeline */}
            <div className="relative pl-5 space-y-3.5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200 pt-0.5">
              
              {/* Step 1: Transfer Request Created */}
              <div className="relative group">
                <div className="absolute -left-[19px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-3 ring-white shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                      1. Transfer Request
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {formatDate(transfer.transfer_date)}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">Order Placed</h4>
                  <p className="text-[10px] text-gray-600 font-medium">
                    By: <span className="font-bold text-gray-800">{creatorName}</span>
                  </p>
                  <p className="text-[9.5px] text-gray-400">
                    {items.length} items ({totalRequested.toFixed(0)} units)
                  </p>
                </div>
              </div>

              {/* Step 2: Smart Pick List Allocation */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[19px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs transition-all',
                  latestPickList ? 'bg-emerald-600' : 'bg-amber-500 ring-amber-100 animate-pulse'
                )}>
                  {latestPickList ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <Boxes className="w-2 h-2" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase tracking-wider',
                      latestPickList ? 'text-emerald-700' : 'text-amber-700'
                    )}>
                      2. Pick List
                    </span>
                    {latestPickList && (
                      <span className="text-[9px] text-gray-400 font-mono">
                        {formatDate(latestPickList.created_at)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">
                    {latestPickList ? latestPickList.pick_no : 'Awaiting Allocation'}
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    {latestPickList
                      ? `${latestPickList.items?.length || 0} allocations`
                      : 'Auto-allocate bins'}
                  </p>
                </div>
              </div>

              {/* Step 3: Packing Station & Verification */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[19px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs transition-all',
                  latestPackingSlip ? 'bg-emerald-600' :
                  latestPickList ? 'bg-amber-500 ring-amber-100 animate-pulse' :
                  'bg-gray-300'
                )}>
                  {latestPackingSlip ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <Box className="w-2 h-2" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase tracking-wider',
                      latestPackingSlip ? 'text-emerald-700' :
                      latestPickList ? 'text-amber-700' :
                      'text-gray-400'
                    )}>
                      3. Packing
                    </span>
                    {latestPackingSlip && (
                      <span className="text-[9px] text-gray-400 font-mono">
                        {formatDate(latestPackingSlip.created_at || new Date().toISOString())}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">
                    {latestPackingSlip ? latestPackingSlip.packing_no : 'Carton Packaging'}
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    {latestPackingSlip
                      ? `${latestPackingSlip.gross_weight ? `${latestPackingSlip.gross_weight} kg • ` : ''}Verified`
                      : 'Verify & seal boxes'}
                  </p>
                </div>
              </div>

              {/* Step 4: Dispatch Stock Issue */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[19px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs transition-all',
                  transfer.status === 'dispatched' || transfer.status === 'received' ? 'bg-emerald-600' :
                  latestPackingSlip ? 'bg-blue-600 ring-blue-100 animate-pulse' :
                  'bg-gray-300'
                )}>
                  {transfer.status === 'dispatched' || transfer.status === 'received' ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <Truck className="w-2 h-2" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase tracking-wider',
                      transfer.status === 'dispatched' || transfer.status === 'received' ? 'text-emerald-700' :
                      latestPackingSlip ? 'text-blue-700' :
                      'text-gray-400'
                    )}>
                      4. Dispatch
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">
                    {transfer.status === 'dispatched' || transfer.status === 'received'
                      ? 'In Transit'
                      : 'Ready for Loading'}
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    {transfer.status === 'dispatched' || transfer.status === 'received'
                      ? 'Stock deducted'
                      : 'Assign vehicle & issue'}
                  </p>
                </div>
              </div>

              {/* Step 5: Destination Receipt & Putaway */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[19px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs transition-all',
                  transfer.status === 'received' ? 'bg-emerald-600' :
                  transfer.status === 'dispatched' ? 'bg-amber-500 ring-amber-100 animate-pulse' :
                  'bg-gray-300'
                )}>
                  {transfer.status === 'received' ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <PackageCheck className="w-2 h-2" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase tracking-wider',
                      transfer.status === 'received' ? 'text-emerald-700' :
                      transfer.status === 'dispatched' ? 'text-amber-700' :
                      'text-gray-400'
                    )}>
                      5. Putaway
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">
                    {transfer.status === 'received' ? 'Completed' : 'Destination Receipt'}
                  </h4>
                  {transfer.status === 'received' && (
                    <p className="text-[10px] text-emerald-700 font-medium">
                      By: <span className="font-bold">{receiverName}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500">
                    {transfer.status === 'received'
                      ? `${totalReceived.toFixed(0)} units received`
                      : 'Slot into target bins'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Embedded Print CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: portrait; margin: 10mm; }
          body, * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { background-color: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:mt-6 { margin-top: 1.5rem !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          * { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
        }
      `,
        }}
      />

      {/* Pick List Slip Modal (Printable) */}
      <PickListModal
        isOpen={isPickModalOpen}
        onClose={() => setIsPickModalOpen(false)}
        pickList={latestPickList}
        transfer={transfer}
      />

      {/* Pack Transfer Modal (Packing Station / Verification) */}
      <PackTransferModal
        isOpen={isPackModalOpen}
        onClose={() => setIsPackModalOpen(false)}
        pickList={latestPickList}
        transfer={transfer}
        onSuccess={() => refetch()}
      />

      {/* Packing Slip Modal (Printable) */}
      <PackingSlipModal
        isOpen={isPackingSlipModalOpen}
        onClose={() => setIsPackingSlipModalOpen(false)}
        packingSlip={latestPackingSlip}
        pickList={latestPickList}
        transfer={transfer}
      />

      {/* Dispatch Transfer Modal (Vehicle Details & Dispatch) */}
      <DispatchTransferModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        transfer={transfer}
        packingSlip={latestPackingSlip}
        onSuccess={() => refetch()}
      />

      {/* Receive Modal (Putaway into destination bin) */}
      <ReceiveTransferModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        transferId={transferId}
      />

      {/* Generate Pick List & Shelf Allocation Modal */}
      <GeneratePickListModal
        isOpen={isPickGenerateModalOpen}
        onClose={() => setIsPickGenerateModalOpen(false)}
        transfer={transfer}
        onSuccess={() => refetch()}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Warehouse Transfer"
        message="Are you sure you want to cancel this pending transfer request?"
        confirmText="Cancel Transfer"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  )
}
