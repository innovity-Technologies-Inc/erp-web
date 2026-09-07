import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { costCenterSchema } from '../../hooks/validation'
import type { CostCenterFormValues } from '../../hooks/validation'
import {
  useCreateCostCenter,
  useUpdateCostCenter,
} from '../../hooks/useCostCenters'
import { useUiStore } from '@/store/useUiStore'
import type { CostCenter } from '../../api/types'

interface CostCenterModalProps {
  isOpen: boolean
  onClose: () => void
  costCenterToEdit?: CostCenter | null
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export const CostCenterModal = ({
  isOpen,
  onClose,
  costCenterToEdit,
}: CostCenterModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeCostCenter, isPending: isStoring } = useCreateCostCenter()
  const { mutate: updateCostCenter, isPending: isUpdating } = useUpdateCostCenter()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CostCenterFormValues>({
    resolver: zodResolver(costCenterSchema) as any,
    defaultValues: {
      code: '',
      name: '',
      description: '',
      status: 'active',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (costCenterToEdit) {
        reset({
          code: costCenterToEdit.code || '',
          name: costCenterToEdit.name || '',
          description: costCenterToEdit.description || '',
          status: costCenterToEdit.status || 'active',
        })
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          status: 'active',
        })
      }
    }
  }, [isOpen, costCenterToEdit, reset])

  const onSubmit = (data: CostCenterFormValues) => {
    const payload = {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description?.trim() || null,
      status: data.status,
    }

    if (costCenterToEdit) {
      updateCostCenter(
        { uuid: costCenterToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Cost Center Updated!',
              `Cost center "${payload.name}" (${payload.code}) has been updated successfully.`,
              'success'
            )
          },
          onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update cost center.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeCostCenter(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Cost Center Created!',
            `Cost center "${payload.name}" (${payload.code}) has been added successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to create cost center.'
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
      title={costCenterToEdit ? 'Edit Cost Center' : 'Add Cost Center'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {costCenterToEdit ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Cost Center Code" error={errors.code?.message} required>
            <input
              {...register('code')}
              type="text"
              className="erp-input w-full uppercase"
              placeholder="Enter cost center code"
              autoComplete="off"
              autoFocus={!costCenterToEdit}
            />
          </FormField>

          <FormField label="Status" error={errors.status?.message} required>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select2
                  options={statusOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Select status"
                />
              )}
            />
          </FormField>
        </div>

        <FormField label="Cost Center Name" error={errors.name?.message} required>
          <input
            {...register('name')}
            type="text"
            className="erp-input w-full"
            placeholder="Enter cost center name"
            autoComplete="off"
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
