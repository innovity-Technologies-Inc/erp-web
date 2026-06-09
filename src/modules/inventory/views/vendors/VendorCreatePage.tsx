import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Check, 
  Building2, 
  UserCircle2, 
  MapPin
} from 'lucide-react'
import { supplierSchema, type SupplierFormValues } from '../../hooks/validation'
import { useCreateSupplier } from '../../hooks/useSuppliers'
import { useState } from 'react'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'

export const VendorCreatePage = () => {
  const navigate = useNavigate()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const { mutate: createVendor, isPending: isSaving } = useCreateSupplier()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      status: 1,
    },
  })

  const onSubmit = (data: SupplierFormValues) => {
    createVendor(data, {
      onSuccess: () => navigate({ to: '/inventory/vendors' }),
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/vendors' })
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Add Vendor</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        <form id="vendor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Vendor Info & Address */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Vendor Information */}
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-medium text-[#1e293b]">Vendor Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Vendor Name <span className="text-rose-500">*</span></label>
                    <input {...register('supplier_name')}
                      placeholder="e.g. Acme Corp"
                      className={clsx(
                        "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300",
                        errors.supplier_name ? "border-rose-500 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300" : "border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                      )}
                    />
                    {errors.supplier_name && <span className="text-rose-500 text-[11px] font-medium">{errors.supplier_name.message}</span>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">EIN No</label>
                    <input {...register('last_name')} // Mapping vat_no to last_name as per legacy blade
                      placeholder="XX-XXXXXXX"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Phone Number</label>
                    <input {...register('mobile')}
                      placeholder="Enter phone number"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Fax</label>
                    <input {...register('fax')}
                      placeholder="Fax number"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-medium text-[#1e293b]">Business Address</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Address 1</label>
                    <input {...register('address')}
                      placeholder="Enter street name, building number and floor..."
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Address 2</label>
                    <input {...register('address2')}
                      placeholder="Enter street name, building number and floor..."
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Country</label>
                    <input {...register('country')}
                      placeholder="Select country"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">State</label>
                    <input {...register('state')}
                      placeholder="Select state"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">City</label>
                    <input {...register('city')}
                      placeholder="Select city"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Zip Code</label>
                    <input {...register('zip')}
                      placeholder="XXXXX"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Details */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-sm h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-medium text-[#1e293b]">Contact Details</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Contact Person Name</label>
                      <input {...register('contact')}
                        placeholder="Enter contact name"
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-500">Phone Number</label>
                      <input {...register('phone')}
                        placeholder="Enter phone number"
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Email Address</label>
                    <input {...register('emailnumber')}
                      placeholder="contact@warehouse.com"
                      className={clsx(
                        "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300",
                        errors.emailnumber ? "border-rose-500 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300" : "border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                      )}
                    />
                    {errors.emailnumber && <span className="text-rose-500 text-[11px] font-medium">{errors.emailnumber.message}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={handleDiscard} 
              className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px]"
            >
              {isSaving ? (
                <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Save
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal 
        isOpen={isDiscardModalOpen} 
        onClose={() => setIsDiscardModalOpen(false)} 
        onConfirm={() => navigate({ to: '/inventory/vendors' })} 
        title="Discard Changes?" 
        message="You have unsaved changes. Are you sure you want to discard them?" 
        confirmText="Yes, Discard" 
        variant="danger" 
      />
    </div>
  )
}
