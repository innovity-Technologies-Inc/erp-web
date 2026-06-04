import { useNavigate, useParams, Link } from '@tanstack/react-router'
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
import { useUpdateSupplier, useSupplierData } from '../../hooks/useSuppliers'
import { useState, useEffect } from 'react'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { LoadingState } from '@/components/Loading/LoadingState'

export const VendorEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const vendorId = id ? parseInt(id as string, 10) : null
  
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const { data: vendorResponse, isLoading: isLoadingDetails } = useSupplierData(vendorId)
  const { mutate: updateVendor, isPending: isSaving } = useUpdateSupplier()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema) as any,
  })

  // Hydrate form
  useEffect(() => {
    if (vendorResponse?.data) {
      const data = vendorResponse.data
      reset({
        supplier_name: data.supplier_name || '',
        mobile: data.mobile || '',
        emailnumber: data.emailnumber || '',
        last_name: data.last_name || '',
        address: data.address || '',
        address2: data.address2 || '',
        contact: data.contact || '',
        phone: data.phone || '',
        fax: data.fax || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        country: data.country || '',
        details: data.details || '',
        status: data.status ?? 1,
      })
    }
  }, [vendorResponse, reset])

  const onSubmit = (data: SupplierFormValues) => {
    if (vendorResponse?.data?.uuid) {
      updateVendor({ uuid: vendorResponse.data.uuid, data }, {
        onSuccess: () => navigate({ to: '/inventory/vendors' }),
      })
    }
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/vendors' })
    }
  }

  if (isLoadingDetails) {
    return <LoadingState message="Loading vendor details..." />
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/vendors"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Edit Vendor</h1>
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
                    <input {...register('last_name')}
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
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-medium text-[#1e293b]">Contact Details</h2>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto">
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
              className="px-6 h-10 bg-white border border-gray-200 text-[#64748b] font-medium rounded-lg hover:bg-gray-50 transition-all text-[13px] shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-8 h-10 bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[13px]"
            >
              {isSaving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Update
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
