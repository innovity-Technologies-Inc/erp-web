import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { budgetCategorySchema } from '../../hooks/validation'
import type { BudgetCategoryFormValues } from '../../hooks/validation'
import {
  useCreateBudgetCategory,
  useUpdateBudgetCategory,
} from '../../hooks/useBudgetCategories'
import { useUiStore } from '@/store/useUiStore'
import type { BudgetCategory } from '../../api/types'

interface BudgetCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryToEdit?: BudgetCategory | null
}

export const BudgetCategoryModal = ({
  isOpen,
  onClose,
  categoryToEdit,
}: BudgetCategoryModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeCategory, isPending: isStoring } = useCreateBudgetCategory()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateBudgetCategory()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetCategoryFormValues>({
    resolver: zodResolver(budgetCategorySchema) as any,
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        reset({
          name: categoryToEdit.name || '',
          description: categoryToEdit.description || '',
        })
      } else {
        reset({
          name: '',
          description: '',
        })
      }
    }
  }, [isOpen, categoryToEdit, reset])

  const onSubmit = (data: BudgetCategoryFormValues) => {
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
    }

    if (categoryToEdit) {
      updateCategory(
        { uuid: categoryToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Budget Category Updated!',
              `Budget category "${payload.name}" has been updated successfully.`,
              'success'
            )
          },
          onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update budget category.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeCategory(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Budget Category Created!',
            `Budget category "${payload.name}" has been created successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to create budget category.'
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
      title={categoryToEdit ? 'Edit Budget Category' : 'Add Budget Category'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {categoryToEdit ? (
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
        <FormField label="Category Name" error={errors.name?.message} required>
          <input
            {...register('name')}
            type="text"
            className="erp-input w-full"
            placeholder="Enter budget category name"
            autoComplete="off"
            autoFocus
          />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={3}
            className="erp-input w-full resize-none"
            placeholder="Enter description (optional)"
          />
        </FormField>
      </form>
    </Modal>
  )
}
