import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertCircle, ShieldAlert, ShieldCheck, Clock, Check } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { useUpdateVendor } from '../../hooks/useVendors'
import { useCreateVendorBlacklist } from '../../hooks/useVendorBlacklists'
import { updateVendor as updateVendorApi } from '../../api/vendor.api'
import { getVendorBlacklists, deleteVendorBlacklist } from '../../api/vendorBlacklist.api'
import { vendorBlacklistKeys, vendorKeys } from '../../api/vendor.keys'
import { useUiStore } from '@/store/useUiStore'
import type { Vendor, VendorStatus, VendorBlacklistType } from '../../api/types'
import { clsx } from 'clsx'

interface VendorApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  vendor: Vendor | null
  initialStatus?: VendorStatus
}

const statusOptions: { value: VendorStatus; label: string; description: string; color: string; icon: any }[] = [
  {
    value: 'approved',
    label: 'Approved',
    description: 'Vendor documents and compliance have been verified. Ready for procurement operations.',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: CheckCircle2,
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Fully qualified active vendor participating in RFQs, purchase orders, and contracts.',
    color: 'text-green-700 bg-green-50 border-green-200',
    icon: ShieldCheck,
  },
  {
    value: 'under_review',
    label: 'Under Review',
    description: 'Vendor profile and credentials are under internal verification.',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: Clock,
  },
  {
    value: 'kyc_pending',
    label: 'KYC Pending',
    description: 'Awaiting mandatory KYC documents or identity verification.',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    icon: AlertCircle,
  },
  {
    value: 'monitored',
    label: 'Monitored',
    description: 'Vendor is under performance evaluation or conditional status.',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    icon: AlertCircle,
  },
  {
    value: 'blacklisted',
    label: 'Blacklisted',
    description: 'Suspended or barred from future procurement activities due to non-compliance.',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    icon: ShieldAlert,
  },
]

const blacklistTypeOptions: { value: VendorBlacklistType; label: string; description: string }[] = [
  {
    value: 'temporary',
    label: 'Temporary Suspension',
    description: 'Suspended pending ongoing disciplinary investigation, audit, or remedy.',
  },
  {
    value: 'permanent',
    label: 'Permanent Blacklist',
    description: 'Permanently debarred from all future RFQ invitations and purchase orders.',
  },
]

