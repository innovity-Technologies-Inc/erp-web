import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { useCreateService, useUpdateService } from '../hooks/useService'
import { useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import { Save, PenLine } from 'lucide-react'
import type { ServiceListItem } from '../api/service.api'
import { Select2 } from '@/components/Select/Select2'
import { useUiStore } from '@/store/useUiStore'

const serviceSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  charge: z.coerce.number().min(0, 'Charge must be at least 0'),
  service_vat: z.coerce.number().min(0, 'VAT must be at least 0').nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.coerce.number().default(1),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

interface ServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  service?: ServiceListItem | null
}

export const ServiceFormModal = ({ isOpen, onClose, service }: ServiceFormModalProps) => {
  const { mutate: createService, isPending: isCreating } = useCreateService()
  const { mutate: updateService, isPending: isUpdating } = useUpdateService()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    shouldFocusError: false,
    defaultValues: {
      service_name: '',
      charge: 0,
      service_vat: 0,
      description: '',
      status: 1,
    }
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Service Form Errors:', errors)
    }
  }, [errors])

  useEffect(() => {
    if (service && isOpen) {
      reset({
        service_name: service.service_name,
        charge: service.charge,
        service_vat: service.service_vat ?? 0,
        description: service.description ?? '',
        status: service.status ?? 1,
      })
    } else if (!service && isOpen) {
      reset({
        service_name: '',
        charge: 0,
        service_vat: 0,
        description: '',
        status: 1,
      })
    }
  }, [service, reset, isOpen])

  const statusOptions = useMemo(() => [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ], [])

  const { notify } = useUiStore()

  const onSubmit = (data: ServiceFormValues) => {
    console.log('Submitting Service Data:', data)
    if (service) {
      updateService({ id: service.id, data }, {
        onSuccess: () => {
          onClose()
          reset()
        }
      })
    } else {
      createService(data, {
        onSuccess: () => {
          onClose()
          reset()
        }
      })
    }
  }

  const onInvalid = (errors: any) => {
    console.log('Validation Errors:', errors)
    notify('Please check the form for errors', 'error')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? 'Edit Service' : 'Add New Service'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-[#475569] mb-1.5 block">
            Service Name <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('service_name')}
            className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
            placeholder="Enter service name"
          />
          {errors.service_name && (
            <p className="text-rose-500 text-xs mt-1">{errors.service_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-semibold text-[#475569] mb-1.5 block">
              Service Charge <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('charge')}
              className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-right"
              placeholder="0.00"
            />
            {errors.charge && (
              <p className="text-rose-500 text-xs mt-1">{errors.charge.message}</p>
            )}
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[#475569] mb-1.5 block">
              Service VAT (%)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('service_vat')}
              className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-right"
              placeholder="0.00"
            />
            {errors.service_vat && (
              <p className="text-rose-500 text-xs mt-1">{errors.service_vat.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-[#475569] mb-1.5 block">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full p-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium resize-none"
            placeholder="Enter service description"
          />
        </div>

        <div className="flex items-center justify-between p-2 bg-gray-50/50 rounded-xl border border-gray-100">
          <div>
            <label className="text-[13px] font-bold text-[#1e293b] block">
              Service Status
            </label>
          </div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(field.value === 1 ? 0 : 1)}
                className={clsx(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary/20",
                  field.value === 1 ? "bg-primary" : "bg-gray-200"
                )}
              >
                <span
                  className={clsx(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    field.value === 1 ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-10 h-11"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-12 h-11 bg-[#059669] hover:bg-[#047857]"
            loading={isCreating || isUpdating}
          >
            {service ? (
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
      </form>
    </Modal>
  )
}
