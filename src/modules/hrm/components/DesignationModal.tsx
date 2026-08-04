import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { designationSchema } from '../hooks/validation'
import type { DesignationFormValues } from '../hooks/validation'
import { useCreateDesignation, useUpdateDesignation } from '../hooks/useDesignations'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'

interface DesignationModalProps {
  isOpen: boolean
  onClose: () => void
  designationId: number | null
  initialData?: DesignationFormValues | null
}

export const DesignationModal = ({ isOpen, onClose, designationId, initialData }: DesignationModalProps) => {
  const { mutate: storeDesignation, isPending: isStoring } = useCreateDesignation()
  const { mutate: updateDesignation, isPending: isUpdating } = useUpdateDesignation()
  const { showNotificationModal } = useUiStore()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema) as any,
    defaultValues: {
      designation: '',
      details: '',
      status: 1,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          designation: initialData.designation || '',
          details: initialData.details || '',
          status: initialData.status !== undefined ? Number(initialData.status) : 1,
        })
      } else {
        reset({
          designation: '',
          details: '',
          status: 1,
        })
      }
    }
  }, [isOpen, initialData, reset])

  const statusOptions = useMemo(() => [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ], [])

  const onSubmit = (data: DesignationFormValues) => {
    const payload = {
      ...data,
      status: Number(data.status),
    }

    if (designationId) {
      updateDesignation(
        { id: designationId, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Updated Successfully!',
              'Designation details have been updated successfully.',
              'success'
            )
          },
        }
      )
    } else {
      storeDesignation(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Saved Successfully!',
            'New designation has been added successfully.',
            'success'
          )
        },
      })
    }
  }

  const isPending = isStoring || isUpdating
  const isFetching = !!designationId && !initialData

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={designationId ? 'Edit Designation' : 'Add New Designation'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending || isFetching}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending} disabled={isFetching}>
            {designationId ? (
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
      {isFetching ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Designation" error={errors.designation?.message} required>
            <input
              {...register('designation')}
              type="text"
              className="erp-input w-full"
              placeholder="Enter designation name"
              autoComplete="off"
            />
          </FormField>

          <FormField label="Details" error={errors.details?.message}>
            <textarea
              {...register('details')}
              className="erp-input w-full p-3 min-h-[100px]"
              placeholder="Details write here"
              autoComplete="off"
            />
          </FormField>

          <FormField label="Status">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select2
                  options={statusOptions}
                  value={field.value as any}
                  onChange={(val) => field.onChange(val)}
                  className="w-full"
                  menuPortalTarget={document.body}
                />
              )}
            />
          </FormField>
        </form>
      )}
    </Modal>
  )
}
