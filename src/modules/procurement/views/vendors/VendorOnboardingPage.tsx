import { useState, useEffect } from 'react'
import { useSearch } from '@tanstack/react-router'
import {
  Building2,
  User,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Clock,
  ShieldCheck,
  Send,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  useValidateOnboardingToken,
  useSubmitVendorOnboarding,
} from '../../hooks/useVendorInvitations'
import { clsx } from 'clsx'

interface ContactItem {
  id: string
  name: string
  designation: string
  phone: string
  email: string
  is_primary: boolean
}

interface AddressItem {
  id: string
  address_type: string
  address_line: string
  city: string
  district: string
  country: string
}

interface BankItem {
  id: string
  bank_name: string
  branch_name: string
  account_name: string
  account_no: string
  routing_no: string
}

export const VendorOnboardingPage = () => {
  const searchParams = useSearch({ strict: false }) as { token?: string }
  const token = searchParams.token || ''

  const {
    data: validationData,
    isLoading: isValidating,
    isError: isValidationError,
    error: validationErrorObj,
  } = useValidateOnboardingToken(token)

  const { mutate: submitOnboarding, isPending: isSubmitting } = useSubmitVendorOnboarding()

  // Form State
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [tin, setTin] = useState('')
  const [bin, setBin] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])

  // Multiple Contacts State
  const [contacts, setContacts] = useState<ContactItem[]>([
    { id: 'c-1', name: '', designation: '', phone: '', email: '', is_primary: true },
  ])

  // Multiple Addresses State
  const [addresses, setAddresses] = useState<AddressItem[]>([
    { id: 'a-1', address_type: 'registered', address_line: '', city: '', district: '', country: 'Bangladesh' },
  ])

  // Multiple Bank Infos State
  const [bankInfos, setBankInfos] = useState<BankItem[]>([
    { id: 'b-1', bank_name: '', branch_name: '', account_name: '', account_no: '', routing_no: '' },
  ])

  // Documents State: Record<document_type_id, { file: File; expire_at?: string }>
  const [documents, setDocuments] = useState<
    Record<number, { file: File; expire_at?: string }>
  >({})

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submittedVendor, setSubmittedVendor] = useState<{
    code: string
    name: string
    status: string
  } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const rawData = validationData as any
  const invitationInfo = rawData?.invitation || rawData?.response || rawData?.data
  const isValid = rawData?.valid === true || rawData?.status === 'Ok' || Boolean(invitationInfo?.company_name || invitationInfo?.email)

  // Prefill on validation success
  useEffect(() => {
    if (isValid && invitationInfo) {
      setCompanyName(invitationInfo.company_name || '')
      setEmail(invitationInfo.email || '')
      if (invitationInfo.phone) setPhone(invitationInfo.phone)
      if (invitationInfo.category_id) {
        setSelectedCategoryIds([invitationInfo.category_id])
      }
    }
  }, [isValid, invitationInfo])

  // Token missing state
  if (!token) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-slate-100 flex items-center justify-center p-4 font-poppins">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-4">
          <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Invalid Onboarding Link</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            No registration security token was provided. Please check the invitation email you received or contact the procurement department.
          </p>
        </div>
      </div>
    )
  }

  // Token validation loading
  if (isValidating) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-slate-100 flex items-center justify-center p-4 font-poppins">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-4">
          <div className="h-12 w-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">Verifying Security Token...</h3>
          <p className="text-xs text-slate-500">
            Please wait while we validate your one-time registration link.
          </p>
        </div>
      </div>
    )
  }

  // Token validation failed or expired
  if (isValidationError || !isValid) {
    const errorMsg =
      (validationErrorObj as any)?.response?.data?.message ||
      rawData?.message ||
      'This registration invitation link is invalid or has expired.'
    const reason =
      (validationErrorObj as any)?.response?.data?.reason ||
      rawData?.reason ||
      'invalid'

    return (
      <div className="fixed inset-0 overflow-y-auto bg-slate-100 flex items-center justify-center p-4 font-poppins">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-4">
          <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
            {reason === 'already_completed' ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <XCircle className="h-8 w-8" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {reason === 'already_completed'
              ? 'Application Already Submitted'
              : 'Link Expired or Invalid'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{errorMsg}</p>
          <div className="pt-2">
            <p className="text-xs text-slate-400">
              Need assistance? Contact our procurement helpdesk at{' '}
              <span className="font-semibold text-slate-600">procurement@company.com</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success Screen
  if (submittedVendor) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-slate-100 flex items-center justify-center p-4 font-poppins">
        <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-6">
          <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Registration Submitted!
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Thank you for completing your vendor registration. Your application is now in review with our procurement team.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Company Name:</span>
              <span className="font-semibold text-slate-800">{submittedVendor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Application Code:</span>
              <span className="font-mono font-bold text-indigo-600">
                {submittedVendor.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Under Review
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
            Once approved, you will receive an official onboarding confirmation email with your Vendor Portal credentials.
          </div>
        </div>
      </div>
    )
  }

  const availableCategories: Array<{ id: number; name: string; vendor_type?: string }> = invitationInfo?.categories || []
  const availableDocTypes: Array<{ id: number; name: string; code?: string; is_required?: boolean }> = invitationInfo?.document_types || []

  // File upload handler
  const handleFileChange = (docTypeId: number, file: File | null) => {
    if (!file) {
      setDocuments((prev) => {
        const next = { ...prev }
        delete next[docTypeId]
        return next
      })
      return
    }

    setDocuments((prev) => ({
      ...prev,
      [docTypeId]: {
        file,
        expire_at: prev[docTypeId]?.expire_at || '',
      },
    }))
    setErrors((prev) => ({ ...prev, [`doc_${docTypeId}`]: '' }))
  }

  const handleExpiryChange = (docTypeId: number, date: string) => {
    setDocuments((prev) => {
      if (!prev[docTypeId]) return prev
      return {
        ...prev,
        [docTypeId]: {
          ...prev[docTypeId],
          expire_at: date,
        },
      }
    })
  }

  // Contact Handlers
  const handleAddContact = () => {
    setContacts((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: '', designation: '', phone: '', email: '', is_primary: false },
    ])
  }

  const handleUpdateContact = (index: number, field: keyof ContactItem, value: any) => {
    setContacts((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`contact_${field}_${index}`]
      return next
    })
  }

  const handleRemoveContact = (index: number) => {
    if (contacts.length <= 1) return
    setContacts((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Address Handlers
  const handleAddAddress = () => {
    setAddresses((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, address_type: 'office', address_line: '', city: '', district: '', country: 'Bangladesh' },
    ])
  }

  const handleUpdateAddress = (index: number, field: keyof AddressItem, value: any) => {
    setAddresses((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`address_${field}_${index}`]
      return next
    })
  }

  const handleRemoveAddress = (index: number) => {
    if (addresses.length <= 1) return
    setAddresses((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Bank Handlers
  const handleAddBank = () => {
    setBankInfos((prev) => [
      ...prev,
      { id: `b-${Date.now()}`, bank_name: '', branch_name: '', account_name: '', account_no: '', routing_no: '' },
    ])
  }

  const handleUpdateBank = (index: number, field: keyof BankItem, value: any) => {
    setBankInfos((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`bank_${field}_${index}`]
      return next
    })
  }

  const handleRemoveBank = (index: number) => {
    if (bankInfos.length <= 1) return
    setBankInfos((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const newErrors: Record<string, string> = {}

    if (!companyName.trim()) newErrors.companyName = 'Company name is required.'
    if (!email.trim()) newErrors.email = 'Official email is required.'
    if (!phone.trim()) newErrors.phone = 'Official phone is required.'

    // Check primary contact (index 0)
    if (!contacts[0]?.name.trim()) newErrors.contact_name_0 = 'Primary contact person name is required.'
    if (!contacts[0]?.phone.trim()) newErrors.contact_phone_0 = 'Primary contact phone number is required.'

    // Check primary address (index 0)
    if (!addresses[0]?.address_line.trim()) newErrors.address_address_line_0 = 'Street address is required.'
    if (!addresses[0]?.city.trim()) newErrors.address_city_0 = 'City is required.'
    if (!addresses[0]?.country.trim()) newErrors.address_country_0 = 'Country is required.'

    // Check primary bank info (index 0)
    if (!bankInfos[0]?.bank_name.trim()) newErrors.bank_bank_name_0 = 'Bank name is required.'
    if (!bankInfos[0]?.account_name.trim()) newErrors.bank_account_name_0 = 'Account holder name is required.'
    if (!bankInfos[0]?.account_no.trim()) newErrors.bank_account_no_0 = 'Account number is required.'

    // Check mandatory documents
    availableDocTypes.forEach((docType) => {
      if (docType.is_required && !documents[docType.id]?.file) {
        newErrors[`doc_${docType.id}`] = `${docType.name} is required.`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const validContacts = contacts
      .filter((c) => c.name.trim() || c.phone.trim())
      .map((c, idx) => ({
        name: c.name.trim(),
        designation: c.designation.trim() || undefined,
        phone: c.phone.trim(),
        email: c.email.trim() || undefined,
        is_primary: idx === 0,
      }))

    const validAddresses = addresses
      .filter((a) => a.address_line.trim() || a.city.trim())
      .map((a) => ({
        address_type: a.address_type || 'office',
        address_line: a.address_line.trim(),
        city: a.city.trim(),
        district: a.district.trim() || undefined,
        country: a.country.trim(),
      }))

    const validBanks = bankInfos
      .filter((b) => b.bank_name.trim() && b.account_no.trim())
      .map((b) => ({
        bank_name: b.bank_name.trim(),
        branch_name: b.branch_name.trim() || undefined,
        account_name: b.account_name.trim(),
        account_no: b.account_no.trim(),
        routing_no: b.routing_no.trim() || undefined,
      }))

    // Build documents payload array
    const documentsPayload = Object.entries(documents).map(([typeId, item]) => ({
      vendor_document_type_id: Number(typeId),
      file: item.file,
      expire_at: item.expire_at || undefined,
    }))

    submitOnboarding(
      {
        token,
        name: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim() || undefined,
        tax_identification_number: tin.trim() || undefined,
        business_registration_number: bin.trim() || undefined,
        category_ids: selectedCategoryIds,
        contacts: validContacts,
        addresses: validAddresses,
        bank_infos: validBanks,
        documents: documentsPayload,
      },
      {
        onSuccess: (res) => {
          const v = (res as any)?.response || (res as any)?.data || res
          setSubmittedVendor({
            code: v.code || 'VND-SUBMITTED',
            name: v.name || companyName,
            status: v.status || 'under_review',
          })
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Submission failed. Please verify your form entries.'
          setSubmitError(msg)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-slate-100 py-10 px-4 font-poppins text-slate-800 flex justify-center custom-scrollbar">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header Hero Card (Google Form style top banner) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden border-t-8 border-t-indigo-600">
          <div className="p-6 sm:p-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-wide uppercase">
                <ShieldCheck className="h-5 w-5" />
                <span>Vendor Onboarding Portal</span>
              </div>
              {invitationInfo?.expires_at && (
                <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Link expires {new Date(invitationInfo.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Vendor Self-Registration Form
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Welcome to our supplier registration gateway. Please provide accurate company details, official contact, banking information, and statutory compliance documents.
            </p>

            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
              <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Fields marked with <span className="text-rose-500 font-bold">*</span> are required. This one-time registration token will be deactivated upon submission.
              </span>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Submission Error</div>
              <div>{submitError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Company Profile */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">1. Company Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Legal Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value)
                    if (errors.companyName) {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.companyName
                        return next
                      })
                    }
                  }}
                  placeholder="e.g. Apex Industrial Solutions Ltd"
                  className={clsx(
                    'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                    errors.companyName
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                  )}
                />
                {errors.companyName && (
                  <span className="text-xs text-rose-500 font-medium">
                    {errors.companyName}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.email
                        return next
                      })
                    }
                  }}
                  placeholder="info@company.com"
                  className={clsx(
                    'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                    errors.email
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                  )}
                />
                {errors.email && (
                  <span className="text-xs text-rose-500 font-medium">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Official Phone / Mobile <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (errors.phone) {
                      setErrors((prev) => {
                        const next = { ...prev }
                        delete next.phone
                        return next
                      })
                    }
                  }}
                  placeholder="e.g. 01700000000 or +8801700000000"
                  className={clsx(
                    'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                    errors.phone
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                  )}
                />
                {errors.phone && (
                  <span className="text-xs text-rose-500 font-medium">{errors.phone}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tax Identification No (TIN)
                </label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="12-digit TIN / e-TIN"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Business Registration / BIN
                </label>
                <input
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  placeholder="BIN / Trade License Registration No"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Company Website (Optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                />
              </div>

              {availableCategories.length > 0 && (
                <div className="sm:col-span-2 space-y-2 pt-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Industry / Product Categories Supplied
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== cat.id)
                                : [...prev, cat.id]
                            )
                          }}
                          className={clsx(
                            'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          {cat.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Contact Persons */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <User className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">2. Contact Persons & Representatives</h2>
              </div>
              <button
                type="button"
                onClick={handleAddContact}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Another Contact</span>
              </button>
            </div>

            <div className="space-y-6 divide-y divide-slate-100">
              {contacts.map((contact, idx) => (
                <div key={contact.id} className="pt-5 first:pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Contact Person #{idx + 1}
                      </span>
                      {idx === 0 ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          Primary Contact
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Alternate Contact
                        </span>
                      )}
                    </div>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Contact Person Name {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => handleUpdateContact(idx, 'name', e.target.value)}
                        placeholder="e.g. John Doe"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`contact_name_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`contact_name_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`contact_name_${idx}`]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        value={contact.designation}
                        onChange={(e) => handleUpdateContact(idx, 'designation', e.target.value)}
                        placeholder="e.g. Sales Manager / Director"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Mobile Number {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={contact.phone}
                        onChange={(e) => handleUpdateContact(idx, 'phone', e.target.value)}
                        placeholder="e.g. 01800000000 or +8801800000000"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`contact_phone_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`contact_phone_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`contact_phone_${idx}`]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleUpdateContact(idx, 'email', e.target.value)}
                        placeholder="contact@company.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Business Addresses */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">3. Operating Locations & Addresses</h2>
              </div>
              <button
                type="button"
                onClick={handleAddAddress}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Another Location</span>
              </button>
            </div>

            <div className="space-y-6 divide-y divide-slate-100">
              {addresses.map((address, idx) => (
                <div key={address.id} className="pt-5 first:pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Location #{idx + 1}
                    </span>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Address Type
                      </label>
                      <select
                        value={address.address_type}
                        onChange={(e) => handleUpdateAddress(idx, 'address_type', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                      >
                        <option value="registered">Registered / Head Office</option>
                        <option value="office">Corporate / Sales Office</option>
                        <option value="factory">Factory / Manufacturing Plant</option>
                        <option value="warehouse">Warehouse / Depot</option>
                        <option value="billing">Billing Address</option>
                        <option value="shipping">Shipping / Dispatch Facility</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Address Line / Street Details {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.address_line}
                        onChange={(e) => handleUpdateAddress(idx, 'address_line', e.target.value)}
                        placeholder="e.g. Suite 401, Plot 12, Road 4, Banani"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`address_address_line_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`address_address_line_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`address_address_line_${idx}`]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        City / Town {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => handleUpdateAddress(idx, 'city', e.target.value)}
                        placeholder="e.g. Dhaka, Chittagong"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`address_city_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`address_city_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`address_city_${idx}`]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        District / State
                      </label>
                      <input
                        type="text"
                        value={address.district}
                        onChange={(e) => handleUpdateAddress(idx, 'district', e.target.value)}
                        placeholder="e.g. Dhaka, Gazipur"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Country {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={address.country}
                        onChange={(e) => handleUpdateAddress(idx, 'country', e.target.value)}
                        placeholder="e.g. Bangladesh"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`address_country_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`address_country_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`address_country_${idx}`]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Banking Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  4. Bank Account & Settlement Details
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddBank}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Bank Account</span>
              </button>
            </div>

            <div className="space-y-6 divide-y divide-slate-100">
              {bankInfos.map((bank, idx) => (
                <div key={bank.id} className="pt-5 first:pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Bank Account #{idx + 1}
                    </span>
                    {bankInfos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBank(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Bank"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Bank Name {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={bank.bank_name}
                        onChange={(e) => handleUpdateBank(idx, 'bank_name', e.target.value)}
                        placeholder="e.g. Dutch-Bangla Bank / Standard Chartered"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`bank_bank_name_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`bank_bank_name_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`bank_bank_name_${idx}`]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Branch Name</label>
                      <input
                        type="text"
                        value={bank.branch_name}
                        onChange={(e) => handleUpdateBank(idx, 'branch_name', e.target.value)}
                        placeholder="e.g. Gulshan Branch"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Account Name {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={bank.account_name}
                        onChange={(e) => handleUpdateBank(idx, 'account_name', e.target.value)}
                        placeholder="Company Account Title"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`bank_account_name_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`bank_account_name_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`bank_account_name_${idx}`]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Account Number {idx === 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={bank.account_no}
                        onChange={(e) => handleUpdateBank(idx, 'account_no', e.target.value)}
                        placeholder="e.g. 101-123-45678"
                        className={clsx(
                          'w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm outline-none transition-all',
                          errors[`bank_account_no_${idx}`]
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                        )}
                      />
                      {errors[`bank_account_no_${idx}`] && (
                        <span className="text-xs text-rose-500 font-medium">
                          {errors[`bank_account_no_${idx}`]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Routing / Swift Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={bank.routing_no}
                        onChange={(e) => handleUpdateBank(idx, 'routing_no', e.target.value)}
                        placeholder="9-digit bank routing number"
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Compliance Documents (KYC) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                5. Statutory Documents & KYC
              </h2>
            </div>

            <p className="text-xs text-slate-500">
              Please upload clear PDF or image copies of your company documents (Max 10MB per file).
            </p>

            <div className="space-y-4">
              {availableDocTypes.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                  No specific document requirements specified.
                </div>
              ) : (
                availableDocTypes.map((docType) => {
                  const uploaded = documents[docType.id]
                  const docError = errors[`doc_${docType.id}`]

                  return (
                    <div
                      key={docType.id}
                      className={clsx(
                        'p-4 rounded-xl border transition-all space-y-3',
                        docError
                          ? 'border-rose-300 bg-rose-50/30'
                          : uploaded
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-slate-200 bg-slate-50/40'
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {docType.name}
                          </span>
                          {docType.is_required ? (
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wider font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>
                              Document Attachment {docType.is_required && <span className="text-rose-500">*</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">PDF, PNG, JPG, DOCX</span>
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.docx"
                              id={`file-${docType.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null
                                handleFileChange(docType.id, file)
                              }}
                              className="hidden"
                            />
                            {uploaded ? (
                              <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs h-[42px]">
                                <div className="flex items-center gap-2 truncate text-emerald-900 font-medium">
                                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[170px]">{uploaded.file.name}</span>
                                  <span className="text-[10px] text-emerald-600 shrink-0">
                                    ({(uploaded.file.size / 1024).toFixed(0)} KB)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <label
                                    htmlFor={`file-${docType.id}`}
                                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer underline"
                                  >
                                    Change
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleFileChange(docType.id, null)}
                                    className="p-1 hover:bg-emerald-100 rounded text-rose-500 cursor-pointer"
                                    title="Remove file"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label
                                htmlFor={`file-${docType.id}`}
                                className={clsx(
                                  'flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-dashed text-xs font-medium cursor-pointer transition-all h-[42px]',
                                  docError
                                    ? 'border-rose-400 bg-rose-50/50 text-rose-700 hover:bg-rose-50'
                                    : 'border-slate-300 bg-slate-50/50 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white'
                                )}
                              >
                                <Upload className="h-4 w-4 shrink-0" />
                                <span className="truncate">Choose file to upload</span>
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Document Expiry Date <span className="text-slate-400 font-normal">(If applicable)</span>
                          </label>
                          <input
                            type="date"
                            value={uploaded?.expire_at || ''}
                            onChange={(e) => handleExpiryChange(docType.id, e.target.value)}
                            className="w-full h-[42px] px-3.5 py-2 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs text-slate-700 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {docError && (
                        <div className="text-xs text-rose-500 font-medium">{docError}</div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Submission Footer */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 leading-relaxed text-center sm:text-left">
              By submitting this form, you certify that all information provided is accurate and verifiable.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
