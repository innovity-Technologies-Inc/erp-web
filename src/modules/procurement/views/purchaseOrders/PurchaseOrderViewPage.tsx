import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Printer,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Layers,
  Paperclip,
  Check,
  X,
  FileText,
  Clock,
  ShieldCheck,
  ShoppingBag,
  History,
  FileCheck2,
  AlertCircle,
  Globe,
  Plus,
  Mail,
  Phone,
  User,
  ExternalLink,
  Hash,
  Eye,
  Download,
  Sparkles,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import {
  usePurchaseOrderDetails,
  useApprovePO,
  useDispatchPurchaseOrder,
  useAmendPO,
  useDeletePurchaseOrder,
} from '../../hooks/usePurchaseOrders'
import { useWorkflowsList } from '@/modules/settings/hooks/useWorkflows'
import { useDepartments } from '@/modules/hrm'
import { useCostCenters } from '../../hooks/useCostCenters'
import { useProductSelect2, useCategorySelect2 } from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useSettings } from '@/hooks/useSettings'
import { useUiStore } from '@/store/useUiStore'
import { LoadingState } from '@/components/Loading/LoadingState'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { ManagePOScheduleModal } from '../../components/purchaseOrder/ManagePOScheduleModal'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { PurchaseOrder, POStatus } from '../../api/types'
import { clsx } from 'clsx'

