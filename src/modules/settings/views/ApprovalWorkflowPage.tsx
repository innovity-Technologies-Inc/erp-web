import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Trash2, GitMerge, CheckCircle2, XCircle } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { getSettingsTabs } from '../tabs'
import { usePermissions } from '@/hooks/usePermissions'
import { useWorkflowsList, useDeleteWorkflow } from '../hooks/useWorkflows'
import type { ColDef } from 'ag-grid-community'
import type { WorkflowItem } from '../api/workflow.api'

const MODULE_LABELS: Record<string, string> = {
  purchase_requisition: 'Purchase Requisition (PR)',
  purchase_order: 'Purchase Order (PO)',
  vendor_invoice: 'Vendor Invoice (Bill)',
  payment_request: 'Payment Request',
  leave_request: 'Leave Request',
  promotion: 'Promotion Request',
  designation_change: 'Designation Change Request',
  customer_pos_profile: 'Customer Tax Exemption / Profile',
}

export const ApprovalWorkflowPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const loggedInUser = useAuthStore((state) => state.user)
  const { hasPermission } = usePermissions()

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [idToDelete, setIdToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    module: true,
    type: true,
    steps: true,
    status: true,
    action: true,
  })

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  // Load tabs with dynamic active status
  const tabs = useMemo(
    () => getSettingsTabs('/settings/approval-workflows', isSuperAdmin, hasPermission),
    [isSuperAdmin, hasPermission]
  )

  const { data: workflowsResponse, isLoading } = useWorkflowsList()
  const { mutate: deleteWorkflowMutation, isPending: isDeleting } = useDeleteWorkflow()

  // Filter workflows locally based on search
  const rawWorkflows: WorkflowItem[] = useMemo(() => {
    const list = workflowsResponse?.data || []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (MODULE_LABELS[w.module] || w.module).toLowerCase().includes(q)
    )
  }, [workflowsResponse, search])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return rawWorkflows.slice(start, start + pageSize)
  }, [rawWorkflows, currentPage, pageSize])

  const handleAdd = () => {
    navigate({ to: '/settings/approval-workflows/create' })
  }

  const handleConfirmDelete = () => {
    if (idToDelete) {
      deleteWorkflowMutation(idToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setIdToDelete(null)
          showNotificationModal(
            'Deleted Successfully!',
            'The approval workflow configuration has been deleted.',
            'success'
          )
        },
        onError: (err: any) => {
          setIsConfirmOpen(false)
          setIdToDelete(null)
          const msg = err.response?.data?.message || err.message || 'Failed to delete workflow.'
          showNotificationModal('Delete Failed', msg, 'error')
        },
      })
    }
  }

  const columnDefs = useMemo<ColDef<any>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 70,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'WORKFLOW NAME',
        field: 'name',
        minWidth: 220,
        flex: 1.2,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-slate-800 flex items-center',
        cellRenderer: (params: any) => {
          const name = params.value
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                <GitMerge className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800 text-[13px]">{name}</span>
            </div>
          )
        },
      },
      {
        headerName: 'TARGET MODULE',
        field: 'module',
        minWidth: 180,
        flex: 1,
        hide: !visibleCols.module,
        cellClass: 'flex items-center',
        cellRenderer: (params: any) => {
          const mod = params.value
          const label = MODULE_LABELS[mod] || mod
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {label}
            </span>
          )
        },
      },
      {
        headerName: 'TYPE',
        field: 'type',
        minWidth: 130,
        width: 140,
        hide: !visibleCols.type,
        cellClass: 'flex items-center',
        cellRenderer: (params: any) => {
          const type = params.value
          const required = params.data?.required_approvals
          const total = params.data?.total_steps || params.data?.steps?.length || 0
          const label =
            type === 'sequential'
              ? 'Sequential'
              : required
                ? `Parallel (${required}/${total})`
                : 'Parallel'

          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                type === 'sequential'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/60'
              }`}
            >
              {label}
            </span>
          )
        },
      },
      {
        headerName: 'APPROVAL LEVELS PIPELINE',
        minWidth: 320,
        flex: 2,
        hide: !visibleCols.steps,
        cellClass: 'flex items-center',
        cellRenderer: (params: any) => {
          const steps = params.data?.steps || []
          if (!steps || steps.length === 0) {
            return <span className="text-slate-400 text-xs italic">No steps configured</span>
          }

          const sorted = [...steps].sort((a: any, b: any) => a.step_order - b.step_order)

          return (
            <div className="flex items-center gap-1.5 flex-wrap py-1">
              {sorted.map((s: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/80">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                      {s.step_order}
                    </span>
                    <span>{s.name}</span>
                  </span>
                  {idx < sorted.length - 1 && (
                    <span className="text-slate-300 font-medium text-[10px]">➔</span>
                  )}
                </div>
              ))}
            </div>
          )
        },
      },
      {
        headerName: 'STATUS',
        field: 'is_active',
        minWidth: 100,
        width: 110,
        hide: !visibleCols.status,
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: any) => {
          const active = !!params.value
          return active ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              <XCircle className="w-3.5 h-3.5" />
              Inactive
            </span>
          )
        },
      },
      {
        headerName: 'ACTIONS',
        width: 110,
        pinned: 'right',
        hide: !visibleCols.action,
        cellClass: 'flex items-center justify-center gap-1.5',
        cellRenderer: (params: any) => {
          const workflowId = params.data?.id
          if (!workflowId) return null
          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => {
                  navigate({
                    to: '/settings/approval-workflows/edit/$id',
                    params: { id: String(workflowId) },
                  })
                }}
                className="p-2 hover:bg-emerald-50 text-[#10b981] rounded-xl transition-all border border-transparent hover:border-emerald-100 hover:scale-110 group/edit cursor-pointer"
                title="Edit Workflow"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIdToDelete(workflowId)
                  setIsConfirmOpen(true)
                }}
                className="p-2 hover:bg-rose-50 text-[#ef4444] rounded-xl transition-all border border-transparent hover:border-rose-100 hover:scale-110 group/del cursor-pointer"
                title="Delete Workflow"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [visibleCols, currentPage, pageSize]
  )

  const filterColumns = useMemo(
    () => [
      { name: 'SL', field: 'sl', visible: visibleCols.sl },
      { name: 'Workflow Name', field: 'name', visible: visibleCols.name },
      { name: 'Target Module', field: 'module', visible: visibleCols.module },
      { name: 'Type', field: 'type', visible: visibleCols.type },
      { name: 'Pipeline Levels', field: 'steps', visible: visibleCols.steps },
      { name: 'Status', field: 'status', visible: visibleCols.status },
      { name: 'Actions', field: 'action', visible: visibleCols.action },
    ],
    [visibleCols]
  )

  const totalPages = useMemo(() => {
    return Math.ceil(rawWorkflows.length / pageSize) || 1
  }, [rawWorkflows.length, pageSize])

  return (
    <>
      <ListPageLayout
        title="Approval Workflow List"
        backTo="/"
        tabs={tabs}
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        onCreate={handleAdd}
        createPermission="view_general_setting"
        addLabel="Create"
        // AG Grid Props
        rowData={paginatedData}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={rawWorkflows.length}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        gridOptions={{
          rowHeight: 46,
          suppressRowTransform: true,
        }}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Workflow Configuration"
        message="Are you sure you want to delete this approval workflow? Pending requisitions may no longer progress through this hierarchy."
        confirmText="Delete Workflow"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
