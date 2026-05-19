import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Check, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Info,
  Loader2
} from 'lucide-react'
import { warehouseSchema, type WarehouseFormValues } from '../../hooks/validation'
import { useUpdateWarehouse, useEmployees, useWarehouseDetails } from '../../hooks/useWarehouse'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { Select2 } from '@/components/Select/Select2'

export const WarehouseEditPage = () => {
  const { id } = useParams({ strict: false })
  const navigate = useNavigate()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const { data: warehouseResponse, isLoading } = useWarehouseDetails(id)
  const { mutate: updateWarehouse, isPending: isSaving } = useUpdateWarehouse()
  const { data: employees } = useEmployees()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
  })

  useEffect(() => {
    if (warehouseResponse?.data) {
      reset({
        ...warehouseResponse.data,
        status: warehouseResponse.data.status,
      })
    }
  }, [warehouseResponse, reset])

  const status = watch('status')

  const onSubmit = (data: WarehouseFormValues) => {
    if (!warehouseResponse?.data?.uuid) return
    updateWarehouse({ ...data, uuid: warehouseResponse.data.uuid }, {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-[#64748b] font-medium text-[13px]">Loading Warehouse Details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/inventory/warehouse"
              className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </Link>
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
              Edit Warehouse <span className="text-gray-400 text-[14px] ml-1">[{warehouseResponse?.data?.name}]</span>
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
                  <Building2 className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1e293b]">Basic Information</h2>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Warehouse Code <span className="text-rose-500">*</span></label>
                  <input
                    {...register('warehouse_code')}
                    autoComplete="off"
                    placeholder="e.g. WH-001"
                    className={clsx(
                      "w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                      errors.warehouse_code ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                    )}
                  />
                  {errors.warehouse_code && <span className="text-rose-500 text-[11px] font-medium">{errors.warehouse_code.message}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Warehouse Name <span className="text-rose-500">*</span></label>
                  <input
                    {...register('name')}
                    autoComplete="off"
                    placeholder="e.g. Central Warehouse"
                    className={clsx(
                      "w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                      errors.name ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                    )}
                  />
                  {errors.name && <span className="text-rose-500 text-[11px] font-medium">{errors.name.message}</span>}
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[13px] font-medium text-[#475569]">Status</label>
                  <div 
                    onClick={() => setValue('status', status == 1 ? 0 : 1, { shouldDirty: true })}
                    className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer group hover:bg-gray-100 transition-all"
                  >
                    <span className="text-[14px] font-medium text-[#1e293b]">
                      Active Warehouse
                    </span>
                    <div className={clsx(
                      "w-11 h-6 rounded-full relative transition-colors duration-200",
                      status == 1 ? "bg-primary" : "bg-gray-300"
                    )}>
                      <div className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm",
                        status == 1 ? "left-6" : "left-1"
                      )} />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Inactive warehouse are hidden from the storefront.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Contact Details */}
            <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <Info className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1e293b]">Contact Details</h2>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Point of Contact (PoC)</label>
                  <Controller
                    control={control}
                    name="contact_person"
                    render={({ field }) => (
                      <Select2
                        options={employeeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select Contact Person"
                      />
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Phone Number</label>
                  <div className="relative">
                    <input
                      {...register('phone')}
                      autoComplete="off"
                      placeholder="e.g. +1 234 567 890"
                      className="w-full h-[42px] pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Email Address</label>
                  <div className="relative">
                    <input
                      {...register('email')}
                      autoComplete="off"
                      placeholder="e.g. wh@example.com"
                      className={clsx(
                        "w-full h-[42px] pl-10 pr-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                        errors.email ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      )}
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.email && <span className="text-rose-500 text-[11px] font-medium">{errors.email.message}</span>}
                </div>
              </div>
            </div>

            {/* Card 3: Locations Details */}
            <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                  <MapPin className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1e293b]">Locations Details</h2>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Full address</label>
                  <input
                    {...register('address_line1')}
                    autoComplete="off"
                    placeholder="Enter street name, building number and floor..."
                    className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#475569]">Country</label>
                    <input
                      {...register('country')}
                      autoComplete="off"
                      placeholder="Enter country"
                      className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#475569]">City</label>
                    <input
                      {...register('city')}
                      autoComplete="off"
                      placeholder="Enter city"
                      className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569]">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Optional notes regarding access hours, loading docks, etc."
                    className="w-full p-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-10 h-[42px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-lg hover:bg-gray-50 transition-all text-[13px] shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-12 h-[42px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[13px]"
            >
              {isSaving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Check className="h-4 w-4" strokeWidth={3} /> Update</>
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/warehouse' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
