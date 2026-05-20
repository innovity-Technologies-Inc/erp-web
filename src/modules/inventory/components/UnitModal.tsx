import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { unitSchema } from '../hooks/validation'
import type { UnitFormValues } from '../hooks/validation'
import { useStoreUnit, useUpdateUnit } from '../hooks/useUnits'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'

interface UnitModalProps {
  isOpen: boolean
  onClose: () => void
  unitId: number | null
  initialData?: UnitFormValues | null
}

export const UnitModal = ({ isOpen, onClose, unitId, initialData }: UnitModalProps) => {
  const { mutate: storeUnit, isPending: isStoring } = useStoreUnit()
  const { mutate: updateUnit, isPending: isUpdating } = useUpdateUnit()
  const { showNotificationModal } = useUiStore()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      unit_name: '',
      status: 1,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          unit_name: initialData.unit_name || '',
          status: initialData.status !== undefined ? Number(initialData.status) : 1,
        })
      } else {
        reset({
          unit_name: '',
          status: 1,
        })
      }
    }
  }, [isOpen, initialData, reset])

  const statusOptions = useMemo(() => [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ], [])

  const onSubmit = (data: UnitFormValues) => {
    const payload = {
      ...data,
      status: Number(data.status),
    }

    if (unitId) {
      updateUnit(
        { id: unitId, data: payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Updated Successfully!',
              'Unit details have been updated successfully.',
              'success'
            )
          },
        }
      )
    } else {
      storeUnit(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Saved Successfully!',
            'New unit has been added successfully.',
            'success'
          )
        },
      })
    }
  }

  const isPending = isStoring || isUpdating
  const isFetching = !!unitId && !initialData

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={unitId ? 'Edit Unit' : 'Add New Unit'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending || isFetching}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending} disabled={isFetching}>
            {unitId ? (
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
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading unit details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Unit Name" error={errors.unit_name?.message} required>
            <input
              {...register('unit_name')}
              type="text"
              className="erp-input w-full"
              placeholder="Enter unit name (e.g., KG, Meter, Piece)"
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
                  value={field.value}
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
