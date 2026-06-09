import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Contact2,
  Info
} from 'lucide-react'
import { warehouseSchema, type WarehouseFormValues } from '../../hooks/validation'
import { useCreateWarehouse, useEmployees } from '../../hooks/useWarehouse'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { Select2 } from '@/components/Select/Select2'


export const WarehouseCreatePage = () => {
  const navigate = useNavigate()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const { mutate: createWarehouse, isPending: isSaving } = useCreateWarehouse()
  const { data: employees } = useEmployees()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema) as any,
    defaultValues: {
      status: 1,
    },
  })

  const status = watch('status')

  const onSubmit = (data: WarehouseFormValues) => {
    createWarehouse(data as any, {
      onSuccess: () => navigate({ to: '/inventory/warehouse' }),
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/warehouse' })
    }
  }

  const employeeOptions = employees?.map((emp: any) => ({
    label: emp.text,
    value: emp.id
  })) || []

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleDiscard}
              className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </button>
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
              Add Warehouse
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Basic Information */}
            <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <Info className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1e293b]">Basic Information</h2>
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Warehouse Code <span className="text-rose-500">*</span></label>
                  <input {...register('warehouse_code')} autoComplete="off" placeholder="e.g., WH-001" className={clsx("w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300", errors.warehouse_code ? "border-rose-500" : "border-gray-200")} />
                  {errors.warehouse_code && <span className="text-rose-500 text-[11px] font-medium">{errors.warehouse_code.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Warehouse Name <span className="text-rose-500">*</span></label>
                  <input {...register('name')} autoComplete="off" placeholder="Main Warehouse" className={clsx("w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300", errors.name ? "border-rose-500" : "border-gray-200")} />
                  {errors.name && <span className="text-rose-500 text-[11px] font-medium">{errors.name.message}</span>}
                </div>
                <div className="space-y-3 pt-2">
                  <label className="text-[13px] font-medium text-[#475569]">Status</label>
                  <div onClick={() => setValue('status', status == 1 ? 0 : 1, { shouldDirty: true })} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer group hover:bg-gray-100 transition-all">
                    <span className="text-[14px] font-medium text-[#1e293b]">Active Warehouse</span>
                    <div className={clsx("w-11 h-6 rounded-full relative transition-colors duration-200", status == 1 ? "bg-primary" : "bg-gray-300")}>
                      <div className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm", status == 1 ? "left-6" : "left-1")} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Contact Details */}
            <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <Contact2 className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1e293b]">Contact Details</h2>
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Point of Contact</label>
                  <Controller control={control} name="contact_person" render={({ field }) => ( <Select2 options={employeeOptions} value={field.value} onChange={field.onChange} placeholder="Select Contact Person" /> )} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Phone number</label>
                  <input {...register('phone')} autoComplete="off" placeholder="0123456789" className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Email address</label>
                  <input {...register('email')} autoComplete="off" placeholder="contact@warehouse.com" className={clsx("w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300", errors.email ? "border-rose-500" : "border-gray-200")} />
                  {errors.email && <span className="text-rose-500 text-[11px] font-medium">{errors.email.message}</span>}
                </div>
              </div>
            </div>

            {/* Card 3: Location Details */}
            <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <MapPin className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1e293b]">Location Details</h2>
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Full address</label>
                  <input {...register('address_line1')} autoComplete="off" placeholder="Enter address..." className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none transition-all font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#475569]">Country</label>
                    <input {...register('country')} autoComplete="off" placeholder="Country" className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#475569]">City</label>
                    <input {...register('city')} autoComplete="off" placeholder="City" className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none transition-all font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Description</label>
                  <textarea {...register('description')} rows={4} placeholder="Optional notes..." className="w-full p-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium resize-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={handleDiscard} className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px]">
              {isSaving ? <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-5 w-5" strokeWidth={3} />}
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal isOpen={isDiscardModalOpen} onClose={() => setIsDiscardModalOpen(false)} onConfirm={() => navigate({ to: '/inventory/warehouse' })} title="Discard Changes?" message="You have unsaved changes. Are you sure you want to discard them?" confirmText="Yes, Discard" variant="danger" />
    </div>
  )
}
