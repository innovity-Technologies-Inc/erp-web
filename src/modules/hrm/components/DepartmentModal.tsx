import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { departmentSchema } from '../hooks/validation'
import type { DepartmentFormValues } from '../hooks/validation'
import {
  useCreateDepartment,
  useUpdateDepartment,
} from '../hooks/useDepartments'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'

interface DepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  departmentId: number | null
  initialData?: any | null
}

export const DepartmentModal = ({
  isOpen,
  onClose,
  departmentId,
  initialData,
}: DepartmentModalProps) => {
  const { mutate: storeDepartment, isPending: isStoring } = useCreateDepartment()
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment()
  const { showNotificationModal } = useUiStore()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema) as any,
    defaultValues: {
      name: '',
      code: '',
      details: '',
      status: 1,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name || '',
          code: initialData.code || '',
          details: initialData.details || '',
          status:
            initialData.status !== undefined ? Number(initialData.status) : 1,
        })
      } else {
        reset({
          name: '',
          code: '',
          details: '',
          status: 1,
        })
      }
    }
  }, [isOpen, initialData, reset])

  const statusOptions = useMemo(
    () => [
      { value: 1, label: 'Active' },
      { value: 0, label: 'Inactive' },
    ],
    []
  )

  const onSubmit = (data: DepartmentFormValues) => {
    const payload = {
      ...data,
      status: Number(data.status),
    }

    if (departmentId) {
      updateDepartment(
        { id: departmentId, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Updated Successfully!',
              'Department details have been updated successfully.',
              'success'
            )
          },
          onError: (err: any) => {
            const msg =
              err.response?.data?.message ||
              err.message ||
              'Failed to update department.'
            showNotificationModal('Update Failed', msg, 'error')
          },
        }
      )
    } else {
      storeDepartment(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Saved Successfully!',
            'New department has been created successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to create department.'
          showNotificationModal('Save Failed', msg, 'error')
        },
      })
    }
  }

  const isPending = isStoring || isUpdating
  const isFetching = !!departmentId && !initialData

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={departmentId ? 'Edit Department' : 'Create Department'}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending || isFetching}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={isFetching}
          >
            {departmentId ? (
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
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">
            Loading department data...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Department Name"
            required
            error={errors.name?.message}
          >
            <input
              type="text"
              placeholder="e.g. Finance & Accounts"
              {...register('name')}
              className="erp-input w-full"
              autoComplete="off"
            />
          </FormField>

          <FormField
            label="Department Code"
            error={errors.code?.message}
          >
            <input
              type="text"
              placeholder="e.g. DPT-ACC (Optional - auto-generated if blank)"
              {...register('code')}
              className="erp-input w-full"
              autoComplete="off"
            />
          </FormField>

          <FormField
            label="Description / Details"
            error={errors.details?.message}
          >
            <textarea
              rows={3}
              placeholder="Enter department scope or functional description..."
              {...register('details')}
              className="erp-input w-full p-3 min-h-[100px] resize-none"
              autoComplete="off"
            />
          </FormField>

          <FormField label="Status" error={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select2
                  options={statusOptions}
                  value={field.value !== undefined ? Number(field.value) : 1}
                  onChange={(val) => field.onChange(Number(val))}
                  placeholder="Select Status"
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
