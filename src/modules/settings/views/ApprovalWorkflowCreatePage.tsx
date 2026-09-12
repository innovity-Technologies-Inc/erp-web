import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Trash2, Check, ArrowDown, ChevronDown, ChevronUp, Layers, Sliders, Shield, Info } from 'lucide-react'
import { FormField } from '@/components/Form/FormField'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useRolesSelect2 } from '@/modules/user-management/hooks/useUsers'
import { useEmployeeSelect2 } from '@/modules/inventory/hooks/useSelect2'
import { useDesignationSelect2 } from '@/modules/hrm'
import { useStoreWorkflow } from '../hooks/useWorkflows'
import { useUiStore } from '@/store/useUiStore'
import type { WorkflowDTO } from '../api/workflow.api'

export const TARGET_MODULE_OPTIONS = [
  // Procurement
  { value: 'purchase_requisition', label: 'Purchase Requisition (PR)' },
  { value: 'purchase_order', label: 'Purchase Order (PO)' },
  { value: 'vendor_invoice', label: 'Vendor Invoice (Bill)' },
  { value: 'payment_request', label: 'Payment Request' },

  // HRM & Payroll
  { value: 'leave_request', label: 'Leave Request' },
  { value: 'promotion', label: 'Promotion Request' },
  { value: 'designation_change', label: 'Designation Change Request' },

  // POS & Sales
  { value: 'customer_pos_profile', label: 'Customer Tax Exemption / Profile' },
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

export const ApprovalWorkflowCreatePage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { mutate: createWorkflow, isPending: isSaving } = useStoreWorkflow()

  // Dynamic Options
  const { data: rolesData } = useRolesSelect2({})
  const { data: employeesData } = useEmployeeSelect2()
  const { data: designationsData } = useDesignationSelect2()

  const roleOptions = rolesData || []
  const employeeOptions = employeesData || []

  // Strictly dynamic designations from HRM
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
  const [requiredApprovals, setRequiredApprovals] = useState<number | ''>('')
  const [isActive, setIsActive] = useState(true)

  // Scope Rules
  const [showRules, setShowRules] = useState(false)
  const [includerRole, setIncluderRole] = useState<number | ''>('')
  const [includerUserType, setIncluderUserType] = useState<string>('')
  const [includerUserId, setIncluderUserId] = useState<number | ''>('')

  const [excludeRole, setExcludeRole] = useState<number | ''>('')
  const [excludeUserType, setExcludeUserType] = useState<string>('')
  const [excludeUserId, setExcludeUserId] = useState<number | ''>('')

  // Steps
  const [steps, setSteps] = useState<StepFormItem[]>([
    {
      name: '',
      step_order: 1,
      type: 'user-type',
      required_user_type: '',
    },
  ])

  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const isDirty = Boolean(name || steps.some((s) => s.name) || steps.length > 1)

  const handleBackOrCancel = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/settings/approval-workflows' })
    }
  }

  const handleAddStep = () => {
    const nextOrder = steps.length + 1
    setSteps((prev) => [
      ...prev,
      {
        name: '',
        step_order: nextOrder,
        type: 'user-type',
        required_user_type: designationOptions[0]?.value || '',
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
      if (field === 'type') {
        copy[index] = {
          ...copy[index],
          type: value,
          required_user_type: value === 'user-type' ? copy[index].required_user_type || designationOptions[0]?.value || '' : undefined,
          role_id: value === 'role-user' ? copy[index].role_id || null : null,
          user_id: value === 'specific-user' ? copy[index].user_id || null : null,
        }
      } else {
        copy[index] = { ...copy[index], [field]: value }
      }
      return copy
    })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showNotificationModal('Validation Error', 'Please enter a workflow name.', 'error')
      return
    }

    if (steps.length === 0) {
      showNotificationModal('Validation Error', 'Please add at least one approval step.', 'error')
      return
    }

    if (type === 'random' && requiredApprovals !== '' && Number(requiredApprovals) > steps.length) {
      showNotificationModal('Validation Error', `Required approvals (${requiredApprovals}) cannot exceed total steps (${steps.length}).`, 'error')
      return
    }

    const payload: WorkflowDTO = {
      name: name.trim(),
      module,
      type,
      total_steps: steps.length,
      required_approvals: type === 'random' && requiredApprovals !== '' ? Number(requiredApprovals) : null,
      is_active: isActive,
      includer_role_ids: includerRole ? [Number(includerRole)] : null,
      includer_user_types: includerUserType ? [includerUserType] : null,
      includer_user_ids: includerUserId ? [Number(includerUserId)] : null,
      exclude_role_ids: excludeRole ? [Number(excludeRole)] : null,
      exclude_user_types: excludeUserType ? [excludeUserType] : null,
      exclude_user_ids: excludeUserId ? [Number(excludeUserId)] : null,
      steps: steps.map((s, idx) => ({
        name: s.name.trim() || `Step ${idx + 1}`,
        step_order: idx + 1,
        type: s.type,
        required_user_type: s.type === 'user-type' ? s.required_user_type : null,
        role_id: s.type === 'role-user' && s.role_id ? Number(s.role_id) : null,
        user_id: s.type === 'specific-user' && s.user_id ? Number(s.user_id) : null,
      })),
    }

    createWorkflow(payload, {
      onSuccess: (res: any) => {
        showNotificationModal(
          'Saved Successfully!',
          res.message || 'Approval workflow configuration has been saved.',
          'success'
        )
        navigate({ to: '/settings/approval-workflows' })
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to save workflow.'
        showNotificationModal('Save Failed', msg, 'error')
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackOrCancel}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Add New Approval Workflow</h1>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* Card 1: General Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">General Information</h2>
                  <p className="text-[12px] text-gray-400 font-medium">Select target ERP module and workflow execution model.</p>
                </div>
              </div>
              <Info className="h-5 w-5 text-gray-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Workflow Name" required>
                <input
                  type="text"
                  placeholder="e.g. Standard Multi-Level Approval"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="erp-input w-full"
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Target Module" required>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="erp-input w-full font-medium text-slate-700"
                >
                  {TARGET_MODULE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                  Workflow Execution Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('sequential')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      type === 'sequential'
                        ? 'bg-primary/5 border-primary text-primary shadow-xs'
                        : 'bg-white border-gray-200 text-slate-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[13px] font-bold">Sequential</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Step 1 ➔ Step 2 ➔ Step 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('random')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      type === 'random'
                        ? 'bg-primary/5 border-primary text-primary shadow-xs'
                        : 'bg-white border-gray-200 text-slate-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[13px] font-bold">Parallel (Random)</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Any approver in parallel</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3.5 p-3.5 bg-gray-50/60 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-[13px] font-bold text-slate-800">Active Workflow</span>
                    <p className="text-[11px] text-slate-500">Automatically applies to new submissions in this module.</p>
                  </div>
                </label>
              </div>
            </div>

            {type === 'random' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-amber-900">
                      Required Approvals (Quorum / Threshold)
                    </label>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      How many approvers must approve before this document is fully Approved?
                    </p>
                  </div>
                  <div className="w-full sm:w-48">
                    <input
                      type="number"
                      min={1}
                      value={requiredApprovals}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') {
                          setRequiredApprovals('')
                        } else {
                          const num = parseInt(val, 10)
                          setRequiredApprovals(isNaN(num) || num < 1 ? '' : num)
                        }
                      }}
                      placeholder={`All (${steps.length || 1})`}
                      className="erp-input w-full bg-white font-bold text-amber-900"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                  • <strong>Leave blank:</strong> All {steps.length} approvers must approve (Unanimous). If 1 person rejects, the workflow fails.<br />
                  • <strong>Set to e.g. 2:</strong> As soon as any 2 people approve, the document is Approved. If 1 person rejects, the other 2 can still approve and complete it.
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Approval Hierarchy Levels */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                    Approval Levels & Hierarchy ({steps.length})
                  </h2>
                  <p className="text-[12px] text-gray-400 font-medium">Configure sequential levels and designate who approves at each stage.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-2 px-3.5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-[12px] font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 shadow-2xs relative hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs">
                        {step.step_order}
                      </span>
                      <span className="text-[14px] font-bold text-slate-800">
                        Level {step.step_order} Decision
                      </span>
                    </div>

                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Level"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step Title */}
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                        Level Title
                      </label>
                      <input
                        type="text"
                        value={step.name}
                        placeholder={`e.g. Step ${step.step_order} Review`}
                        onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                        className="erp-input w-full text-xs font-medium bg-white"
                      />
                    </div>

                    {/* Approver Criteria */}
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                        Approver Criteria
                      </label>
                      <select
                        value={step.type}
                        onChange={(e) => handleStepChange(index, 'type', e.target.value as any)}
                        className="erp-input w-full text-xs font-medium bg-white text-slate-700"
                      >
                        <option value="user-type">By Designation</option>
                        <option value="role-user">By User Role</option>
                        <option value="specific-user">By Specific Employee</option>
                      </select>
                    </div>

                    {/* Approver Selection */}
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
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
                          className="erp-input w-full text-xs font-medium bg-white text-slate-800"
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
                          value={step.role_id !== null && step.role_id !== undefined ? String(step.role_id) : ''}
                          onChange={(e) => handleStepChange(index, 'role_id', e.target.value ? Number(e.target.value) : null)}
                          className="erp-input w-full text-xs font-medium bg-white text-slate-800"
                        >
                          <option value="">Select Role</option>
                          {roleOptions.map((r: any) => (
                            <option key={r.id} value={String(r.id)}>
                              {r.text || r.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {step.type === 'specific-user' && (
                        <select
                          value={step.user_id !== null && step.user_id !== undefined ? String(step.user_id) : ''}
                          onChange={(e) => handleStepChange(index, 'user_id', e.target.value ? Number(e.target.value) : null)}
                          className="erp-input w-full text-xs font-medium bg-white text-slate-800"
                        >
                          <option value="">Select Employee</option>
                          {employeeOptions.map((emp: any) => (
                            <option key={emp.id} value={String(emp.id)}>
                              {emp.text || emp.name} {emp.designation ? `(${emp.designation})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex justify-center -mb-7.5 mt-3.5 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-400 shadow-xs">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Inclusion & Exclusion Rules */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRules(!showRules)}
              className="w-full p-6 bg-white flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">Inclusion & Exclusion Rules (Optional Scope)</h2>
                  <p className="text-[12px] text-gray-400 font-medium">Define which requesters this workflow specifically applies to or who is exempted.</p>
                </div>
              </div>
              {showRules ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showRules && (
              <div className="p-6 pt-0 space-y-5 text-xs">
                {/* Inclusion Criteria */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4.5">
                  <span className="font-bold text-emerald-800 block text-[13px] mb-1">
                    Inclusion Rules (Who must follow this workflow)
                  </span>
                  <p className="text-[11px] text-emerald-700/80 mb-3.5">
                    Specify who this workflow applies to. If selected, only records created by matching designations, roles, or users will trigger this workflow. (Leave unselected to apply globally to all employees).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1.5">Target Designation</label>
                      <select
                        value={includerUserType}
                        onChange={(e) => setIncluderUserType(e.target.value)}
                        className="erp-input w-full text-xs bg-white"
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
                      <label className="block text-gray-700 font-semibold mb-1.5">Target Role</label>
                      <select
                        value={includerRole}
                        onChange={(e) => setIncluderRole(e.target.value ? Number(e.target.value) : '')}
                        className="erp-input w-full text-xs bg-white"
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
                      <label className="block text-gray-700 font-semibold mb-1.5">Specific Requester</label>
                      <select
                        value={includerUserId}
                        onChange={(e) => setIncluderUserId(e.target.value ? Number(e.target.value) : '')}
                        className="erp-input w-full text-xs bg-white"
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
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4.5">
                  <span className="font-bold text-rose-800 block text-[13px] mb-1">
                    Exclusion Rules (Who is exempted / bypassed)
                  </span>
                  <p className="text-[11px] text-rose-700/80 mb-3.5">
                    Specify who is exempted from this workflow. Records created by these designations, roles, or users will bypass this approval workflow entirely (e.g. Managing Director or Chief Executives).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1.5">Exempted Designation</label>
                      <select
                        value={excludeUserType}
                        onChange={(e) => setExcludeUserType(e.target.value)}
                        className="erp-input w-full text-xs bg-white"
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
                      <label className="block text-gray-700 font-semibold mb-1.5">Exempted Role</label>
                      <select
                        value={excludeRole}
                        onChange={(e) => setExcludeRole(e.target.value ? Number(e.target.value) : '')}
                        className="erp-input w-full text-xs bg-white"
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
                      <label className="block text-gray-700 font-semibold mb-1.5">Exempted Employee</label>
                      <select
                        value={excludeUserId}
                        onChange={(e) => setExcludeUserId(e.target.value ? Number(e.target.value) : '')}
                        className="erp-input w-full text-xs bg-white"
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

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-4 max-w-[1600px] mx-auto">
            <button
              type="button"
              onClick={handleBackOrCancel}
              className="bg-white text-[#64748b] border border-gray-200 px-6 h-10 rounded-lg hover:bg-gray-50 transition-all shadow-sm text-[13px] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#059669] hover:bg-[#047857] text-white px-8 h-10 rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-[13px] font-semibold disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        onConfirm={() => navigate({ to: '/settings/approval-workflows' })}
        onClose={() => setIsDiscardModalOpen(false)}
        confirmText="Yes, discard"
        cancelText="Keep editing"
        variant="danger"
      />
    </div>
  )
}
