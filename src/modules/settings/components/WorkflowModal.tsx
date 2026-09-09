import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Save, PenLine, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { useRolesSelect2 } from '@/modules/user-management/hooks/useUsers'
import { useEmployeeSelect2 } from '@/modules/inventory/hooks/useSelect2'
import { useDesignationSelect2 } from '@/modules/hrm'
import { useWorkflowDetails, useStoreWorkflow } from '../hooks/useWorkflows'
import { useUiStore } from '@/store/useUiStore'
import type { WorkflowDTO } from '../api/workflow.api'

interface WorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: number | null
}

const MODULE_OPTIONS = [
  { value: 'purchase_requisition', label: 'Purchase Requisition (PR)' },
  { value: 'purchase_order', label: 'Purchase Order (PO)' },
  { value: 'vendor_invoice', label: 'Vendor Invoice (Bill)' },
  { value: 'payment_request', label: 'Payment Request' },
  { value: 'leave_request', label: 'Leave Request' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'designation_change', label: 'Designation Change' },
]

const DESIGNATION_OPTIONS = [
  { value: '', label: 'All Designations' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'procurement_manager', label: 'Procurement Manager' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'general_manager', label: 'General Manager' },
  { value: 'managing_director', label: 'Managing Director' },
  { value: 'admin', label: 'Administrator' },
]

interface StepFormItem {
  id?: number
  name: string
  step_order: number
  type: 'user-type' | 'role-user' | 'specific-user'
  required_user_type?: string
  role_id?: number | null
  user_id?: number | null
}