export const VendorApprovalModal = ({
  isOpen,
  onClose,
  vendor,
  initialStatus = 'approved',
}: VendorApprovalModalProps) => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()
  const { mutate: updateVendor, isPending: isUpdatingVendor } = useUpdateVendor()
  const { mutate: createBlacklist, isPending: isCreatingBlacklist } = useCreateVendorBlacklist()
  const [isRemovingBlacklist, setIsRemovingBlacklist] = useState(false)
  const isPending = isUpdatingVendor || isCreatingBlacklist || isRemovingBlacklist

  const [selectedStatus, setSelectedStatus] = useState<VendorStatus>(initialStatus)
  const [blacklistType, setBlacklistType] = useState<VendorBlacklistType>('temporary')
  const [blacklistReason, setBlacklistReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  useEffect(() => {
    if (vendor && isOpen) {
      setSelectedStatus((initialStatus || vendor.status || 'approved') as VendorStatus)
      setBlacklistType('temporary')
      setBlacklistReason('')
      setReasonError(null)
    }
  }, [vendor, initialStatus, isOpen])

  if (!vendor) return null

  const selectedOption = statusOptions.find((opt) => opt.value === selectedStatus) || statusOptions[0]
  const Icon = selectedOption.icon

  const handleConfirm = async () => {
    const targetUuid = vendor.uuid || (vendor as any).id
    if (!targetUuid) {
      showNotificationModal('Error', 'Vendor identifier not found.', 'error')
      return
    }

    // 1. If target status is "blacklisted", route through Blacklist API to log disciplinary record
    if (selectedStatus === 'blacklisted') {
      if (!blacklistReason.trim()) {
        setReasonError('Please provide a reason or justification for blacklisting this vendor.')
        return
      }

      createBlacklist(
        {
          vendor_id: vendor.id,
          blacklist_type: blacklistType,
          reason: blacklistReason.trim(),
        },
        {
          onSuccess: () => {
            showNotificationModal(
              'Vendor Blacklisted',
              `Vendor "${vendor.name}" has been blacklisted and added to the Blacklisted Vendors list.`,
              'success'
            )
            onClose()
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || 'Failed to blacklist vendor.'
            showNotificationModal('Blacklist Failed', msg, 'error')
          },
        }
      )
      return
    }

    // 2. If vendor was currently blacklisted and we are transitioning to a non-blacklisted status (e.g. Active, Approved)
    if (vendor.status === 'blacklisted') {
      setIsRemovingBlacklist(true)
      try {
        // Find existing blacklist records for this vendor
        const blacklistRes = await getVendorBlacklists({ vendor_id: vendor.id })
        const blacklistItems = blacklistRes?.response || []

        // Delete blacklist logs (this removes them from Blacklist table and resets status on backend)
        for (const item of blacklistItems) {
          if (item.uuid) {
            await deleteVendorBlacklist(item.uuid)
          }
        }

        // If target status is something other than 'active' (e.g. 'approved', 'under_review'), update it explicitly
        if (selectedStatus !== 'active') {
          await updateVendorApi({
            uuid: targetUuid,
            status: selectedStatus,
          })
        }

        // Invalidate queries so lists refresh immediately without page reload
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: vendorKeys.all(), refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: vendorBlacklistKeys.all(), refetchType: 'all' }),
          queryClient.invalidateQueries({ queryKey: ['procurement', 'vendor-blacklists'], refetchType: 'all' }),
        ])

        showNotificationModal(
          'Status Updated',
          `Vendor "${vendor.name}" status changed to ${selectedOption.label} and removed from blacklist.`,
          'success'
        )
        onClose()
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to update vendor status.'
        showNotificationModal('Update Failed', msg, 'error')
      } finally {
        setIsRemovingBlacklist(false)
      }
      return
    }

    // 3. Otherwise standard status update
    updateVendor(
      {
        uuid: targetUuid,
        status: selectedStatus,
      },
      {
        onSuccess: () => {
          showNotificationModal(
            'Status Updated',
            `Vendor "${vendor.name}" status changed to ${selectedOption.label}.`,
            'success'
          )
          onClose()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to update vendor status.'
          showNotificationModal('Update Failed', msg, 'error')
        },
      }
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Vendor Status / Approval"
      size="md"
    >
      <div className="space-y-4 pt-1 font-poppins">
        {/* Vendor Summary Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</div>
            <div className="text-sm font-bold text-slate-900">{vendor.name}</div>
            <div className="text-xs font-mono text-slate-600 mt-0.5">{vendor.code}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Status</div>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-200 text-slate-800">
              {vendor.status_label || vendor.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Status Selection */}
        <FormField label="Target Status" required>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.value
              const OptIcon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(opt.value)
                    setReasonError(null)
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <OptIcon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? 'text-primary' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-primary' : 'text-slate-800'
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {opt.value}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </FormField>

        {/* Status Description Banner */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${selectedOption.color}`}>
          <Icon className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed font-medium">
            <span className="font-bold">{selectedOption.label}: </span>
            {selectedOption.description}
          </div>
        </div>

        {/* Disciplinary Inputs (Visible ONLY when target status is Blacklisted) */}
        {selectedStatus === 'blacklisted' && (
          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3.5 animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-800 text-[13px] font-bold">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>Blacklist Disciplinary Details</span>
            </div>

            {/* Classification */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider">
                Blacklist Classification
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {blacklistTypeOptions.map((opt) => {
                  const isSelected = blacklistType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBlacklistType(opt.value)}
                      className={clsx(
                        'p-2.5 rounded-lg text-left border transition-all cursor-pointer space-y-0.5',
                        isSelected
                          ? 'border-rose-400 bg-white ring-2 ring-rose-400/20 shadow-xs'
                          : 'border-rose-200 bg-white/70 hover:bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={clsx('text-[12px] font-bold', isSelected ? 'text-rose-700' : 'text-gray-700')}>
                          {opt.label}
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-rose-600" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider">
                Disciplinary Reason / Justification <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={blacklistReason}
                onChange={(e) => {
                  setBlacklistReason(e.target.value)
                  setReasonError(null)
                }}
                placeholder="Explain the reason for blacklisting (e.g. counterfeit parts, breach of SLA, failed KYC, fraud)..."
                rows={3}
                className={clsx(
                  'w-full p-2.5 bg-white border rounded-lg text-[12px] outline-none font-medium text-gray-800 focus:ring-1 focus:ring-rose-400 focus:border-rose-500 transition-all resize-none',
                  reasonError ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-rose-200 hover:border-rose-300'
                )}
              />
              {reasonError && (
                <span className="text-rose-600 text-[11px] font-medium block">{reasonError}</span>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="px-4 h-9">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={isPending}
            className="px-5 h-9 font-semibold"
          >
            {selectedStatus === 'blacklisted' ? 'Confirm Blacklist' : 'Apply Status'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
