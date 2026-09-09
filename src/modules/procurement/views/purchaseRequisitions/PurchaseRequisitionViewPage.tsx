import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Printer,
  Mail,
  Phone,
  Building2,
  User,
  ShieldCheck,
  FileText,
  Clock,
  Calendar,
  Hash,
  Download,
  Paperclip,
  CheckCircle2,
  XCircle,
  Send,
  Edit,
  Eye,
  ExternalLink,
  Globe,
  AlertCircle,
  Check,
  ChevronRight,
  UserCheck,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react'
import {
  usePurchaseRequisitionDetails,
  useApprovePurchaseRequisition,
} from '../../hooks/usePurchaseRequisitions'
import { useWorkflowsList } from '@/modules/settings/hooks/useWorkflows'
import { useDepartments } from '@/modules/hrm'
import { useCostCenters } from '../../hooks/useCostCenters'
import { useBudgetHeads } from '../../hooks/useBudgetHeads'
import { useProductSelect2, useCategorySelect2 } from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { useQuery } from '@tanstack/react-query'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { clsx } from 'clsx'
import { useSettings } from '@/hooks/useSettings'
import { useAuthStore } from '@/store/useAuthStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useUiStore } from '@/store/useUiStore'
import { LoadingState } from '@/components/Loading/LoadingState'

