import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sliders, Save, Building2, MapPin, Scan, Sparkles } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { useUpdateWarehouseConfig } from '../../hooks/useWarehouse'
import { useWarehouseZones } from '../../hooks/useWarehouseZones'
import type { WarehouseListItem } from '../../api/warehouse.api'
import { clsx } from 'clsx'

const configSchema = z.object({
  type: z.enum(['Owned', 'Rented', '3PL', 'Transit']).default('Owned'),
  default_picking_zone: z.string().optional().nullable(),
  default_packing_station: z.string().optional().nullable(),
  is_barcode_scanning_enabled: z.boolean().default(false),
  is_auto_location_suggest_enabled: z.boolean().default(false),
})

type ConfigFormValues = z.infer<typeof configSchema>

interface WarehouseConfigModalProps {
  isOpen: boolean
  onClose: () => void
  warehouse: (WarehouseListItem & {
    default_picking_zone?: string
    default_packing_station?: string
    is_barcode_scanning_enabled?: boolean
    is_auto_location_suggest_enabled?: boolean
    type?: 'Owned' | 'Rented' | '3PL' | 'Transit'
  }) | null
}

const typeOptions = [
  { label: 'Owned Facility', value: 'Owned' },
  { label: 'Rented Facility', value: 'Rented' },
  { label: '3PL (Third-Party Logistics)', value: '3PL' },
  { label: 'Transit Hub', value: 'Transit' },
]

export const WarehouseConfigModal = ({ isOpen, onClose, warehouse }: WarehouseConfigModalProps) => {
  const { mutate: updateConfig, isPending: isSaving } = useUpdateWarehouseConfig()
  const { data: zonesResponse, isLoading: isLoadingZones } = useWarehouseZones(
    warehouse?.id ? { warehouse_id: warehouse.id, per_page: 100 } : undefined
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema) as any,
    defaultValues: {
      type: 'Owned',
      default_picking_zone: '',
      default_packing_station: '',
      is_barcode_scanning_enabled: false,
      is_auto_location_suggest_enabled: false,
    },
  })

  const barcodeScanning = watch('is_barcode_scanning_enabled')
  const autoLocation = watch('is_auto_location_suggest_enabled')

  useEffect(() => {
    if (isOpen && warehouse) {
      reset({
        type: (warehouse.type as any) || 'Owned',
        default_picking_zone: warehouse.default_picking_zone || '',
        default_packing_station: warehouse.default_packing_station || '',
        is_barcode_scanning_enabled: Boolean(warehouse.is_barcode_scanning_enabled),
        is_auto_location_suggest_enabled: Boolean(warehouse.is_auto_location_suggest_enabled),
      })
    }
  }, [isOpen, warehouse, reset])

  const directZones = (warehouse?.zones || []).map((z: any) => ({
    label: `${z.zone_name} (${z.zone_code})`,
    value: z.zone_name,
  }))

  const fetchedZones = (
    Array.isArray(zonesResponse?.data?.data)
      ? zonesResponse?.data?.data
      : Array.isArray(zonesResponse?.data)
      ? zonesResponse?.data
      : []
  ).map((z: any) => ({
    label: `${z.zone_name} (${z.zone_code})`,
    value: z.zone_name,
  }))

  const combinedZones = [...directZones]
  fetchedZones.forEach((fz: any) => {
    if (!combinedZones.some((cz) => cz.value === fz.value)) {
      combinedZones.push(fz)
    }
  })

  const zoneOptions = [...combinedZones]
  if (warehouse?.default_picking_zone && !zoneOptions.some(z => z.value === warehouse.default_picking_zone)) {
    zoneOptions.unshift({
      label: warehouse.default_picking_zone,
      value: warehouse.default_picking_zone,
    })
  }

  const isEditMode = Boolean(
    warehouse?.default_picking_zone ||
    warehouse?.default_packing_station
  )

  const onSubmit = (values: ConfigFormValues) => {
    if (!warehouse?.uuid) return

    updateConfig(
      {
        uuid: warehouse.uuid,
        data: {
          type: values.type,
          default_picking_zone: values.default_picking_zone || undefined,
          default_packing_station: values.default_packing_station || undefined,
          is_barcode_scanning_enabled: values.is_barcode_scanning_enabled,
          is_auto_location_suggest_enabled: values.is_auto_location_suggest_enabled,
        },
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  if (!warehouse) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-bold text-gray-800">
              {isEditMode ? 'Edit Warehouse Configuration' : 'Setup Warehouse Configuration'}
            </div>
            <div className="text-[12px] font-medium text-gray-500">
              {warehouse.name} ({warehouse.warehouse_code})
            </div>
          </div>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1 font-poppins">
        {/* Warehouse Type */}
        <FormField label="Warehouse Type" error={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select2
                options={typeOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select Warehouse Type"
              />
            )}
          />
        </FormField>

        {/* Operational Layout Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Default Picking Zone" error={errors.default_picking_zone?.message}>
            <Controller
              name="default_picking_zone"
              control={control}
              render={({ field }) => (
                <Select2
                  options={zoneOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={isLoadingZones ? 'Loading zones...' : zoneOptions.length === 0 ? 'No zones created yet' : 'Select Default Picking Zone'}
                />
              )}
            />
          </FormField>

          <FormField label="Default Packing Station" error={errors.default_packing_station?.message}>
            <input
              {...register('default_packing_station')}
              placeholder="e.g. PACK-01"
              className="w-full h-[42px] px-3.5 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-medium"
            />
          </FormField>
        </div>

        {/* Operational Toggles */}
        <div className="space-y-2.5 pt-1">
          {/* Barcode Scanning Toggle */}
          <div
            onClick={() =>
              setValue('is_barcode_scanning_enabled', !barcodeScanning, { shouldDirty: true })
            }
            className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Scan className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium text-gray-800">
                Barcode Scanning
              </span>
            </div>
            <div
              className={clsx(
                'w-11 h-6 rounded-full relative transition-colors duration-200',
                barcodeScanning ? 'bg-primary' : 'bg-gray-300'
              )}
            >
              <div
                className={clsx(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm',
                  barcodeScanning ? 'left-6' : 'left-1'
                )}
              />
            </div>
          </div>

          {/* Smart Auto Location Suggestion Toggle */}
          <div
            onClick={() =>
              setValue('is_auto_location_suggest_enabled', !autoLocation, { shouldDirty: true })
            }
            className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium text-gray-800">
                Auto Location Suggestion
              </span>
            </div>
            <div
              className={clsx(
                'w-11 h-6 rounded-full relative transition-colors duration-200',
                autoLocation ? 'bg-primary' : 'bg-gray-300'
              )}
            >
              <div
                className={clsx(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm',
                  autoLocation ? 'left-6' : 'left-1'
                )}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditMode ? 'Update Configuration' : 'Save Configuration'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
