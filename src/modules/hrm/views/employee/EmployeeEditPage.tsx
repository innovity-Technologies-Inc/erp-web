import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Check, Upload, User, Briefcase, MapPin, Info } from 'lucide-react'
import { useRef, useState, useMemo, useEffect } from 'react'
import { employeeSchema } from '../../hooks/validation'
import type { EmployeeFormValues } from '../../hooks/validation'
import { useUpdateEmployee, useEmployee } from '../../hooks/useEmployees'
import { useDesignationSelect2 } from '../../hooks/useDesignations'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'

const countries = [
  "Bangladesh", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", 
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Barbados", "Belarus", 
  "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", 
  "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Chile", 
  "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", 
  "Denmark", "Djibouti", "Dominica", "Egypt", "Estonia", "Ethiopia", "Fiji", "Finland", 
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", 
  "Guatemala", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", 
  "Iran", "Iraq", "Ireland", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", 
  "Kenya", "Kuwait", "Lebanon", "Malaysia", "Maldives", "Mexico", "Morocco", "Myanmar", 
  "Nepal", "Netherlands", "New Zealand", "Norway", "Oman", "Pakistan", "Philippines", "Poland", 
  "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Singapore", "South Africa", "Spain", 
  "Sri Lanka", "Sweden", "Switzerland", "Syria", "Taiwan", "Thailand", "Turkey", "Ukraine", 
  "United Arab Emirates", "United Kingdom", "United States", "Vietnam", "Yemen", "Zimbabwe"
].map(c => ({ value: c, label: c }))

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => ({ value: g, label: g }))

const rateTypes = [
  { value: 1, label: 'Hourly' },
  { value: 2, label: 'Monthly Salary' }
]

