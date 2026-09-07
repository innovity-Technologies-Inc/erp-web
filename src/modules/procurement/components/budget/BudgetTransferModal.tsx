import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightLeft } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { budgetTransferSchema } from '../../hooks/validation'
import type { BudgetTransferFormValues } from '../../hooks/validation'
import { useTransferBudget, useBudgets, useBudgetDetails } from '../../hooks/useBudgets'
import { useUiStore } from '@/store/useUiStore'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/formatters'
import type { Budget } from '../../api/types'

interface BudgetTransferModalProps {
  isOpen: boolean
  onClose: () => void
  sourceBudget?: Budget | null
}

export const BudgetTransferModal = ({
  isOpen,
  onClose,
  sourceBudget,
}: BudgetTransferModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { currency, currencyPosition } = useSettings()
  const { mutate: performTransfer, isPending } = useTransferBudget()

  // Fetch all approved budgets
  const { data: allBudgetsData } = useBudgets({ status: 'approved', per_page: 200 })

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BudgetTransferFormValues>({
    resolver: zodResolver(budgetTransferSchema) as any,
    defaultValues: {
      source_budget_uuid: '',
      destination_budget_uuid: '',
      amount: '' as any,
      remarks: '',
    },
  })

  const selectedSourceUuid = watch('source_budget_uuid')

  // Get real-time balance for the selected source budget
  const { data: sourceDetailData } = useBudgetDetails(selectedSourceUuid || null)
  const sourceBudgetObj = (sourceDetailData as any)?.response || (sourceDetailData as any)?.data
  const sourceAvailableBalance = sourceBudgetObj?.available_balance
    ? Number(sourceBudgetObj.available_balance)
    : 0

  const approvedBudgets = useMemo(() => allBudgetsData?.response || [], [allBudgetsData])

  const sourceOptions = useMemo(() => {
    return approvedBudgets.map((b) => ({
      value: b.uuid,
      label: `${b.budget_no || 'BUDG'} - ${b.budget_head?.name || 'Head'} (${b.cost_center?.name || 'CC'})`,
    }))
  }, [approvedBudgets])

  const destinationOptions = useMemo(() => {
    return approvedBudgets
      .filter((b) => b.uuid !== selectedSourceUuid)
      .map((b) => ({
        value: b.uuid,
        label: `${b.budget_no || 'BUDG'} - ${b.budget_head?.name || 'Head'} (${b.cost_center?.name || 'CC'})`,
      }))
  }, [approvedBudgets, selectedSourceUuid])

  useEffect(() => {
    if (isOpen) {
      reset({
        source_budget_uuid: sourceBudget?.uuid || '',
        destination_budget_uuid: '',
        amount: '' as any,
        remarks: '',
      })
    }
  }, [isOpen, sourceBudget, reset])

  const onSubmit = (data: BudgetTransferFormValues) => {
    const transferAmount = Number(data.amount)
    if (sourceAvailableBalance > 0 && transferAmount > sourceAvailableBalance) {
      showNotificationModal(
        'Insufficient Balance',
        `Transfer amount (${formatCurrency(transferAmount, currency, currencyPosition)}) exceeds available source balance (${formatCurrency(sourceAvailableBalance, currency, currencyPosition)}).`,
        'warning'
      )
      return
    }

    performTransfer(
      {
        source_budget_uuid: data.source_budget_uuid,
        destination_budget_uuid: data.destination_budget_uuid,
        amount: transferAmount,
        remarks: data.remarks?.trim() || null,
      },
      {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Transfer Complete!',
            `Budget amount of ${formatCurrency(transferAmount, currency, currencyPosition)} has been transferred successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Transfer failed.'
          showNotificationModal('Transfer Failed', message, 'error')
        },
      }
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Budget Allocation"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            <ArrowRightLeft className="h-4 w-4" />
            Execute Transfer
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Source Budget */}
        <FormField label="Source Budget (From)" error={errors.source_budget_uuid?.message} required>
          <Controller
            name="source_budget_uuid"
            control={control}
            render={({ field }) => (
              <Select2
                options={sourceOptions}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                placeholder="Select source budget"
              />
            )}
          />
        </FormField>

        {/* Source Available Balance Info */}
        {selectedSourceUuid && (
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex justify-between items-center text-sm">
            <span className="text-emerald-800 font-medium">Available Source Limit:</span>
            <span className="font-mono font-bold text-emerald-900">
              {formatCurrency(sourceAvailableBalance, currency, currencyPosition)}
            </span>
          </div>
        )}

        {/* Destination Budget */}
        <FormField label="Destination Budget (To)" error={errors.destination_budget_uuid?.message} required>
          <Controller
            name="destination_budget_uuid"
            control={control}
            render={({ field }) => (
              <Select2
                options={destinationOptions}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                placeholder="Select destination budget"
                isDisabled={!selectedSourceUuid}
              />
            )}
          />
        </FormField>

        {/* Transfer Amount */}
        <FormField label="Transfer Amount" error={errors.amount?.message} required>
          <input
            {...register('amount')}
            type="number"
            step="0.01"
            min="0.01"
            className="erp-input w-full font-semibold text-gray-900"
            placeholder="Enter transfer amount"
            autoComplete="off"
          />
        </FormField>

        {/* Remarks */}
        <FormField label="Transfer Justification / Remarks" error={errors.remarks?.message}>
          <textarea
            {...register('remarks')}
            rows={2}
            className="erp-input w-full resize-none"
            placeholder="Enter justification for this budget reallocation..."
          />
        </FormField>
      </form>
    </Modal>
  )
}
