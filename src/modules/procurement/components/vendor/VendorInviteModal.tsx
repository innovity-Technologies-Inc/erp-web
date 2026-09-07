import { useState, useMemo } from 'react'
import { Mail, Check, Send, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { useSendVendorInvitation } from '../../hooks/useVendorInvitations'
import { useVendorCategories } from '../../hooks/useVendorCategories'
import { useUiStore } from '@/store/useUiStore'
import type { VendorInvitation } from '../../api/types'

interface VendorInviteModalProps {
  isOpen: boolean
  onClose: () => void
}

export const VendorInviteModal = ({ isOpen, onClose }: VendorInviteModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { data: categoriesData } = useVendorCategories({ per_page: 100 })
  const { mutate: sendInvite, isPending: isSending } = useSendVendorInvitation()

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [expiresDays, setExpiresDays] = useState(7)
  const [errors, setErrors] = useState<{ company_name?: string; email?: string }>({})
  const [sentInvitation, setSentInvitation] = useState<VendorInvitation | null>(null)

  const categoryOptions = useMemo(() => {
    if (!categoriesData?.response) return []
    return categoriesData.response.map((c) => ({
      value: c.id,
      label: c.name,
    }))
  }, [categoriesData])

  const handleReset = () => {
    setCompanyName('')
    setEmail('')
    setPhone('')
    setCategoryId(undefined)
    setExpiresDays(7)
    setErrors({})
    setSentInvitation(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { company_name?: string; email?: string } = {}
    if (!companyName.trim()) {
      newErrors.company_name = 'Company Name is required.'
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    sendInvite(
      {
        company_name: companyName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        vendor_category_id: categoryId || null,
        expires_days: expiresDays,
      },
      {
        onSuccess: (res) => {
          const inv = (res as any)?.response?.invitation || (res as any)?.response || (res as any)?.data || res
          setSentInvitation(inv)
          showNotificationModal(
            'Invitation Sent',
            `Registration invitation email has been sent successfully to ${email}.`,
            'success'
          )
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to create and dispatch vendor invitation.'
          showNotificationModal('Error', msg, 'error')
        },
      }
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Vendor for Self-Registration"
      size="md"
    >
      {sentInvitation ? (
        <div className="space-y-4 pt-1 font-poppins">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-emerald-900">
                Invitation Email Sent!
              </h4>
              <p className="text-[12px] text-emerald-700 mt-0.5">
                The onboarding registration invitation has been dispatched automatically from the system to{' '}
                <span className="font-bold">{sentInvitation.email}</span>.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[12px] text-slate-700 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Company:</span>
              <span className="font-semibold text-slate-900">
                {sentInvitation.company_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-900">
                {sentInvitation.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Validity:</span>
              <span className="font-semibold text-slate-900">
                {expiresDays} Days (Expires{' '}
                {new Date(sentInvitation.expires_at).toLocaleDateString()})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="outline"
              type="button"
              onClick={handleReset}
              className="px-4 h-9 text-[13px]"
            >
              Invite Another
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleClose}
              className="px-4 h-9 text-[13px]"
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-poppins">
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-[12px] text-indigo-900 leading-relaxed">
            <Mail className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              Enter the vendor's company name and email. The system will automatically email them a secure, one-time self-onboarding registration form.
            </div>
          </div>

          <FormField label="Company / Business Name" required error={errors.company_name}>
            <input
              type="text"
              value={companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCompanyName(e.target.value)
                setErrors((prev) => ({ ...prev, company_name: undefined }))
              }}
              placeholder="e.g. Apex Industrial Solutions Ltd"
              className="w-full h-10 px-3 bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg text-[13px] text-gray-800 outline-none transition-all"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Vendor Email Address" required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="contact@vendor.com"
                className="w-full h-10 px-3 bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg text-[13px] text-gray-800 outline-none transition-all"
              />
            </FormField>

            <FormField label="Phone Number (Optional)">
              <input
                type="text"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                placeholder="+8801700000000"
                className="w-full h-10 px-3 bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg text-[13px] text-gray-800 outline-none transition-all"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-500">
                Primary Category (Optional)
              </label>
              <Select2
                options={categoryOptions}
                value={categoryId}
                onChange={(val) => setCategoryId(val as number)}
                placeholder="Select category..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-500">
                Link Validity
              </label>
              <select
                value={expiresDays}
                onChange={(e) => setExpiresDays(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg text-[13px] text-gray-800 outline-none transition-all"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Default)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={isSending}
              className="px-4 h-9 text-[13px]"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[13px] transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Send Invitation Email</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
