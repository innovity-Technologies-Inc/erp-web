import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Briefcase,
  CreditCard,
  Info,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Camera,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { useCreateUser, useRolesSelect2 } from '../../hooks/useUsers'
import { usePermissionsList } from '../../hooks/useRoles'
import { userSchema, type UserFormValues } from '../../hooks/validation'
import { Select2 } from '@/components/Select/Select2'
import { FormField } from '@/components/Form/FormField'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'

export const UserCreatePage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const loggedInUser = useAuthStore((state) => state.user)

  // Super Admin detection
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  // Is Demo User detection
  const loggedInIsDemo = loggedInUser?.is_demo_user === 1

  // States
  const [showPassword, setShowPassword] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isDirty },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      password: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      user_type: 'user',
      is_demo_user: 0,
      organization_id: '',
      company_id: '',
      roles: [],
    },
  })

  // Watch org & company to filter lists and roles dynamically
  const selectedOrgId = watch('organization_id')
  const selectedCompanyId = watch('company_id')

  // Fetch companies & orgs (available to super-admin)
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissionsList()
  const organizations = permissionsData?.data?.organizations || []
  const companies = permissionsData?.data?.companies || []

  // Filter companies by selected organization
  const companyOptions = useMemo(() => {
    if (!selectedOrgId) {
      return companies.map((c) => ({ value: c.id, label: c.company_name }))
    }
    return companies
      .filter((c) => String(c.organization_id) === String(selectedOrgId))
      .map((c) => ({ value: c.id, label: c.company_name }))
  }, [companies, selectedOrgId])

  const organizationOptions = useMemo(() => {
    return organizations.map((org) => ({ value: org.id, label: org.name }))
  }, [organizations])

  // Reset company if organization changes
  useEffect(() => {
    setValue('company_id', '')
  }, [selectedOrgId, setValue])

  // Fetch roles dynamically based on Org/Company selection
  const { data: rolesData, isLoading: isLoadingRoles } = useRolesSelect2({
    organization_id: selectedOrgId ? Number(selectedOrgId) : null,
    company_id: selectedCompanyId ? Number(selectedCompanyId) : null,
  })

  // Format roles for Select2
  const roleOptions = useMemo(() => {
    return rolesData?.map((r) => ({ value: r.id, label: r.text })) || []
  }, [rolesData])

  const { mutate: createUserMutation, isPending: isSaving } = useCreateUser()

  // File Upload Handlers
  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
      setValue('image', file, { shouldDirty: true })
    }
  }

  // Handle Cancel / Back button click with Dirty validation check
  const handleBackOrCancel = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/user' })
    }
  }

  // Submit Handler
  const onSubmit = (data: UserFormValues) => {
    const formData = new FormData()
    formData.append('first_name', data.first_name)
    formData.append('last_name', data.last_name)
    formData.append('email', data.email)
    formData.append('mobile', data.mobile)
    formData.append('password', data.password)
    formData.append('address', data.address || '')
    formData.append('city', data.city || '')
    formData.append('state', data.state || '')
    formData.append('zip_code', data.zip_code || '')
    formData.append('user_type', data.user_type)
    formData.append('is_demo_user', String(data.is_demo_user))

    if (data.organization_id) {
      formData.append('organization_id', String(data.organization_id))
    }
    if (data.company_id) {
      formData.append('company_id', String(data.company_id))
    }

    // Roles must be submitted to the backend as a JSON-encoded array string
    formData.append('roles', JSON.stringify(data.roles))

    if (selectedFile) {
      formData.append('image', selectedFile)
    }

    createUserMutation(formData, {
      onSuccess: () => {
        showNotificationModal('Saved Successfully!', 'The user has been created successfully.', 'success')
        navigate({ to: '/user' })
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Failed to create user.'
        showNotificationModal('Submission Failed', message, 'error')
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackOrCancel}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Add New User</h1>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Account Info & Contact Location) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card 1: Account Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">Account Information</h2>
                  <p className="text-[12px] text-gray-400 font-medium">Core identity and security credentials</p>
                </div>
              </div>
              <Info className="h-5 w-5 text-gray-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="First name" error={errors.first_name?.message} required>
                <input
                  type="text"
                  placeholder="e.g. Jonathan"
                  {...register('first_name')}
                  className="erp-input w-full"
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Last name" error={errors.last_name?.message} required>
                <input
                  type="text"
                  placeholder="e.g. Doe"
                  {...register('last_name')}
                  className="erp-input w-full"
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Email Address" error={errors.email?.message} required>
                <input
                  type="email"
                  placeholder="jonathan.doe@gmail.com"
                  {...register('email')}
                  className="erp-input w-full"
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Password" error={errors.password?.message} required>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="erp-input w-full pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
            </div>

            {/* Super Admin specific selectors */}
            {isSuperAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <FormField label="Organization" error={errors.organization_id?.message}>
                  <Controller
                    name="organization_id"
                    control={control}
                    render={({ field }) => (
                      <Select2
                        {...field}
                        options={organizationOptions}
                        placeholder="Select Organization"
                        isLoading={isLoadingPermissions}
                      />
                    )}
                  />
                </FormField>

                <FormField label="Company" error={errors.company_id?.message}>
                  <Controller
                    name="company_id"
                    control={control}
                    render={({ field }) => (
                      <Select2
                        {...field}
                        options={companyOptions}
                        placeholder="Select Company"
                        isLoading={isLoadingPermissions}
                        isDisabled={!selectedOrgId}
                      />
                    )}
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Card 2: Contact & Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">Contact & Location</h2>
                  <p className="text-[12px] text-gray-400 font-medium">Where the user is located and how to reach them</p>
                </div>
              </div>
              <Info className="h-5 w-5 text-gray-300" />
            </div>

            <div className="space-y-6">
              <FormField label="Street Address" error={errors.address?.message}>
                <input
                  type="text"
                  placeholder="123 Corporate Blvd, Suite 400"
                  {...register('address')}
                  className="erp-input w-full"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="City" error={errors.city?.message}>
                  <input
                    type="text"
                    placeholder="San Francisco"
                    {...register('city')}
                    className="erp-input w-full"
                  />
                </FormField>

                <FormField label="State/Province" error={errors.state?.message}>
                  <input
                    type="text"
                    placeholder="CA"
                    {...register('state')}
                    className="erp-input w-full"
                  />
                </FormField>

                <FormField label="ZIP Code" error={errors.zip_code?.message}>
                  <input
                    type="text"
                    placeholder="94105"
                    {...register('zip_code')}
                    className="erp-input w-full"
                  />
                </FormField>
              </div>

              <FormField label="Phone Number" error={errors.mobile?.message} required>
                <input
                  type="text"
                  placeholder="+880 100 0000 000"
                  {...register('mobile')}
                  className="erp-input w-full"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Right Column (Profile Details & Save) */}
        <div className="flex flex-col gap-6">
          
          {/* Card 3: Profile Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">Profile Details</h2>
                  <p className="text-[12px] text-gray-400 font-medium">Roles, user types, and image upload</p>
                </div>
              </div>
              <Info className="h-5 w-5 text-gray-300" />
            </div>

            {/* Profile image picker box */}
            <div className="flex flex-col items-center pb-2">
              <div
                onClick={handleImageClick}
                className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-slate-50 transition-all relative overflow-hidden group bg-slate-50 shadow-sm"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <Camera className="h-8 w-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Select Image</span>
                  </div>
                )}
                {/* Pencil floating circle */}
                <div className="absolute bottom-2 right-2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <span className="text-[10px]">✏️</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <span className="text-[11px] text-gray-400 mt-2.5 font-medium">Recommended 400x400px JPG or PNG</span>
            </div>

            <div className="space-y-6">
              <FormField label="User type" error={errors.user_type?.message} required>
                {loggedInIsDemo ? (
                  <select
                    {...register('user_type')}
                    className="erp-input w-full"
                  >
                    <option value="user">User</option>
                  </select>
                ) : (
                  <select
                    {...register('user_type')}
                    className="erp-input w-full"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </FormField>

              <FormField label="Role" error={errors.roles?.message} required>
                <Controller
                  name="roles"
                  control={control}
                  render={({ field }) => (
                    <Select2
                      isMulti
                      options={roleOptions}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      placeholder="Select Roles"
                      isLoading={isLoadingRoles}
                    />
                  )}
                />
              </FormField>

              {/* Demo user checkbox toggler (visible to super admin) */}
              {isSuperAdmin && (
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                  <Controller
                    name="is_demo_user"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(field.value === 1 ? 0 : 1)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none shrink-0 ${
                          field.value === 1 ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                            field.value === 1 ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-700">Is Demo User?</span>
                    <span className="text-[10px] text-gray-400 font-medium">Limits operations inside the platform</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Note Box */}
          <div className="bg-[#1E3A8A] text-white rounded-2xl shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex gap-4">
              <div className="p-2 bg-blue-700/50 text-blue-200 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                <Info className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-1">Quick Note</h4>
                <p className="text-[11px] text-blue-200/90 leading-relaxed font-medium">
                  New users will receive an automated invitation email to verify their account and set up their personal
                  dashboard preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleBackOrCancel}
              className="bg-white text-[#64748b] border border-gray-200 px-6 h-10 rounded-lg hover:bg-gray-50 transition-all shadow-sm text-[13px] font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#059669] hover:bg-[#047857] text-white px-8 h-10 rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-[13px] font-semibold disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        onConfirm={() => navigate({ to: '/user' })}
        onCancel={() => setIsDiscardModalOpen(false)}
        confirmText="Yes, discard"
        cancelText="Keep editing"
        variant="danger"
      />
    </div>
  )
}
