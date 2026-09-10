import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Printer,
  Edit,
  Send,
  BarChart3,
  FileText,
  Users,
  Calendar,
  Building2,
  ShieldCheck,
  Award,
  Download,
  Eye,
  Package,
  Clock,
  Paperclip,
  Globe,
  AlertCircle,
  Hash,
  CheckCircle2,
  Briefcase,
  Mail,
  Phone,
} from 'lucide-react'
import { useRFQDetails, useDispatchRFQ } from '../../hooks/useRFQs'
import { useDepartments } from '@/modules/hrm'
import { useCostCenters } from '../../hooks/useCostCenters'
import { useRFQEvaluationTemplates } from '../../hooks/useRFQEvaluationTemplates'
import { useProductSelect2, useCategorySelect2 } from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { useQuery } from '@tanstack/react-query'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { useSettings } from '@/hooks/useSettings'
import { useUiStore } from '@/store/useUiStore'
import { formatDate } from '@/utils/formatters'
import { LoadingState } from '@/components/Loading/LoadingState'
import { clsx } from 'clsx'
import type { RFQStatus } from '../../api/types'

const statusBadgeColors: Record<RFQStatus, { bg: string; text: string; border: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Sent / Dispatched' },
  acknowledged: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300', label: 'Acknowledged' },
  submitted: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', label: 'Bids Received' },
  under_evaluation: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Under Evaluation' },
  awarded: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Awarded' },
  expired: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', label: 'Expired' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Cancelled' },
}

