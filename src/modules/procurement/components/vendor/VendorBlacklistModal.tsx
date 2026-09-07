import { useState, useEffect, useMemo } from 'react'
import { ShieldAlert, AlertTriangle, Building2, Clock, Check } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { useCreateVendorBlacklist, useUpdateVendorBlacklist } from '../../hooks/useVendorBlacklists'
import { useVendors } from '../../hooks/useVendors'
import { useUiStore } from '@/store/useUiStore'
import type { VendorBlacklist, VendorBlacklistType } from '../../api/types'
import { clsx } from 'clsx'

interface VendorBlacklistModalProps {
  isOpen: boolean
  onClose: () => void
  blacklistRecord?: VendorBlacklist | null
  preselectedVendorId?: number
}

const typeOptions: { value: VendorBlacklistType; label: string; description: string }[] = [
  {
    value: 'temporary',
    label: 'Temporary Suspension',
    description: 'Suspended pending ongoing disciplinary investigation, audit, or conditional remedy.',
  },
  {
    value: 'permanent',
    label: 'Permanent Blacklist',
    description: 'Permanently debarred from all future RFQ invitations, purchase orders, and settlements.',
  },
]

export const VendorBlacklistModal = ({
  isOpen,
  onClose,
  blacklistRecord,
  preselectedVendorId,
}: VendorBlacklistModalProps) => {
  const { showNotificationModal } = useUiStore()
  const isEditing = !!blacklistRecord

  // Fetch vendors for selection
  const { data: vendorsData } = useVendors({ per_page: 200 })
  const { mutate: createBlacklist, isPending: isCreating } = useCreateVendorBlacklist()
  const { mutate: updateBlacklist, isPending: isUpdating } = useUpdateVendorBlacklist()
  const isSaving = isCreating || isUpdating

  const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>(preselectedVendorId)
  const [blacklistType, setBlacklistType] = useState<VendorBlacklistType>('temporary')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ vendor_id?: string; reason?: string }>({})

  const vendorOptions = useMemo(() => {
    if (!vendorsData?.response) return []
    return vendorsData.response.map((v) => ({
      value: v.id,
      label: `${v.name} (${v.code})`,
    }))
  }, [vendorsData])

  useEffect(() => {
    if (blacklistRecord) {
      setSelectedVendorId(blacklistRecord.vendor_id)
      setBlacklistType(blacklistRecord.blacklist_type || 'temporary')
      setReason(blacklistRecord.reason || '')
    } else {
      setSelectedVendorId(preselectedVendorId)
      setBlacklistType('temporary')
      setReason('')
    }
    setErrors({})
  }, [blacklistRecord, preselectedVendorId, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { vendor_id?: string; reason?: string } = {}
    if (!isEditing && !selectedVendorId) {
      newErrors.vendor_id = 'Please select a vendor to blacklist.'
    }
    if (!reason.trim()) {
      newErrors.reason = 'Please provide a detailed reason or justification for blacklisting.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (isEditing && blacklistRecord) {
      updateBlacklist(
        {
          uuid: blacklistRecord.uuid,
          blacklist_type: blacklistType,
          reason: reason.trim(),
        },
        {
          onSuccess: () => {
            showNotificationModal(
              'Blacklist Updated',
              'Vendor blacklist disciplinary record has been updated successfully.',
              'success'
            )
            onClose()
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || 'Failed to update blacklist record.'
            showNotificationModal('Update Failed', msg, 'error')
          },
        }
      )
    } else if (selectedVendorId) {
      createBlacklist(
        {
          vendor_id: selectedVendorId,
          blacklist_type: blacklistType,
          reason: reason.trim(),
        },
        {
          onSuccess: () => {
            showNotificationModal(
              'Vendor Blacklisted',
              'Vendor has been placed on the blacklist and status set to Blacklisted.',
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
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Blacklist Disciplinary Record' : 'Blacklist Vendor'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-poppins">
        {/* Warning Alert */}
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-[12px] text-rose-800 leading-relaxed">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Important Notice: </span>
            Blacklisting a vendor will immediately restrict their participation in RFQs, purchase orders, and active procurement operations.
          </div>
        </div>

        {/* Vendor Selection */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-gray-500">
            Select Vendor <span className="text-rose-500">*</span>
          </label>
          {isEditing ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>{blacklistRecord?.vendor?.name || 'Selected Vendor'}</span>
              <span className="text-xs font-mono text-gray-500">({blacklistRecord?.vendor?.code})</span>
            </div>
          ) : (
            <>
              <Select2
                options={vendorOptions}
                value={selectedVendorId}
                onChange={(val) => {
                  setSelectedVendorId(val as number)
                  setErrors((prev) => ({ ...prev, vendor_id: undefined }))
                }}
                placeholder="Search vendor by name or code..."
              />
              {errors.vendor_id && (
                <span className="text-rose-500 text-[11px] font-medium">{errors.vendor_id}</span>
              )}
            </>
          )}
        </div>

        {/* Blacklist Type Selection */}
        <FormField label="Blacklist Classification" required>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {typeOptions.map((opt) => {
              const isSelected = blacklistType === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBlacklistType(opt.value)}
                  className={clsx(
                    'p-3 rounded-xl text-left border transition-all cursor-pointer space-y-1',
                    isSelected
                      ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={clsx('text-[12px] font-bold', isSelected ? 'text-rose-700' : 'text-gray-800')}>
                      {opt.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-rose-600" />}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-snug">{opt.description}</p>
                </button>
              )
            })}
          </div>
        </FormField>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-gray-500">
            Disciplinary Reason / Justification <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setErrors((prev) => ({ ...prev, reason: undefined }))
            }}
            placeholder="Describe reason for blacklisting (e.g. counterfeit parts, breach of SLA, failed quality compliance, legal dispute)..."
            rows={4}
            className={clsx(
              'w-full p-3 bg-white border rounded-lg text-[13px] outline-none font-medium text-gray-800 focus:ring-1 focus:ring-rose-400 focus:border-rose-500 transition-all resize-none',
              errors.reason ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-gray-200 hover:border-gray-300'
            )}
          />
          {errors.reason && (
            <span className="text-rose-500 text-[11px] font-medium">{errors.reason}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving} className="px-4 h-9 text-[13px]">
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[13px] transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            <span>{isEditing ? 'Save Changes' : 'Confirm Blacklist'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
