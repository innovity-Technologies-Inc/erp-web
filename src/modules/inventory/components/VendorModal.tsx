import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Check, Save } from 'lucide-react'
import { supplierSchema, type SupplierFormValues } from '../hooks/validation'
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers'
import { clsx } from 'clsx'

interface VendorModalProps {
  isOpen: boolean
  onClose: () => void
  vendorId?: number | null
  vendorUuid?: string | null
  initialData?: any
}

export const VendorModal = ({ isOpen, onClose, vendorId, vendorUuid, initialData }: VendorModalProps) => {
  const { mutate: createVendor, isPending: isCreating } = useCreateSupplier()
  const { mutate: updateVendor, isPending: isUpdating } = useUpdateSupplier()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      status: 1,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          supplier_name: initialData.supplier_name || '',
          mobile: initialData.mobile || '',
          emailnumber: initialData.emailnumber || '',
          address: initialData.address || '',
          address2: initialData.address2 || '',
          contact: initialData.contact || '',
          phone: initialData.phone || '',
          fax: initialData.fax || '',
          city: initialData.city || '',
          state: initialData.state || '',
          zip: initialData.zip || '',
          country: initialData.country || '',
          details: initialData.details || '',
          status: initialData.status ?? 1,
        })
      } else {
        reset({
          supplier_name: '',
          mobile: '',
          emailnumber: '',
          address: '',
          address2: '',
          contact: '',
          phone: '',
          fax: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          details: '',
          status: 1,
        })
      }
    }
  }, [isOpen, initialData, reset])

  const onSubmit = (data: SupplierFormValues) => {
    if (vendorId && vendorUuid) {
      updateVendor({ uuid: vendorUuid, data }, {
        onSuccess: () => {
          onClose()
        }
      })
    } else {
      createVendor(data, {
        onSuccess: () => {
          onClose()
        }
      })
    }
  }

  if (!isOpen) return null

  const isPending = isCreating || isUpdating

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Save className="h-5 w-5" />
            </div>
            <h2 className="text-[18px] font-semibold text-gray-900">
              {vendorId ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto px-1">
            {/* Vendor Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[13px] font-medium text-gray-700">Vendor Name <span className="text-rose-500">*</span></label>
              <input {...register('supplier_name')}
                placeholder="Enter vendor full name"
                className={clsx(
                  "w-full h-11 px-4 bg-gray-50 border rounded-xl text-[14px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300",
                  errors.supplier_name ? "border-rose-500 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300" : "border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                )}
              />
              {errors.supplier_name && <p className="text-rose-500 text-[11px] font-medium ml-1">{errors.supplier_name.message}</p>}
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">Mobile No</label>
              <input {...register('mobile')}
                placeholder="01xxxxxxxxx"
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">Email Address</label>
              <input {...register('emailnumber')}
                placeholder="vendor@example.com"
                className={clsx(
                  "w-full h-11 px-4 bg-gray-50 border rounded-xl text-[14px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300",
                  errors.emailnumber ? "border-rose-500 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300" : "border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                )}
              />
              {errors.emailnumber && <p className="text-rose-500 text-[11px] font-medium ml-1">{errors.emailnumber.message}</p>}
            </div>

            {/* Address 1 */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[13px] font-medium text-gray-700">Address</label>
              <textarea {...register('address')}
                placeholder="Primary address"
                rows={2}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none resize-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

             {/* Country */}
             <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">Country</label>
              <input {...register('country')}
                placeholder="e.g. Bangladesh"
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">City</label>
              <input {...register('city')}
                placeholder="e.g. Dhaka"
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">State / Province</label>
              <input {...register('state')}
                placeholder="e.g. Dhaka"
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Zip */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">Zip / Postal Code</label>
              <input {...register('zip')}
                placeholder="e.g. 1200"
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Details */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[13px] font-medium text-gray-700">Additional Details</label>
              <textarea {...register('details')}
                placeholder="Other information..."
                rows={2}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none resize-none hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[13px] font-medium text-gray-700">Status</label>
              <div className="flex gap-4 p-1">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" 
                      value={1} 
                      {...register('status', { valueAsNumber: true })}
                      className="w-4 h-4 text-primary border-gray-300 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <span className="text-[14px] font-medium text-gray-600 group-hover:text-primary transition-colors">Active</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" 
                      value={0} 
                      {...register('status', { valueAsNumber: true })}
                      className="w-4 h-4 text-primary border-gray-300 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <span className="text-[14px] font-medium text-gray-600 group-hover:text-rose-500 transition-colors">Inactive</span>
                 </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-[14px] font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-[14px] hover:bg-[#153a80] transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isPending ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-4.5 w-4.5" />
              )}
              {vendorId ? 'Update Vendor' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