export const RFQViewPage = () => {
  const params = useParams({ strict: false }) as Record<string, string | undefined>
  const targetId = params.id || params.uuid || ''
  const navigate = useNavigate()
  const { companyInformation, webSetting } = useSettings()
  const { showNotificationModal } = useUiStore()

  const [isDispatchOpen, setIsDispatchOpen] = useState(false)

  // RFQ Query
  const { data: rfqResponse, isLoading, error } = useRFQDetails(targetId)
  const rfq = rfqResponse?.response || (rfqResponse as any)?.data

  // Mutations
  const { mutate: dispatchRFQMutate, isPending: isDispatching } = useDispatchRFQ()

  // Dynamic Lookups
  const { data: deptResponse } = useDepartments({ all: true })
  const deptMap = useMemo(() => {
    const list = deptResponse?.data || deptResponse?.response || []
    return new Map<number, string>(list.map((d: any) => [d.id, d.name]))
  }, [deptResponse])

  const { data: costCentersResponse } = useCostCenters({ per_page: 200 })
  const costCenterMap = useMemo(() => {
    const list = costCentersResponse?.response || []
    return new Map<number, string>(list.map((c: any) => [c.id, `${c.code} - ${c.name}`]))
  }, [costCentersResponse])

  const { data: productsData } = useProductSelect2()
  const productMap = useMemo(() => {
    return new Map<number, string>((productsData || []).map((p: any) => [p.id, p.text || p.name]))
  }, [productsData])

  const { data: categoriesData } = useCategorySelect2()
  const categoryMap = useMemo(() => {
    return new Map<number, string>((categoriesData || []).map((c: any) => [c.id, c.text || c.name]))
  }, [categoriesData])

  const { data: unitsData } = useQuery({
    queryKey: ['select2', 'units'],
    queryFn: getUnitSelect2,
  })
  const unitMap = useMemo(() => {
    return new Map<number, string>((unitsData || []).map((u: any) => [u.id, u.text || u.name]))
  }, [unitsData])

  const { data: templatesResponse } = useRFQEvaluationTemplates({ per_page: 100 })
  const templateList = useMemo(() => templatesResponse?.response || [], [templatesResponse])
  const activeTemplate = useMemo(() => {
    if (!rfq?.evaluation_template_id) return null
    return templateList.find((t: any) => Number(t.id) === Number(rfq.evaluation_template_id)) || null
  }, [rfq?.evaluation_template_id, templateList])

  const items = useMemo(() => {
    if (!rfq) return []
    return Array.isArray(rfq.items) ? rfq.items : []
  }, [rfq])

  const totalQuantity = useMemo(() => {
    return items.reduce((acc: number, item: any) => acc + (parseFloat(String(item.quantity)) || 0), 0)
  }, [items])

  const targetVendors = useMemo(() => {
    if (!rfq) return []
    return rfq.target_vendors || rfq.targetVendors || []
  }, [rfq])

  const terms = useMemo(() => {
    if (!rfq) return []
    return rfq.rfq_terms || rfq.rfqTerms || []
  }, [rfq])

  const attachments = useMemo(() => {
    if (!rfq) return []
    return rfq.attachments || []
  }, [rfq])

  const handlePrint = () => {
    window.print()
  }

  const handleDispatchConfirm = () => {
    if (!targetId) return
    dispatchRFQMutate(targetId, {
      onSuccess: () => {
        setIsDispatchOpen(false)
        showNotificationModal(
          'RFQ Dispatched!',
          `RFQ "${rfq?.rfq_no}" has been dispatched to target vendors via email notification.`,
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to dispatch RFQ.'
        showNotificationModal('Dispatch Failed', msg, 'error')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <LoadingState message="Loading Request For Quotation details..." />
      </div>
    )
  }

  if (error || !rfq || (!rfq.id && !rfq.uuid)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">RFQ Record Not Found</h2>
          <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">
            The requested Request For Quotation could not be loaded or has been deleted from the system.
          </p>
          <button
            onClick={() => navigate({ to: '/procurement/rfqs' })}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Return to RFQ List
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = statusBadgeColors[rfq.status as RFQStatus] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    label: rfq.status || 'Draft',
  }
  const isDraft = rfq.status === 'draft'
  const hasQuotes = (rfq.quotations?.length ?? 0) > 0 || ['submitted', 'under_evaluation', 'awarded'].includes(rfq.status)
  const backendBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0 text-[#475569]">
      {/* Top Header Controls (Hidden on print) */}
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-6 print:hidden gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/procurement/rfqs"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Request For Quotation Details</h1>
            {rfq.rfq_no && (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {rfq.rfq_no}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print RFQ</span>
          </button>

          {/* Comparative Statement (CS Matrix) */}
          {hasQuotes && (
            <button
              type="button"
              onClick={() => navigate({ to: `/procurement/rfqs/cs/${rfq.uuid}` as any })}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <BarChart3 className="h-4 w-4" />
              <span>CS Matrix</span>
            </button>
          )}

          {isDraft && (
            <>
              <PermissionGuard permission="edit_rfq">
                <button
                  type="button"
                  onClick={() => navigate({ to: `/procurement/rfqs/edit/${rfq.uuid}` as any })}
                  className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Draft</span>
                </button>
              </PermissionGuard>

              <PermissionGuard permission="edit_rfq">
                <button
                  type="button"
                  onClick={() => setIsDispatchOpen(true)}
                  className="px-4 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Dispatch to Vendors</span>
                </button>
              </PermissionGuard>
            </>
          )}
        </div>
      </div>

      {/* Main Document Paper Container */}
      <div className="max-w-[1600px] mx-auto pb-12 print:block print:p-0 print:m-0">
        <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:m-0 print:max-w-none">
          
          {/* Document Header */}
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 print:flex-row print:items-center print:p-4 border-b border-gray-100">
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

            <div className="text-right">
              <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2 print:text-[18px] print:mb-1">
                Request For Quotation #{rfq.rfq_no || rfq.id}
              </h2>
              <div className="flex items-center justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  <span>Issue Date: {formatDate(rfq.rfq_date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600 print:w-3.5 print:h-3.5" />
                  <span className="font-semibold text-rose-600">Bid Deadline: {formatDate(rfq.rfq_expiry_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Info Cards (Department & Sourcing Parameters) */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 p-6 pb-4 print:p-4 print:gap-4">
            {/* Card 1: Department & Cost Center */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Department & Cost Center
                </span>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 print:bg-orange-50 print:p-1.5">
                  <Building2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">
                {deptMap.get(rfq.department_id) || `Department #${rfq.department_id}`}
              </h3>

              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Cost Center:</span>
                  <span>{costCenterMap.get(rfq.cost_center_id) || (rfq.cost_center_id ? `Cost Center #${rfq.cost_center_id}` : 'General / Central')}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Currency:</span>
                  <span className="font-semibold text-slate-800">{rfq.currency || 'USD ($)'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Sourcing Mode:</span>
                  {rfq.purchase_requisition?.pr_no || rfq.purchaseRequisition?.pr_no ? (
                    <span className="px-2 py-0.5 bg-blue-100 text-[#1e4ba1] text-[11px] font-bold rounded-md">
                      PR Linked: {rfq.purchase_requisition?.pr_no || rfq.purchaseRequisition?.pr_no}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-md">
                      Direct RFQ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Bidding Parameters & Timeline */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#1e4ba1] text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Bidding & Sourcing Timeline
                </span>
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e4ba1] print:bg-blue-50 print:p-1.5">
                  <Clock className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">
                {targetVendors.length} {targetVendors.length === 1 ? 'Vendor Invited' : 'Vendors Invited'}
              </h3>

              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Submission Deadline:</span>
                  <span className="font-semibold text-rose-600">{formatDate(rfq.rfq_expiry_date)}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Expected Delivery:</span>
                  <span>{rfq.expected_delivery_date ? formatDate(rfq.expected_delivery_date) : 'As per quotation'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Evaluation Template:</span>
                  <span>{activeTemplate?.name || (rfq.evaluation_template_id ? `Template #${rfq.evaluation_template_id}` : 'Standard / Price-Based')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items & Technical Scope Table */}
          <div className="border-t border-gray-100 mx-6 py-4 print:mx-4 print:py-2">
            <div className="flex items-center justify-between mb-4 print:mb-2">
              <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">
                Line Items & Technical Scope
              </h3>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                {items.length} {items.length === 1 ? 'Item' : 'Items'} Listed
              </span>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden print:border print:rounded-xl">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 print:bg-gray-50">
                      <th className="px-6 py-4 w-16 print:px-3 print:py-2 text-center">SL.</th>
                      <th className="px-4 py-4 min-w-[280px] print:min-w-0 print:px-2 print:py-2">Item Details & Technical Specifications</th>
                      <th className="px-4 py-4 print:px-2 print:py-2">Category</th>
                      <th className="px-4 py-4 print:px-2 print:py-2">Unit</th>
                      <th className="px-6 py-4 text-center print:px-3 print:py-2">Required Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px]">
                    {items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors print:bg-white">
                        <td className="px-6 py-4 text-gray-500 print:px-3 print:py-2 text-center font-mono">{index + 1}</td>
                        <td className="px-4 py-4 print:px-2 print:py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[#1e4ba1] text-[14px] print:text-[12px]">
                              {productMap.get(item.product_id) || item.product?.product_name || `Product #${item.product_id}`}
                            </span>
                            {item.item_description && (
                              <span className="text-[11px] text-gray-500 font-medium print:text-[9px]">
                                {item.item_description}
                              </span>
                            )}
                            {item.remarks && (
                              <span className="text-[10px] text-gray-400 italic print:text-[9px]">
                                Spec / Remarks: {item.remarks}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">
                          {categoryMap.get(item.category_id) || item.category?.category_name || '—'}
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">
                          {unitMap.get(item.unit_id) || item.unit?.unit_name || '—'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-900 font-mono text-[14px] print:text-[12px] print:px-3 print:py-2">
                          {parseFloat(item.quantity) || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Invited Target Vendors Grid */}
          <div className="border-t border-gray-100 mx-6 py-4 print:mx-4 print:py-2">
            <div className="flex items-center justify-between mb-4 print:mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">
                  Target Sourcing Vendors ({targetVendors.length})
                </h3>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Invited Supplier Roster</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
              {targetVendors.map((tv: any, idx: number) => {
                const v = tv.vendor || tv
                return (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-primary/40 transition-all print:p-2.5 print:break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-[13px] font-bold text-gray-900 truncate" title={v.vendor_name || v.name}>
                        {v.vendor_name || v.name || `Vendor #${tv.vendor_id}`}
                      </h4>
                      <span className={clsx(
                        'px-2 py-0.5 text-[9px] font-bold uppercase rounded-md shrink-0 border',
                        tv.status === 'submitted' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        tv.status === 'acknowledged' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        tv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      )}>
                        {tv.status || 'Pending'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono text-gray-600 font-semibold">{v.vendor_code || v.code || 'CODE-N/A'}</span>
                      </div>
                      {v.email && (
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{v.email}</span>
                        </div>
                      )}
                      {v.phone && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{v.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom Details Section (12 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-6 p-6 pt-2 print:gap-4 print:px-4 print:py-2 print:mt-2">
            
            {/* Left Column (8 cols): Scope, Terms, Evaluation, Attachments */}
            <div className="lg:col-span-8 print:col-span-7 space-y-6 print:space-y-3">
              
              {/* Scope & Purpose Justification */}
              {rfq.purpose_justification && (
                <div className="p-5 bg-[#f8fafc] rounded-xl border border-gray-200 print:bg-[#f8fafc] print:p-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Scope of Work & Commercial Terms
                  </span>
                  <div
                    className="text-[13px] text-gray-700 leading-relaxed print:text-[11px] prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: rfq.purpose_justification }}
                  />
                </div>
              )}

              {/* Special Remarks */}
              {rfq.remarks && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-600">
                  <span className="font-bold text-gray-700 block mb-1">Special Instructions & Guidelines:</span>
                  <p>{rfq.remarks}</p>
                </div>
              )}

              {/* Terms & Conditions Library Clauses */}
              {terms.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Mandatory Terms & Compliance Clauses ({terms.length})
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">Standard Sourcing Terms</span>
                  </div>

                  <div className="space-y-2.5">
                    {terms.map((t: any, idx: number) => {
                      const term = t.term || {}
                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1 shadow-2xs hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {term.title || `Clause #${t.term_library_id}`}
                            </span>
                            <span
                              className={clsx(
                                'px-2 py-0.5 text-[9px] font-bold rounded-md uppercase border',
                                t.is_mandatory
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                              )}
                            >
                              {t.is_mandatory ? 'Mandatory' : 'Optional'}
                            </span>
                          </div>
                          {term.content && (
                            <p className="text-[11px] text-gray-600 leading-relaxed">{term.content}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Evaluation Matrix Template */}
              {activeTemplate && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                      Evaluation Scoring Matrix
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
                    <span className="font-bold text-gray-900">{activeTemplate.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] rounded-md">
                        Technical: {activeTemplate.technical_weightage}%
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-md">
                        Commercial: {activeTemplate.commercial_weightage}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Summary Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 print:gap-2">
                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 print:bg-blue-50 print:p-1.5">
                    <ShieldCheck className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Status</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px] capitalize">
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 print:bg-indigo-50 print:p-1.5">
                    <FileText className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Currency</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px]">
                      {rfq.currency || 'USD ($)'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg shrink-0 print:bg-orange-50 print:p-1.5">
                    <Users className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Invited Vendors</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px]">
                      {targetVendors.length} Suppliers
                    </span>
                  </div>
                </div>
              </div>

              {/* Supporting Tender Attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4 text-primary" />
                      Tender Documents & Attachments ({attachments.length})
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">Click to preview or download</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((att: any, idx: number) => {
                      const fileUrl = att.file_url 
                        ? (att.file_url.startsWith('http') ? att.file_url : `${backendBaseUrl}${att.file_url.startsWith('/') ? '' : '/'}${att.file_url}`)
                        : (att.file_path ? `${backendBaseUrl}/storage/${att.file_path}` : '#')
                      
                      const ext = (att.file_name || '').split('.').pop()?.toUpperCase() || 'FILE'

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-primary/40 rounded-xl text-xs shadow-2xs hover:shadow-xs transition-all group"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2 min-w-0">
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-mono text-[9px] font-bold rounded shrink-0">
                              {ext}
                            </span>
                            <span className="font-semibold text-gray-800 truncate group-hover:text-primary transition-colors" title={att.file_name}>
                              {att.file_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {fileUrl !== '#' && (
                              <>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                                  title="View / Preview File in New Tab"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </a>
                                <a
                                  href={fileUrl}
                                  download={att.file_name || 'attachment'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (4 cols): RFQ Summary Card */}
            <div className="lg:col-span-4 print:col-span-5 flex flex-col print:break-inside-avoid">
              <div className="bg-[#f8fafc] border border-gray-200 rounded-t-xl flex-grow print:bg-[#f8fafc]">
                <h3 className="text-[16px] font-semibold text-[#1e4ba1] p-4 print:text-[14px] print:p-2">
                  RFQ Summary
                </h3>

                <div className="space-y-3.5 bg-white text-[14px] p-4 print:text-[12px] print:p-2 print:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Line Items:</span>
                    <span className="text-gray-900 font-semibold">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Units Required:</span>
                    <span className="text-gray-900 font-semibold">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Invited Suppliers:</span>
                    <span className="text-gray-900 font-semibold">{targetVendors.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Attached Terms:</span>
                    <span className="text-gray-900 font-semibold">{terms.length} Clauses</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 pb-3 border-t border-b border-gray-200 my-2 print:pt-1 print:pb-1 print:my-1">
                    <span className="text-gray-900 font-bold">Quotation Currency:</span>
                    <span className="text-[16px] text-[#1e4ba1] font-bold print:text-[14px]">
                      {rfq.currency || 'USD ($)'}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-emerald-700">Tender Lifecycle:</span>
                    <span className="text-[14px] font-bold text-emerald-800 uppercase">{statusInfo.label}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f2d5c] p-5 flex items-center justify-between text-white rounded-b-xl border border-[#0f2d5c] print:bg-[#0f2d5c] print:p-3">
                <span className="text-[13px] font-bold tracking-wider print:text-[11px]">RFQ STATUS</span>
                <span className="text-[18px] font-bold uppercase print:text-[15px] font-mono">{statusInfo.label}</span>
              </div>
            </div>
          </div>

          {/* Classic Authorization & Signatures Section */}
          <div className="mx-6 pt-16 pb-6 print:mx-4 print:pt-14 print:pb-4 border-t border-gray-100 print:border-t">
            <div className="flex flex-wrap sm:flex-nowrap items-end justify-between gap-6 print:flex-nowrap print:justify-between print:gap-4 text-center">
              {/* Line 1: Prepared By */}
              <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                  <span className="text-[10px] font-mono text-gray-500 font-semibold">
                    ✓ Draft Prepared
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                    Prepared By
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium truncate" title={rfq.creator?.name || 'Procurement Buyer'}>
                    {rfq.creator?.name || 'Procurement Buyer'}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    Procurement Specialist {rfq.created_at || rfq.rfq_date ? `• ${formatDate(rfq.created_at || rfq.rfq_date)}` : ''}
                  </div>
                </div>
              </div>

              {/* Line 2: Sourcing Lead */}
              <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                  {rfq.status !== 'draft' ? (
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                      ✓ Dispatched
                    </span>
                  ) : null}
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                    Sourcing Lead / Buyer
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium truncate">
                    {rfq.status !== 'draft' ? 'Commercial Tender Desk' : 'Pending Dispatch'}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    Supply Chain Department
                  </div>
                </div>
              </div>

              {/* Line 3: Department Head */}
              <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                <div className="h-12" />
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                    Head of Procurement
                  </div>
                  <div className="text-[10px] text-gray-400">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Dispatch Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onConfirm={handleDispatchConfirm}
        title="Dispatch RFQ to Vendors?"
        message={`Dispatching "${rfq.rfq_no}" will send invitation emails to all ${targetVendors.length} target vendors and transition status to Sent/Open.`}
        confirmText="Yes, Dispatch"
        cancelText="Cancel"
        variant="dispatch"
        isLoading={isDispatching}
      />

      {/* Embedded Print CSS matching Purchase View */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
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
    </div>
  )
}