export const WorkflowModal = ({ isOpen, onClose, workflowId }: WorkflowModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: saveWorkflow, isPending: isSaving } = useStoreWorkflow()
  const { data: detailsData, isLoading: isLoadingDetails } = useWorkflowDetails(workflowId)

  // Dynamic options from backend
  const { data: rolesData } = useRolesSelect2({})
  const { data: employeesData } = useEmployeeSelect2()
  const { data: designationsData } = useDesignationSelect2()

  const roleOptions = rolesData || []
  const employeeOptions = employeesData || []

  const designationOptions: { value: string; label: string }[] = useMemo(() => {
    return (designationsData || []).map((d: any) => ({
      value: d.text || d.designation || String(d.id),
      label: d.text || d.designation,
    }))
  }, [designationsData])

  // Form States
  const [name, setName] = useState('')
  const [module, setModule] = useState('purchase_requisition')
  const [type, setType] = useState<'sequential' | 'random'>('sequential')
  const [isActive, setIsActive] = useState(true)

  // Inclusion & Exclusion Rules
  const [showRules, setShowRules] = useState(false)
  const [includerRole, setIncluderRole] = useState<number | ''>('')
  const [includerUserType, setIncluderUserType] = useState<string>('')
  const [includerUserId, setIncluderUserId] = useState<number | ''>('')

  const [excludeRole, setExcludeRole] = useState<number | ''>('')
  const [excludeUserType, setExcludeUserType] = useState<string>('')
  const [excludeUserId, setExcludeUserId] = useState<number | ''>('')

  const [steps, setSteps] = useState<StepFormItem[]>([
    {
      name: '',
      step_order: 1,
      type: 'user-type',
      required_user_type: 'department_head',
    },
  ])

  // Populate when editing or opening
  useEffect(() => {
    if (isOpen) {
      if (workflowId && detailsData?.data) {
        const wf = detailsData.data
        setName(wf.name || '')
        setModule(wf.module || 'purchase_requisition')
        setType(wf.type || 'sequential')
        setIsActive(wf.is_active ?? true)

        setIncluderRole(wf.includer_role_ids?.[0] || '')
        setIncluderUserType(wf.includer_user_types?.[0] || '')
        setIncluderUserId(wf.includer_user_ids?.[0] || '')

        setExcludeRole(wf.exclude_role_ids?.[0] || '')
        setExcludeUserType(wf.exclude_user_types?.[0] || '')
        setExcludeUserId(wf.exclude_user_ids?.[0] || '')

        if (
          wf.includer_role_ids?.length ||
          wf.includer_user_types?.length ||
          wf.includer_user_ids?.length ||
          wf.exclude_role_ids?.length ||
          wf.exclude_user_types?.length ||
          wf.exclude_user_ids?.length
        ) {
          setShowRules(true)
        }

        if (wf.steps && wf.steps.length > 0) {
          const sorted = [...wf.steps].sort((a, b) => a.step_order - b.step_order)
          setSteps(
            sorted.map((s, idx) => ({
              id: s.id,
              name: s.name || '',
              step_order: idx + 1,
              type: s.type || 'user-type',
              required_user_type: s.required_user_type || 'department_head',
              role_id: s.role_id || null,
              user_id: s.user_id || null,
            }))
          )
        } else {
          setSteps([
            {
              name: '',
              step_order: 1,
              type: 'user-type',
              required_user_type: 'department_head',
            },
          ])
        }
      } else {
        setName('')
        setModule('purchase_requisition')
        setType('sequential')
        setIsActive(true)
        setShowRules(false)
        setIncluderRole('')
        setIncluderUserType('')
        setIncluderUserId('')
        setExcludeRole('')
        setExcludeUserType('')
        setExcludeUserId('')
        setSteps([
          {
            name: '',
            step_order: 1,
            type: 'user-type',
            required_user_type: 'department_head',
          },
        ])
      }
    }
  }, [isOpen, workflowId, detailsData])

  const handleAddStep = () => {
    const nextOrder = steps.length + 1
    setSteps((prev) => [
      ...prev,
      {
        name: '',
        step_order: nextOrder,
        type: 'user-type',
        required_user_type: 'procurement_manager',
      },
    ])
  }

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return
    const updated = steps.filter((_, idx) => idx !== index)
    const reordered = updated.map((step, idx) => ({
      ...step,
      step_order: idx + 1,
    }))
    setSteps(reordered)
  }

  const handleStepChange = (index: number, field: keyof StepFormItem, value: any) => {
    setSteps((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      showNotificationModal('Validation Error', 'Please enter a workflow name.', 'error')
      return
    }

    if (steps.length === 0) {
      showNotificationModal('Validation Error', 'Please add at least one approval step.', 'error')
      return
    }

    const payload: WorkflowDTO = {
      id: workflowId || undefined,
      name: name.trim(),
      module,
      type,
      total_steps: steps.length,
      is_active: isActive,
      includer_role_ids: includerRole ? [Number(includerRole)] : null,
      includer_user_types: includerUserType ? [includerUserType] : null,
      includer_user_ids: includerUserId ? [Number(includerUserId)] : null,
      exclude_role_ids: excludeRole ? [Number(excludeRole)] : null,
      exclude_user_types: excludeUserType ? [excludeUserType] : null,
      exclude_user_ids: excludeUserId ? [Number(excludeUserId)] : null,
      steps: steps.map((s, idx) => ({
        id: s.id,
        name: s.name.trim() || `Step ${idx + 1}`,
        step_order: idx + 1,
        type: s.type,
        required_user_type: s.type === 'user-type' ? s.required_user_type : null,
        role_id: s.type === 'role-user' ? Number(s.role_id) : null,
        user_id: s.type === 'specific-user' ? Number(s.user_id) : null,
      })),
    }

    saveWorkflow(payload, {
      onSuccess: (res: any) => {
        onClose()
        showNotificationModal(
          'Saved Successfully!',
          res.message || 'Workflow configuration has been saved successfully.',
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to save workflow.'
        showNotificationModal('Save Failed', msg, 'error')
      },
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={workflowId ? 'Edit Approval Workflow' : 'Add New Approval Workflow'}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving || isLoadingDetails}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSaving} disabled={isLoadingDetails}>
            {workflowId ? (
              <>
                <PenLine className="h-4 w-4" />
                Update
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* General Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Workflow Name" required>
            <input
              type="text"
              placeholder="e.g. Standard Multi-Level Approval"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>

          <FormField label="Target Module" required>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Workflow Type & Active Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Workflow Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('sequential')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  type === 'sequential'
                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-[13px] font-bold">Sequential</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Step 1 ➔ Step 2 ➔ Step 3</span>
              </button>
              <button
                type="button"
                onClick={() => setType('random')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  type === 'random'
                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-[13px] font-bold">Parallel (Random)</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Any approver in parallel</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-[13px] font-bold text-slate-800">Active Workflow</span>
                <p className="text-[11px] text-slate-500">Automatically applies to new submissions in this module.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Inclusion & Exclusion Scope Rules (Collapsible) */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="w-full px-4 py-2.5 bg-gray-50 flex items-center justify-between text-left text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <div>
              <span>Inclusion & Exclusion Rules (Optional Scope)</span>
              <p className="text-[11px] font-normal text-gray-500 mt-0.5">
                Define which requesters this workflow specifically applies to or who is exempted.
              </p>
            </div>
            {showRules ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 ml-2" />}
          </button>

          {showRules && (
            <div className="p-4 bg-white space-y-4 text-xs">
              {/* Inclusion Criteria */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                <span className="font-bold text-emerald-800 block text-[13px] mb-0.5">
                  Inclusion Rules (Who must follow this workflow)
                </span>
                <p className="text-[11px] text-emerald-700/80 mb-3">
                  Specify who this workflow applies to. If selected, only requisitions created by matching designations, roles, or users will trigger this workflow. (Leave unselected to apply globally to all employees).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Target Designation</label>
                    <select
                      value={includerUserType}
                      onChange={(e) => setIncluderUserType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">All Designations</option>
                      {designationOptions.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Target Role</label>
                    <select
                      value={includerRole}
                      onChange={(e) => setIncluderRole(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">All Roles</option>
                      {roleOptions.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.text || r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Specific Requester</label>
                    <select
                      value={includerUserId}
                      onChange={(e) => setIncluderUserId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">All Employees</option>
                      {employeeOptions.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.text || emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Exclusion Criteria */}
              <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3">
                <span className="font-bold text-rose-800 block text-[13px] mb-0.5">
                  Exclusion Rules (Who is exempted / bypassed)
                </span>
                <p className="text-[11px] text-rose-700/80 mb-3">
                  Specify who is exempted from this workflow. Requisitions created by these designations, roles, or users will bypass this approval workflow entirely (e.g. Managing Director or Chief Executives).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Exempted Designation</label>
                    <select
                      value={excludeUserType}
                      onChange={(e) => setExcludeUserType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">None</option>
                      {designationOptions.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Exempted Role</label>
                    <select
                      value={excludeRole}
                      onChange={(e) => setExcludeRole(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">None</option>
                      {roleOptions.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.text || r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Exempted Employee</label>
                    <select
                      value={excludeUserId}
                      onChange={(e) => setExcludeUserId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">None</option>
                      {employeeOptions.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.text || emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Steps Hierarchy Builder Section */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">
                Approval Levels & Hierarchy ({steps.length})
              </h4>
              <p className="text-xs text-gray-500">Configure sequential approvers for this workflow.</p>
            </div>
            <button
              type="button"
              onClick={handleAddStep}
              className="px-3.5 py-1.5 bg-[#1B4D90] text-white text-xs font-semibold rounded-lg hover:bg-[#153a80] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Step
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 shadow-sm relative hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[11px]">
                      {step.step_order}
                    </span>
                    <span className="text-[13px] font-bold text-slate-800">
                      Level {step.step_order} Decision
                    </span>
                  </div>

                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      title="Remove Level"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step Title with Placeholder */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Level Title
                    </label>
                    <input
                      type="text"
                      value={step.name}
                      placeholder={`e.g. Step ${step.step_order} Review`}
                      onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                  </div>

                  {/* Approver Type */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      Approver Criteria
                    </label>
                    <select
                      value={step.type}
                      onChange={(e) => handleStepChange(index, 'type', e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700"
                    >
                      <option value="user-type">By Designation</option>
                      <option value="role-user">By User Role</option>
                      <option value="specific-user">By Specific Employee</option>
                    </select>
                  </div>

                  {/* Approver Target Selector */}
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                      {step.type === 'user-type'
                        ? 'Select Designation'
                        : step.type === 'role-user'
                        ? 'Select Role'
                        : 'Select Employee'}
                    </label>

                    {step.type === 'user-type' && (
                      <select
                        value={step.required_user_type || ''}
                        onChange={(e) => handleStepChange(index, 'required_user_type', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800"
                      >
                        <option value="">Select Designation</option>
                        {designationOptions.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {step.type === 'role-user' && (
                      <select
                        value={step.role_id || ''}
                        onChange={(e) => handleStepChange(index, 'role_id', e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800"
                      >
                        <option value="">Select Role</option>
                        {roleOptions.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.text || r.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {step.type === 'specific-user' && (
                      <select
                        value={step.user_id || ''}
                        onChange={(e) => handleStepChange(index, 'user_id', e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800"
                      >
                        <option value="">Select Employee</option>
                        {employeeOptions.map((emp: any) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.text || emp.name} {emp.designation ? `(${emp.designation})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex justify-center -mb-6 mt-2 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-400 shadow-2xs">
                      <ArrowDown className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
