import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Printer,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  Building2,
  Calendar,
  Users,
  ShieldCheck,
  Star,
  Check,
  X,
  Clock,
  Sparkles,
  Layers,
  Globe,
} from 'lucide-react'
import {
  useComparativeStatement,
  useRFQDetails,
  useEvaluateQuotation,
  useAwardRFQ,
} from '../../hooks/useRFQs'
import { useAuthStore } from '@/store/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useSettings } from '@/hooks/useSettings'
import { useUiStore } from '@/store/useUiStore'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { clsx } from 'clsx'

export const RFQComparativeStatementPage = () => {
  const params = useParams({ strict: false }) as Record<string, string | undefined>
  const targetId = params.id || params.uuid || ''
  const navigate = useNavigate()
  const { companyInformation, webSetting } = useSettings()
  const { showNotificationModal } = useUiStore()
  const { user } = useAuthStore()
  const { hasPermission } = usePermissions()

  // Guard: Vendors are strictly forbidden from viewing CS Matrix
  const isVendor = user?.user_type === 'vendor'

  // Queries
  const { data: csResponse, isLoading: isCsLoading, error: csError, refetch } = useComparativeStatement(targetId)
  const { data: rfqResponse, isLoading: isRfqLoading } = useRFQDetails(targetId)

  const csData = csResponse?.response || (csResponse as any)?.data
  const rfq = rfqResponse?.response || (rfqResponse as any)?.data

  // Dynamic currency from RFQ or Global Web Settings
  const activeCurrency = rfq?.currency || webSetting?.currency || '৳'
  const activeCurrencyPos = webSetting?.currency_position || 'right'

  // Mutations
  const { mutate: evaluateMutate, isPending: isEvaluating } = useEvaluateQuotation()
  const { mutate: awardMutate, isPending: isAwarding } = useAwardRFQ()

  // State for evaluation modal & award modal
  const [evaluatingQuotation, setEvaluatingQuotation] = useState<any | null>(null)
  const [techScore, setTechScore] = useState<string>('')
  const [commScore, setCommScore] = useState<string>('')
  const [evalRemarks, setEvalRemarks] = useState<string>('')
  const [awardingVendor, setAwardingVendor] = useState<{ id: number; name: string; amount: number } | null>(null)

  // Memoized data
  const vendors = useMemo(() => csData?.vendors || [], [csData])
  const itemsMatrix = useMemo(() => csData?.items_matrix || [], [csData])
  const termsMatrix = useMemo(() => csData?.terms_compliance_matrix || [], [csData])
  const l1Vendor = useMemo(() => csData?.recommended_l1_vendor || null, [csData])

  const handlePrint = () => {
    window.print()
  }

  // Open Evaluation Modal
  const openEvaluation = (v: any) => {
    const rawQuote = (rfq?.quotations || []).find((q: any) => q.id === v.quotation_id || q.uuid === v.quotation_uuid)
    setEvaluatingQuotation({ ...v, rawQuote })
    setTechScore(rawQuote?.technical_score ? String(rawQuote.technical_score) : '80')
    setCommScore(rawQuote?.commercial_score ? String(rawQuote.commercial_score) : '85')
    setEvalRemarks('')
  }

  // Submit Evaluation Score
  const handleSaveEvaluation = () => {
    if (!evaluatingQuotation || !targetId) return
    const tScore = parseFloat(techScore)
    const cScore = parseFloat(commScore)

    if (isNaN(tScore) || tScore < 0 || tScore > 100) {
      showNotificationModal('Validation Error', 'Technical score must be between 0 and 100.', 'error')
      return
    }
    if (isNaN(cScore) || cScore < 0 || cScore > 100) {
      showNotificationModal('Validation Error', 'Commercial score must be between 0 and 100.', 'error')
      return
    }

    evaluateMutate(
      {
        uuid: targetId,
        data: {
          vendor_quotation_id: evaluatingQuotation.quotation_id,
          technical_score: tScore,
          commercial_score: cScore,
        },
      },
      {
        onSuccess: () => {
          setEvaluatingQuotation(null)
          showNotificationModal(
            'Evaluation Saved',
            `Evaluation score updated for "${evaluatingQuotation.vendor_name}".`,
            'success'
          )
          refetch()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to submit evaluation.'
          showNotificationModal('Evaluation Error', msg, 'error')
        },
      }
    )
  }

  // Confirm Award RFQ
  const handleConfirmAward = () => {
    if (!awardingVendor || !targetId) return
    awardMutate(
      {
        uuid: targetId,
        vendorId: awardingVendor.id,
      },
      {
        onSuccess: () => {
          setAwardingVendor(null)
          showNotificationModal(
            'RFQ Awarded!',
            `RFQ "${rfq?.rfq_no || targetId}" has been successfully awarded to "${awardingVendor.name}".`,
            'success'
          )
          refetch()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to award RFQ.'
          showNotificationModal('Awarding Error', msg, 'error')
        },
      }
    )
  }

  // Access Control: Block Vendor
  if (isVendor) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">Access Restricted</h2>
          <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">
            Comparative Statements contain confidential commercial data from multiple vendors and are accessible only to authorized procurement officers.
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

  if (isCsLoading || isRfqLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <LoadingState message="Generating Comparative Statement Matrix..." />
      </div>
    )
  }

  if (csError || !csData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">CS Matrix Not Available</h2>
          <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">
            No quotation bids have been submitted yet for this RFQ, or the record could not be found.
          </p>
          <button
            onClick={() => navigate({ to: `/procurement/rfqs/view/${targetId}` as any })}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Back to RFQ Details
          </button>
        </div>
      </div>
    )
  }

  const isAwarded = rfq?.status === 'awarded'
  const isEditable = !isAwarded && ['submitted', 'under_evaluation', 'sent', 'acknowledged'].includes(rfq?.status || '')

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0 text-[#475569] pb-12">
      {/* Top Header Controls (Hidden on print) */}
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-6 print:hidden gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/procurement/rfqs/view/${targetId}` as any}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Comparative Statement (CS Matrix)</h1>
            {rfq?.rfq_no && (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {rfq.rfq_no}
              </span>
            )}
            {isAwarded && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Awarded
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
            <span>Print CS Statement</span>
          </button>
        </div>
      </div>

      {/* Main Document / Content Container */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Clean Document Header (Print & Web) */}
        <div className="border-b border-gray-100 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url ? (
                <img
                  src={webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url || undefined}
                  alt="Logo"
                  className="h-12 object-contain print:h-10 shrink-0"
                />
              ) : (
                <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span>{companyInformation?.company_name || 'GEN-ITECH ERP'}</span>
                </div>
              )}
              <div className="border-l border-gray-200 pl-4 py-0.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Procurement Evaluation
                </span>
                <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">
                  Comparative Statement (CS Matrix)
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-2">
                <span className="text-gray-400 font-medium">Tender:</span>
                <span className="font-bold text-gray-900 font-mono">{rfq?.rfq_no || 'N/A'}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-2">
                <span className="text-gray-400 font-medium">Currency:</span>
                <span className="font-bold text-primary font-mono">{activeCurrency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Stat Metric Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 print:grid-cols-4">
          {/* Stat 1: RFQ & PR Reference */}
          <div className="p-3.5 bg-slate-50/70 border border-gray-200/80 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#1e4ba1] rounded-lg shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Source Reference</span>
              <span className="text-[13px] font-bold text-gray-900 truncate block">
                {rfq?.purchaseRequisition?.pr_no || rfq?.purchase_requisition?.pr_no ? (
                  `PR: ${rfq?.purchaseRequisition?.pr_no || rfq?.purchase_requisition?.pr_no}`
                ) : (
                  'Direct RFQ'
                )}
              </span>
            </div>
          </div>

          {/* Stat 2: Total Bids Received */}
          <div className="p-3.5 bg-slate-50/70 border border-gray-200/80 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Bids</span>
              <span className="text-[13px] font-bold text-gray-900 block">
                {vendors.length} {vendors.length === 1 ? 'Supplier' : 'Suppliers'} Quoted
              </span>
            </div>
          </div>

          {/* Stat 3: Issue & Deadline Timeline */}
          <div className="p-3.5 bg-slate-50/70 border border-gray-200/80 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bid Deadline</span>
              <span className="text-[13px] font-bold text-rose-600 truncate block">
                {formatDate(rfq?.rfq_expiry_date)}
              </span>
            </div>
          </div>

          {/* Stat 4: L1 Lowest Quoted Rate */}
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">L1 Lowest Bid</span>
              <span className="text-[13px] font-bold text-primary font-mono truncate block">
                {l1Vendor ? formatCurrency(l1Vendor.total_quoted_amount, activeCurrency, activeCurrencyPos) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* L1 Recommendation Card */}
        {l1Vendor && (
          <div className="bg-slate-50/90 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary text-white rounded-lg shrink-0 shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Recommended L1
                  </span>
                  <span className="text-[14px] font-bold text-gray-900">{l1Vendor.vendor_name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Quoted Total:{' '}
                  <strong className="text-primary font-mono text-xs">
                    {formatCurrency(l1Vendor.total_quoted_amount, activeCurrency, activeCurrencyPos)}
                  </strong>
                </div>
              </div>
            </div>

            {isEditable && (
              <PermissionGuard permission="award_rfq">
                <button
                  type="button"
                  onClick={() =>
                    setAwardingVendor({
                      id: l1Vendor.vendor_id,
                      name: l1Vendor.vendor_name,
                      amount: l1Vendor.total_quoted_amount,
                    })
                  }
                  className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Award RFQ</span>
                </button>
              </PermissionGuard>
            )}
          </div>
        )}

        {/* Section 1: Vendor Bids Summary & Scoring Matrix */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="text-[15px] font-semibold text-gray-900">Vendor Bids & Evaluation Summary</h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">Sorted by Rank / Total Bid Amount</span>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3 text-center w-12">Rank</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4 text-right">Total Quoted Bid</th>
                  <th className="py-3 px-3 text-center">Tech Score</th>
                  <th className="py-3 px-3 text-center">Comm Score</th>
                  <th className="py-3 px-3 text-center">Final Score</th>
                  <th className="py-3 px-4 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {vendors.map((v: any) => {
                  const rawQuote = (rfq?.quotations || []).find(
                    (q: any) => q.id === v.quotation_id || q.uuid === v.quotation_uuid
                  )
                  const isSelected = rawQuote?.status?.value === 'selected' || rawQuote?.status === 'selected'
                  const isL1 = v.is_l1

                  return (
                    <tr
                      key={v.quotation_id}
                      className={clsx(
                        'hover:bg-gray-50/60 transition-colors',
                        isSelected && 'bg-emerald-50/30 font-medium'
                      )}
                    >
                      <td className="py-3 px-3 text-center">
                        <span
                          className={clsx(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[11px]',
                            isL1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {v.rank || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {v.vendor_name}
                          {isL1 && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                              L1
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Winner
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400">ID: #{v.vendor_id}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                        <span className={isL1 ? 'text-primary' : ''}>
                          {formatCurrency(v.total_quoted_amount, activeCurrency, activeCurrencyPos)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        {rawQuote?.technical_score != null ? (
                          <span className="text-gray-800">{rawQuote.technical_score} / 100</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        {rawQuote?.commercial_score != null ? (
                          <span className="text-gray-800">{rawQuote.commercial_score} / 100</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {rawQuote?.final_score != null ? (
                          <span className="text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {rawQuote.final_score}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-2">
                          {isEditable && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEvaluation(v)}
                                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-semibold rounded border border-gray-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Score Technical & Commercial Marks"
                              >
                                <Star className="w-3 h-3 text-amber-500" />
                                <span>Score</span>
                              </button>

                              <PermissionGuard permission="award_rfq">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAwardingVendor({
                                      id: v.vendor_id,
                                      name: v.vendor_name,
                                      amount: v.total_quoted_amount,
                                    })
                                  }
                                  className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold rounded border border-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Award RFQ to this vendor"
                                >
                                  <Award className="w-3 h-3 text-primary" />
                                  <span>Award</span>
                                </button>
                              </PermissionGuard>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Item-by-Item Price Comparison Matrix */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-[15px] font-semibold text-gray-900">Item-By-Item Price Matrix</h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">Comparing unit rates & total per line item</span>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Item Description</th>
                  <th className="py-3 px-3 text-right w-24">Qty</th>
                  {vendors.map((v: any) => (
                    <th key={v.quotation_id} className="py-3 px-4 text-right border-l border-gray-100 min-w-[160px]">
                      <div>{v.vendor_name}</div>
                      <div className="text-[10px] font-normal text-gray-400">Unit Price / Total</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {itemsMatrix.map((itemRow: any, idx: number) => {
                  // Find minimum unit price for this item row
                  const prices = Object.values(itemRow.vendor_prices || {})
                    .map((p: any) => (p as any)?.unit_price)
                    .filter((p) => p != null && !isNaN(p) && p > 0)
                  const minUnitPrice = prices.length > 0 ? Math.min(...(prices as number[])) : null

                  return (
                    <tr key={itemRow.rfq_item_id || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{itemRow.item_description || `Product #${itemRow.product_id}`}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-gray-800">
                        {itemRow.quantity}
                      </td>
                      {vendors.map((v: any) => {
                        const vPrice = itemRow.vendor_prices?.[v.quotation_id]
                        const isLowest = vPrice?.unit_price != null && vPrice.unit_price === minUnitPrice

                        return (
                          <td
                            key={v.quotation_id}
                            className={clsx(
                              'py-3 px-4 text-right border-l border-gray-100',
                              isLowest && 'bg-primary/5'
                            )}
                          >
                            {vPrice?.unit_price != null ? (
                              <div>
                                <div className={clsx('font-bold font-mono', isLowest ? 'text-primary' : 'text-gray-900')}>
                                  {formatCurrency(vPrice.unit_price, activeCurrency, activeCurrencyPos)}
                                  {isLowest && (
                                    <span className="ml-1 text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.2 rounded border border-primary/20">
                                      Lowest
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  Total: {formatCurrency(vPrice.total_price, activeCurrency, activeCurrencyPos)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Not Quoted</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Terms & Conditions Compliance Matrix */}
        {termsMatrix.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-[15px] font-semibold text-gray-900">Terms & Compliance Matrix</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">Strict validation of contractual terms & vendor exceptions</span>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-4 min-w-[240px]">Requirement / Condition</th>
                    {vendors.map((v: any) => (
                      <th key={v.quotation_id} className="py-3 px-4 text-center border-l border-gray-100 min-w-[150px]">
                        <div>{v.vendor_name}</div>
                        <div className="text-[10px] font-normal text-gray-400">Status & Remarks</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px]">
                  {termsMatrix.map((termRow: any, idx: number) => (
                    <tr key={termRow.rfq_term_id || termRow.term_id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span>{termRow.term_title}</span>
                          {termRow.is_mandatory && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                              Mandatory
                            </span>
                          )}
                        </div>
                        {termRow.term_code && (
                          <span className="text-[10px] font-mono text-gray-400 block">{termRow.term_code}</span>
                        )}
                        {termRow.term_description && (
                          <div className="text-gray-500 text-xs mt-0.5">{termRow.term_description}</div>
                        )}
                      </td>
                      {vendors.map((v: any) => {
                        const compliancesMap = termRow.vendor_compliances || termRow.vendor_compliance || {}
                        const vComp = compliancesMap[v.quotation_id]
                        const rawVal = vComp?.compliance_value || vComp?.compliance_status || ''
                        const valLower = String(rawVal).toLowerCase().trim()

                        const isAgreed =
                          valLower === 'agreed' ||
                          valLower === 'agreed / yes' ||
                          valLower === 'yes' ||
                          valLower === 'true'
                        const isDeviated = valLower === 'deviated' || valLower === 'partial' || valLower === 'maybe'
                        const isRejected =
                          valLower === 'rejected' ||
                          valLower === 'disagreed' ||
                          valLower === 'no' ||
                          valLower === 'false'

                        return (
                          <td key={v.quotation_id} className="py-3 px-4 text-center border-l border-gray-100">
                            {isAgreed ? (
                              <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Agreed</span>
                              </div>
                            ) : isDeviated ? (
                              <div className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                <AlertCircle className="w-3 h-3" />
                                <span>{rawVal || 'Deviated'}</span>
                              </div>
                            ) : isRejected ? (
                              <div className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                <X className="w-3 h-3 stroke-[3]" />
                                <span>Rejected</span>
                              </div>
                            ) : rawVal && rawVal !== 'not_provided' ? (
                              <div className="inline-flex items-center font-mono font-bold text-gray-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                                <span>{rawVal}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[11px] italic">Not Provided</span>
                            )}

                            {vComp?.vendor_remarks && (
                              <div className="text-[11px] text-gray-500 mt-1 italic max-w-[180px] mx-auto break-words">
                                &quot;{vComp.vendor_remarks}&quot;
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Printable Sign-off Footer */}
        <div className="hidden print:grid grid-cols-3 gap-8 text-center text-xs text-gray-500 pt-16 mt-8 break-inside-avoid">
          <div>
            <div className="border-t border-dashed border-gray-400 pt-2 font-semibold text-gray-700">
              Prepared By (Procurement Officer)
            </div>
          </div>
          <div>
            <div className="border-t border-dashed border-gray-400 pt-2 font-semibold text-gray-700">
              Reviewed By (Tender Committee)
            </div>
          </div>
          <div>
            <div className="border-t border-dashed border-gray-400 pt-2 font-semibold text-gray-700">
              Approved By (Head of Procurement / MD)
            </div>
          </div>
        </div>
      </div>

      {/* Technical / Commercial Evaluation Score Modal */}
      {evaluatingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-gray-900">Score Vendor Quotation</h4>
                <p className="text-xs text-gray-500 font-medium">{evaluatingQuotation.vendor_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingQuotation(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-poppins">
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Technical Score (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={techScore}
                  onChange={(e) => setTechScore(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Commercial Score (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commScore}
                  onChange={(e) => setCommScore(e.target.value)}
                  placeholder="e.g. 90"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Evaluation Remarks</label>
                <textarea
                  rows={3}
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  placeholder="Optional committee / reviewer feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEvaluatingQuotation(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEvaluation}
                disabled={isEvaluating}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isEvaluating ? 'Saving...' : 'Save Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award RFQ Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(awardingVendor)}
        title="Award Request For Quotation"
        message={`Are you sure you want to award RFQ "${rfq?.rfq_no || targetId}" to "${awardingVendor?.name}" for total amount ${formatCurrency(awardingVendor?.amount || 0, activeCurrency, activeCurrencyPos)}? This will mark other vendor bids as rejected and notify the awarded vendor.`}
        confirmText="Confirm Award"
        variant="success"
        isLoading={isAwarding}
        onConfirm={handleConfirmAward}
        onClose={() => setAwardingVendor(null)}
      />

      {/* Embedded Print CSS for Landscape CS Matrix */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: landscape; margin: 8mm; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background-color: white !important; 
          }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:grid { display: grid !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #e2e8f0 !important; }
          * { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
        }
        `,
        }}
      />
    </div>
  )
}
