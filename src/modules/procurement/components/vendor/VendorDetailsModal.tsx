import { useState } from 'react'
import {
  Phone,
  Mail,
  Globe,
  FileText,
  Star,
  MapPin,
  Landmark,
  CheckCircle2,
  ExternalLink,
  Edit,
  UserCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { useVendorDetails } from '../../hooks/useVendors'
import { formatDate } from '@/utils/formatters'
import { VendorApprovalModal } from './VendorApprovalModal'
import { useNavigate } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { clsx } from 'clsx'
import type {
  VendorCategory,
  VendorContactPerson,
  VendorAddress,
  VendorBankInfo,
  VendorDocument,
  VendorBlacklist,
} from '../../api/types'

interface VendorDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  uuid: string | null
}

export const VendorDetailsModal = ({
  isOpen,
  onClose,
  uuid,
}: VendorDetailsModalProps) => {
  const navigate = useNavigate()
  const { data: vendorResponse, isLoading } = useVendorDetails(uuid)
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'addresses' | 'banks' | 'documents' | 'history'>('overview')
  const [isApprovalOpen, setIsApprovalOpen] = useState(false)

  const vendor = vendorResponse?.response || (vendorResponse as any)?.data

  if (!isOpen) return null

  const getStatusBadge = (status: string, label?: string) => {
    let style = 'bg-gray-100 text-gray-700 border-gray-200'
    if (status === 'active' || status === 'approved') {
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    } else if (status === 'under_review' || status === 'kyc_pending' || status === 'monitored') {
      style = 'bg-amber-50 text-amber-700 border-amber-200'
    } else if (status === 'blacklisted') {
      style = 'bg-rose-50 text-rose-700 border-rose-200'
    } else if (status === 'documents_uploaded' || status === 'evaluated') {
      style = 'bg-blue-50 text-blue-700 border-blue-200'
    }

    return (
      <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border', style)}>
        {label || status?.replace('_', ' ')}
      </span>
    )
  }

  // Handle various casing for bank accounts
  const bankAccounts: VendorBankInfo[] = vendor?.bank_infos || (vendor as any)?.bankInfos || []
  const contacts: VendorContactPerson[] = vendor?.contacts || []
  const addresses: VendorAddress[] = vendor?.addresses || []
  const documents: VendorDocument[] = vendor?.documents || []
  const blacklists: VendorBlacklist[] = vendor?.blacklists || []

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Vendor 360° Profile"
        size="xl"
      >
        {isLoading || !vendor ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading vendor profile...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header / Hero Section */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/60 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 shadow-xs">
                  {vendor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{vendor.name}</h3>
                    {getStatusBadge(vendor.status, vendor.status_label)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      {vendor.code}
                    </span>
                    {vendor.license_no && (
                      <span className="text-slate-500">
                        License: <span className="font-medium text-slate-700">{vendor.license_no}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Rating */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {vendor.rating !== undefined && vendor.rating !== null && (
                  <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-900">{vendor.rating}</span>
                    {vendor.rating_grade && (
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1 rounded">
                        {vendor.rating_grade}
                      </span>
                    )}
                  </div>
                )}

                <PermissionGuard permission="edit_vendor">
                  <Button
                    variant="outline"
                    className="px-3 h-8 gap-1.5 text-xs font-semibold"
                    onClick={() => {
                      onClose()
                      navigate({ to: `/procurement/vendors/edit/${vendor.uuid}` as any })
                    }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                </PermissionGuard>

                <PermissionGuard permission="edit_vendor">
                  <Button
                    variant="primary"
                    className="px-3 h-8 gap-1.5 text-xs font-semibold"
                    onClick={() => setIsApprovalOpen(true)}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Change Status
                  </Button>
                </PermissionGuard>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
              {[
                { id: 'overview', label: 'Overview & General' },
                { id: 'contacts', label: `Contacts (${contacts.length})` },
                { id: 'addresses', label: `Addresses (${addresses.length})` },
                { id: 'banks', label: `Bank Accounts (${bankAccounts.length})` },
                { id: 'documents', label: `Compliance Docs (${documents.length})` },
                { id: 'history', label: `Audit & History (${blacklists.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    'px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 rounded-t-lg',
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[220px] max-h-[380px] overflow-y-auto pr-1">
              {/* TAB 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
                      </div>
                      <div className="text-xs font-semibold text-slate-900 mt-1">
                        {vendor.phone || '—'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                      </div>
                      <div className="text-xs font-semibold text-slate-900 mt-1 truncate">
                        {vendor.email || '—'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" /> Website
                      </div>
                      <div className="text-xs font-semibold text-slate-900 mt-1 truncate">
                        {vendor.website ? (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {vendor.website}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Associated Business Categories
                    </div>
                    {vendor.categories && vendor.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.categories.map((cat: VendorCategory) => (
                          <span
                            key={cat.id}
                            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-medium"
                          >
                            {cat.name}
                            {cat.vendor_type && (
                              <span className="ml-1 text-[10px] text-slate-400 uppercase">
                                ({cat.vendor_type})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No categories linked.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Contacts */}
              {activeTab === 'contacts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contacts.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic">
                      No contact persons listed.
                    </div>
                  ) : (
                    contacts.map((c: VendorContactPerson, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-900">{c.name}</span>
                          {c.is_primary && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                              Primary Contact
                            </span>
                          )}
                        </div>
                        {c.designation && (
                          <div className="text-[11px] text-slate-500 font-medium">{c.designation}</div>
                        )}
                        <div className="pt-1 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                          </span>
                          {c.email && (
                            <span className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: Addresses */}
              {activeTab === 'addresses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addresses.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic">
                      No addresses recorded.
                    </div>
                  ) : (
                    addresses.map((a: VendorAddress, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> {a.address_type} Address
                          </span>
                          {a.is_primary && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {a.address_line}
                        </p>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {[a.city, a.district, a.division, a.state, a.postal_code, a.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: Bank Accounts */}
              {activeTab === 'banks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bankAccounts.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic">
                      No bank accounts registered.
                    </div>
                  ) : (
                    bankAccounts.map((b: VendorBankInfo, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-indigo-600" /> {b.bank_name}
                          </span>
                          {b.is_primary && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                              Primary Account
                            </span>
                          )}
                        </div>
                        {b.branch_name && (
                          <div className="text-[11px] text-slate-500">Branch: {b.branch_name}</div>
                        )}
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Title:</span>
                            <span className="font-semibold text-slate-800">{b.account_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account No:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {b.account_number || b.account_no || '—'}
                            </span>
                          </div>
                          {(b.routing_number || b.routing_no || b.swift_code) && (
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Routing / SWIFT:</span>
                              <span className="font-mono text-slate-600">
                                {b.routing_number || b.routing_no || b.swift_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: Compliance Documents */}
              {activeTab === 'documents' && (
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No compliance documents uploaded.
                    </div>
                  ) : (
                    documents.map((doc: VendorDocument, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              {doc.document_type?.name || doc.document_name || `Document #${i + 1}`}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {doc.expiry_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Expires: {formatDate(doc.expiry_date)}
                                </span>
                              )}
                              {doc.is_verified ? (
                                <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium">Pending Verification</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {doc.document_url && (
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors shrink-0"
                          >
                            View File
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: History & Blacklist Logs */}
              {activeTab === 'history' && (
                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Record Created: </span>
                      <span className="font-semibold text-slate-800">
                        {vendor.created_at ? formatDate(vendor.created_at) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Updated: </span>
                      <span className="font-semibold text-slate-800">
                        {vendor.updated_at ? formatDate(vendor.updated_at) : '—'}
                      </span>
                    </div>
                  </div>

                  {blacklists.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Blacklist & Suspension Records
                      </div>
                      {blacklists.map((bl: VendorBlacklist, i: number) => (
                        <div
                          key={i}
                          className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex justify-between font-semibold text-rose-900">
                            <span className="capitalize">{bl.blacklist_type_label || bl.blacklist_type || (bl as any).type} Blacklist</span>
                            <span>{bl.created_at ? formatDate(bl.created_at) : ''}</span>
                          </div>
                          <p className="text-slate-700">{bl.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  onClose()
                  navigate({ to: `/procurement/vendors/view/${vendor.uuid}` as any })
                }}
                className="px-3 h-8 text-xs font-medium text-slate-600"
              >
                Open Full View Page
              </Button>

              <Button variant="primary" onClick={onClose} className="px-5 h-8 text-xs">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval / Status Update Modal */}
      {vendor && (
        <VendorApprovalModal
          isOpen={isApprovalOpen}
          onClose={() => setIsApprovalOpen(false)}
          vendor={vendor}
          initialStatus={vendor.status}
        />
      )}
    </>
  )
}
