import { useState } from 'react'
import { CheckCircle2, XCircle, Send, Lock } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { useApproveBudget } from '../../hooks/useBudgets'
import { useUiStore } from '@/store/useUiStore'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/formatters'
import type { Budget } from '../../api/types'

export type BudgetActionType = 'submit' | 'approve' | 'reject' | 'close'

interface BudgetApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  budget: Budget | null
  action: BudgetActionType
}

const actionConfig: Record<
  BudgetActionType,
  {
    title: string
    confirmText: string
    color: string
    icon: any
    description: string
  }
> = {
  submit: {
    title: 'Submit Budget Allocation',
    confirmText: 'Yes, Submit for Approval',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: Send,
    description: 'Submitting this draft budget will generate an official Budget Number and send it for manager approval.',
  },
  approve: {
    title: 'Approve Budget Allocation',
    confirmText: 'Yes, Approve Budget',
    color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon: CheckCircle2,
    description: 'Approving this budget will post the initial Opening Credit Limit to the Budget Ledger and enable it for Purchase Requisitions.',
  },
  reject: {
    title: 'Reject Budget Allocation',
    confirmText: 'Yes, Reject',
    color: 'bg-rose-600 hover:bg-rose-700 text-white',
    icon: XCircle,
    description: 'Rejecting this budget will return it to the originator with your feedback.',
  },
  close: {
    title: 'Close Budget Allocation',
    confirmText: 'Yes, Close & Lapse Balance',
    color: 'bg-slate-700 hover:bg-slate-800 text-white',
    icon: Lock,
    description: 'Closing this budget will lapse any remaining unspent balance in the ledger.',
  },
}

export const BudgetApprovalModal = ({
  isOpen,
  onClose,
  budget,
  action,
}: BudgetApprovalModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { currency, currencyPosition } = useSettings()
  const { mutate: performApproval, isPending } = useApproveBudget()
  const [remarks, setRemarks] = useState('')

  if (!budget) return null

  const config = actionConfig[action] || actionConfig.submit
  const Icon = config.icon

  const handleConfirm = () => {
    performApproval(
      {
        uuid: budget.uuid,
        action,
        remarks: remarks.trim() || null,
      },
      {
        onSuccess: () => {
          onClose()
          setRemarks('')
          showNotificationModal(
            'Action Successful!',
            `Budget has been successfully updated (${action}).`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Action failed.'
          showNotificationModal('Action Failed', message, 'error')
        },
      }
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isPending}
            className={config.color}
          >
            <Icon className="h-4 w-4" />
            {config.confirmText}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Info Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Budget Head:</span>
            <span className="font-semibold text-gray-900">{budget.budget_head?.name || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Cost Center:</span>
            <span className="font-medium text-gray-800">{budget.cost_center?.name || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Allocated Amount:</span>
            <span className="font-mono font-bold text-primary">
              {formatCurrency(Number(budget.allocated_amount), currency, currencyPosition)}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          {config.description}
        </p>

        <FormField label="Review Remarks / Reason" required={action === 'reject'}>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="erp-input w-full resize-none"
            placeholder={
              action === 'reject'
                ? 'Please provide reason for rejection...'
                : 'Enter remarks or notes (optional)...'
            }
          />
        </FormField>
      </div>
    </Modal>
  )
}
