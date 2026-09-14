import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { useWarehouses } from '../../hooks/useWarehouse'
import { useCreateWarehouseZone, useUpdateWarehouseZone } from '../../hooks/useWarehouseZones'
import type { WarehouseZone } from '../../api/warehouseZone.api'

const zoneSchema = z.object({
  warehouse_id: z.union([z.string().min(1, 'Warehouse is required'), z.number().min(1, 'Warehouse is required')]),
  zone_name: z.string().min(1, 'Zone name is required').max(255),
  zone_code: z.string().min(1, 'Zone code is required').max(50),
  status: z.enum(['active', 'inactive']),
})

type ZoneFormValues = z.infer<typeof zoneSchema>

interface ZoneModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: WarehouseZone | null
}

export const ZoneModal = ({ isOpen, onClose, initialData }: ZoneModalProps) => {
  const isEditing = !!initialData
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses()
  const { mutate: createZone, isPending: isCreating } = useCreateWarehouseZone()
  const { mutate: updateZone, isPending: isUpdating } = useUpdateWarehouseZone()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema) as any,
    defaultValues: {
      warehouse_id: '',
      zone_name: '',
      zone_code: '',
      status: 'active',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          warehouse_id: initialData.warehouse_id ? String(initialData.warehouse_id) : '',
          zone_name: initialData.zone_name || '',
          zone_code: initialData.zone_code || '',
          status: initialData.status || 'active',
        })
      } else {
        reset({
          warehouse_id: '',
          zone_name: '',
          zone_code: '',
          status: 'active',
        })
      }
    }
  }, [isOpen, initialData, reset])

  const warehouseOptions = (warehousesData || []).map((w: any) => {
    const name = w.name || w.text || w.warehouse_name || `Warehouse #${w.id}`
    const code = w.warehouse_code || w.code
    return {
      label: code ? `${name} (${code})` : name,
      value: String(w.id),
    }
  })

  const onSubmit = (values: ZoneFormValues) => {
    const payload = {
      warehouse_id: Number(values.warehouse_id),
      zone_name: values.zone_name.trim(),
      zone_code: values.zone_code.trim().toUpperCase(),
      status: values.status,
    }

    if (isEditing && initialData) {
      updateZone(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            onClose()
          },
        }
      )
    } else {
      createZone(payload, {
        onSuccess: () => {
          onClose()
        },
      })
    }
  }

  const isPending = isCreating || isUpdating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Warehouse Zone' : 'Create Warehouse Zone'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <Controller
          name="warehouse_id"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Target Warehouse <span className="text-rose-500">*</span>
              </label>
              <Select2
                options={warehouseOptions}
                value={field.value ? String(field.value) : ''}
                onChange={(val) => field.onChange(val)}
                placeholder="Select warehouse..."
                isDisabled={isLoadingWarehouses || isPending}
              />
              {errors.warehouse_id && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.warehouse_id.message}</p>
              )}
            </div>
          )}
        />

        <FormField label="Zone Name" required error={errors.zone_name?.message}>
          <input
            type="text"
            placeholder="e.g. Cold Storage / Zone A"
            disabled={isPending}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
            {...register('zone_name')}
          />
        </FormField>

        <FormField label="Zone Code" required error={errors.zone_code?.message}>
          <input
            type="text"
            placeholder="e.g. ZONE-A / CS-01"
            disabled={isPending}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 uppercase"
            {...register('zone_code')}
          />
        </FormField>

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isPending}>
            <Save className="w-4 h-4 mr-1.5" />
            {isEditing ? 'Update Zone' : 'Create Zone'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
