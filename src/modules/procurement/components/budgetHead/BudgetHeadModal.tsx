import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { budgetHeadSchema } from '../../hooks/validation'
import type { BudgetHeadFormValues } from '../../hooks/validation'
import {
  useCreateBudgetHead,
  useUpdateBudgetHead,
} from '../../hooks/useBudgetHeads'
import { useBudgetCategories } from '../../hooks/useBudgetCategories'
import { useUiStore } from '@/store/useUiStore'
import type { BudgetHead } from '../../api/types'

interface BudgetHeadModalProps {
  isOpen: boolean
  onClose: () => void
  headToEdit?: BudgetHead | null
}

export const BudgetHeadModal = ({
  isOpen,
  onClose,
  headToEdit,
}: BudgetHeadModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeHead, isPending: isStoring } = useCreateBudgetHead()
  const { mutate: updateHead, isPending: isUpdating } = useUpdateBudgetHead()

  const { data: categoriesData } = useBudgetCategories({ per_page: 200 })

  const categoryOptions = useMemo(() => {
    return (categoriesData?.response || []).map((cat) => ({
      value: String(cat.id),
      label: cat.name,
    }))
  }, [categoriesData])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetHeadFormValues>({
    resolver: zodResolver(budgetHeadSchema) as any,
    defaultValues: {
      budget_category_id: '' as any,
      code: '',
      name: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (headToEdit) {
        reset({
          budget_category_id: headToEdit.budget_category_id,
          code: headToEdit.code || '',
          name: headToEdit.name || '',
        })
      } else {
        reset({
          budget_category_id: '' as any,
          code: '',
          name: '',
        })
      }
    }
  }, [isOpen, headToEdit, reset])

  const onSubmit = (data: BudgetHeadFormValues) => {
    const payload = {
      budget_category_id: Number(data.budget_category_id),
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
    }

    if (headToEdit) {
      updateHead(
        { uuid: headToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Budget Head Updated!',
              `Budget head "${payload.name}" (${payload.code}) has been updated successfully.`,
              'success'
            )
          },
          onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update budget head.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeHead(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Budget Head Created!',
            `Budget head "${payload.name}" (${payload.code}) has been created successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to create budget head.'
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
      title={headToEdit ? 'Edit Budget Head' : 'Add Budget Head'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {headToEdit ? (
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Budget Category" error={errors.budget_category_id?.message} required>
          <Controller
            name="budget_category_id"
            control={control}
            render={({ field }) => (
              <Select2
                options={categoryOptions}
                value={field.value ? String(field.value) : ''}
                onChange={(val) => field.onChange(val ? Number(val) : '')}
                placeholder="Select budget category"
              />
            )}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Budget Head Code" error={errors.code?.message} required>
            <input
              {...register('code')}
              type="text"
              className="erp-input w-full uppercase"
              placeholder="Enter budget head code"
              autoComplete="off"
            />
          </FormField>

          <FormField label="Budget Head Name" error={errors.name?.message} required>
            <input
              {...register('name')}
              type="text"
              className="erp-input w-full"
              placeholder="Enter budget head name"
              autoComplete="off"
            />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