export const PurchaseRequisitionViewPage = () => {
  const params = useParams({ strict: false }) as Record<string, string | undefined>
  const targetId = params.id || params.uuid || ''
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currency, currencyPosition, companyInformation, webSetting } = useSettings()
  const { showNotificationModal } = useUiStore()

  const { data: prResponse, isLoading, error } = usePurchaseRequisitionDetails(targetId)
  const pr = prResponse?.response || prResponse?.data || (prResponse as any)

  const { mutate: approvePR, isPending: isActionPending } = useApprovePurchaseRequisition()
  const [actionConfirm, setActionConfirm] = useState<{
    isOpen: boolean
    action: 'submit' | 'approve' | 'reject'
    remarks: string
  }>({
    isOpen: false,
    action: 'submit',
    remarks: '',
  })

  // Lookups for labels
  const { data: departmentsData } = useDepartments({ all: true })
  const deptMap = useMemo(() => {
    const list = departmentsData?.data || departmentsData?.response || []
    return new Map(list.map((d: any) => [d.id, d.name]))
  }, [departmentsData])

  const { data: costCentersData } = useCostCenters({ per_page: 100 })
  const costCenterMap = useMemo(() => {
    const list = costCentersData?.response || []
    return new Map(list.map((c: any) => [c.id, `${c.code} - ${c.name}`]))
  }, [costCentersData])

  const { data: budgetHeadsData } = useBudgetHeads({ per_page: 200 })
  const budgetHeadMap = useMemo(() => {
    const list = budgetHeadsData?.response || []
    return new Map(list.map((b: any) => [b.id, `${b.code} - ${b.name}`]))
  }, [budgetHeadsData])

  const { data: productsData } = useProductSelect2()
  const productMap = useMemo(() => {
    return new Map((productsData || []).map((p: any) => [p.id, p.text]))
  }, [productsData])

  const { data: categoriesData } = useCategorySelect2()
  const categoryMap = useMemo(() => {
    return new Map((categoriesData || []).map((c: any) => [c.id, c.text]))
  }, [categoriesData])

  const { data: unitsData } = useQuery({
    queryKey: ['unit-select2'],
    queryFn: getUnitSelect2,
  })
  const unitMap = useMemo(() => {
    return new Map((unitsData || []).map((u: any) => [u.id, u.text]))
  }, [unitsData])

  // Workflows configuration lookup
  const { data: workflowsData } = useWorkflowsList()
  const activePRWorkflow = useMemo(() => {
    const list = workflowsData?.data || []
    return list.find((w: any) => w.module === 'purchase_requisition' && w.is_active) || null
  }, [workflowsData])

  // Extract active Approval Request and Step Requests from PR
  const activeApprovalRequest = useMemo(() => {
    const list = pr?.approval_requests || pr?.approvalRequests || []
    if (!Array.isArray(list) || list.length === 0) return null
    return list[list.length - 1]
  }, [pr])

  const stepRequests = useMemo(() => {
    if (!activeApprovalRequest) return []
    const rawSteps = activeApprovalRequest.step_requests || activeApprovalRequest.stepRequests || []
    return [...rawSteps].sort((a: any, b: any) => {
      const orderA = a.workflow_step?.step_order ?? a.workflowStep?.step_order ?? a.id
      const orderB = b.workflow_step?.step_order ?? b.workflowStep?.step_order ?? b.id
      return orderA - orderB
    })
  }, [activeApprovalRequest])

  // Fallback configured steps preview when PR is in draft or hasn't started workflow yet
  const configuredSteps = useMemo(() => {
    if (stepRequests.length > 0) return []
    if (!activePRWorkflow?.steps) return []
    return [...activePRWorkflow.steps].sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
  }, [stepRequests, activePRWorkflow])

  const pendingSteps = useMemo(() => {
    return stepRequests.filter((s: any) => s.status === 'pending')
  }, [stepRequests])

  const activeStageNames = useMemo(() => {
    if (!pendingSteps || pendingSteps.length === 0) return ''
    return pendingSteps
      .map((s: any) => s.workflow_step?.name || s.workflowStep?.name || 'Stage')
      .join(', ')
  }, [pendingSteps])

  const myActiveStep = useMemo(() => {
    return pr?.active_approval_step || null
  }, [pr])

  const currentPendingStep = useMemo(() => {
    if (myActiveStep) {
      const match = stepRequests.find((s: any) => s.id === myActiveStep.step_request_id)
      if (match) return match
    }
    return stepRequests.find((s: any) => s.status === 'pending') || null
  }, [stepRequests, myActiveStep])

  const currentPendingIndex = useMemo(() => {
    return stepRequests.findIndex((s: any) => s.status === 'pending')
  }, [stepRequests])

  const items = useMemo(() => {
    if (!pr) return []
    return Array.isArray(pr.items) ? pr.items : []
  }, [pr])

  const { totalQuantity, totalEstimatedAmount } = useMemo(() => {
    let qty = 0
    let total = 0
    items.forEach((item: any) => {
      const q = parseFloat(String(item.quantity)) || 0
      const r = parseFloat(String(item.estimated_rate)) || 0
      qty += q
      total += q * r
    })
    return {
      totalQuantity: qty,
      totalEstimatedAmount: pr?.total_estimated_amount ? parseFloat(String(pr.total_estimated_amount)) : total,
    }
  }, [items, pr])

  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  const handlePrint = () => {
    window.print()
  }

  const handleActionSubmit = () => {
    if (!pr?.uuid) return
    approvePR(
      {
        uuid: pr.uuid,
        action: actionConfirm.action,
        remarks: actionConfirm.remarks,
      },
      {
        onSuccess: () => {
          const actionText =
            actionConfirm.action === 'submit'
              ? 'Submitted'
              : actionConfirm.action === 'approve'
                ? 'Approved'
                : 'Rejected'
          setActionConfirm({ isOpen: false, action: 'submit', remarks: '' })
          showNotificationModal(
            `Purchase Requisition ${actionText}!`,
            `PR ${pr.pr_no || ''} has been ${actionText.toLowerCase()} successfully.`,
            'success'
          )
        },
        onError: (err: any) => {
          const message = err.response?.data?.message || err.message || 'Action failed.'
          showNotificationModal('Action Failed', message, 'error')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <LoadingState message="Loading purchase requisition details..." />
      </div>
    )
  }

  if (error || !pr || (!pr.id && !pr.uuid)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">Purchase Requisition Not Found</h2>
          <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">
            The requested requisition record could not be found or has been removed from the system.
          </p>
          <button
            onClick={() => navigate({ to: '/procurement/purchase-requisitions' })}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Return to Requisitions List
          </button>
        </div>
      </div>
    )
  }

  const isEmergency = !!pr.is_emergency || pr.procurement_type === 'emergency'
  const statusFormatted = (pr.status || 'draft').toUpperCase()

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0 text-[#475569]">
      {/* Top Header Controls (Hidden on print) */}
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-6 print:hidden gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/procurement/purchase-requisitions"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Purchase Requisition Details</h1>
            {pr.pr_no && (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {pr.pr_no}
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
            <span>Print Requisition</span>
          </button>

          {pr.status === 'draft' && (
            <>
              <PermissionGuard permission="edit_purchase_requisition">
                <button
                  type="button"
                  onClick={() => navigate({ to: `/procurement/purchase-requisitions/edit/${pr.uuid}` as any })}
                  className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Draft</span>
                </button>
              </PermissionGuard>

              <PermissionGuard permission="submit_purchase_requisition">
                <button
                  type="button"
                  onClick={() => setActionConfirm({ isOpen: true, action: 'submit', remarks: '' })}
                  className="px-4 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit for Approval</span>
                </button>
              </PermissionGuard>
            </>
          )}

          {pr.status === 'submitted' && (
            pr.can_current_user_approve ? (
              <>
                <button
                  type="button"
                  onClick={() => setActionConfirm({ isOpen: true, action: 'approve', remarks: '' })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve Stage {myActiveStep?.name ? `(${myActiveStep.name})` : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionConfirm({ isOpen: true, action: 'reject', remarks: '' })}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Awaiting Stage: {activeStageNames || 'Review'}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Main Container: 20% Left Vertical Pipeline + 80% Right Invoice Document */}
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-5 items-start pb-12 print:block print:p-0 print:m-0">
        
        {/* Left Column (~20%): Sleek Vertical Multi-Level Approval Pipeline (Sticky on scroll) */}
        <div className="w-full lg:w-[260px] xl:w-[280px] shrink-0 sticky top-6 print:hidden space-y-3">
          
          {/* Card: Approval Pipeline Stepper */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-primary/10 text-primary rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Approval Path</h3>
                  <p className="text-[9px] text-gray-400">Workflow Stages</p>
                </div>
              </div>

              <span className={clsx(
                'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                pr.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                pr.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                pr.status === 'submitted' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                'bg-slate-100 text-slate-700'
              )}>
                {pr.status === 'submitted' ? 'In Review' : (pr.status || 'Draft')}
              </span>
            </div>

            {/* If In Review: Context Action Box */}
            {pr.status === 'submitted' && (
              <div className="p-2.5 bg-blue-50/90 rounded-lg border border-blue-200 text-xs space-y-2">
                <div className="flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">
                      {pr.can_current_user_approve ? 'Action Required (Your Stage):' : 'Awaiting Action:'}
                    </span>
                    <p className="text-[11px] font-bold text-gray-900 leading-tight mt-0.5 truncate max-w-[200px]" title={pr.can_current_user_approve ? (myActiveStep?.name || 'Your Review Stage') : (activeStageNames || 'Department / Management Review')}>
                      {pr.can_current_user_approve
                        ? (myActiveStep?.name || 'Your Review Stage')
                        : (activeStageNames || 'Department / Management Review')}
                    </p>
                    {pr.can_current_user_approve && myActiveStep?.name && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        ✓ You are the assigned approver for this stage
                      </p>
                    )}
                  </div>
                </div>

                {pr.can_current_user_approve ? (
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-blue-100">
                    <button
                      type="button"
                      onClick={() => setActionConfirm({ isOpen: true, action: 'approve', remarks: '' })}
                      className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold rounded-md transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionConfirm({ isOpen: true, action: 'reject', remarks: '' })}
                      className="py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white text-[9.5px] font-bold rounded-md transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-1.5 border-t border-blue-100">
                    <p className="text-[9.5px] text-amber-700 font-medium italic">
                      Waiting for designated approvers ({activeStageNames || 'Approver'})
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Vertical Stepper Timeline */}
            <div className="relative pl-5 space-y-4 before:absolute before:left-[8px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
              
              {/* Step 1: Draft Created */}
              <div className="relative group">
                <div className="absolute -left-[20px] top-0 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-3 ring-white shadow-xs">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                      1. Draft Created
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {formatDate(pr.created_at || pr.pr_date)}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">Requisition Created</h4>
                  <p className="text-[10px] text-gray-500 truncate" title={pr.creator?.name || pr.requisitioner_name || 'Creator'}>
                    By {pr.creator?.name || pr.requisitioner_name || 'Creator'}
                  </p>
                </div>
              </div>

              {/* Step 2: Submitted for Approval */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[20px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs',
                  pr.status !== 'draft' ? 'bg-emerald-600' : 'bg-amber-500 ring-amber-100 animate-pulse'
                )}>
                  {pr.status !== 'draft' ? (
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  ) : (
                    <Send className="w-2.5 h-2.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase tracking-wider',
                      pr.status !== 'draft' ? 'text-emerald-700' : 'text-amber-700'
                    )}>
                      2. Submission
                    </span>
                    {pr.status !== 'draft' && (
                      <span className="text-[9px] text-gray-400 font-mono">
                        {formatDate(pr.submitted_at || activeApprovalRequest?.created_at || pr.updated_at || pr.pr_date)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">
                    {pr.status !== 'draft' ? 'Submitted for Approval' : 'Awaiting Submission'}
                  </h4>
                  <p className="text-[10px] text-gray-500 truncate" title={pr.status !== 'draft' ? `Sent by ${pr.submitter?.name || pr.updater?.name || pr.creator?.name || 'Submitter'}` : ''}>
                    {pr.status !== 'draft'
                      ? `Sent by ${pr.submitter?.name || pr.updater?.name || pr.creator?.name || 'Submitter'}`
                      : 'Click "Submit for Approval"'}
                  </p>
                </div>
              </div>

              {/* Dynamic Approval Steps (Level 1, 2, ... N) */}
              {stepRequests.length > 0 &&
                stepRequests.map((step: any, idx: number) => {
                  const stepName = step.workflow_step?.name || step.workflowStep?.name || `Level ${idx + 1} Review`
                  const isApproved = step.status === 'approved'
                  const isPending = step.status === 'pending'
                  const isRejected = step.status === 'rejected'
                  const isMyStep = isPending && myActiveStep?.step_request_id === step.id
                  const approverName = step.approver?.name || (isApproved ? 'Authorized' : 'Assigned Approver')

                  return (
                    <div key={step.id || idx} className="relative group">
                      <div className={clsx(
                        'absolute -left-[20px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs transition-all',
                        isApproved ? 'bg-emerald-600' :
                        isMyStep ? 'bg-emerald-600 ring-emerald-200 animate-pulse' :
                        isPending ? 'bg-blue-600 ring-blue-100' :
                        isRejected ? 'bg-rose-600' :
                        'bg-gray-300 text-gray-600'
                      )}>
                        {isApproved && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        {isPending && <Clock className="w-2.5 h-2.5" />}
                        {isRejected && <XCircle className="w-2.5 h-2.5" />}
                        {!isApproved && !isPending && !isRejected && <span className="text-[8px] font-bold">{idx + 1}</span>}
                      </div>

                      <div className={clsx(
                        'p-2.5 rounded-lg border text-xs transition-all',
                        isApproved ? 'bg-emerald-50/40 border-emerald-200' :
                        isMyStep ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs' :
                        isPending ? 'bg-blue-50/70 border-blue-300' :
                        isRejected ? 'bg-rose-50/60 border-rose-300' :
                        'bg-gray-50/50 border-gray-200'
                      )}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={clsx(
                            'text-[8.5px] font-bold uppercase tracking-wider px-1 py-0.2 rounded',
                            isApproved ? 'bg-emerald-100 text-emerald-800' :
                            isMyStep ? 'bg-emerald-100 text-emerald-800 font-extrabold' :
                            isPending ? 'bg-blue-100 text-blue-800' :
                            isRejected ? 'bg-rose-100 text-rose-800' :
                            'bg-gray-200 text-gray-600'
                          )}>
                            Level {idx + 1}
                          </span>
                          <span className={clsx(
                            'text-[9px] font-semibold capitalize',
                            isApproved ? 'text-emerald-700' :
                            isMyStep ? 'text-emerald-700 font-bold' :
                            isPending ? 'text-blue-700 font-semibold' :
                            isRejected ? 'text-rose-700 font-bold' :
                            'text-gray-400'
                          )}>
                            {isApproved ? 'Approved' : isMyStep ? 'Your Action' : isPending ? 'Pending' : isRejected ? 'Rejected' : 'Queued'}
                          </span>
                        </div>

                        <h4 className="text-[11px] font-bold text-gray-900 truncate" title={stepName}>
                          {stepName}
                        </h4>
                        <p className="text-[10px] text-gray-600 truncate mt-0.5" title={approverName}>
                          {isMyStep ? 'Action required by you' : approverName}
                        </p>

                        {step.action_taken_at && (
                          <div className="text-[8.5px] text-gray-400 font-mono mt-1 pt-1 border-t border-gray-100 flex items-center justify-between">
                            <span>Done</span>
                            <span>{formatDate(step.action_taken_at)}</span>
                          </div>
                        )}

                        {step.comments && (
                          <div className="mt-1.5 p-1 bg-white rounded text-[9px] text-gray-600 italic border border-gray-100 truncate" title={step.comments}>
                            "{step.comments}"
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

              {/* Fallback Configured Preview Steps (If Draft) */}
              {stepRequests.length === 0 && configuredSteps.length > 0 &&
                configuredSteps.map((step: any, idx: number) => {
                  return (
                    <div key={step.id || idx} className="relative group">
                      <div className="absolute -left-[20px] top-0 w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center ring-3 ring-white shadow-xs text-[8px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="p-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.5px] font-bold uppercase tracking-wider text-gray-500">
                            Level {idx + 1}
                          </span>
                          <span className="text-[8.5px] text-gray-400 italic">Queued</span>
                        </div>
                        <h4 className="text-[10.5px] font-semibold text-gray-700 mt-0.5 truncate">{step.name}</h4>
                        <p className="text-[9.5px] text-gray-400 truncate mt-0.5">
                          {step.role?.name || (step.type === 'role-user' ? 'Designated Role' : 'Assigned Approver')}
                        </p>
                      </div>
                    </div>
                  )
                })}

              {/* Outcome Step */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[20px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs',
                  pr.status === 'approved' ? 'bg-emerald-600' : 'bg-gray-300 text-gray-600'
                )}>
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Outcome</span>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">PO Conversion</h4>
                  <p className="text-[9.5px] text-gray-400">
                    {pr.status === 'approved' ? 'Authorized for PO' : 'Awaiting approvals'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Approx 75% - 80%): Pristine Requisition Document */}
        <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:m-0 print:max-w-none">
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
                Requisition #{pr.pr_no || pr.id}
              </h2>
              <div className="flex items-center justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  <span>PR Date: {formatDate(pr.pr_date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  <span>Required By: {formatDate(pr.required_by_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Info Cards (Department & Requisitioner) */}
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
                {deptMap.get(pr.department_id) || `Department #${pr.department_id}`}
              </h3>

              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Cost Center:</span>
                  <span>{costCenterMap.get(pr.cost_center_id) || `Cost Center #${pr.cost_center_id}`}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Procurement Type:</span>
                  <span className="capitalize font-semibold text-slate-800">{pr.procurement_type || 'Normal'}</span>
                  {isEmergency && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">
                      Emergency
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Priority:</span>
                  <span className="capitalize font-semibold text-slate-800">{pr.priority || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Requisitioner Details */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#1e4ba1] text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Requisitioner Details
                </span>
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e4ba1] print:bg-blue-50 print:p-1.5">
                  <User className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">
                {pr.requisitioner_name || 'Designated Employee'}
              </h3>

              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Designation:</span>
                  <span>{pr.designation || 'Staff / Requisitioner'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Phone className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5 text-gray-400" />
                  <span>{pr.contact_no || 'No contact number provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Mail className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5 text-gray-400" />
                  <span>{pr.email || 'No email provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Requisitioned Items Table */}
          <div className="border-t border-gray-100 mx-6 py-4 print:mx-4 print:py-2">
            <div className="flex items-center justify-between mb-4 print:mb-2">
              <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">Requisition Items</h3>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                {items.length} {items.length === 1 ? 'Item' : 'Items'} Requisitioned
              </span>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden print:border print:rounded-xl">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 print:bg-gray-50">
                      <th className="px-6 py-4 w-16 print:px-3 print:py-2 text-center">SL.</th>
                      <th className="px-4 py-4 min-w-[250px] print:min-w-0 print:px-2 print:py-2">Product Description</th>
                      <th className="px-4 py-4 print:px-2 print:py-2">Category</th>
                      <th className="px-4 py-4 print:px-2 print:py-2">Unit</th>
                      <th className="px-4 py-4 print:px-2 print:py-2">Budget Head</th>
                      <th className="px-4 py-4 text-center print:px-2 print:py-2">Qty</th>
                      <th className="px-4 py-4 text-right print:px-2 print:py-2">Est. Rate</th>
                      <th className="px-6 py-4 text-right print:px-3 print:py-2">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px]">
                    {items.map((item: any, index: number) => {
                      const rowAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.estimated_rate) || 0)
                      return (
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
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">
                            {categoryMap.get(item.category_id) || item.category?.category_name || '-'}
                          </td>
                          <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">
                            {unitMap.get(item.unit_id) || item.unit?.unit_name || '-'}
                          </td>
                          <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2 text-xs">
                            {budgetHeadMap.get(item.budget_head_id) || (item.budget_head_id ? `#${item.budget_head_id}` : '-')}
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-gray-900 print:px-2 print:py-2">
                            {parseFloat(item.quantity) || 0}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-700 font-mono print:px-2 print:py-2">
                            {formatValue(item.estimated_rate)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#1e4ba1] text-[14px] print:text-[12px] print:px-3 print:py-2 font-mono">
                            {formatValue(rowAmount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Details Section (12 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-6 p-6 pt-2 print:gap-4 print:px-4 print:py-2 print:mt-2">
            {/* Left Column (8 cols): Justifications, Attachments, Chips */}
            <div className="lg:col-span-8 print:col-span-7 space-y-6 print:space-y-3">
              {/* Purpose & Justification */}
              {pr.purpose_justification && (
                <div className="p-5 bg-[#f8fafc] rounded-xl border border-gray-200 print:bg-[#f8fafc] print:p-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    Business Purpose & Justification
                  </span>
                  <div
                    className="text-[13px] text-gray-700 leading-relaxed print:text-[11px] prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: pr.purpose_justification }}
                  />
                </div>
              )}

              {/* Special Remarks */}
              {pr.remarks && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-600">
                  <span className="font-bold text-gray-700 block mb-1">Remarks / Instructions:</span>
                  <p>{pr.remarks}</p>
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
                      {pr.status || 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 print:bg-indigo-50 print:p-1.5">
                    <FileText className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Priority</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px] capitalize">
                      {pr.priority || 'Medium'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg shrink-0 print:bg-orange-50 print:p-1.5">
                    <Hash className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Procurement</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px] capitalize">
                      {pr.procurement_type || 'Normal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supporting Attachments */}
              {Array.isArray(pr.attachments) && pr.attachments.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="h-4 w-4 text-primary" />
                      Supporting Attachments ({pr.attachments.length})
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">Click to view or download</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {pr.attachments.map((att: any, idx: number) => {
                      const backendBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
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

            {/* Right Column (4 cols): Requisition Financial Summary */}
            <div className="lg:col-span-4 print:col-span-5 flex flex-col print:break-inside-avoid">
              <div className="bg-[#f8fafc] border border-gray-200 rounded-t-xl flex-grow print:bg-[#f8fafc]">
                <h3 className="text-[16px] font-semibold text-[#1e4ba1] p-4 print:text-[14px] print:p-2">
                  Requisition Summary
                </h3>

                <div className="space-y-3.5 bg-white text-[14px] p-4 print:text-[12px] print:p-2 print:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Line Items:</span>
                    <span className="text-gray-900 font-semibold">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Quantity:</span>
                    <span className="text-gray-900 font-semibold">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 pb-3 border-t border-b border-gray-200 my-2 print:pt-1 print:pb-1 print:my-1">
                    <span className="text-gray-900 font-bold">Estimated Total:</span>
                    <span className="text-[16px] text-[#1e4ba1] font-bold print:text-[14px]">
                      {formatValue(totalEstimatedAmount)}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-emerald-700">Approval State:</span>
                    <span className="text-[14px] font-bold text-emerald-800 uppercase">{statusFormatted}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f2d5c] p-5 flex items-center justify-between text-white rounded-b-xl border border-[#0f2d5c] print:bg-[#0f2d5c] print:p-3">
                <span className="text-[13px] font-bold tracking-wider print:text-[11px]">ESTIMATED TOTAL</span>
                <span className="text-[20px] font-bold print:text-[16px] font-mono">{formatValue(totalEstimatedAmount)}</span>
              </div>
            </div>
          </div>

          {/* Classic Invoice Signatures / Authorization Section */}
          <div className="mx-6 pt-16 pb-6 print:mx-4 print:pt-14 print:pb-4 border-t border-gray-100 print:border-t">
            <div className="flex flex-wrap sm:flex-nowrap items-end justify-between gap-6 print:flex-nowrap print:justify-between print:gap-4 text-center">
              {/* Line 1: Prepared By (Draft Creator / Requisitioner) */}
              <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                  <span className="text-[10px] font-mono text-gray-500 font-semibold">
                    ✓ Draft Created
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                    Prepared By
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium truncate" title={pr.creator?.name || pr.requisitioner_name}>
                    {pr.creator?.name || pr.requisitioner_name || 'Designated Employee'}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {pr.designation || 'Requisitioner'} {pr.created_at || pr.pr_date ? `• ${formatDate(pr.created_at || pr.pr_date)}` : ''}
                  </div>
                </div>
              </div>

              {/* Line 2: Submitted By (When submitted into approval workflow) */}
              <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                  {pr.status !== 'draft' ? (
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                      ✓ Submitted
                    </span>
                  ) : null}
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                    Submitted By
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium truncate" title={pr.status !== 'draft' ? (pr.submitter?.name || pr.updater?.name || pr.creator?.name || 'Authorized Submitter') : ''}>
                    {pr.status !== 'draft'
                      ? (pr.submitter?.name || pr.updater?.name || pr.creator?.name || 'Authorized Submitter')
                      : 'Pending Submission'}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {pr.status !== 'draft'
                      ? `Workflow Entry • ${formatDate(pr.submitted_at || activeApprovalRequest?.created_at || pr.updated_at || pr.pr_date)}`
                      : 'Awaiting Sign-off'}
                  </div>
                </div>
              </div>

              {/* Dynamic Approval Lines */}
              {stepRequests.length > 0 ? (
                stepRequests.map((step: any, idx: number) => {
                  const stepName = step.workflow_step?.name || step.workflowStep?.name || `Authority ${idx + 1}`
                  const isApproved = step.status === 'approved'
                  const isRejected = step.status === 'rejected'

                  return (
                    <div key={step.id || idx} className="flex-1 min-w-[120px] flex flex-col justify-end">
                      <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                        {isApproved ? (
                          <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                            ✓ Approved
                          </span>
                        ) : isRejected ? (
                          <span className="text-[10px] font-mono text-rose-600 font-semibold">
                            ✕ Rejected
                          </span>
                        ) : null}
                      </div>
                      <div className="border-t border-gray-300 pt-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800 truncate" title={stepName}>
                          {stepName}
                        </div>
                        <div className="text-[11px] text-gray-600 font-medium truncate">
                          {isApproved
                            ? (step.approver?.name || 'Authorized Signatory')
                            : isRejected
                              ? (step.approver?.name || 'Reviewing Authority')
                              : (step.approver?.name || '')}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {step.approver?.designation || step.workflow_step?.approver_type || ''}
                          {isApproved && step.action_taken_at ? ` • ${formatDate(step.action_taken_at)}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : configuredSteps.length > 0 ? (
                configuredSteps.map((step: any, idx: number) => (
                  <div key={step.id || idx} className="flex-1 min-w-[120px] flex flex-col justify-end">
                    <div className="h-12" />
                    <div className="border-t border-gray-300 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800 truncate" title={step.name}>
                        {step.name || `Authority ${idx + 1}`}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {step.approver_type || 'Authorized Signatory'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                    <div className="h-12" />
                    <div className="border-t border-gray-300 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        Department Head
                      </div>
                      <div className="text-[10px] text-gray-400">Department Authority</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                    <div className="h-12" />
                    <div className="border-t border-gray-300 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                        Authorized Signatory
                      </div>
                      <div className="text-[10px] text-gray-400">Financial Controller</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Approval / Rejection / Submission Confirmation Modal */}
      {actionConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className={clsx(
                'p-3 rounded-xl flex items-center justify-center text-white shrink-0',
                actionConfirm.action === 'submit' ? 'bg-[#0d7a50]' :
                actionConfirm.action === 'approve' ? 'bg-emerald-600' :
                'bg-rose-600'
              )}>
                {actionConfirm.action === 'submit' && <Send className="w-5 h-5" />}
                {actionConfirm.action === 'approve' && <CheckCircle2 className="w-5 h-5" />}
                {actionConfirm.action === 'reject' && <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 capitalize">
                  {actionConfirm.action === 'submit'
                    ? 'Submit Requisition for Approval'
                    : actionConfirm.action === 'approve'
                      ? 'Approve Requisition Stage'
                      : 'Reject Purchase Requisition'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {actionConfirm.action === 'submit'
                    ? 'Trigger multi-level approval pipeline across designated authorization levels.'
                    : actionConfirm.action === 'approve'
                      ? 'Authorize and advance this requisition to the next workflow stage.'
                      : 'Decline this requisition and log your remarks for the requester.'}
                </p>
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Requisition No</span>
                <span className="font-bold text-gray-800">{pr.pr_no || 'Draft'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Estimated Amount</span>
                <span className="font-bold text-[#1e4ba1] font-mono">{formatValue(totalEstimatedAmount)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {actionConfirm.action === 'reject' ? 'Rejection Reason / Comments (Required)' : 'Approval Remarks / Notes (Optional)'}
              </label>
              <textarea
                rows={3}
                value={actionConfirm.remarks}
                onChange={(e) => setActionConfirm((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder={
                  actionConfirm.action === 'reject'
                    ? 'State the reason for rejecting this requisition...'
                    : 'Add any specific instructions or approvals notes...'
                }
                className="w-full p-3 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setActionConfirm({ isOpen: false, action: 'submit', remarks: '' })}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={isActionPending || (actionConfirm.action === 'reject' && !actionConfirm.remarks.trim())}
                className={clsx(
                  'px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                  actionConfirm.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#0d7a50] hover:bg-[#0a6642]'
                )}
              >
                {isActionPending ? 'Processing...' : actionConfirm.action === 'submit' ? 'Submit Now' : actionConfirm.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

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
