import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { termSchema } from '../hooks/validation'
import type { TermFormValues } from '../hooks/validation'
import { useCreateTerm, useUpdateTerm, useTerm } from '../hooks/useTerms'

interface TermModalProps {
  isOpen: boolean
  onClose: () => void
  termId: number | null
}

export const TermModal = ({ isOpen, onClose, termId }: TermModalProps) => {
  const { data: termResponse, isLoading: isFetching } = useTerm(termId)
  const { mutate: createTerm, isPending: isCreating } = useCreateTerm()
  const { mutate: updateTerm, isPending: isUpdating } = useUpdateTerm()

  const {
    register,
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
    if (termResponse?.data) {
      reset({
        description: termResponse.data.description,
        status: termResponse.data.status,
      })
    } else {
      reset({
        description: '',
        status: 1,
      })
    }
  }, [termResponse, reset, isOpen])

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
            reset()
          },
        }
      )
    } else {
      createTerm(payload, {
        onSuccess: () => {
          onClose()
          reset()
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
            {termId ? 'Update Term' : 'Create Term'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={4}
            className="erp-input min-h-[120px] resize-y py-3"
            placeholder="Enter sales term and condition..."
          />
        </FormField>

        <FormField label="Status">
          <select
            {...register('status')}
            className="erp-input"
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </FormField>
      </form>
    </Modal>
  )
}
