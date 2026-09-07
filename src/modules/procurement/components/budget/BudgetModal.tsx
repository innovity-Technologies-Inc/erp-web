import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { budgetSchema } from '../../hooks/validation'
import type { BudgetFormValues } from '../../hooks/validation'
import {
  useCreateBudget,
  useUpdateBudget,
} from '../../hooks/useBudgets'
import { useCostCenters } from '../../hooks/useCostCenters'
import { useBudgetHeads } from '../../hooks/useBudgetHeads'
import { useFinancialYearsDatatable } from '@/modules/account/hooks/useFinancialYear'
import { useDepartments } from '@/modules/hrm'
import { useUiStore } from '@/store/useUiStore'
import type { Budget } from '../../api/types'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  budgetToEdit?: Budget | null
}

export const BudgetModal = ({
  isOpen,
  onClose,
  budgetToEdit,
}: BudgetModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeBudget, isPending: isStoring } = useCreateBudget()
  const { mutate: updateBudget, isPending: isUpdating } = useUpdateBudget()

  // Master Data Options
  const { data: fyData } = useFinancialYearsDatatable({ length: 100 })
  const { data: costCentersData } = useCostCenters({ per_page: 200 })
  const { data: budgetHeadsData } = useBudgetHeads({ per_page: 200 })
  const { data: departmentsData } = useDepartments({ status: 1 })

  const departmentOptions = useMemo(() => {
    const list = departmentsData?.data || departmentsData?.response || []
    return list.map((d: any) => ({
      value: String(d.id),
      label: d.code ? `${d.name} (${d.code})` : d.name,
    }))
  }, [departmentsData])

  const financialYearOptions = useMemo(() => {
    return (fyData?.data || []).map((fy: any) => ({
      value: String(fy.id),
      label: fy.year,
    }))
  }, [fyData])

  const costCenterOptions = useMemo(() => {
    return (costCentersData?.response || [])
      .filter((cc) => cc.status === 'active')
      .map((cc) => ({
        value: String(cc.id),
        label: `${cc.name} (${cc.code})`,
      }))
  }, [costCentersData])

  const budgetHeadOptions = useMemo(() => {
    return (budgetHeadsData?.response || []).map((bh) => ({
      value: String(bh.id),
      label: `${bh.name} (${bh.code})`,
    }))
  }, [budgetHeadsData])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      financial_year_id: '' as any,
      department_id: '' as any,
      cost_center_id: '' as any,
      budget_head_id: '' as any,
      allocated_amount: '' as any,
      remarks: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (budgetToEdit) {
        reset({
          financial_year_id: budgetToEdit.financial_year_id,
          department_id: budgetToEdit.department_id,
          cost_center_id: budgetToEdit.cost_center_id,
          budget_head_id: budgetToEdit.budget_head_id,
          allocated_amount: Number(budgetToEdit.allocated_amount),
          remarks: budgetToEdit.remarks || '',
        })
      } else {
        reset({
          financial_year_id: financialYearOptions[0]?.value ? Number(financialYearOptions[0].value) : ('' as any),
          department_id: '' as any,
          cost_center_id: '' as any,
          budget_head_id: '' as any,
          allocated_amount: '' as any,
          remarks: '',
        })
      }
    }
  }, [isOpen, budgetToEdit, financialYearOptions, reset])

  const onSubmit = (data: BudgetFormValues) => {
    const payload = {
      financial_year_id: Number(data.financial_year_id),
      department_id: Number(data.department_id),
      cost_center_id: Number(data.cost_center_id),
      budget_head_id: Number(data.budget_head_id),
      allocated_amount: Number(data.allocated_amount),
      remarks: data.remarks?.trim() || null,
    }

    if (budgetToEdit) {
      updateBudget(
        { uuid: budgetToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Budget Updated!',
              'Draft budget allocation updated successfully.',
              'success'
            )
          },
          onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update budget.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeBudget(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Budget Created!',
            'New draft budget allocation created successfully.',
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to create budget.'
          showNotificationModal('Create Failed', message, 'error')
        },
      })
    }
  }

  const isPending = isStoring || isUpdating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Budget Allocation (Draft)' : 'New Budget Allocation'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {budgetToEdit ? (
              <>
                <PenLine className="h-4 w-4" />
                Update
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Draft
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Financial Year" error={errors.financial_year_id?.message} required>
            <Controller
              name="financial_year_id"
              control={control}
              render={({ field }) => (
                <Select2
                  options={financialYearOptions}
                  value={field.value ? String(field.value) : ''}
                  onChange={(val) => field.onChange(val ? Number(val) : '')}
                  placeholder="Select financial year"
                />
              )}
            />
          </FormField>

          <FormField label="Department" error={errors.department_id?.message} required>
            <Controller
              name="department_id"
              control={control}
              render={({ field }) => (
                <Select2
                  options={departmentOptions}
                  value={field.value ? String(field.value) : ''}
                  onChange={(val) => field.onChange(val ? Number(val) : '')}
                  placeholder="Select department"
                />
              )}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Cost Center" error={errors.cost_center_id?.message} required>
            <Controller
              name="cost_center_id"
              control={control}
              render={({ field }) => (
                <Select2
                  options={costCenterOptions}
                  value={field.value ? String(field.value) : ''}
                  onChange={(val) => field.onChange(val ? Number(val) : '')}
                  placeholder="Select cost center"
                />
              )}
            />
          </FormField>

          <FormField label="Budget Head" error={errors.budget_head_id?.message} required>
            <Controller
              name="budget_head_id"
              control={control}
              render={({ field }) => (
                <Select2
                  options={budgetHeadOptions}
                  value={field.value ? String(field.value) : ''}
                  onChange={(val) => field.onChange(val ? Number(val) : '')}
                  placeholder="Select budget head"
                />
              )}
            />
          </FormField>
        </div>

        <FormField label="Allocated Amount" error={errors.allocated_amount?.message} required>
          <input
            {...register('allocated_amount')}
            type="number"
            step="0.01"
            min="0"
            className="erp-input w-full font-semibold text-gray-900"
            placeholder="Enter allocated amount"
            autoComplete="off"
          />
        </FormField>

        <FormField label="Remarks" error={errors.remarks?.message}>
          <textarea
            {...register('remarks')}
            rows={2}
            className="erp-input w-full resize-none"
            placeholder="Enter remarks (optional)"
          />
        </FormField>
      </form>
    </Modal>
  )
}