export const EmployeeEditPage = () => {
  const { uuid } = useParams({ from: '/_authenticated/hrm/employee/edit/$uuid' })
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Image Preview State
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // API Data
  const { data: employeeData, isLoading: isLoadingEmployee } = useEmployee(uuid)
  const { data: designationSelectData, isLoading: isLoadingDesignations } = useDesignationSelect2()
  const { mutate: updateEmployee, isPending: isSaving } = useUpdateEmployee()

  const designationOptions = useMemo(() => {
    return designationSelectData?.map((d: any) => ({ value: d.id, label: d.text })) || []
  }, [designationSelectData])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      blood_group: '',
      address_line_1: '',
      address_line_2: '',
      country: '',
      city: '',
      zip: '',
      hrate: '',
      image: null,
    },
  })

  // Hydrate form values once data is fetched
  useEffect(() => {
    if (employeeData?.data) {
      const emp = employeeData.data
      reset({
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        designation: emp.designation ? Number(emp.designation) : undefined,
        phone: emp.phone || '',
        email: emp.email || '',
        rate_type: emp.rate_type ? Number(emp.rate_type) : undefined,
        hrate: emp.hrate !== undefined && emp.hrate !== null ? String(emp.hrate) : '',
        blood_group: emp.blood_group || '',
        address_line_1: emp.address_line_1 || '',
        address_line_2: emp.address_line_2 || '',
        country: emp.country || '',
        city: emp.city || '',
        zip: emp.zip || '',
      })
      if (emp.image) {
        const backendUrl = import.meta.env.VITE_API_URL.replace('/api', '')
        setImagePreview(emp.image.startsWith('http') ? emp.image : `${backendUrl}/storage/${emp.image}`)
      }
    }
  }, [employeeData, reset])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('image', file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const onSubmit = (data: EmployeeFormValues) => {
    const formData = new FormData()
    formData.append('uuid', uuid!)
    formData.append('first_name', data.first_name)
    formData.append('last_name', data.last_name)
    formData.append('designation', String(data.designation))
    formData.append('phone', data.phone)
    formData.append('email', data.email)
    formData.append('rate_type', String(data.rate_type))
    formData.append('hrate', data.hrate)
    
    if (data.blood_group) formData.append('blood_group', data.blood_group)
    if (data.address_line_1) formData.append('address_line_1', data.address_line_1)
    if (data.address_line_2) formData.append('address_line_2', data.address_line_2)
    
    formData.append('country', data.country)
    formData.append('city', data.city)
    formData.append('zip', data.zip)
    
    if (data.image instanceof File) {
      formData.append('image', data.image)
    }

    updateEmployee(formData, {
      onSuccess: () => {
        showNotificationModal(
          'Updated Successfully!',
          'Employee details have been updated successfully.',
          'success'
        )
        navigate({ to: '/hrm/employee' })
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Failed to update employee.'
        showNotificationModal('Update Failed', message, 'error')
      }
    })
  }

  if (isLoadingEmployee) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-gray-500 font-medium">Loading employee details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: '/hrm/employee' })}
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Edit Employee</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            
            {/* Row 1: Personal Info (Left) & Photo (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
              
              {/* Personal Information */}
              <div className="xl:col-span-2 flex">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-5 w-full flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <User className="h-5 w-5" />
                      </div>
                      <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">Personal Information</h2>
                    </div>
                    <Info className="h-5 w-5 text-gray-300" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="First name" error={errors.first_name?.message} required>
                      <input
                        {...register('first_name')}
                        type="text"
                        placeholder="e.g. Jonathan"
                        className="erp-input w-full"
                        autoComplete="off"
                      />
                    </FormField>

                    <FormField label="Last name" error={errors.last_name?.message} required>
                      <input
                        {...register('last_name')}
                        type="text"
                        placeholder="e.g. Doe"
                        className="erp-input w-full"
                        autoComplete="off"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Phone Number" error={errors.phone?.message} required>
                      <input
                        {...register('phone')}
                        type="text"
                        placeholder="+880 100 0000 000"
                        className="erp-input w-full"
                        autoComplete="off"
                      />
                    </FormField>

                    <FormField label="Blood Group" error={errors.blood_group?.message}>
                      <Controller
                        name="blood_group"
                        control={control}
                        render={({ field }) => (
                          <Select2
                            options={bloodGroups}
                            value={field.value as any}
                            onChange={(val) => field.onChange(val)}
                            placeholder="Select blood group"
                            className="w-full"
                          />
                        )}
                      />
                    </FormField>
                  </div>

                  <FormField label="Email Address" error={errors.email?.message} required>
                    <input
                      {...register('email')}
                      type="text"
                      placeholder="jonathan.doe@gmail.com"
                      className="erp-input w-full"
                      autoComplete="off"
                    />
                  </FormField>
                </div>
              </div>

              {/* Employee Photo */}
              <div className="xl:col-span-1 flex">
                <div className="bg-[#1E3A5F] rounded-2xl shadow-md p-4 text-white flex flex-col items-center justify-center text-center space-y-6 min-h-[295px] w-full flex-grow">
                  <div 
                    onClick={triggerUpload}
                    className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/30 hover:border-white/65 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-inner group relative"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Upload className="h-7 w-7 text-white/50 group-hover:text-white/80 transition-colors" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[16px] font-semibold tracking-tight">Employee Photo</h3>
                    <p className="text-[11px] text-white/60 max-w-[220px] leading-relaxed">
                      Recommended: Square aspect ratio, max 2MB.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={triggerUpload}
                    className="bg-white hover:bg-slate-50 text-[#1E3A5F] px-6 py-2.5 rounded-xl text-[12px] font-bold transition-all shadow-md active:scale-95 shrink-0"
                  >
                    Upload Image
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

            </div>

            {/* Row 2: Employment Details (Left) & Address Info (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
              
              {/* Employment Details */}
              <div className="xl:col-span-2 flex">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-5 w-full flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">Employment Details</h2>
                    </div>
                    <Info className="h-5 w-5 text-gray-300" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Designation" error={errors.designation?.message} required>
                      <Controller
                        name="designation"
                        control={control}
                        render={({ field }) => (
                          <Select2
                            options={designationOptions}
                            value={field.value as any}
                            onChange={(val) => field.onChange(val)}
                            placeholder={isLoadingDesignations ? "Loading..." : "Select designation"}
                            className="w-full"
                            isLoading={isLoadingDesignations}
                          />
                        )}
                      />
                    </FormField>

                    <FormField label="Rate type" error={errors.rate_type?.message} required>
                      <Controller
                        name="rate_type"
                        control={control}
                        render={({ field }) => (
                          <Select2
                            options={rateTypes}
                            value={field.value as any}
                            onChange={(val) => field.onChange(val)}
                            placeholder="Select type"
                            className="w-full"
                          />
                        )}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Hourly rate/salary" error={errors.hrate?.message} required>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-[13px]">$</span>
                        <input
                          {...register('hrate')}
                          type="text"
                          placeholder="0.00"
                          className="erp-input w-full pl-8"
                          autoComplete="off"
                        />
                      </div>
                    </FormField>

                    <FormField label="Country" error={errors.country?.message} required>
                      <Controller
                        name="country"
                        control={control}
                        render={({ field }) => (
                          <Select2
                            options={countries}
                            value={field.value as any}
                            onChange={(val) => field.onChange(val)}
                            placeholder="Select country"
                            className="w-full"
                          />
                        )}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="City" error={errors.city?.message} required>
                      <input
                        {...register('city')}
                        type="text"
                        placeholder="e.g. San Francisco"
                        className="erp-input w-full"
                        autoComplete="off"
                      />
                    </FormField>

                    <FormField label="ZIP code" error={errors.zip?.message} required>
                      <input
                        {...register('zip')}
                        type="text"
                        placeholder="e.g. 94103"
                        className="erp-input w-full"
                        autoComplete="off"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="xl:col-span-1 flex">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-5 w-full flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">Address Information</h2>
                    </div>
                    <Info className="h-5 w-5 text-gray-300" />
                  </div>

                  <FormField label="Address line 1" error={errors.address_line_1?.message}>
                    <textarea
                      {...register('address_line_1')}
                      placeholder="Street name, apartment number, etc."
                      className="erp-input w-full p-3 min-h-[100px]"
                      autoComplete="off"
                    />
                  </FormField>

                  <FormField label="Address line 2" error={errors.address_line_2?.message}>
                    <textarea
                      {...register('address_line_2')}
                      placeholder="Suite, floor, landmark (optional)"
                      className="erp-input w-full p-3 min-h-[100px]"
                      autoComplete="off"
                    />
                  </FormField>
                </div>
              </div>

            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate({ to: '/hrm/employee' })}
              disabled={isSaving}
              className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[14px] shadow-sm font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 text-[14px] font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