export const PurchaseOrderViewPage = () => {
  const params = useParams({ strict: false }) as Record<string, string | undefined>
  const uuid = params.id || params.uuid || ''
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currency, currencyPosition, companyInformation, webSetting } = useSettings()
  const { showNotificationModal } = useUiStore()

  // Queries
  const { data: poResponse, isLoading, error, refetch } = usePurchaseOrderDetails(uuid)
  const po: PurchaseOrder | undefined = poResponse?.response || (poResponse as any)?.data

  const activeCurrency = currency || '৳'
  const activeCurrencyPos = currencyPosition || 'right'

  // Mutations
  const { mutate: approvePOMutate, isPending: isApproving } = useApprovePO()
  const { mutate: dispatchPOMutate, isPending: isDispatching } = useDispatchPurchaseOrder()
  const { mutate: amendPOMutate, isPending: isAmending } = useAmendPO()
  const { mutate: deletePOMutate, isPending: isDeleting } = useDeletePurchaseOrder()

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
  const activePOWorkflow = useMemo(() => {
    const list = workflowsData?.data || []
    return list.find((w: any) => (w.module === 'purchase_order' || w.module === 'po') && w.is_active) || null
  }, [workflowsData])

  // Extract active Approval Request and Step Requests from PO
  const activeApprovalRequest = useMemo(() => {
    const list = (po as any)?.approval_requests || (po as any)?.approvalRequests || []
    if (!Array.isArray(list) || list.length === 0) return null
    return list[list.length - 1]
  }, [po])

  const stepRequests = useMemo(() => {
    if (!activeApprovalRequest) return []
    const rawSteps = activeApprovalRequest.step_requests || activeApprovalRequest.stepRequests || []
    return [...rawSteps].sort((a: any, b: any) => {
      const orderA = a.workflow_step?.step_order ?? a.workflowStep?.step_order ?? a.id
      const orderB = b.workflow_step?.step_order ?? b.workflowStep?.step_order ?? b.id
      return orderA - orderB
    })
  }, [activeApprovalRequest])

  // Fallback configured steps preview when PO is in draft
  const configuredSteps = useMemo(() => {
    if (stepRequests.length > 0) return []
    if (!activePOWorkflow?.steps) return []
    return [...activePOWorkflow.steps].sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
  }, [stepRequests, activePOWorkflow])

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
    return (po as any)?.active_approval_step || null
  }, [po])

  const canCurrentUserApprove = useMemo(() => {
    return Boolean((po as any)?.can_current_user_approve)
  }, [po])

  // Modal States
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean
    action: 'submit' | 'approve' | 'reject'
    remarks: string
  }>({
    isOpen: false,
    action: 'submit',
    remarks: '',
  })

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Amendment Modal State
  const [amendModal, setAmendModal] = useState<{
    isOpen: boolean
    reason: string
    deliveryDate: string
    termsAndConditions: string
    items: Record<number, { quantity: number; rate: number }>
  }>({
    isOpen: false,
    reason: '',
    deliveryDate: '',
    termsAndConditions: '',
    items: {},
  })

  const handlePrint = () => {
    window.print()
  }

  // Delivery Progress Calculation
  const items = useMemo(() => {
    return Array.isArray(po?.items) ? po.items : []
  }, [po?.items])

  const deliverySchedules = useMemo(() => {
    if (Array.isArray(po?.schedules) && po.schedules.length > 0) {
      return po.schedules
    }
    const currentItems = Array.isArray(po?.items) ? po.items : []
    const flattened: any[] = []
    currentItems.forEach((it: any) => {
      if (Array.isArray(it.schedules) && it.schedules.length > 0) {
        flattened.push(...it.schedules)
      }
    })
    return flattened
  }, [po?.schedules, po?.items])

  const { totalQuantity, totalOrdered, totalReceived, progressPercent } = useMemo(() => {
    const ordered = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)
    const received = items.reduce((acc, it) => acc + (Number(it.received_quantity) || 0), 0)
    const percent = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0
    return { totalQuantity: ordered, totalOrdered: ordered, totalReceived: received, progressPercent: percent }
  }, [items])

  // Open Amendment Modal
  const openAmendModal = () => {
    const initialItems: Record<number, { quantity: number; rate: number }> = {}
    items.forEach((it) => {
      initialItems[it.id] = {
        quantity: Number(it.quantity),
        rate: Number(it.rate),
      }
    })
    setAmendModal({
      isOpen: true,
      reason: '',
      deliveryDate: (po as any)?.delivery_date ? (po as any).delivery_date.split('T')[0] : '',
      termsAndConditions: (po as any)?.terms_and_conditions || '',
      items: initialItems,
    })
  }

  // Submit PO Amendment
  const handleSaveAmendment = () => {
    if (!amendModal.reason.trim()) {
      showNotificationModal('Reason Required', 'Please provide a justification / reason for amending this PO.', 'error')
      return
    }

    // Validation Guard: Quantity cannot be less than already received quantity
    for (const it of items) {
      const amendedItem = amendModal.items[it.id]
      const receivedQty = Number(it.received_quantity || 0)
      if (amendedItem && Number(amendedItem.quantity) < receivedQty) {
        const prodName = productMap.get(it.product_id) || it.product?.product_name || it.product?.name || `Item #${it.id}`
        showNotificationModal(
          'Invalid Quantity',
          `Amended quantity for "${prodName}" (${amendedItem.quantity}) cannot be less than the already received quantity (${receivedQty}).`,
          'error'
        )
        return
      }
    }

    const amendItems = Object.entries(amendModal.items).map(([itemId, data]) => ({
      purchase_order_item_id: Number(itemId),
      quantity: Number(data.quantity),
      rate: Number(data.rate),
    }))

    amendPOMutate(
      {
        uuid,
        data: {
          reason: amendModal.reason.trim(),
          delivery_date: amendModal.deliveryDate || undefined,
          terms_and_conditions: amendModal.termsAndConditions || undefined,
          items: amendItems,
        },
      },
      {
        onSuccess: () => {
          setAmendModal({ isOpen: false, reason: '', deliveryDate: '', termsAndConditions: '', items: {} })
          showNotificationModal('PO Amended', 'Purchase order amendment registered successfully. PO has been set to draft for re-approval.', 'success')
          refetch()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to amend Purchase Order.'
          showNotificationModal('Amendment Error', msg, 'error')
        },
      }
    )
  }

  // Submit / Approve / Reject Confirmation
  const handleApprovalSubmit = () => {
    approvePOMutate(
      {
        uuid,
        action: approvalModal.action,
        remarks: approvalModal.remarks,
      },
      {
        onSuccess: () => {
          const actionText =
            approvalModal.action === 'submit'
              ? 'submitted for approval'
              : approvalModal.action === 'approve'
              ? 'approved'
              : 'rejected'
          setApprovalModal({ isOpen: false, action: 'submit', remarks: '' })
          showNotificationModal('Status Updated', `Purchase Order was ${actionText}.`, 'success')
          refetch()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Approval action failed.'
          showNotificationModal('Action Failed', msg, 'error')
        },
      }
    )
  }

  // Issue PO to Vendor
  const handleIssueSubmit = () => {
    dispatchPOMutate(uuid, {
      onSuccess: () => {
        setIsIssueModalOpen(false)
        showNotificationModal('PO Issued!', `Purchase Order "${po?.po_no}" has been officially issued to the vendor.`, 'success')
        refetch()
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to issue Purchase Order.'
        showNotificationModal('Dispatch Failed', msg, 'error')
      },
    })
  }

  // Submit for Approval with Delivery Schedule Validation
  const handleSubmitForApproval = () => {
    const currentItems = Array.isArray(po?.items) ? po.items : []
    const schedules = Array.isArray(po?.schedules) ? po.schedules : []

    if (schedules.length === 0) {
      showNotificationModal(
        'Delivery Schedule Required',
        'Cannot submit Purchase Order for approval without a delivery schedule. Please configure delivery milestones first.',
        'warning'
      )
      setIsScheduleModalOpen(true)
      return
    }

    if (currentItems.length > 0) {
      const incompleteItem = currentItems.find((it) => {
        const itemSchedQty = schedules
          .filter((s: any) => Number(s.purchase_order_item_id) === Number(it.id))
          .reduce((sum: number, s: any) => sum + (Number(s.planned_quantity) || 0), 0)
        return Math.abs(itemSchedQty - (Number(it.quantity) || 0)) > 0.001
      })

      if (incompleteItem) {
        showNotificationModal(
          'Incomplete Delivery Schedule',
          'All line items must be 100% scheduled before submitting for approval. Please complete the delivery schedule.',
          'warning'
        )
        setIsScheduleModalOpen(true)
        return
      }
    }

    setApprovalModal({ isOpen: true, action: 'submit', remarks: '' })
  }

  // Delete Draft Handler
  const handleDeleteDraft = () => {
    if (!uuid) return
    deletePOMutate(uuid, {
      onSuccess: () => {
        setIsDeleteModalOpen(false)
        showNotificationModal('Draft Deleted', `Purchase Order "${po?.po_no}" deleted successfully.`, 'success')
        navigate({ to: '/procurement/purchase-orders' as any })
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to delete Purchase Order.'
        showNotificationModal('Delete Failed', msg, 'error')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <LoadingState message="Loading Purchase Order details..." />
      </div>
    )
  }

  if (error || !po || (!po.id && !po.uuid)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center font-poppins">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
          <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">Purchase Order Not Found</h2>
          <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">
            The requested Purchase Order record could not be found or has been removed from the system.
          </p>
          <button
            onClick={() => navigate({ to: '/procurement/purchase-orders' as any })}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Return to PO List
          </button>
        </div>
      </div>
    )
  }

  const rawStatus = po.status
  const status: POStatus = (typeof rawStatus === 'object' && rawStatus !== null ? (rawStatus as any).value : rawStatus) || 'draft'
  const isDraft = status === 'draft'
  const isPending = status === 'pending_approval'
  const isApproved = status === 'approved'
  const isIssued = status === 'issued' || status === 'partially_delivered'
  const isFullyDelivered = status === 'fully_delivered' || status === 'closed'
  const statusFormatted = (status || 'draft').toUpperCase()

  const departmentName = po.department?.name || deptMap.get(po.department_id) || (po.department_id ? `Department #${po.department_id}` : '—')
  const costCenterName = po.cost_center?.name || po.costCenter?.name || costCenterMap.get(po.cost_center_id) || (po.cost_center_id ? `Cost Center #${po.cost_center_id}` : '—')

  const formatValue = (val: number | string) => formatCurrency(val, activeCurrency, activeCurrencyPos)

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0 text-[#475569]">
      {/* Top Header Controls (Hidden on print) */}
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-6 print:hidden gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/procurement/purchase-orders"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Purchase Order Details</h1>
            {po.po_no && (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {po.po_no}
              </span>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Order</span>
          </button>

          {/* Draft Actions */}
          {isDraft && (
            <>
              <PermissionGuard permission="edit_po">
                <button
                  type="button"
                  onClick={() => navigate({ to: `/procurement/purchase-orders/edit/${po.uuid}` as any })}
                  className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Draft</span>
                </button>
              </PermissionGuard>

              <PermissionGuard permission="edit_po">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-4 py-2 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span>Delivery Schedule</span>
                </button>
              </PermissionGuard>

              <PermissionGuard permission="create_po">
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  className="px-4 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit for Approval</span>
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_po">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>Delete Draft</span>
                </button>
              </PermissionGuard>
            </>
          )}

          {/* In Review Actions */}
          {isPending && (
            canCurrentUserApprove ? (
              <>
                <button
                  type="button"
                  onClick={() => setApprovalModal({ isOpen: true, action: 'approve', remarks: '' })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve Stage {myActiveStep?.name ? `(${myActiveStep.name})` : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalModal({ isOpen: true, action: 'reject', remarks: '' })}
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

          {/* Approved: Issue to Vendor Action */}
          {isApproved && (
            <PermissionGuard permission="issue_po">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
              >
                <Truck className="h-4 w-4" />
                <span>Issue PO to Vendor</span>
              </button>
            </PermissionGuard>
          )}

          {/* Issued Actions: Amendment */}
          {isIssued && (
            <PermissionGuard permission="amend_po">
              <button
                type="button"
                onClick={openAmendModal}
                className="px-4 py-2 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Amend PO</span>
              </button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Main Container: Left Document + Right Vertical Approval Pipeline */}
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-5 items-start pb-12 print:block print:p-0 print:m-0">
        
        {/* Left Column: Pristine PO Document & Commercial Specs */}
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
                Purchase Order #{po.po_no || po.id}
              </h2>
              <div className="flex items-center justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  <span>PO Date: {formatDate(po.po_date)}</span>
                </div>
                {po.po_validity_date && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                    <span>Validity: {formatDate(po.po_validity_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2-Column Info Cards (Vendor Details & Issuing Department / Cost Center) */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 p-6 pb-4 print:p-4 print:gap-4 border-b border-gray-100">
            {/* Card 1: Vendor / Supplier Info */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Vendor / Supplier Details
                </span>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 print:bg-orange-50 print:p-1.5">
                  <Building2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">
                {po.vendor?.name || `Vendor #${po.vendor_id}`}
              </h3>

              <div className="space-y-3 print:space-y-1.5">
                {po.vendor?.code && (
                  <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                    <span className="font-bold text-gray-700 shrink-0">Vendor Code:</span>
                    <span className="font-mono text-gray-900 font-semibold">{po.vendor.code}</span>
                  </div>
                )}
                {po.vendor?.contact_person && (
                  <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                    <span className="font-bold text-gray-700 shrink-0">Contact Person:</span>
                    <span>{po.vendor.contact_person}</span>
                  </div>
                )}
                {(po.vendor?.phone || po.vendor?.mobile) && (
                  <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                    <Phone className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5 text-gray-400" />
                    <span>{po.vendor.mobile || po.vendor.phone}</span>
                  </div>
                )}
                {po.vendor?.email && (
                  <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                    <Mail className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5 text-gray-400" />
                    <a href={`mailto:${po.vendor.email}`} className="text-primary hover:underline">
                      {po.vendor.email}
                    </a>
                  </div>
                )}
                {po.vendor?.address && (
                  <div className="text-[12px] text-gray-500 pt-2 border-t border-gray-100 print:text-[10px]">
                    {po.vendor.address}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Issuing Department, Cost Center & Reference */}
            <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#1e4ba1] text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Issuing Department & Cost Center
                </span>
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e4ba1] print:bg-blue-50 print:p-1.5">
                  <ShieldCheck className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">
                {departmentName}
              </h3>

              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Cost Center:</span>
                  <span>{costCenterName}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Currency:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {activeCurrency}
                  </span>
                </div>
                {po.rfq_id && (
                  <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                    <span className="font-bold text-gray-700 shrink-0">Source RFQ:</span>
                    {po.rfq?.uuid ? (
                      <Link
                        to={`/procurement/rfqs/view/${po.rfq.uuid}` as any}
                        className="font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>{po.rfq?.rfq_no || `RFQ #${po.rfq_id}`}</span>
                        <ExternalLink className="w-3 h-3 print:hidden" />
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-900">{po.rfq?.rfq_no || `RFQ #${po.rfq_id}`}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <span className="font-bold text-gray-700 shrink-0">Created By:</span>
                  <span>{po.creator?.name || 'System User'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Progress Banner (if issued / delivered) */}
          {(isIssued || isFullyDelivered) && (
            <div className="mx-6 my-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 print:hidden space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-purple-950">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span>Goods Delivery Progress:</span>
                  <span className="font-mono">{totalReceived} of {totalOrdered} items received</span>
                </div>
                <span className="font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                  {progressPercent}% Delivered
                </span>
              </div>
              <div className="w-full h-2.5 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Ordered Items Table */}
          <div className="border-t border-gray-100 mx-6 py-4 print:mx-4 print:py-2">
            <div className="flex items-center justify-between mb-4 print:mb-2">
              <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">Purchase Order Items</h3>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                {items.length} {items.length === 1 ? 'Item' : 'Items'} Ordered
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
                      <th className="px-4 py-4 text-center print:px-2 print:py-2">Qty</th>
                      <th className="px-4 py-4 text-right print:px-2 print:py-2">Unit Rate</th>
                      <th className="px-4 py-4 text-right print:px-2 print:py-2">VAT</th>
                      <th className="px-6 py-4 text-right print:px-3 print:py-2">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px]">
                    {items.map((item: any, index: number) => {
                      const lineQty = Number(item.quantity) || 0
                      const lineRate = Number(item.rate) || 0
                      const lineVatPct = Number(item.vat_percentage) || 0
                      const lineSub = lineQty * lineRate
                      const lineVatAmt = Number(item.vat_amount) || (lineSub * (lineVatPct / 100))
                      const lineTotal = Number(item.total_price) || (lineSub + lineVatAmt)
                      const prodName = productMap.get(item.product_id) || item.product?.product_name || item.product?.name || `Product #${item.product_id}`
                      const catName = categoryMap.get(item.category_id) || item.category?.category_name || item.category?.name || '-'
                      const unitName = unitMap.get(item.unit_id) || item.unit?.unit_name || item.unit?.name || 'Pcs'

                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors print:bg-white">
                          <td className="px-6 py-4 text-gray-500 print:px-3 print:py-2 text-center font-mono">{index + 1}</td>
                          <td className="px-4 py-4 print:px-2 print:py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-[#1e4ba1] text-[14px] print:text-[12px]">
                                {prodName}
                              </span>
                              {item.item_description && (
                                <span className="text-[11px] text-gray-500 font-medium print:text-[9px]">
                                  {item.item_description}
                                </span>
                              )}
                              {item.hs_code && (
                                <span className="inline-block mt-0.5 text-[9.5px] font-mono font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded w-fit">
                                  HS: {item.hs_code}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">
                            {catName}
                          </td>
                          <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">
                            {unitName}
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-gray-900 print:px-2 print:py-2">
                            {lineQty}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-700 font-mono print:px-2 print:py-2">
                            {formatValue(lineRate)}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-600 font-mono print:px-2 print:py-2">
                            <div>{lineVatPct}%</div>
                            <div className="text-[10px] text-gray-400">{formatValue(lineVatAmt)}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#1e4ba1] text-[14px] print:text-[12px] print:px-3 print:py-2 font-mono">
                            {formatValue(lineTotal)}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-6 p-6 pt-2 print:gap-4 print:px-4 print:py-2 print:mt-2 items-start">
            {/* Left Column (8 cols): Terms, Schedules, Attachments */}
            <div className="lg:col-span-8 print:col-span-7 space-y-4 print:space-y-2.5">
              {/* Payment & Delivery Terms */}
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-gray-200 print:bg-[#f8fafc] print:p-2.5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block print:text-[9.5px]">
                  Commercial & Delivery Terms
                </span>
                <div className="space-y-1.5 text-[12.5px] text-gray-700 leading-relaxed print:text-[10px]">
                  <div>
                    <span className="font-bold text-gray-800">Payment Terms: </span>
                    <span>{po.payment_terms || 'Standard Net 30 Days after invoice & delivery acceptance'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Delivery Terms: </span>
                    <span>{po.delivery_terms || 'Standard warehouse delivery as per agreed schedule'}</span>
                  </div>
                </div>
              </div>

              {/* Special Remarks */}
              {po.remarks && (
                <div className="p-3.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 print:p-2 print:text-[10px]">
                  <span className="font-bold text-gray-700 block mb-0.5">Remarks / Special Instructions:</span>
                  <p>{po.remarks}</p>
                </div>
              )}

              {/* Delivery Schedules Section (Hidden in print) */}
              <div className="space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-primary" />
                    Delivery Schedule Milestones ({deliverySchedules.length})
                  </span>

                  {isDraft && (
                    <PermissionGuard permission="edit_po">
                      <button
                        type="button"
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Manage Schedule</span>
                      </button>
                    </PermissionGuard>
                  )}
                </div>

                {deliverySchedules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {deliverySchedules.map((sched: any, sIdx: number) => {
                      const plannedQty = Number(sched.planned_quantity) || 0
                      const receivedQty = Number(sched.received_quantity) || 0
                      const progress = plannedQty > 0 ? Math.min(100, Math.round((receivedQty / plannedQty) * 100)) : 0

                      // Match item details from po.items
                      const matchedItem = (po.items || []).find((it: any) => Number(it.id) === Number(sched.purchase_order_item_id))
                      const itemName = matchedItem?.product?.name || matchedItem?.product?.product_name || (sched.item?.product?.name) || `Item #${sched.purchase_order_item_id}`
                      const unitName = matchedItem?.unit?.name || matchedItem?.unit?.unit_name || matchedItem?.unit?.code || 'Units'

                      const rawStatus = typeof sched.status === 'object' && sched.status !== null ? sched.status.value : sched.status || 'in_progress'
                      const isComplete = rawStatus === 'completed'
                      const isPartial = rawStatus === 'partially_received'

                      return (
                        <div
                          key={sched.id || sIdx}
                          className="p-3.5 bg-white border border-gray-200 rounded-xl text-xs space-y-2.5 shadow-2xs hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-center justify-between font-bold text-gray-900">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-700 border border-slate-200 shrink-0">
                                {sched.schedule_no || `SCH-${sIdx + 1}`}
                              </span>
                              <span className="truncate text-gray-800 font-semibold" title={itemName}>
                                {itemName}
                              </span>
                            </div>
                            <span
                              className={clsx(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border shrink-0',
                                isComplete
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isPartial
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              )}
                            >
                              {isComplete ? 'Completed' : isPartial ? 'Partially Received' : 'In Progress'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-gray-500 text-[11px]">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-gray-400">Planned Date</span>
                              <span className="font-semibold text-gray-800">{formatDate(sched.planned_delivery_date)}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] uppercase font-bold text-gray-400">Target Qty</span>
                              <span className="font-mono font-bold text-gray-900">
                                {plannedQty} {unitName}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-medium text-gray-500">
                              <span>Received: <strong className="text-gray-900 font-mono">{receivedQty}</strong> / {plannedQty}</span>
                              <span className="font-bold text-primary">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={clsx(
                                  'h-full rounded-full transition-all duration-300',
                                  isComplete ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-primary'
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center space-y-2">
                    <p className="text-xs text-gray-500">
                      No delivery schedule milestones defined yet for this order.
                    </p>
                    {isDraft && (
                      <PermissionGuard permission="edit_po">
                        <button
                          type="button"
                          onClick={() => setIsScheduleModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-white border border-primary/20 hover:bg-primary/5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Configure Delivery Milestones</span>
                        </button>
                      </PermissionGuard>
                    )}
                  </div>
                )}
              </div>

              {/* Supporting Attachments */}
              {Array.isArray(po.attachments) && po.attachments.length > 0 && (
                <div className="space-y-2 print:hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      Attached Documents ({po.attachments.length})
                    </span>
                    <span className="text-[10.5px] text-gray-400 font-medium">Click to view or download</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {po.attachments.map((att: any, idx: number) => {
                      const backendBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
                      const fileUrl = att.file_url 
                        ? (att.file_url.startsWith('http') ? att.file_url : `${backendBaseUrl}${att.file_url.startsWith('/') ? '' : '/'}${att.file_url}`)
                        : (att.file_path ? `${backendBaseUrl}/storage/${att.file_path}` : '#')
                      
                      const ext = (att.file_name || '').split('.').pop()?.toUpperCase() || 'FILE'

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white border border-gray-200 hover:border-primary/40 rounded-xl text-xs shadow-2xs hover:shadow-xs transition-all group"
                        >
                          <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-mono text-[9px] font-bold rounded shrink-0">
                              {ext}
                            </span>
                            <span className="font-semibold text-gray-800 truncate group-hover:text-primary transition-colors text-[11px]" title={att.file_name}>
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
                                  className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                                  title="View / Preview File in New Tab"
                                >
                                  <Eye className="h-3 w-3" />
                                </a>
                                <a
                                  href={fileUrl}
                                  download={att.file_name || 'attachment'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="h-3 w-3" />
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

              {/* Amendment Revisions History (Audit Trail) */}
              {Array.isArray(po.amendments) && po.amendments.length > 0 && (
                <div className="space-y-2.5 pt-1 print:break-inside-avoid">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                      Amendment Revisions History ({po.amendments.length})
                    </span>
                    <span className="text-[10.5px] text-gray-400 font-medium">Audit Trail</span>
                  </div>

                  <div className="space-y-2">
                    {po.amendments.map((amend: any, aIdx: number) => (
                      <div
                        key={amend.id || aIdx}
                        className="p-3 bg-amber-50/40 border border-amber-200/70 rounded-xl text-xs space-y-1.5 shadow-2xs print:p-2"
                      >
                        <div className="flex items-center justify-between font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 font-mono text-[10.5px] font-bold text-amber-800 border border-amber-300 print:text-[9px]">
                              {amend.amendment_no || `POA-${aIdx + 1}`}
                            </span>
                            <span className="text-gray-500 text-[10.5px] font-normal print:text-[9px]">
                              {formatDate(amend.amendment_date || amend.created_at)}
                            </span>
                          </div>
                          <span className="text-[10.5px] font-semibold text-gray-700 print:text-[9px]">
                            By: {amend.amended_by?.name || amend.amendedBy?.name || 'Authorized User'}
                          </span>
                        </div>

                        {amend.reason && (
                          <p className="text-[11px] text-gray-700 italic bg-white/70 p-1.5 rounded-lg border border-amber-100 print:text-[9.5px]">
                            <strong className="not-italic text-gray-800 font-semibold">Justification:</strong> {amend.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (4 cols): Order Financial Summary */}
            <div className="lg:col-span-4 print:col-span-5 flex flex-col print:break-inside-avoid">
              <div className="bg-[#f8fafc] border border-gray-200 rounded-t-xl print:bg-[#f8fafc]">
                <h3 className="text-[15px] font-semibold text-[#1e4ba1] p-3.5 print:text-[13px] print:p-2">
                  Order Summary
                </h3>

                <div className="space-y-3 bg-white text-[13.5px] p-4 print:text-[11.5px] print:p-2 print:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Line Items:</span>
                    <span className="text-gray-900 font-semibold">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Quantity:</span>
                    <span className="text-gray-900 font-semibold">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-mono text-gray-900 font-semibold">{formatValue(po.sub_total || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total VAT / Tax:</span>
                    <span className="font-mono text-gray-900 font-semibold">{formatValue(po.vat_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 pb-2.5 border-t border-b border-gray-200 my-1.5 print:pt-1 print:pb-1 print:my-1">
                    <span className="text-gray-900 font-bold">Grand Total:</span>
                    <span className="text-[15px] text-[#1e4ba1] font-bold print:text-[13px] font-mono">
                      {formatValue(po.total_amount || 0)}
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between print:mt-1.5 print:p-1.5">
                    <span className="text-[12px] font-semibold text-emerald-700 print:text-[10px]">Approval State:</span>
                    <span className="text-[13px] font-bold text-emerald-800 uppercase print:text-[11px]">{statusFormatted}</span>
                  </div>
                </div>
              </div>

              <div
                className="bg-[#0f2d5c] p-5 flex items-center justify-between text-white rounded-b-xl border border-[#0f2d5c] print:bg-[#0f2d5c] print:text-white print:p-3"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  backgroundColor: '#0f2d5c',
                  color: '#ffffff',
                }}
              >
                <span
                  className="text-[13px] font-bold tracking-wider text-white print:text-white print:text-[11px]"
                  style={{ color: '#ffffff' }}
                >
                  ORDER GRAND TOTAL
                </span>
                <span
                  className="text-[20px] font-bold text-white print:text-white print:text-[16px] font-mono"
                  style={{ color: '#ffffff' }}
                >
                  {formatValue(po.total_amount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Classic Invoice Signatures / Authorization Section */}
          <div className="mx-6 pt-16 pb-6 print:mx-4 print:pt-14 print:pb-4 border-t border-gray-100 print:border-t">
            <div className="flex flex-wrap sm:flex-nowrap items-end justify-between gap-6 print:flex-nowrap print:justify-between print:gap-4 text-center">
              {/* Line 1: Prepared By (Draft Creator) */}
              <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                  <span className="text-[10px] font-mono text-gray-500 font-semibold">
                    ✓ Order Drafted
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {formatDate(po.created_at || po.po_date)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                    Prepared By
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {po.creator?.name || 'Procurement Officer'}
                  </div>
                </div>
              </div>

              {/* Line 2: Submitted / Verified */}
              <div className="flex-1 min-w-[120px] flex flex-col justify-end">
                <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                  {!isDraft && (
                    <>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">
                        ✓ Submitted
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {formatDate(po.submitted_at || po.updated_at || po.po_date)}
                      </span>
                    </>
                  )}
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                    Verified By
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {po.submitter?.name || po.updater?.name || 'Department Authority'}
                  </div>
                </div>
              </div>

              {/* Dynamic Step Approvers Signatures */}
              {stepRequests.length > 0 ? (
                stepRequests.map((step: any, idx: number) => (
                  <div key={step.id || idx} className="flex-1 min-w-[120px] flex flex-col justify-end">
                    <div className="h-12 flex flex-col items-center justify-end pb-1.5">
                      {step.status === 'approved' ? (
                        <>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold">
                            ✓ Approved
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {formatDate(step.action_taken_at || step.updated_at)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] font-mono text-amber-600 italic">
                          {step.status === 'pending' ? 'Pending Approval' : 'Rejected'}
                        </span>
                      )}
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800 truncate" title={step.workflow_step?.name || step.workflowStep?.name}>
                        {step.workflow_step?.name || step.workflowStep?.name || `Stage ${idx + 1}`}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {step.approver?.name || 'Authorized Approver'}
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
                        Managing Authority
                      </div>
                      <div className="text-[10px] text-gray-400">Authorized Signatory</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Vertical Multi-Level Approval Pipeline (Sticky on scroll) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 sticky top-6 print:hidden space-y-3">
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
                isApproved ? 'bg-emerald-100 text-emerald-800' :
                isIssued ? 'bg-purple-100 text-purple-800' :
                isFullyDelivered ? 'bg-emerald-100 text-emerald-800' :
                status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                isPending ? 'bg-blue-100 text-blue-800 animate-pulse' :
                'bg-slate-100 text-slate-700'
              )}>
                {isPending ? 'In Review' : (status.replace('_', ' '))}
              </span>
            </div>

            {/* If In Review: Context Action Box */}
            {isPending && (
              <div className="p-2.5 bg-blue-50/90 rounded-lg border border-blue-200 text-xs space-y-2">
                <div className="flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">
                      {canCurrentUserApprove ? 'Action Required (Your Stage):' : 'Awaiting Action:'}
                    </span>
                    <p className="text-[11px] font-bold text-gray-900 leading-tight mt-0.5 truncate max-w-[200px]" title={canCurrentUserApprove ? (myActiveStep?.name || 'Your Review Stage') : (activeStageNames || 'Department / Management Review')}>
                      {canCurrentUserApprove
                        ? (myActiveStep?.name || 'Your Review Stage')
                        : (activeStageNames || 'Department / Management Review')}
                    </p>
                    {canCurrentUserApprove && myActiveStep?.name && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        ✓ You are the assigned approver for this stage
                      </p>
                    )}
                  </div>
                </div>

                {canCurrentUserApprove ? (
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-blue-100">
                    <button
                      type="button"
                      onClick={() => setApprovalModal({ isOpen: true, action: 'approve', remarks: '' })}
                      className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold rounded-md transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalModal({ isOpen: true, action: 'reject', remarks: '' })}
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
                      {formatDate(po.created_at || po.po_date)}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">PO Created</h4>
                  <p className="text-[10px] text-gray-500 truncate" title={po.creator?.name || 'Creator'}>
                    By {po.creator?.name || 'Creator'}
                  </p>
                </div>
              </div>

              {/* Step 2: Submitted for Approval */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[20px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs',
                  !isDraft ? 'bg-emerald-600' : 'bg-amber-500 ring-amber-100 animate-pulse'
                )}>
                  {!isDraft ? (
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  ) : (
                    <Send className="w-2.5 h-2.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-[9px] font-bold uppercase tracking-wider',
                      !isDraft ? 'text-emerald-700' : 'text-amber-700'
                    )}>
                      2. Submission
                    </span>
                    {!isDraft && (
                      <span className="text-[9px] text-gray-400 font-mono">
                        {formatDate(po.submitted_at || activeApprovalRequest?.created_at || po.updated_at || po.po_date)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">
                    {!isDraft ? 'Submitted for Approval' : 'Awaiting Submission'}
                  </h4>
                  <p className="text-[10px] text-gray-500 truncate" title={!isDraft ? `Sent by ${po.submitter?.name || po.updater?.name || po.creator?.name || 'Submitter'}` : ''}>
                    {!isDraft
                      ? `Sent by ${po.submitter?.name || po.updater?.name || po.creator?.name || 'Submitter'}`
                      : 'Click "Submit for Approval"'}
                  </p>
                </div>
              </div>

              {/* Dynamic Approval Steps (Level 1, 2, ... N) */}
              {stepRequests.length > 0 &&
                stepRequests.map((step: any, idx: number) => {
                  const stepName = step.workflow_step?.name || step.workflowStep?.name || `Level ${idx + 1} Review`
                  const stepApproved = step.status === 'approved'
                  const stepPending = step.status === 'pending'
                  const stepRejected = step.status === 'rejected'
                  const isMyStep = stepPending && myActiveStep?.step_request_id === step.id
                  const approverName = step.approver?.name || (stepApproved ? 'Authorized' : 'Assigned Approver')

                  return (
                    <div key={step.id || idx} className="relative group">
                      <div className={clsx(
                        'absolute -left-[20px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs transition-all',
                        stepApproved ? 'bg-emerald-600' :
                        isMyStep ? 'bg-emerald-600 ring-emerald-200 animate-pulse' :
                        stepPending ? 'bg-blue-600 ring-blue-100' :
                        stepRejected ? 'bg-rose-600' :
                        'bg-gray-300 text-gray-600'
                      )}>
                        {stepApproved && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        {stepPending && <Clock className="w-2.5 h-2.5" />}
                        {stepRejected && <XCircle className="w-2.5 h-2.5" />}
                        {!stepApproved && !stepPending && !stepRejected && <span className="text-[8px] font-bold">{idx + 1}</span>}
                      </div>

                      <div className={clsx(
                        'p-2.5 rounded-lg border text-xs transition-all',
                        stepApproved ? 'bg-emerald-50/40 border-emerald-200' :
                        isMyStep ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs' :
                        stepPending ? 'bg-blue-50/70 border-blue-300' :
                        stepRejected ? 'bg-rose-50/60 border-rose-300' :
                        'bg-gray-50/50 border-gray-200'
                      )}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={clsx(
                            'text-[8.5px] font-bold uppercase tracking-wider px-1 py-0.2 rounded',
                            stepApproved ? 'bg-emerald-100 text-emerald-800' :
                            isMyStep ? 'bg-emerald-100 text-emerald-800 font-extrabold' :
                            stepPending ? 'bg-blue-100 text-blue-800' :
                            stepRejected ? 'bg-rose-100 text-rose-800' :
                            'bg-gray-200 text-gray-600'
                          )}>
                            Level {idx + 1}
                          </span>
                          <span className={clsx(
                            'text-[9px] font-semibold capitalize',
                            stepApproved ? 'text-emerald-700' :
                            isMyStep ? 'text-emerald-700 font-bold' :
                            stepPending ? 'text-blue-700 font-semibold' :
                            stepRejected ? 'text-rose-700 font-bold' :
                            'text-gray-400'
                          )}>
                            {stepApproved ? 'Approved' : isMyStep ? 'Your Action' : stepPending ? 'Pending' : stepRejected ? 'Rejected' : 'Queued'}
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

              {/* Step: PO Approved */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[20px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs',
                  isApproved || isIssued || isFullyDelivered ? 'bg-emerald-600' : 'bg-gray-300 text-gray-600'
                )}>
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Outcome</span>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">Approved Order</h4>
                  <p className="text-[9.5px] text-gray-400">
                    {isApproved || isIssued || isFullyDelivered ? 'Authorized for dispatch' : 'Awaiting approvals'}
                  </p>
                </div>
              </div>

              {/* Step: Issued to Vendor */}
              <div className="relative group">
                <div className={clsx(
                  'absolute -left-[20px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-white ring-3 ring-white shadow-xs',
                  isIssued || isFullyDelivered ? 'bg-purple-600' : 'bg-gray-300 text-gray-600'
                )}>
                  <Truck className="w-2.5 h-2.5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Dispatch</span>
                  <h4 className="text-[11px] font-bold text-gray-900 mt-0.5">Vendor Issued</h4>
                  <p className="text-[9.5px] text-gray-400">
                    {isIssued || isFullyDelivered ? 'Order active with supplier' : 'Pending issuance'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval / Rejection / Submission Confirmation Modal */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className={clsx(
                'p-3 rounded-xl flex items-center justify-center text-white shrink-0',
                approvalModal.action === 'submit' ? 'bg-[#0d7a50]' :
                approvalModal.action === 'approve' ? 'bg-emerald-600' :
                'bg-rose-600'
              )}>
                {approvalModal.action === 'submit' && <Send className="w-5 h-5" />}
                {approvalModal.action === 'approve' && <CheckCircle2 className="w-5 h-5" />}
                {approvalModal.action === 'reject' && <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 capitalize">
                  {approvalModal.action === 'submit'
                    ? 'Submit Purchase Order for Approval'
                    : approvalModal.action === 'approve'
                    ? 'Approve Purchase Order Stage'
                    : 'Reject Purchase Order'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {approvalModal.action === 'submit'
                    ? 'Trigger multi-level approval pipeline across designated authorization levels.'
                    : approvalModal.action === 'approve'
                    ? 'Authorize and advance this purchase order to the next workflow stage.'
                    : 'Decline this purchase order and send back to draft with remarks.'}
                </p>
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs grid grid-cols-3 gap-2">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">PO No</span>
                <span className="font-bold text-gray-800 truncate block">{po.po_no || 'Draft'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Vendor</span>
                <span className="font-bold text-gray-800 truncate block" title={po.vendor?.name}>{po.vendor?.name || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Total Value</span>
                <span className="font-bold text-[#1e4ba1] font-mono truncate block">{formatValue(po.total_amount || 0)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {approvalModal.action === 'reject' ? 'Rejection Reason / Comments (Required)' : 'Approval Remarks / Notes (Optional)'}
              </label>
              <textarea
                value={approvalModal.remarks}
                onChange={(e) => setApprovalModal((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder={
                  approvalModal.action === 'reject'
                    ? 'State the reason for rejection...'
                    : 'Add any review notes or comments...'
                }
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setApprovalModal({ isOpen: false, action: 'submit', remarks: '' })}
                disabled={isApproving}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprovalSubmit}
                disabled={isApproving || (approvalModal.action === 'reject' && !approvalModal.remarks.trim())}
                className={clsx(
                  'px-5 py-2 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50',
                  approvalModal.action === 'submit' ? 'bg-[#0d7a50] hover:bg-[#0a6642] shadow-emerald-500/20' :
                  approvalModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' :
                  'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                )}
              >
                {isApproving && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {approvalModal.action === 'submit'
                    ? 'Confirm Submission'
                    : approvalModal.action === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue PO to Vendor Confirmation Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-xl shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Issue Purchase Order</h3>
                <p className="text-xs text-gray-500 mt-0.5">PO #{po.po_no}</p>
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Vendor</span>
                <span className="font-bold text-gray-800 truncate block">{po.vendor?.name || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Total Value</span>
                <span className="font-bold text-purple-700 font-mono truncate block">{formatValue(po.total_amount || 0)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to officially issue this purchase order to <strong>{po.vendor?.name}</strong>?
              This will notify the vendor via portal & email to proceed with order fulfillment.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                disabled={isDispatching}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueSubmit}
                disabled={isDispatching}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isDispatching && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>Issue Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Amendment Modal */}
      {amendModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">Create Purchase Order Amendment</h3>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                      Revision #{(po.amendments?.length || 0) + 1}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Order Reference: PO #{po.po_no}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAmendModal({ isOpen: false, reason: '', deliveryDate: '', termsAndConditions: '', items: {} })}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Amendment Justification / Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={amendModal.reason}
                  onChange={(e) => setAmendModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Official justification for modifying rates, quantities, or delivery terms..."
                  rows={2}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  required
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Revised Delivery Date
                </label>
                <input
                  type="date"
                  value={amendModal.deliveryDate}
                  onChange={(e) => setAmendModal((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Line Items Revision
                </label>
                <span className="text-[11px] text-gray-400">
                  Quantity cannot be reduced below already received stock
                </span>
              </div>

              <div className="max-h-[38vh] overflow-y-auto space-y-2.5 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                {items.map((it) => {
                  const cur = amendModal.items[it.id] || { quantity: Number(it.quantity), rate: Number(it.rate) }
                  const prodName = productMap.get(it.product_id) || it.product?.product_name || it.product?.name || `Product #${it.product_id}`
                  const receivedQty = Number(it.received_quantity || 0)
                  const lineTotal = (Number(cur.quantity) || 0) * (Number(cur.rate) || 0)

                  return (
                    <div key={it.id} className="p-3 bg-white rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs shadow-2xs">
                      <div className="md:col-span-5 min-w-0">
                        <div className="font-bold text-gray-900 truncate" title={prodName}>{prodName}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                          <span>Orig: <strong className="font-mono text-gray-700">{it.quantity}</strong></span>
                          {receivedQty > 0 && (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                              Received: {receivedQty}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                          Amended Qty:
                        </label>
                        <input
                          type="number"
                          min={receivedQty > 0 ? receivedQty : 0.01}
                          step={0.01}
                          value={cur.quantity}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0)
                            setAmendModal((prev) => ({
                              ...prev,
                              items: { ...prev.items, [it.id]: { ...cur, quantity: val } },
                            }))
                          }}
                          className={clsx(
                            'w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold text-right outline-none focus:ring-1',
                            cur.quantity < receivedQty
                              ? 'border-rose-400 focus:ring-rose-400 bg-rose-50 text-rose-700'
                              : 'border-gray-300 focus:ring-primary text-gray-800'
                          )}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                          Unit Rate:
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={cur.rate}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0)
                            setAmendModal((prev) => ({
                              ...prev,
                              items: { ...prev.items, [it.id]: { ...cur, rate: val } },
                            }))
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-right outline-none focus:ring-1 focus:ring-primary text-gray-800"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold mb-0.5">Line Total</span>
                        <span className="font-mono font-bold text-gray-900 text-xs">
                          {formatValue(lineTotal)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Financial Impact Bar */}
            {(() => {
              let sub = 0
              items.forEach((it) => {
                const cur = amendModal.items[it.id] || { quantity: Number(it.quantity), rate: Number(it.rate) }
                sub += (Number(cur.quantity) || 0) * (Number(cur.rate) || 0)
              })
              const vat = (sub * Number(po?.vat_percentage || 0)) / 100
              const revisedTotal = sub + vat
              const origTotal = Number(po.total_amount || 0)
              const diff = revisedTotal - origTotal

              return (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-gray-500 text-[11px]">Original Grand Total:</span>
                    <p className="font-mono font-semibold text-gray-700">{formatValue(origTotal)}</p>
                  </div>
                  <div className="space-y-0.5 text-center">
                    <span className="text-gray-500 text-[11px]">Variance / Difference:</span>
                    <p className={clsx('font-mono font-bold', diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-600' : 'text-gray-600')}>
                      {diff > 0 ? `+${formatValue(diff)}` : diff < 0 ? `-${formatValue(Math.abs(diff))}` : '৳ 0.00'}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[#1e4ba1] font-bold text-[11px]">Amended Grand Total:</span>
                    <p className="font-mono font-black text-[15px] text-[#1e4ba1]">{formatValue(revisedTotal)}</p>
                  </div>
                </div>
              )
            })()}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAmendModal({ isOpen: false, reason: '', deliveryDate: '', termsAndConditions: '', items: {} })}
                disabled={isAmending}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAmendment}
                disabled={isAmending || !amendModal.reason.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAmending && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Submit Amendment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Delivery Schedule Modal */}
      {isScheduleModalOpen && po && (
        <ManagePOScheduleModal
          isOpen={isScheduleModalOpen}
          po={po}
          onClose={() => setIsScheduleModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Delete Draft Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDraft}
        title="Delete Purchase Order Draft"
        message={`Are you sure you want to delete draft "${po?.po_no}"? This action cannot be undone.`}
        confirmText="Delete Draft"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Embedded Print CSS matching Purchase / Requisition View */}
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
    </div>
  )
}
