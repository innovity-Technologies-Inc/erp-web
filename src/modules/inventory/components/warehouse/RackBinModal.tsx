import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, QrCode } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { useWarehouseZones } from '../../hooks/useWarehouseZones'
import { useCreateWarehouseRackBin, useUpdateWarehouseRackBin } from '../../hooks/useWarehouseRackBins'
import type { WarehouseRackBin } from '../../api/warehouseRackBin.api'
import type { WarehouseZone } from '../../api/warehouseZone.api'

const rackBinSchema = z.object({
  zone_id: z.union([z.string().min(1, 'Zone is required'), z.number().min(1, 'Zone is required')]),
  aisle: z.string().optional(),
  rack: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().optional(),
  capacity_volume: z.union([z.string(), z.number()]).optional().nullable(),
  capacity_weight: z.union([z.string(), z.number()]).optional().nullable(),
  max_quantity: z.union([z.string(), z.number()]).optional().nullable(),
  status: z.enum(['active', 'inactive']),
})

type RackBinFormValues = z.infer<typeof rackBinSchema>

interface RackBinModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: WarehouseRackBin | null
}

export const RackBinModal = ({ isOpen, onClose, initialData }: RackBinModalProps) => {
  const isEditing = !!initialData
  const { data: zonesData, isLoading: isLoadingZones } = useWarehouseZones({ per_page: 100, status: isEditing ? undefined : 'active' })
  const { mutate: createRackBin, isPending: isCreating } = useCreateWarehouseRackBin()
  const { mutate: updateRackBin, isPending: isUpdating } = useUpdateWarehouseRackBin()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RackBinFormValues>({
    resolver: zodResolver(rackBinSchema) as any,
    defaultValues: {
      zone_id: '',
      aisle: '',
      rack: '',
      shelf: '',
      bin: '',
      capacity_volume: '',
      capacity_weight: '',
      max_quantity: 1000,
      status: 'active',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          zone_id: initialData.zone_id ? String(initialData.zone_id) : '',
          aisle: initialData.aisle || '',
          rack: initialData.rack || '',
          shelf: initialData.shelf || '',
          bin: initialData.bin || '',
          capacity_volume: initialData.capacity_volume ?? '',
          capacity_weight: initialData.capacity_weight ?? '',
          max_quantity: initialData.max_quantity ?? 1000,
          status: initialData.status || 'active',
        })
      } else {
        reset({
          zone_id: '',
          aisle: '',
          rack: '',
          shelf: '',
          bin: '',
          capacity_volume: '',
          capacity_weight: '',
          max_quantity: 1000,
          status: 'active',
        })
      }
    }
  }, [isOpen, initialData, reset])

  const zoneResData = (zonesData as any)?.response || (zonesData as any)?.data
  const zoneList: WarehouseZone[] = Array.isArray(zoneResData?.data) ? zoneResData.data : Array.isArray(zoneResData) ? zoneResData : []
  const zoneOptions = zoneList
    .filter((z) => isEditing ? (z.status === 'active' || String(z.id) === String(initialData?.zone_id)) : (z.status === 'active' || !z.status))
    .map((z) => {
      const whName = z.warehouse?.name ? (z.warehouse.warehouse_code ? `${z.warehouse.name} (${z.warehouse.warehouse_code})` : z.warehouse.name) : 'Warehouse'
      const statusLabel = z.status === 'inactive' ? ' [Inactive]' : ''
      return {
        label: `${z.zone_name} (${z.zone_code}) — ${whName}${statusLabel}`,
        value: String(z.id),
      }
    })

  const selectedZoneId = watch('zone_id')
  const watchedAisle = watch('aisle') || '0'
  const watchedRack = watch('rack') || '0'
  const watchedShelf = watch('shelf') || '0'
  const watchedBin = watch('bin') || '0'

  const selectedZone = useMemo(() => {
    return zoneList.find((z) => String(z.id) === String(selectedZoneId))
  }, [zoneList, selectedZoneId])

  const previewBarcode = useMemo(() => {
    const whCode = selectedZone?.warehouse?.warehouse_code || 'WH'
    const zCode = selectedZone?.zone_code || 'ZONE'
    return `WH-${whCode}-${zCode}-${watchedAisle || '0'}-${watchedRack || '0'}-${watchedShelf || '0'}-${watchedBin || '0'}`.toUpperCase()
  }, [selectedZone, watchedAisle, watchedRack, watchedShelf, watchedBin])

  const onSubmit = (values: RackBinFormValues) => {
    const payload = {
      zone_id: Number(values.zone_id),
      aisle: values.aisle?.trim() || undefined,
      rack: values.rack?.trim() || undefined,
      shelf: values.shelf?.trim() || undefined,
      bin: values.bin?.trim() || undefined,
      capacity_volume: values.capacity_volume ? Number(values.capacity_volume) : null,
      capacity_weight: values.capacity_weight ? Number(values.capacity_weight) : null,
      max_quantity: values.max_quantity ? Number(values.max_quantity) : 999999,
      status: values.status,
    }

    if (isEditing && initialData) {
      updateRackBin(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            onClose()
          },
        }
      )
    } else {
      createRackBin(payload, {
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
      title={isEditing ? 'Edit Rack / Bin Location' : 'Create Rack / Bin Location'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Controller
              name="zone_id"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Select Zone <span className="text-rose-500">*</span>
                  </label>
                  <Select2
                    options={zoneOptions}
                    value={field.value ? String(field.value) : ''}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Choose zone..."
                    isDisabled={isLoadingZones || isPending}
                  />
                  {errors.zone_id && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{errors.zone_id.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <FormField label="Aisle" error={errors.aisle?.message}>
            <input
              type="text"
              placeholder="e.g. A01"
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
              {...register('aisle')}
            />
          </FormField>

          <FormField label="Rack" error={errors.rack?.message}>
            <input
              type="text"
              placeholder="e.g. R01"
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
              {...register('rack')}
            />
          </FormField>

          <FormField label="Shelf" error={errors.shelf?.message}>
            <input
              type="text"
              placeholder="e.g. S01"
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
              {...register('shelf')}
            />
          </FormField>

          <FormField label="Bin" error={errors.bin?.message}>
            <input
              type="text"
              placeholder="e.g. B01"
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
              {...register('bin')}
            />
          </FormField>

          <FormField label="Volume Capacity (m³)" error={errors.capacity_volume?.message}>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 1.50"
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
              {...register('capacity_volume')}
            />
          </FormField>

          <FormField label="Weight Capacity (kg)" error={errors.capacity_weight?.message}>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 500"
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
              {...register('capacity_weight')}
            />
          </FormField>

          <FormField label="Max Unit Quantity" error={errors.max_quantity?.message}>
            <input
              type="number"
              placeholder="e.g. 1000"
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50"
              {...register('max_quantity')}
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
        </div>

        {/* Live Barcode Preview Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">System Barcode Value</p>
              <p className="font-mono text-sm font-bold text-gray-900">{previewBarcode}</p>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 font-medium italic">Auto-generated</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isPending}>
            <Save className="w-4 h-4 mr-1.5" />
            {isEditing ? 'Update Location' : 'Save Location'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
