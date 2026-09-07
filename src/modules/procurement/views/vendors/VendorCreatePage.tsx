import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Check,
  Building2,
  UserCircle2,
  MapPin,
  Landmark,
  FileText,
  Calendar,
  Link2,
  Upload,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { vendorFormSchema, type VendorFormValues } from '../../hooks/validation'
import { useCreateVendor } from '../../hooks/useVendors'
import { useVendorCategories } from '../../hooks/useVendorCategories'
import { useVendorDocumentTypes } from '../../hooks/useVendorDocumentTypes'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { Select2 } from '@/components/Select/Select2'
import { useUiStore } from '@/store/useUiStore'
import { clsx } from 'clsx'

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'kyc_pending', label: 'KYC Pending' },
  { value: 'documents_uploaded', label: 'Documents Uploaded' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'evaluated', label: 'Evaluated' },
  { value: 'monitored', label: 'Monitored' },
]

const addressTypeOptions = [
  { value: 'registered', label: 'Registered Office' },
  { value: 'factory', label: 'Factory / Warehouse' },
  { value: 'billing', label: 'Billing Address' },
  { value: 'shipping', label: 'Shipping Address' },
]

export const VendorCreatePage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File | null>>({})
  const { mutate: createVendor, isPending: isSaving } = useCreateVendor()

  // Master data
  const { data: categoriesData } = useVendorCategories({ per_page: 200 })
  const { data: docTypesData } = useVendorDocumentTypes({ per_page: 100 })

  const categoryOptions = useMemo(() => {
    if (!categoriesData?.response) return []
    return categoriesData.response.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }))
  }, [categoriesData])

  const documentTypes = useMemo(() => {
    return docTypesData?.response || []
  }, [docTypesData])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema) as any,
    defaultValues: {
      code: `VEND-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      email: '',
      phone: '',
      website: '',
      license_no: '',
      rating: undefined,
      status: 'draft',
      category_ids: [],
      addresses: [
        {
          address_type: 'registered',
          address_line: '',
          city: '',
          district: '',
          division: '',
          state: '',
          country: 'Bangladesh',
          postal_code: '',
          phone: '',
        },
      ],
      contacts: [
        {
          name: '',
          designation: '',
          phone: '',
          email: '',
        },
      ],
      bank_infos: [
        {
          bank_name: '',
          branch_name: '',
          account_name: '',
          account_no: '',
          routing_no: '',
          bank_address: '',
        },
      ],
      documents: [],
    },
  })

  // Dynamic Array Handlers
  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control,
    name: 'addresses',
  })

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'contacts',
  })

  const {
    fields: bankFields,
    append: appendBank,
    remove: removeBank,
  } = useFieldArray({
    control,
    name: 'bank_infos',
  })

  const { fields: docFields } = useFieldArray({
    control,
    name: 'documents',
  })

  // Synchronize document checklist with active document types
  useEffect(() => {
    if (documentTypes.length > 0 && docFields.length === 0) {
      const initialDocs = documentTypes.map((dt) => ({
        vendor_document_type_id: dt.id,
        document_url: '',
        expire_at: '',
      }))
      setValue('documents', initialDocs)
    }
  }, [documentTypes, docFields.length, setValue])

  const onSubmit = (data: VendorFormValues) => {
    // Clean and structure payload
    const payload: any = {
      code: data.code.trim(),
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      website: data.website?.trim() || null,
      license_no: data.license_no?.trim() || null,
      rating: data.rating !== undefined && data.rating !== null ? Number(data.rating) : null,
      status: data.status,
      category_ids: data.category_ids || [],
    }

    // Filter valid addresses
    if (data.addresses && data.addresses.length > 0) {
      const validAddresses = data.addresses
        .filter((addr) => addr.address_line?.trim() || addr.city?.trim())
        .map((addr) => ({
          address_type: addr.address_type || 'registered',
          address_line: addr.address_line?.trim() || 'Head Office',
          city: addr.city?.trim() || 'Dhaka',
          district: addr.district?.trim() || null,
          division: addr.division?.trim() || addr.state?.trim() || null,
          state: addr.state?.trim() || addr.division?.trim() || null,
          country: addr.country?.trim() || 'Bangladesh',
          post_office: addr.postal_code?.trim() || null,
          phone: addr.phone?.trim() || data.phone.trim(),
        }))

      if (validAddresses.length > 0) {
        payload.addresses = validAddresses
      }
    }

    // Filter valid contacts
    if (data.contacts && data.contacts.length > 0) {
      const validContacts = data.contacts
        .filter((c) => c.name?.trim() || c.phone?.trim())
        .map((c) => ({
          name: c.name?.trim() || data.name.trim(),
          phone: c.phone?.trim() || data.phone.trim(),
          email: c.email?.trim() || null,
          designation: c.designation?.trim() || 'Representative',
        }))

      if (validContacts.length > 0) {
        payload.contacts = validContacts
      }
    }

    // Filter valid bank infos
    if (data.bank_infos && data.bank_infos.length > 0) {
      const validBanks = data.bank_infos
        .filter((b) => b.bank_name?.trim() && b.account_no?.trim())
        .map((b) => ({
          bank_name: b.bank_name.trim(),
          branch_name: b.branch_name?.trim() || 'Main Branch',
          account_name: b.account_name?.trim() || data.name.trim(),
          account_no: b.account_no.trim(),
          routing_no: b.routing_no?.trim() || '000000000',
          bank_address: b.bank_address?.trim() || null,
        }))

      if (validBanks.length > 0) {
        payload.bank_infos = validBanks
      }
    }

    // Validate required dynamic document types
    documentTypes.forEach((_, idx) => {
      clearErrors(`documents.${idx}.document_url` as any)
    })

    let hasDocError = false
    documentTypes.forEach((docType, idx) => {
      if (docType.is_required) {
        const file = selectedFiles[docType.id]
        const url = data.documents?.[idx]?.document_url?.trim()
        if (!file && !url) {
          setError(`documents.${idx}.document_url` as any, {
            type: 'manual',
            message: `${docType.name} document file is required.`,
          })
          hasDocError = true
        }
      }
    })

    if (hasDocError) {
      showNotificationModal(
        'Required Documents Missing',
        'Please upload the required compliance certificate files marked in red.',
        'warning'
      )
      return
    }

    // Filter valid compliance documents
    const validDocs = documentTypes
      .map((docType, idx) => {
        const file = selectedFiles[docType.id]
        const url = data.documents?.[idx]?.document_url?.trim()
        const expireAt = data.documents?.[idx]?.expire_at || null
        if (file || url) {
          return {
            vendor_document_type_id: docType.id,
            file: file || undefined,
            document_url: url || undefined,
            expire_at: expireAt || null,
          }
        }
        return null
      })
      .filter(Boolean)

    if (validDocs.length > 0) {
      payload.documents = validDocs
    }

    createVendor(payload, {
      onSuccess: () => {
        showNotificationModal('Vendor Created!', `Vendor "${data.name}" added successfully.`, 'success')
        navigate({ to: '/procurement/vendors' })
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Failed to create vendor.'
        showNotificationModal('Create Failed', message, 'error')
      },
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/procurement/vendors' })
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
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-primary transition-colors shadow-2xs text-[12px] font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Add Vendor</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6">
        <form id="vendor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (lg:col-span-6): Vendor Info & Multi Addresses */}
            <div className="lg:col-span-6 space-y-6">
              {/* Vendor Information Card */}
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-medium text-[#1e293b]">Vendor Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-medium text-gray-500">
                      Vendor Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('name')}
                      placeholder="e.g. Acme Supplies Ltd"
                      className={clsx(
                        'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300',
                        errors.name ? 'border-rose-500' : 'border-gray-200'
                      )}
                      autoFocus
                    />
                    {errors.name && (
                      <span className="text-rose-500 text-[11px] font-medium">{errors.name.message}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">
                      Vendor Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('code')}
                      placeholder="e.g. VEND-001"
                      className={clsx(
                        'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-mono font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300',
                        errors.code ? 'border-rose-500' : 'border-gray-200'
                      )}
                    />
                    {errors.code && (
                      <span className="text-rose-500 text-[11px] font-medium">{errors.code.message}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('phone')}
                      placeholder="e.g. +880 1711 000000"
                      className={clsx(
                        'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300',
                        errors.phone ? 'border-rose-500' : 'border-gray-200'
                      )}
                    />
                    {errors.phone && (
                      <span className="text-rose-500 text-[11px] font-medium">{errors.phone.message}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('email')}
                      placeholder="vendor@company.com"
                      className={clsx(
                        'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all hover:border-gray-300',
                        errors.email ? 'border-rose-500' : 'border-gray-200'
                      )}
                    />
                    {errors.email && (
                      <span className="text-rose-500 text-[11px] font-medium">{errors.email.message}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Website</label>
                    <input
                      {...register('website')}
                      placeholder="https://company.com"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    {errors.website && (
                      <span className="text-rose-500 text-[11px] font-medium">{errors.website.message}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Trade License / Reg No</label>
                    <input
                      {...register('license_no')}
                      placeholder="e.g. TRAD/DNCC/012345/2026"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-500">Initial Rating (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      {...register('rating')}
                      placeholder="e.g. 85"
                      className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-medium text-gray-500">Vendor Categories</label>
                    <Controller
                      name="category_ids"
                      control={control}
                      render={({ field }) => (
                        <Select2
                          options={categoryOptions}
                          value={field.value || []}
                          onChange={(val) => field.onChange(val)}
                          isMulti
                          placeholder="Select one or more categories"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[12px] font-medium text-gray-500">Registration Status</label>
                    <div className="flex items-center gap-2 h-[38px] px-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-[13px] font-medium text-amber-800">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>Draft (Pending Admin Review & Approval)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Addresses Card */}
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-medium text-[#1e293b]">Addresses & Locations</h2>
                      <p className="text-[11px] text-gray-500">Add registered office, factory, or warehouse locations</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      appendAddress({
                        address_type: 'factory',
                        address_line: '',
                        city: '',
                        district: '',
                        division: '',
                        state: '',
                        country: 'Bangladesh',
                        postal_code: '',
                        phone: '',
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[12px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Location</span>
                  </button>
                </div>

                <div className="space-y-5 divide-y divide-gray-100">
                  {addressFields.map((field, index) => (
                    <div key={field.id} className="pt-4 first:pt-0 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-gray-700">
                          Location #{index + 1}
                        </span>
                        {addressFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors cursor-pointer"
                            title="Remove Location"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[12px] font-medium text-gray-500">
                            Address Type <span className="text-rose-500">*</span>
                          </label>
                          <Controller
                            name={`addresses.${index}.address_type`}
                            control={control}
                            render={({ field: subField }) => (
                              <Select2
                                options={addressTypeOptions}
                                value={subField.value}
                                onChange={(val) => subField.onChange(val)}
                                placeholder="Select address type"
                              />
                            )}
                          />
                          {errors.addresses?.[index]?.address_type && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.addresses[index]?.address_type?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[12px] font-medium text-gray-500">
                            Street / Facility Details <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`addresses.${index}.address_line`)}
                            placeholder="e.g. Level 4, Plot 12, Road 5, Block B"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.addresses?.[index]?.address_line ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.addresses?.[index]?.address_line && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.addresses[index]?.address_line?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            City / Town <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`addresses.${index}.city`)}
                            placeholder="e.g. Dhaka, Chittagong"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.addresses?.[index]?.city ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.addresses?.[index]?.city && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.addresses[index]?.city?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">District</label>
                          <input
                            {...register(`addresses.${index}.district`)}
                            placeholder="e.g. Dhaka, Gazipur"
                            className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">Division / State</label>
                          <input
                            {...register(`addresses.${index}.division`)}
                            placeholder="e.g. Dhaka Division"
                            className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">Postal / Zip Code</label>
                          <input
                            {...register(`addresses.${index}.postal_code`)}
                            placeholder="e.g. 1212"
                            className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[12px] font-medium text-gray-500">
                            Country <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`addresses.${index}.country`)}
                            placeholder="e.g. Bangladesh"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.addresses?.[index]?.country ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.addresses?.[index]?.country && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.addresses[index]?.country?.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (lg:col-span-6): Multi Contacts, Multi Bank Infos, Documents */}
            <div className="lg:col-span-6 space-y-6">
              {/* Dynamic Contact Persons Card */}
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <UserCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-medium text-[#1e293b]">Contact Persons</h2>
                      <p className="text-[11px] text-gray-500">Add key representatives, account managers, and leads</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      appendContact({
                        name: '',
                        designation: '',
                        phone: '',
                        email: '',
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[12px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Contact</span>
                  </button>
                </div>

                <div className="space-y-5 divide-y divide-gray-100">
                  {contactFields.map((field, index) => (
                    <div key={field.id} className="pt-4 first:pt-0 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-gray-700">
                          Contact #{index + 1}
                        </span>
                        {contactFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors cursor-pointer"
                            title="Remove Contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            Contact Person Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`contacts.${index}.name`)}
                            placeholder="e.g. John Doe"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.contacts?.[index]?.name ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.contacts?.[index]?.name && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.contacts[index]?.name?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">Designation / Role</label>
                          <input
                            {...register(`contacts.${index}.designation`)}
                            placeholder="e.g. Key Account Manager, Director"
                            className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            Direct Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`contacts.${index}.phone`)}
                            placeholder="e.g. +880 1819 000000"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.contacts?.[index]?.phone ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.contacts?.[index]?.phone && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.contacts[index]?.phone?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">Direct Email Address</label>
                          <input
                            {...register(`contacts.${index}.email`)}
                            placeholder="contact@company.com"
                            className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                          {errors.contacts?.[index]?.email && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.contacts[index]?.email?.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Bank Accounts Card */}
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-medium text-[#1e293b]">Bank & Settlement Accounts</h2>
                      <p className="text-[11px] text-gray-500">Add corporate settlement and bank payment details</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      appendBank({
                        bank_name: '',
                        branch_name: '',
                        account_name: '',
                        account_no: '',
                        routing_no: '',
                        bank_address: '',
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-[12px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Bank Account</span>
                  </button>
                </div>

                <div className="space-y-5 divide-y divide-gray-100">
                  {bankFields.map((field, index) => (
                    <div key={field.id} className="pt-4 first:pt-0 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-gray-700">
                          Bank Account #{index + 1}
                        </span>
                        {bankFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBank(index)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors cursor-pointer"
                            title="Remove Bank Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            Bank Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`bank_infos.${index}.bank_name`)}
                            placeholder="e.g. Dutch-Bangla Bank, City Bank"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.bank_infos?.[index]?.bank_name ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.bank_infos?.[index]?.bank_name && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.bank_infos[index]?.bank_name?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            Branch Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`bank_infos.${index}.branch_name`)}
                            placeholder="e.g. Gulshan Branch"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.bank_infos?.[index]?.branch_name ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.bank_infos?.[index]?.branch_name && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.bank_infos[index]?.branch_name?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            Account Name / Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`bank_infos.${index}.account_name`)}
                            placeholder="e.g. Acme Supplies Ltd"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.bank_infos?.[index]?.account_name ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.bank_infos?.[index]?.account_name && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.bank_infos[index]?.account_name?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            Account Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`bank_infos.${index}.account_no`)}
                            placeholder="e.g. 1102938475893"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-mono font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.bank_infos?.[index]?.account_no ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.bank_infos?.[index]?.account_no && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.bank_infos[index]?.account_no?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">
                            Routing / SWIFT Code <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`bank_infos.${index}.routing_no`)}
                            placeholder="e.g. 090272839"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none font-mono font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all',
                              errors.bank_infos?.[index]?.routing_no ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {errors.bank_infos?.[index]?.routing_no && (
                            <span className="text-rose-500 text-[11px] font-medium">
                              {errors.bank_infos[index]?.routing_no?.message}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[12px] font-medium text-gray-500">Branch Address</label>
                          <input
                            {...register(`bank_infos.${index}.bank_address`)}
                            placeholder="e.g. Plot 10, Road 11, Banani, Dhaka"
                            className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Documents Card */}
              <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-medium text-[#1e293b]">Compliance Documents & KYC</h2>
                      <p className="text-[11px] text-gray-500">Upload official company documents and certificates (PDF, PNG, JPG, DOCX)</p>
                    </div>
                  </div>
                </div>

                {documentTypes.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-[13px]">
                    No document types configured yet.
                  </div>
                ) : (
                  <div className="space-y-4 divide-y divide-gray-100">
                    {documentTypes.map((docType, index) => {
                      const file = selectedFiles[docType.id]
                      const docError = errors.documents?.[index]?.document_url

                      return (
                        <div key={docType.id} className="pt-3 first:pt-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[#1e293b] flex items-center gap-1.5">
                              {docType.name}
                              {docType.is_required ? (
                                <>
                                  <span className="text-rose-500">*</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                    Required
                                  </span>
                                </>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                  Optional
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 uppercase">{docType.code}</span>
                          </div>

                          <input
                            type="hidden"
                            {...register(`documents.${index}.vendor_document_type_id`, {
                              value: docType.id,
                              valueAsNumber: true,
                            })}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-7">
                              <input
                                type="file"
                                id={`doc-file-${docType.id}`}
                                accept=".pdf,.png,.jpg,.jpeg,.docx"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null
                                  setSelectedFiles((prev) => ({ ...prev, [docType.id]: f }))
                                  if (f) {
                                    clearErrors(`documents.${index}.document_url` as any)
                                  }
                                }}
                              />
                              {file ? (
                                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[12px]">
                                  <div className="flex items-center gap-2 truncate text-emerald-800 font-medium">
                                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-[10px] text-emerald-600 shrink-0">
                                      ({(file.size / 1024).toFixed(0)} KB)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <label
                                      htmlFor={`doc-file-${docType.id}`}
                                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                                    >
                                      Change
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFiles((prev) => {
                                          const next = { ...prev }
                                          delete next[docType.id]
                                          return next
                                        })
                                      }}
                                      className="p-1 hover:bg-emerald-100 rounded text-rose-500 cursor-pointer"
                                      title="Remove file"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label
                                  htmlFor={`doc-file-${docType.id}`}
                                  className={clsx(
                                    'flex items-center justify-center gap-2 w-full h-[38px] px-3 border border-dashed rounded-lg text-[12px] font-medium cursor-pointer transition-all',
                                    docError
                                      ? 'border-rose-400 bg-rose-50/40 text-rose-600 hover:bg-rose-50'
                                      : 'border-gray-300 bg-gray-50/60 text-gray-600 hover:border-primary hover:text-primary hover:bg-white'
                                  )}
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Choose document file (PDF, PNG, JPG, DOCX)</span>
                                </label>
                              )}
                            </div>

                            <div className="sm:col-span-5 relative">
                              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                              <input
                                type="date"
                                {...register(`documents.${index}.expire_at`)}
                                placeholder="Expiry Date"
                                className="w-full h-[38px] pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-[12px] outline-none font-medium text-[#475569] hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                              />
                            </div>
                          </div>

                          {docError && (
                            <span className="text-rose-500 text-[11px] font-medium block">
                              {docError?.message || `${docType.name} document file is required.`}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px] cursor-pointer"
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
        onConfirm={() => navigate({ to: '/procurement/vendors' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}


