import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { termSchema } from '../hooks/validation'
import type { TermFormValues } from '../hooks/validation'
import { useCreateTerm, useUpdateTerm } from '../hooks/useTerms'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'

interface TermModalProps {
  isOpen: boolean
  onClose: () => void
  termId: number | null
  initialData?: TermFormValues | null
}

export const TermModal = ({ isOpen, onClose, termId, initialData }: TermModalProps) => {
  const { mutate: createTerm, isPending: isCreating } = useCreateTerm()
  const { mutate: updateTerm, isPending: isUpdating } = useUpdateTerm()
  const { showNotificationModal } = useUiStore()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      description: '',
      status: 1,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          description: initialData.description || '',
          status: initialData.status !== undefined ? Number(initialData.status) : 1,
        })
      } else {
        reset({
          description: '',
          status: 1,
        })
      }
    }
  }, [isOpen, initialData, reset])

  const statusOptions = useMemo(() => [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ], [])

  const onSubmit = (data: TermFormValues) => {
    // Convert status to number if it's not
    const payload = {
      ...data,
      status: Number(data.status),
    }

    if (termId) {
      updateTerm(
        { id: termId, data: payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Updated Successfully!',
              'Your sales terms and conditions have been updated successfully.',
              'success'
            )
          },
        }
      )
    } else {
      createTerm(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Saved Successfully!',
            'Your sales terms and conditions have been saved successfully.',
            'success'
          )
        },
      })
    }
  }

  const isPending = isCreating || isUpdating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={termId ? 'Edit Sales Term' : 'Add New Sales Term'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {termId ? (
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
        <FormField label="Description" error={errors.description?.message}>
          <textarea {...register('description')}
            rows={4}
            className="erp-input min-h-[120px] resize-y py-3 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="Enter sales term and condition..."
          />
        </FormField>

        <FormField label="Status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select2
                options={statusOptions}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                className="w-full"
                menuPortalTarget={document.body}
              />
            )}
          />
        </FormField>
      </form>
    </Modal>
  )
}
