import { useState, useRef } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Check, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Lock,
  Percent,
  RefreshCw,
  Upload,
  Eye,
  EyeOff,
  Settings2,
  Contact2
} from 'lucide-react'
import { merchantSchema, type MerchantFormValues } from '../../hooks/validation'
import { useStoreMerchant } from '../../hooks/useMerchants'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { Select2 } from '@/components/Select/Select2'

export const MerchantCreatePage = () => {
  const navigate = useNavigate()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const { mutate: storeMerchant, isPending: isSaving } = useStoreMerchant()
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      status: 1,
      comission_type: 1,
      password_option: 'set',
      comission_value: '0.00'
    },
  })

  const passwordOption = watch('password_option')
  const commissionType = watch('comission_type')
  const status = watch('status')

  const generatePassword = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let pass = ''
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setValue('password', pass, { shouldDirty: true })
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const onSubmit = (data: MerchantFormValues) => {
    const formData = new FormData()
    
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'sales_permit' && value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    // Ensure status and commission value are explicitly appended if not covered above
    if (data.status !== undefined) formData.append('status', String(data.status))
    if (data.comission_value !== undefined) formData.append('comission_value', String(data.comission_value))

    if (data.sales_permit?.[0]) {
      formData.append('sales_permit', data.sales_permit[0])
    }

    storeMerchant(formData, {
      onSuccess: () => navigate({ to: '/inventory/merchant' }),
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/merchant' })
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/merchant"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            Add Merchant
          </h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit, (err) => console.log('Validation Errors:', err))} className="space-y-6">
          <div className="space-y-6">
            {/* Row 1: Business Info & Contact Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7">
                {/* Business Information */}
                <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#1e293b]">Business Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Merchant Name <span className="text-rose-500">*</span></label>
                      <input
                        {...register('customer_name')}
                        autoComplete="off"
                        placeholder="e.g. Acme Corp"
                        className={clsx(
                          "w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                          errors.customer_name ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                        )}
                      />
                      {errors.customer_name && <span className="text-rose-500 text-[11px] font-medium">{errors.customer_name.message}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">EIN No</label>
                      <input
                        {...register('vat_no')}
                        autoComplete="off"
                        placeholder="XX-XXXXXXX"
                        className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Seller's Permit Number</label>
                      <input
                        {...register('sales_permit_number')}
                        autoComplete="off"
                        placeholder="Seller's permit number"
                        className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Seller's Permit Document</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={(e) => setValue('sales_permit', e.target.files, { shouldDirty: true })}
                        />
                        <button
                          type="button"
                          onClick={handleUploadClick}
                          className="flex items-center gap-2 px-6 h-[42px] bg-[#52a882] hover:bg-[#45916d] text-white rounded-lg transition-all font-semibold text-[14px] shadow-sm"
                        >
                          Upload
                          <div className="bg-black/10 p-1 rounded-md">
                            <Upload className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        </button>
                        <span className="text-[12px] text-gray-400 font-medium">PNG, JPG or WEBP (Max. 2MB)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                {/* Contact Details */}
                <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <Contact2 className="h-5 w-5" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#1e293b]">Contact Details</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Email Address <span className="text-rose-500">*</span></label>
                      <input
                        {...register('customer_email')}
                        autoComplete="off"
                        placeholder="contact@warehouse.com"
                        className={clsx(
                          "w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                          errors.customer_email ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                        )}
                      />
                      {errors.customer_email && <span className="text-rose-500 text-[11px] font-medium">{errors.customer_email.message}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#475569]">Phone Number <span className="text-rose-500">*</span></label>
                        <input
                          {...register('customer_mobile')}
                          autoComplete="off"
                          placeholder="Enter phone number"
                          className={clsx(
                            "w-full h-[42px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                            errors.customer_mobile ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                          )}
                        />
                        {errors.customer_mobile && <span className="text-rose-500 text-[11px] font-medium">{errors.customer_mobile.message}</span>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#475569]">Fax</label>
                        <input
                          {...register('fax')}
                          autoComplete="off"
                          placeholder="Fax number"
                          className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Registered Address & Commission/Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7">
                {/* Registered Address */}
                <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#1e293b]">Registered Address</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[13px] font-medium text-[#475569]">Full address</label>
                      <input
                        {...register('customer_address')}
                        autoComplete="off"
                        placeholder="Enter street name, building number and floor..."
                        className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Country</label>
                      <input
                        {...register('country')}
                        autoComplete="off"
                        placeholder="Select country"
                        className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">State</label>
                      <input
                        {...register('state')}
                        autoComplete="off"
                        placeholder="Select state"
                        className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">City</label>
                      <input
                        {...register('city')}
                        autoComplete="off"
                        placeholder="Select city"
                        className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Zip Code</label>
                      <input
                        {...register('zip')}
                        autoComplete="off"
                        placeholder="XXXXX"
                        className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                {/* Commission & Settings */}
                <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <Settings2 className="h-5 w-5" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#1e293b]">Commission & Settings</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#475569]">Value</label>
                        <div className="relative">
                          <input
                            {...register('comission_value')}
                            autoComplete="off"
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                          />
                          {commissionType == 1 && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#1e293b]">%</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#475569]">Commission Type</label>
                        <Controller
                          control={control}
                          name="comission_type"
                          render={({ field }) => (
                            <Select2
                              options={[
                                { label: 'Percentage (%)', value: 1 },
                                { label: 'Flat Rate', value: 0 },
                              ]}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Status</label>
                      <div 
                        onClick={() => setValue('status', status == 1 ? 0 : 1, { shouldDirty: true })}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer group hover:bg-gray-100 transition-all"
                      >
                        <span className="text-[14px] font-medium text-[#1e293b]">
                          {status == 1 ? 'Active Merchant' : 'Inactive Merchant'}
                        </span>
                        <div className={clsx(
                          "w-10 h-5 rounded-full relative transition-colors duration-200",
                          status == 1 ? "bg-primary" : "bg-gray-300"
                        )}>
                          <div className={clsx(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200",
                            status == 1 ? "left-6" : "left-1"
                          )} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Merchant Portal Password</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            {...register('password')}
                            placeholder="••••••••"
                            className="w-full h-[42px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="flex items-center gap-2 px-4 h-[42px] bg-gray-100 hover:bg-gray-200 text-[#475569] border border-gray-200 rounded-lg transition-all font-semibold text-[13px] shrink-0"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reset Password
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569]">Internal Notes</label>
                      <textarea
                        {...register('comission_note')}
                        placeholder="Add any additional notes here..."
                        rows={4}
                        className="w-full p-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-10 h-[42px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-lg hover:bg-gray-50 transition-all text-[14px] shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-12 h-[42px] bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[14px]"
            >
              {isSaving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Check className="h-4 w-4" strokeWidth={3} /> Save</>
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/merchant' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
