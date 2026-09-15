import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Printer,
  Edit,
  ShieldCheck,
  PackageCheck,
  Building2,
  Calendar,
  FileText,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Package,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Check,
  Globe,
} from 'lucide-react'
import { useGRNDetails, usePostGRN } from '../../hooks/useGRN'
import { useProductSelect2 } from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { GRNQCModal } from '../../components/grn/GRNQCModal'
import { GRNPutawayModal } from '../../components/grn/GRNPutawayModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { useSettings } from '@/hooks/useSettings'
import { useUiStore } from '@/store/useUiStore'
import { formatDate } from '@/utils/formatters'
import type { GRNStatus } from '../../api/types'
import { clsx } from 'clsx'

const statusBadgeColors: Record<GRNStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels: Record<GRNStatus, string> = {
  draft: 'Draft Receipt',
  submitted: 'QC Pending',
  approved: 'QC Approved',
  closed: 'Stock Inwarded (Closed)',
  cancelled: 'Cancelled',
}

export const GRNViewPage = () => {
  const { id: uuid } = useParams({ strict: false }) as { id: string }
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { webSetting, companyInformation } = useSettings()

  const [isQCModalOpen, setIsQCModalOpen] = useState(false)
  const [isPostConfirmOpen, setIsPostConfirmOpen] = useState(false)

  const { data: grnData, isLoading, refetch } = useGRNDetails(uuid)
  const { data: productsData } = useProductSelect2()
  const { data: unitsData } = useQuery({
    queryKey: ['unit-select2'],
    queryFn: getUnitSelect2,
  })
  const postMutation = usePostGRN()

  const grn = grnData?.response

  // Product & Unit dictionary maps for accurate names
  const productMap = useMemo(() => {
    return new Map((productsData || []).map((p: any) => [Number(p.id), p.text || p.name || p.product_name]))
  }, [productsData])

  const unitMap = useMemo(() => {
    return new Map((unitsData || []).map((u: any) => [Number(u.id), u.text || u.name]))
  }, [unitsData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading Goods Receipt Note...</p>
        </div>
      </div>
    )
  }

  if (!grn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <p className="text-gray-500 font-medium">Goods Receipt Note not found.</p>
        <Link
          to="/procurement/grns"
          className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
        >
          Return to GRN List
        </Link>
      </div>
    )
  }

  const isDraft = grn.status === 'draft'
  const canQC = grn.status === 'draft' || grn.status === 'submitted'
  const canPost = grn.status === 'approved'

  const handlePrint = () => {
    window.print()
  }

  const items = grn.items || []
  const totalOrdered = items.reduce((sum, it) => sum + Number(it.po_quantity || it.poItem?.quantity || 0), 0)
  const totalReceived = items.reduce((sum, it) => sum + Number(it.received_quantity || 0), 0)
  const totalDamaged = items.reduce((sum, it) => sum + Number(it.damaged_quantity || 0), 0)
  const totalAccepted = items.reduce((sum, it) => sum + Number(it.accepted_quantity || 0), 0)
  const totalDue = Math.max(0, totalOrdered - totalAccepted)

  const po = grn.purchaseOrder || (grn as any).purchase_order
  const vendor = grn.supplier || po?.vendor
  const primaryWarehouse = items[0]?.allocations?.[0]?.warehouse

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-16 font-poppins text-[#475569] print:bg-white print:pb-0">
      {/* Top Header & Actions Bar (hidden in print) */}
      <div className="max-w-[1600px] mx-auto pb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: '/procurement/grns' as any })}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium cursor-pointer"
              title="Back to GRN List"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2.5 ml-2">
              <h1 className="text-[20px] font-medium text-primary tracking-tight">
                Goods Receipt Note Details
              </h1>
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {grn.grn_no}
              </span>
              <span
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize leading-none',
                  statusBadgeColors[grn.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                {statusLabels[grn.status] || grn.status}
              </span>
              <span
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium border leading-none inline-flex items-center gap-1',
                  grn.qc_result === 'passed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : grn.qc_result === 'failed' || grn.qc_result === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {grn.qc_result === 'passed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : grn.qc_result === 'failed' || grn.qc_result === 'rejected' ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                )}
                QC: {grn.qc_result ? grn.qc_result.toUpperCase() : 'PENDING'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Voucher</span>
            </button>

            {/* Edit Draft */}
            {isDraft && (
              <PermissionGuard permission="edit_grn">
                <button
                  type="button"
                  onClick={() => navigate({ to: `/procurement/grns/edit/${grn.uuid}` as any })}
                  className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Draft</span>
                </button>
              </PermissionGuard>
            )}

            {/* Quality Inspection Button */}
            {canQC && (
              <PermissionGuard permission={['inspect_grn', 'qc_grn']}>
                <button
                  type="button"
                  onClick={() => setIsQCModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Log QC Inspection</span>
                </button>
              </PermissionGuard>
            )}

            {/* Post / Inward Stock Button */}
            {canPost && (
              <PermissionGuard permission="post_grn">
                <button
                  type="button"
                  onClick={() => setIsPostConfirmOpen(true)}
                  className="px-4 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>Post to Stock</span>
                </button>
              </PermissionGuard>
            )}
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="max-w-[1600px] mx-auto space-y-6 print:space-y-4 print:p-0 print:m-0 print:max-w-none">
        {/* Document Paper Container */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-4">
          {/* Document Header Banner with Company Logo */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6 print:flex-row print:items-center print:pb-4">
            <div>
              {webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url ? (
                <img
                  src={webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url || undefined}
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

            <div className="text-left md:text-right space-y-1">
              <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2 print:text-[18px] print:mb-1">
                Goods Receipt Note #{grn.grn_no || grn.id}
              </h2>
              <div className="flex items-center md:justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  <span>GRN Date: {grn.grn_date ? formatDate(grn.grn_date) : '—'}</span>
                </div>
                {grn.delivery_date && (
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                    <span>Delivery Date: {formatDate(grn.delivery_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3-Column Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-5 print:gap-3">
            {/* Card 1: Vendor / Supplier Details */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 space-y-3 print:break-inside-avoid print:p-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Vendor / Supplier
                </span>
                {vendor?.code && (
                  <span className="text-[10px] font-mono font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                    {vendor.code}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[16px] font-semibold text-gray-900 leading-snug print:text-[14px]">
                  {vendor?.name || '—'}
                </h3>
                {vendor?.contact_person && (
                  <p className="text-xs text-gray-600 print:text-[11px]">
                    <span className="font-semibold text-gray-700">Attn:</span> {vendor.contact_person}
                  </p>
                )}
                {vendor?.phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 print:text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{vendor.phone}</span>
                  </p>
                )}
                {vendor?.email && (
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate print:text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                      {vendor.email}
                    </a>
                  </p>
                )}
                {vendor?.address && (
                  <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-100 leading-relaxed print:text-[10px]">
                    {vendor.address}
                  </p>
                )}
              </div>
            </div>

            {/* Card 2: Purchase Order Reference */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 space-y-3 print:break-inside-avoid print:p-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Purchase Order
                </span>
                {po?.status && (
                  <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {typeof po.status === 'object' ? po.status.name : po.status}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {po?.uuid ? (
                  <Link
                    to={`/procurement/purchase-orders/view/${po.uuid}` as any}
                    className="text-[16px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 print:text-[14px]"
                    target="_blank"
                  >
                    <span>{po.po_no}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400 print:hidden" />
                  </Link>
                ) : (
                  <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">PO #{grn.purchase_order_id}</h3>
                )}

                {po?.po_date && (
                  <p className="text-xs text-gray-600 print:text-[11px]">
                    <span className="font-semibold text-gray-700">PO Date:</span> {formatDate(po.po_date)}
                  </p>
                )}
                {po?.delivery_date && (
                  <p className="text-xs text-gray-600 print:text-[11px]">
                    <span className="font-semibold text-gray-700">Expected Delivery:</span> {formatDate(po.delivery_date)}
                  </p>
                )}
                {po?.department?.name && (
                  <p className="text-xs text-gray-600 print:text-[11px]">
                    <span className="font-semibold text-gray-700">Department:</span> {po.department.name}
                  </p>
                )}
              </div>
            </div>

            {/* Card 3: Delivery & Inwarding Details */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 space-y-3 print:break-inside-avoid print:p-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Delivery & Gate Dock
                </span>
                <span className="text-[10px] font-mono font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                  {primaryWarehouse?.code || 'WH'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs print:text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Delivery Challan:</span>
                  <span className="font-mono font-bold text-gray-900">{grn.delivery_challan_no || '—'}</span>
                </div>
                {grn.invoice_no && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Supplier Invoice:</span>
                    <span className="font-mono text-gray-800">{grn.invoice_no}</span>
                  </div>
                )}
                {primaryWarehouse?.name && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Receiving Warehouse:</span>
                    <span className="font-semibold text-gray-800">{primaryWarehouse.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">Received By:</span>
                  <span className="font-semibold text-gray-800">{grn.receivedBy?.name || (grn as any).received_by?.name || 'Store Officer'}</span>
                </div>
                {grn.inspection_by_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Inspected By:</span>
                    <span className="font-semibold text-gray-800">{grn.inspectionBy?.name || (grn as any).inspection_by?.name || 'QC Officer'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Breakdown Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2 print:text-[14px]">
                <Package className="h-4 w-4 text-primary" />
                <span>Received Materials Breakdown</span>
              </h3>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                {items.length} {items.length === 1 ? 'Line Item' : 'Line Items'}
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden print:border print:rounded-xl">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 print:bg-gray-50">
                      <th className="py-3 px-3 w-12 text-center">SL</th>
                      <th className="py-3 px-3 min-w-[220px]">Product / Material</th>
                      <th className="py-3 px-2 text-center w-20">Unit</th>
                      <th className="py-3 px-2 text-right w-24">Ordered</th>
                      <th className="py-3 px-2 text-right w-24">Received</th>
                      <th className="py-3 px-2 text-right w-24">Damaged</th>
                      <th className="py-3 px-2 text-right w-28">Accepted</th>
                      <th className="py-3 px-2 text-left w-32">Batch / Lot No</th>
                      <th className="py-3 px-2 text-left w-28">Expiry Date</th>
                      <th className="py-3 px-3 text-center w-28">QC Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {items.map((item, idx) => {
                      const resolvedName =
                        productMap.get(Number(item.product_id)) ||
                        item.product?.name ||
                        item.poItem?.product?.name ||
                        `Product #${item.product_id}`
                      const resolvedUnit =
                        unitMap.get(Number(item.unit_id)) ||
                        item.unit?.name ||
                        'Unit'
                      const batch = item.batches?.[0]
                      const qcStatus = item.qc_status || 'passed'

                      return (
                        <tr key={item.id || idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-900">{resolvedName}</div>
                            {(item.product?.code || item.poItem?.product?.code) && (
                              <div className="text-[11px] text-gray-400 font-mono">
                                SKU: {item.product?.code || item.poItem?.product?.code}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-600 font-medium">{resolvedUnit}</td>
                          <td className="py-3 px-2 text-right font-mono text-gray-600">
                            {Number(item.po_quantity || item.poItem?.quantity || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-gray-800">
                            {Number(item.received_quantity).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-rose-600">
                            {Number(item.damaged_quantity || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-[#0d7a50] text-[13px]">
                            {Number(item.accepted_quantity).toFixed(2)}
                          </td>
                          <td className="py-3 px-2 font-mono text-gray-700">
                            {batch?.batch_no || '—'}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {batch?.expiry_date ? formatDate(batch.expiry_date) : '—'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={clsx(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider leading-none inline-flex items-center gap-1',
                                qcStatus === 'passed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : qcStatus === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              )}
                            >
                              {qcStatus === 'passed' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : qcStatus === 'rejected' ? (
                                <XCircle className="w-3 h-3 text-rose-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              {qcStatus}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Section: Left (Remarks) & Right (Summary Card) Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-6 print:gap-4 items-stretch pt-2 print:break-inside-avoid">
            {/* Left Column (8 cols / 7 cols in print): Remarks & Notes */}
            <div className="lg:col-span-8 print:col-span-7 bg-white rounded-xl border border-gray-200 p-5 print:p-3.5 flex flex-col justify-between space-y-4 print:break-inside-avoid">
              <div>
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-200 mb-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h3 className="text-[14px] font-bold text-[#1e293b] print:text-[13px]">Remarks / Gate Entry Notes</h3>
                </div>
                {(grn as any).remarks ? (
                  <div
                    className="text-xs text-gray-700 leading-relaxed prose prose-sm max-w-none print:text-[11px]"
                    dangerouslySetInnerHTML={{ __html: (grn as any).remarks }}
                  />
                ) : (
                  <p className="text-xs text-gray-400 italic print:text-[11px]">No additional gate entry notes logged.</p>
                )}

                {grn.qc_remarks && (
                  <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1 print:p-2 print:text-[11px]">
                    <span className="font-bold text-amber-900 block">QC Inspection Remarks:</span>
                    <p className="text-amber-800">{grn.qc_remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (4 cols / 5 cols in print): Receipt Summary */}
            <div className="lg:col-span-4 print:col-span-5 flex flex-col print:break-inside-avoid">
              <div className="bg-[#f8fafc] border border-gray-200 rounded-t-xl flex-grow print:bg-[#f8fafc] border-b-0">
                <div className="flex items-center justify-between p-4 print:p-2.5 border-b border-gray-200">
                  <h3 className="text-[15px] font-semibold text-[#1B4D90] print:text-[13px]">
                    Receipt Summary
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
                    {statusLabels[grn.status] || grn.status}
                  </span>
                </div>

                <div className="space-y-3 bg-white text-[13px] p-4 print:text-[11px] print:p-3 print:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Line Items:</span>
                    <span className="text-gray-900 font-bold font-mono">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Ordered Quantity:</span>
                    <span className="text-gray-900 font-bold font-mono">{totalOrdered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Received Qty:</span>
                    <span className="text-gray-900 font-bold font-mono">{totalReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Damaged / Rejected:</span>
                    <span className="text-rose-600 font-bold font-mono">{totalDamaged.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Remaining Due:</span>
                    <span className="text-purple-700 font-bold font-mono">{totalDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div
                className="bg-[#1B4D90] p-4 flex items-center justify-between text-white rounded-b-xl border border-[#1B4D90] print:p-3"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  backgroundColor: '#1B4D90',
                  color: '#ffffff',
                }}
              >
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/80 block print:text-[9.5px]">
                    Net Accepted Qty
                  </span>
                  <span className="text-[9px] text-white/70 print:text-[8px]">
                    {grn.status === 'closed' ? 'Inwarded to Stock' : grn.status === 'approved' ? 'Ready for Post' : 'Pending Inward'}
                  </span>
                </div>
                <span className="text-[20px] font-bold text-white print:text-[18px] font-mono">
                  {totalAccepted.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Full-Width Signatures Section for Printed Voucher */}
          <div className="pt-14 pb-4 print:pt-12 print:pb-2 border-t border-gray-200 print:border-t print:break-inside-avoid">
            <div className="grid grid-cols-3 print:grid-cols-3 gap-8 print:gap-6 text-center text-xs text-gray-600">
              <div>
                <div className="h-10 border-b border-dashed border-gray-400 mb-2"></div>
                <p className="font-bold text-gray-800 print:text-[11px]">Delivered By (Driver / Supplier)</p>
                <p className="text-[10px] text-gray-400">Signature & Date</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-gray-400 mb-2"></div>
                <p className="font-bold text-gray-800 print:text-[11px]">Received By (Store Dept)</p>
                <p className="text-[10px] text-gray-500 font-semibold">{grn.receivedBy?.name || (grn as any).received_by?.name || 'Store Officer'}</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-gray-400 mb-2"></div>
                <p className="font-bold text-gray-800 print:text-[11px]">Quality & Store Authorization</p>
                <p className="text-[10px] text-gray-500 font-semibold">{grn.inspectionBy?.name || (grn as any).inspection_by?.name || 'Authorized Officer'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QC Modal */}
      {grn && (
        <GRNQCModal
          isOpen={isQCModalOpen}
          grn={grn}
          onClose={() => setIsQCModalOpen(false)}
          onSuccess={() => {
            setIsQCModalOpen(false)
            refetch()
          }}
        />
      )}

      {/* Post to Stock / Putaway Modal */}
      {grn && (
        <GRNPutawayModal
          isOpen={isPostConfirmOpen}
          grn={grn}
          onClose={() => setIsPostConfirmOpen(false)}
          onSuccess={() => {
            setIsPostConfirmOpen(false)
            refetch()
          }}
        />
      )}

      {/* Embedded Print CSS matching Procurement View Pages */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: portrait; margin: 8mm 10mm; }
          body, * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { background-color: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .print\\:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
          .print\\:col-span-7 { grid-column: span 7 / span 7 !important; }
          .print\\:col-span-5 { grid-column: span 5 / span 5 !important; }
          .print\\:break-inside-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { word-break: normal !important; }
          * { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
        }
      `,
        }}
      />
    </div>
  )
}
