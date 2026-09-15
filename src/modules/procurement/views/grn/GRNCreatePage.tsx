import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  PackageCheck,
  Building2,
  Calendar,
  FileText,
  Truck,
  Info,
  Package,
  Check,
  AlertCircle,
} from 'lucide-react'
import { usePurchaseOrders, usePurchaseOrderDetails } from '../../hooks/usePurchaseOrders'
import { useCreateGRN } from '../../hooks/useGRN'
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouse'
import { useProductSelect2 } from '@/modules/inventory/hooks/useSelect2'
import { getUnitSelect2 } from '@/modules/inventory/api/units.api'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'
import type { Option } from '@/components/Select/Select2'
import type {
  PurchaseOrder,
  CreateGRNDto,
} from '../../api/types'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { clsx } from 'clsx'

interface LocalGRNItem {
  po_item_id: number
  product_id: number
  product_name: string
  product_code?: string
  unit_id: number
  unit_name: string
  po_quantity: number
  previously_received: number
  remaining_quantity: number
  received_quantity: number
  damaged_quantity: number
  accepted_quantity: number
  batch_no: string
  expiry_date: string
}

export const GRNCreatePage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()

  // Pre-selected PO if provided in query search params
  const searchParams = useSearch({ strict: false }) as any
  const initialPoUuid = searchParams?.poUuid || ''

  // Form State
  const [selectedPoUuid, setSelectedPoUuid] = useState<string>(initialPoUuid)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | string>('')
  const [grnDate, setGrnDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [challanNo, setChallanNo] = useState<string>('')
  const [invoiceNo, setInvoiceNo] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [items, setItems] = useState<LocalGRNItem[]>([])
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  // Data Queries
  const { data: poListData, isLoading: isLoadingPOs } = usePurchaseOrders({ per_page: 500, all: true } as any)
  const { data: poDetailsData } = usePurchaseOrderDetails(selectedPoUuid)
  const { data: warehousesData } = useWarehouses()
  const { data: productsData } = useProductSelect2()
  const { data: unitsData } = useQuery({
    queryKey: ['unit-select2'],
    queryFn: getUnitSelect2,
  })
  const createMutation = useCreateGRN()

  // Product and Unit Mappings for resilient Name resolution
  const productMap = useMemo(() => {
    return new Map((productsData || []).map((p: any) => [Number(p.id), p.text || p.name || p.product_name]))
  }, [productsData])

  const unitMap = useMemo(() => {
    return new Map((unitsData || []).map((u: any) => [Number(u.id), u.text || u.name]))
  }, [unitsData])

  const poList: PurchaseOrder[] = (poListData as any)?.response || (poListData as any)?.data || []

  // FILTER STRICTLY APPROVED, ISSUED, OR PARTIALLY DELIVERED POs THAT STILL HAVE PENDING QUANTITY TO RECEIVE
  const eligiblePOs = useMemo(() => {
    return poList.filter((po) => {
      // 1. Status check: approved, issued, or partially_delivered
      const rawStatus = po.status
      const st = (typeof rawStatus === 'object' && rawStatus !== null ? (rawStatus as any).value : rawStatus) || ''
      const isApprovedStatus = st === 'approved' || st === 'issued' || st === 'partially_delivered'
      if (!isApprovedStatus) return false

      // 2. Pending items check: Must have at least one item with remaining due quantity > 0
      if (po.items && po.items.length > 0) {
        const totalRemaining = po.items.reduce((sum, it) => {
          const ordered = Number(it.quantity || 0)
          const received = Number(it.received_quantity || 0)
          return sum + Math.max(0, ordered - received)
        }, 0)
        return totalRemaining > 0
      }

      return true
    })
  }, [poList])

  const selectedPO: PurchaseOrder | undefined =
    poDetailsData?.response || (poDetailsData as any)?.data || eligiblePOs.find((p) => p.uuid === selectedPoUuid)

  const warehousesList = useMemo(() => {
    return ((warehousesData?.data || (warehousesData as any)?.response || []) as Array<{
      id: number
      name: string
      code?: string
    }>)
  }, [warehousesData])

  // Warehouse options for Select2 supporting {id, text} and {id, name}
  const warehouseOptions: Option[] = useMemo(() => {
    const rawData = warehousesData as any
    const list: any[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.response)
      ? rawData.response
      : []

    return list.map((wh: any) => ({
      value: wh.id,
      label: wh.text || wh.name || (wh.warehouse_code ? `${wh.warehouse_code}` : `Warehouse #${wh.id}`),
    }))
  }, [warehousesData])

  // PO Options for Select2 with Due Quantity
  const poOptions: Option[] = useMemo(() => {
    return eligiblePOs.map((po) => {
      const remainingQty = po.items
        ? po.items.reduce(
            (sum, it) =>
              sum + Math.max(0, Number(it.quantity || 0) - Number(it.received_quantity || 0)),
            0
          )
        : 0

      return {
        value: po.uuid,
        label: `${po.po_no} — ${po.vendor?.name || 'Vendor'} (Due: ${remainingQty.toFixed(2)})`,
      }
    })
  }, [eligiblePOs])

  // Extract delivery schedules from selected PO
  const deliverySchedules = useMemo(() => {
    if (Array.isArray(selectedPO?.schedules) && selectedPO.schedules.length > 0) {
      return selectedPO.schedules
    }
    const currentItems = Array.isArray(selectedPO?.items) ? selectedPO.items : []
    const flattened: any[] = []
    currentItems.forEach((it: any) => {
      if (Array.isArray(it.schedules) && it.schedules.length > 0) {
        flattened.push(...it.schedules)
      }
    })
    return flattened
  }, [selectedPO?.schedules, selectedPO?.items])

  // Group pending milestones by schedule_no or date
  const pendingMilestones = useMemo(() => {
    if (deliverySchedules.length === 0) return []
    
    // Group schedules by schedule_no or planned_delivery_date
    const map = new Map<string, {
      schedule_no: string
      planned_delivery_date: string
      total_planned: number
      total_received: number
      items: Array<{
        item_id: number
        planned_quantity: number
        received_quantity: number
      }>
      is_completed: boolean
    }>()

    deliverySchedules.forEach((sched: any) => {
      const key = sched.schedule_no || sched.planned_delivery_date
      const planned = Number(sched.planned_quantity || 0)
      const rec = Number(sched.received_quantity || 0)
      const status = typeof sched.status === 'object' && sched.status !== null ? sched.status.value : sched.status
      const isCompleted = status === 'completed' || rec >= planned

      if (!map.has(key)) {
        map.set(key, {
          schedule_no: sched.schedule_no || 'Milestone',
          planned_delivery_date: sched.planned_delivery_date,
          total_planned: 0,
          total_received: 0,
          items: [],
          is_completed: true,
        })
      }

      const entry = map.get(key)!
      entry.total_planned += planned
      entry.total_received += rec
      if (!isCompleted) {
        entry.is_completed = false
      }
      entry.items.push({
        item_id: Number(sched.purchase_order_item_id),
        planned_quantity: planned,
        received_quantity: rec,
      })
    })

    return Array.from(map.values())
      .filter((m) => !m.is_completed)
      .sort((a, b) => new Date(a.planned_delivery_date).getTime() - new Date(b.planned_delivery_date).getTime())
  }, [deliverySchedules])

  // Populate items when selected PO or product/unit dictionaries load
  const selectedPoId = selectedPO?.id
  useEffect(() => {
    if (!selectedPO || !selectedPO.items) {
      setItems([])
      return
    }

    const mappedItems: LocalGRNItem[] = selectedPO.items.map((it) => {
      const ordered = Number(it.quantity || 0)
      const prevRec = Number(it.received_quantity || 0)
      const remaining = Math.max(0, ordered - prevRec)
      const defaultReceived = remaining
      const defaultDamaged = 0
      const defaultAccepted = defaultReceived - defaultDamaged
      const resolvedName =
        productMap.get(Number(it.product_id)) ||
        it.product?.name ||
        it.product?.product_name ||
        `Product #${it.product_id}`
      const resolvedUnit =
        unitMap.get(Number(it.unit_id)) ||
        it.unit?.name ||
        'Unit'

      return {
        po_item_id: it.id,
        product_id: it.product_id,
        product_name: resolvedName,
        product_code: it.product?.code || it.product?.sku || '',
        unit_id: it.unit_id,
        unit_name: resolvedUnit,
        po_quantity: ordered,
        previously_received: prevRec,
        remaining_quantity: remaining,
        received_quantity: defaultReceived,
        damaged_quantity: defaultDamaged,
        accepted_quantity: defaultAccepted,
        batch_no: '',
        expiry_date: '',
      }
    })

    setItems(mappedItems)
  }, [selectedPoId, productMap, unitMap])

  // Summary Totals
  const totalReceivedQty = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.received_quantity || 0), 0)
  }, [items])

  const totalDamagedQty = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.damaged_quantity || 0), 0)
  }, [items])

  const totalAcceptedQty = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.accepted_quantity || 0), 0)
  }, [items])

  const totalOrderedQty = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.po_quantity || 0), 0)
  }, [items])

  const totalDueQty = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.remaining_quantity || 0), 0)
  }, [items])

  // Delivery Schedule / Milestone Dropdown Options
  const scheduleOptions: Option[] = useMemo(() => {
    if (!selectedPO) return []

    const opts: Option[] = []

    if (pendingMilestones.length > 0) {
      pendingMilestones.forEach((m, idx) => {
        const key = m.schedule_no || m.planned_delivery_date
        const pendingQty = Math.max(0, m.total_planned - m.total_received)
        opts.push({
          value: `milestone:${key}`,
          label: `${m.schedule_no || `Milestone #${idx + 1}`} (Planned: ${m.planned_delivery_date} | Due: ${pendingQty.toFixed(2)})`,
        })
      })
    }

    opts.push({
      value: 'full_due',
      label: `Full Remaining Due Balance (${totalDueQty.toFixed(2)})`,
    })

    opts.push({
      value: 'custom',
      label: 'Manual / Custom Count Entry',
    })

    return opts
  }, [selectedPO, pendingMilestones, totalDueQty])

  const [selectedSchedulePlan, setSelectedSchedulePlan] = useState<string>('full_due')

  // Apply chosen schedule plan
  const handleApplyScheduleSelection = (planVal: string) => {
    setSelectedSchedulePlan(planVal)
    if (planVal.startsWith('milestone:')) {
      const key = planVal.replace('milestone:', '')
      const targetMilestone = pendingMilestones.find(
        (m) => (m.schedule_no || m.planned_delivery_date) === key
      )

      if (targetMilestone) {
        if (targetMilestone.planned_delivery_date) {
          setDeliveryDate(targetMilestone.planned_delivery_date)
        }

        setItems((prev) =>
          prev.map((item) => {
            const schedItem = targetMilestone.items.find((si) => si.item_id === item.po_item_id)
            let suggestedQty = 0

            if (schedItem) {
              const schedDue = Math.max(0, schedItem.planned_quantity - schedItem.received_quantity)
              suggestedQty = Math.min(schedDue, item.remaining_quantity)
            } else if (targetMilestone.items.length === 0) {
              suggestedQty = item.remaining_quantity
            }

            return {
              ...item,
              received_quantity: suggestedQty,
              damaged_quantity: 0,
              accepted_quantity: suggestedQty,
            }
          })
        )
      }
    } else if (planVal === 'full_due') {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          received_quantity: item.remaining_quantity,
          damaged_quantity: 0,
          accepted_quantity: item.remaining_quantity,
        }))
      )
    } else if (planVal === 'custom') {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          received_quantity: 0,
          damaged_quantity: 0,
          accepted_quantity: 0,
        }))
      )
    }
  }

  // When PO or pending milestones change, auto-select current active milestone
  useEffect(() => {
    if (!selectedPO) {
      setSelectedSchedulePlan('full_due')
      return
    }

    if (pendingMilestones.length > 0) {
      const defaultKey = `milestone:${pendingMilestones[0].schedule_no || pendingMilestones[0].planned_delivery_date}`
      setSelectedSchedulePlan(defaultKey)
      const targetMilestone = pendingMilestones[0]
      if (targetMilestone.planned_delivery_date) {
        setDeliveryDate(targetMilestone.planned_delivery_date)
      }
      setItems((prev) =>
        prev.map((item) => {
          const schedItem = targetMilestone.items.find((si) => si.item_id === item.po_item_id)
          let suggestedQty = 0
          if (schedItem) {
            const schedDue = Math.max(0, schedItem.planned_quantity - schedItem.received_quantity)
            suggestedQty = Math.min(schedDue, item.remaining_quantity)
          } else {
            suggestedQty = item.remaining_quantity
          }
          return {
            ...item,
            received_quantity: suggestedQty,
            damaged_quantity: 0,
            accepted_quantity: suggestedQty,
          }
        })
      )
    } else {
      setSelectedSchedulePlan('full_due')
    }
  }, [selectedPoId, pendingMilestones.length])

  // Item quantity change handler
  const handleItemFieldChange = (
    index: number,
    field: keyof LocalGRNItem,
    val: any
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item

        const updated = { ...item, [field]: val }

        if (field === 'received_quantity' || field === 'damaged_quantity') {
          const rec = field === 'received_quantity' ? Math.max(0, Number(val) || 0) : item.received_quantity
          const dam = field === 'damaged_quantity' ? Math.max(0, Number(val) || 0) : item.damaged_quantity
          updated.received_quantity = rec
          updated.damaged_quantity = dam
          updated.accepted_quantity = Math.max(0, rec - dam)
        }

        return updated
      })
    )
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPO) {
      showNotificationModal('Validation Error', 'Please select an approved Purchase Order.', 'error')
      return
    }

    if (!selectedWarehouseId) {
      showNotificationModal('Validation Error', 'Please select a receiving warehouse.', 'error')
      return
    }

    if (!challanNo.trim()) {
      showNotificationModal('Validation Error', 'Please enter the Delivery Challan Number.', 'error')
      return
    }

    if (!deliveryDate) {
      showNotificationModal('Validation Error', 'Please select the Delivery Date.', 'error')
      return
    }

    const activeItems = items.filter((it) => it.received_quantity > 0)
    if (activeItems.length === 0) {
      showNotificationModal('Validation Error', 'Please enter a receiving quantity greater than 0 for at least one item.', 'error')
      return
    }

    // Build standard payload
    const payload: CreateGRNDto = {
      purchase_order_id: selectedPO.id,
      grn_date: grnDate,
      delivery_challan_no: challanNo.trim(),
      invoice_no: invoiceNo.trim() || null,
      delivery_date: deliveryDate,
      items: activeItems.map((it) => ({
        po_item_id: it.po_item_id,
        received_quantity: Number(it.received_quantity),
        damaged_quantity: Number(it.damaged_quantity || 0),
        batches:
          it.batch_no.trim() || it.expiry_date
            ? [
                {
                  tracking_type: 'batch',
                  batch_no: it.batch_no.trim() || null,
                  serial_no: null,
                  expiry_date: it.expiry_date || null,
                  quantity: Number(it.accepted_quantity),
                },
              ]
            : undefined,
        allocations: [
          {
            warehouse_id: Number(selectedWarehouseId),
            location_aisle: null,
            bin_shelf: null,
            quantity: Number(it.accepted_quantity),
          },
        ],
      })),
    }

    try {
      const response = await createMutation.mutateAsync(payload)
      showNotificationModal(
        'GRN Created Successfully',
        `Goods Receipt Note "${response?.response?.grn_no || (response as any)?.data?.grn_no || 'Draft GRN'}" has been created.`,
        'success'
      )
      navigate({ to: '/procurement/grns' as any })
    } catch (err: any) {
      showNotificationModal(
        'Submission Failed',
        err?.response?.data?.message || err.message || 'Failed to create GRN.',
        'error'
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-16 font-poppins text-[#475569]">
      {/* Top Header / Breadcrumb Bar */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDiscardModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-xs font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            Create Goods Receipt Note (GRN)
          </h1>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-[1600px] mx-auto pb-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Card 1: Goods Receipt Header */}
          <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <Info className="h-4 w-4" />
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Goods Receipt Header</h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 uppercase">
                New Receipt
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Row 1: Purchase Order Reference (6 cols) & Delivery Schedule / Milestone (6 cols) */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Purchase Order Reference <span className="text-rose-500">*</span>
                </label>
                <Select2
                  options={poOptions}
                  value={selectedPoUuid}
                  onChange={(val) => setSelectedPoUuid(val as string)}
                  placeholder={isLoadingPOs ? 'Loading Purchase Orders...' : 'Select Approved Purchase Order...'}
                />
                {eligiblePOs.length === 0 && !isLoadingPOs && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    No approved Purchase Orders with pending items are available for receipt.
                  </p>
                )}
              </div>

              <div className="md:col-span-6 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569] flex items-center justify-between">
                  <span>Delivery Schedule / Milestone</span>
                  {pendingMilestones.length > 0 && (
                    <span className="text-[11px] text-blue-600 font-semibold font-mono">
                      Current: {pendingMilestones[0].schedule_no || 'Milestone #1'}
                    </span>
                  )}
                </label>
                <Select2
                  options={scheduleOptions}
                  value={selectedSchedulePlan}
                  onChange={(val) => handleApplyScheduleSelection(val as string)}
                  placeholder="Select Delivery Milestone or Full Balance..."
                  isDisabled={!selectedPO}
                />
              </div>

              {/* Row 2 (3 fields): Vendor, Warehouse, GRN Date */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">Vendor / Supplier</label>
                <input
                  type="text"
                  readOnly
                  value={selectedPO?.vendor?.name || '—'}
                  placeholder="Auto-populated from Purchase Order"
                  className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 font-medium outline-none cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Receiving Warehouse <span className="text-rose-500">*</span>
                </label>
                <Select2
                  options={warehouseOptions}
                  value={selectedWarehouseId}
                  onChange={(val) => setSelectedWarehouseId(val as number)}
                  placeholder="Select Warehouse..."
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  GRN Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={grnDate}
                  onChange={(e) => setGrnDate(e.target.value)}
                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/30"
                  required
                />
              </div>

              {/* Row 3 (3 fields): Delivery Challan No, Delivery Date, Supplier Invoice No */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Delivery Challan No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  placeholder="e.g. DC-2026-981"
                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/30"
                  required
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Delivery Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/30"
                  required
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Supplier Invoice No (Optional)
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-8821"
                  className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Received Items Table */}
          <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-[16px] font-bold text-[#1e293b] flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                    <Package className="h-4 w-4" />
                  </div>
                  <span>Received Items</span>
                </h2>
                <p className="text-[11.5px] text-gray-400 mt-0.5">
                  Quantities auto-populate from the selected delivery schedule. You can freely adjust receiving quantities, report damages, and specify lot numbers.
                </p>
              </div>
              <span className="text-xs text-gray-500 font-medium px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200 self-start sm:self-auto">
                {items.length} item(s) in PO
              </span>
            </div>

            {items.length === 0 ? (
              <div className="py-14 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl space-y-2">
                <PackageCheck className="w-9 h-9 mx-auto text-gray-300" />
                <p className="font-medium text-gray-500 text-[13px]">
                  Select an approved Purchase Order above to load line items and enter receipt quantities.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#dae8ff]/50 text-gray-700 text-[11px] font-bold border-b border-gray-200">
                      <th className="py-3 px-3 w-12 text-center">SL</th>
                      <th className="py-3 px-3 min-w-[240px]">Product / Material</th>
                      <th className="py-3 px-2 text-center w-20">Unit</th>
                      <th className="py-3 px-2 text-right w-24">Ordered</th>
                      <th className="py-3 px-2 text-right w-24">Prev Rec</th>
                      <th className="py-3 px-2 text-right w-24">Due Qty</th>
                      <th className="py-3 px-2 text-right w-32">Receiving Qty</th>
                      <th className="py-3 px-2 text-right w-28">Damaged</th>
                      <th className="py-3 px-2 text-right w-28">Net Accept</th>
                      <th className="py-3 px-2 text-left w-36">Batch / Lot No</th>
                      <th className="py-3 px-2 text-left w-36">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {items.map((item, itemIdx) => (
                      <tr key={item.po_item_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-3 text-center text-gray-400 font-medium">{itemIdx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{item.product_name}</div>
                          {item.product_code && (
                            <div className="text-[11px] text-gray-400 font-mono">SKU: {item.product_code}</div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600 font-medium">{item.unit_name}</td>
                        <td className="py-3 px-2 text-right font-mono text-gray-700">{item.po_quantity.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-mono text-gray-500">{item.previously_received.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right font-mono font-semibold text-purple-700">
                          {item.remaining_quantity.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.received_quantity}
                            onChange={(e) =>
                              handleItemFieldChange(
                                itemIdx,
                                'received_quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 text-right focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                          />
                        </td>
                        <td className="py-3 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.damaged_quantity}
                            onChange={(e) =>
                              handleItemFieldChange(
                                itemIdx,
                                'damaged_quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs font-bold text-rose-600 text-right focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-white font-mono"
                          />
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-[#0d7a50] text-[13px]">
                          {item.accepted_quantity.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={item.batch_no}
                            onChange={(e) => handleItemFieldChange(itemIdx, 'batch_no', e.target.value)}
                            placeholder="Batch # (Opt)"
                            className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-primary outline-none"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="date"
                            value={item.expiry_date}
                            onChange={(e) => handleItemFieldChange(itemIdx, 'expiry_date', e.target.value)}
                            className="w-full h-8 px-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:border-primary outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Section: Left (Remarks / Gate Entry Notes with RichEditor) & Right (Slim Summary Card) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left (8 cols): Remarks Card with RichEditor */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-primary/10 p-5 shadow-sm flex flex-col space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1e293b]">Remarks / Gate Entry Notes</h3>
              </div>
              <div className="flex-1">
                <RichEditor
                  value={remarks}
                  onChange={(val) => setRemarks(val)}
                  placeholder="Enter gate receiving notes, vehicle details (e.g. Truck # DHAKA-METRO-11-2034), seal status, delivery remarks..."
                />
              </div>
            </div>

            {/* Right (4 cols): Slim & Compact Summary Card (#1B4D90) */}
            <div className="lg:col-span-4 bg-[#1B4D90] rounded-xl p-4.5 shadow-lg text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/15">
                  <h3 className="text-[15px] font-bold opacity-95">Summary</h3>
                  <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">
                    Draft Receipt
                  </span>
                </div>

                <div className="space-y-2.5 text-[12.5px]">
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Line Items</span>
                    <span className="font-bold font-mono">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Ordered Qty</span>
                    <span className="font-bold font-mono">{totalOrderedQty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Due Qty</span>
                    <span className="font-bold font-mono text-purple-200">{totalDueQty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="opacity-80">Receiving Qty</span>
                    <span className="font-bold font-mono">{totalReceivedQty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80 text-rose-200">Damaged / Rejected</span>
                    <span className="font-bold font-mono text-rose-300">{totalDamagedQty.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-white/20 flex justify-between items-end">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider opacity-75 mb-0.5">
                    Net Accepted Qty
                  </p>
                  <p className="text-[22px] font-black text-emerald-300 leading-tight">
                    {totalAcceptedQty.toFixed(2)}
                  </p>
                </div>
                <div className="text-right text-[10.5px] opacity-75">
                  Ready for QC
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex justify-end items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setIsDiscardModalOpen(true)}
              className="px-6 h-[44px] bg-white border border-gray-300 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[14px] shadow-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !selectedPO}
              className="px-8 h-[44px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[14px] cursor-pointer"
            >
              {createMutation.isPending ? (
                <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="h-5 w-5" strokeWidth={3} />
                  <span>Save Goods Receipt Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        title="Discard Changes"
        message="Are you sure you want to discard this Goods Receipt Note? All entered quantities and details will be lost."
        confirmText="Discard Changes"
        variant="danger"
        onConfirm={() => navigate({ to: '/procurement/grns' as any })}
        onClose={() => setIsDiscardModalOpen(false)}
      />
    </div>
  )
}
