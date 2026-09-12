import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Edit,
  Building2,
  UserCircle2,
  MapPin,
  Landmark,
  FileText,
  Calendar,
  ExternalLink,
  UserCheck,
  Star,
  Info,
  Link2,
  ShieldAlert,
  Clock,
  Phone,
  Mail,
  Globe,
  Award,
  CreditCard,
  FileCheck,
  CheckCircle2,
} from 'lucide-react'
import { useVendorDetails } from '../../hooks/useVendors'
import { formatDate } from '@/utils/formatters'
import { VendorApprovalModal } from '../../components/vendor/VendorApprovalModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { useAuthStore } from '@/store/useAuthStore'
import { clsx } from 'clsx'
import type {
  VendorCategory,
  VendorContactPerson,
  VendorAddress,
  VendorBankInfo,
  VendorDocument,
  VendorBlacklist,
} from '../../api/types'

export const VendorViewPage = () => {
  const params = useParams({ strict: false }) as Record<string, string | undefined>
  const targetUuid = params.uuid || params.id || null
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: vendorResponse, isLoading, error } = useVendorDetails(targetUuid)
  const [isApprovalOpen, setIsApprovalOpen] = useState(false)

  const vendor = vendorResponse?.response || (vendorResponse as any)?.data

  const getStatusBadge = (status: string, label?: string) => {
    let style = 'bg-gray-100 text-gray-700 border-gray-200'
    let dotColor = 'bg-gray-400'

    if (status === 'active' || status === 'approved') {
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
      dotColor = 'bg-emerald-500'
    } else if (status === 'under_review' || status === 'kyc_pending' || status === 'monitored') {
      style = 'bg-amber-50 text-amber-700 border-amber-200'
      dotColor = 'bg-amber-500'
    } else if (status === 'blacklisted') {
      style = 'bg-rose-50 text-rose-700 border-rose-200'
      dotColor = 'bg-rose-500'
    } else if (status === 'documents_uploaded' || status === 'evaluated') {
      style = 'bg-blue-50 text-blue-700 border-blue-200'
      dotColor = 'bg-blue-500'
    }

    return (
      <span
        className={clsx(
          'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs inline-flex items-center gap-1.5',
          style
        )}
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotColor)} />
        {label || status?.replace('_', ' ')}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-gray-500 font-medium">Loading vendor profile...</p>
        </div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center font-poppins p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center space-y-4 border border-gray-200 shadow-2xs">
          <Info className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Vendor Not Found</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            The requested vendor details could not be retrieved. The record may have been deleted or moved.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/procurement/vendors' as any })}
            className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg text-[12px] transition-all hover:bg-primary/95 cursor-pointer shadow-2xs"
          >
            Return to Vendor List
          </button>
        </div>
      </div>
    )
  }

  const bankAccounts: VendorBankInfo[] = vendor?.bank_infos || (vendor as any)?.bankInfos || []
  const contacts: VendorContactPerson[] = vendor?.contacts || []
  const addresses: VendorAddress[] = vendor?.addresses || []
  const documents: VendorDocument[] = vendor?.documents || []
  const categories: VendorCategory[] = vendor?.categories || []
  const blacklists: VendorBlacklist[] = vendor?.blacklists || []

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins">
      {/* 1. Page Header matching Create / Edit style */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/procurement/vendors' as any })}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-primary transition-colors shadow-2xs text-[12px] font-medium cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-medium text-primary tracking-tight">Vendor Details</h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-600 shadow-2xs">
                {vendor.code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PermissionGuard permission="approve_vendor">
              {user?.user_type !== 'vendor' && (
                <button
                  type="button"
                  onClick={() => setIsApprovalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[12px] font-medium transition-all shadow-2xs cursor-pointer"
                >
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>Change Status</span>
                </button>
              )}
            </PermissionGuard>

            <PermissionGuard permission="edit_vendor">
              <button
                type="button"
                onClick={() => navigate({ to: `/procurement/vendors/edit/${vendor.uuid}` as any })}
                className="flex items-center gap-2 px-5 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white rounded-lg text-[12px] font-medium transition-all shadow-2xs cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Vendor</span>
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Section Layout matching Create / Edit */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ======================================================== */}
          {/* LEFT COLUMN (lg:col-span-6): Vendor Information & Addresses */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 space-y-6">
            {/* Vendor Information Card */}
            <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1e293b]">Vendor Information</h2>
                    <p className="text-[11px] text-gray-500">Core company profile & contact essentials</p>
                  </div>
                </div>
                {getStatusBadge(vendor.status, vendor.status_label)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Name */}
                <div className="md:col-span-2 p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Vendor / Business Name
                  </p>
                  <p className="text-[15px] font-bold text-gray-900">{vendor.name}</p>
                </div>

                {/* Vendor Code */}
                <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Vendor Code
                  </p>
                  <p className="text-[13px] font-mono font-bold text-gray-800">{vendor.code}</p>
                </div>

                {/* Phone */}
                <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </p>
                  {vendor.phone ? (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1.5"
                    >
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {vendor.phone}
                    </a>
                  ) : (
                    <p className="text-[13px] text-gray-400">—</p>
                  )}
                </div>

                {/* Email */}
                <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Email Address
                  </p>
                  {vendor.email ? (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1.5 truncate"
                    >
                      <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </a>
                  ) : (
                    <p className="text-[13px] text-gray-400">—</p>
                  )}
                </div>

                {/* Website */}
                <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Official Website
                  </p>
                  {vendor.website ? (
                    <a
                      href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1.5 truncate"
                    >
                      <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{vendor.website}</span>
                      <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[13px] text-gray-400">—</p>
                  )}
                </div>

                {/* Trade License */}
                <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Trade License / Reg No
                  </p>
                  <p className="text-[13px] font-medium text-gray-800">
                    {vendor.license_no || '—'}
                  </p>
                </div>

                {/* Rating & Grade */}
                <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Rating & Performance
                  </p>
                  {vendor.rating !== null && vendor.rating !== undefined ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[13px] font-bold text-gray-900">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {vendor.rating} / 100
                      </span>
                      {vendor.rating_grade && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] font-bold">
                          Grade {vendor.rating_grade}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-400">Not evaluated yet</p>
                  )}
                </div>

                {/* Vendor Categories */}
                <div className="md:col-span-2 p-3 bg-gray-50/70 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Supply & Business Categories
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[12px] text-gray-400">No categories assigned</span>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="md:col-span-2 flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100 px-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    Created: <strong className="text-gray-700">{formatDate(vendor.created_at)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    Updated: <strong className="text-gray-700">{formatDate(vendor.updated_at)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Addresses & Locations Card */}
            <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1e293b]">Addresses & Locations</h2>
                    <p className="text-[11px] text-gray-500">Registered office, factory, or warehouse locations</p>
                  </div>
                </div>
                <span className="text-[12px] font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                  {addresses.length} {addresses.length === 1 ? 'Location' : 'Locations'}
                </span>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-[13px] bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  No address records recorded for this vendor.
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr, index) => (
                    <div
                      key={addr.id || index}
                      className="p-4 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-700">
                          {addr.address_type?.replace('_', ' ') || 'Address'}
                        </span>
                        {addr.is_primary && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Primary Address
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[13px] font-semibold text-gray-800 leading-snug">
                          {addr.address_line || '—'}
                        </p>
                        <p className="text-[12px] text-gray-500">
                          {[
                            addr.city,
                            addr.district,
                            addr.division || addr.state,
                            addr.postal_code || addr.post_office,
                            addr.country || 'Bangladesh',
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN (lg:col-span-6): Contacts, Banks, Documents */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 space-y-6">
            {/* Contact Persons Card */}
            <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1e293b]">Contact Persons</h2>
                    <p className="text-[11px] text-gray-500">Key representatives, account managers, and leads</p>
                  </div>
                </div>
                <span className="text-[12px] font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                  {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}
                </span>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-[13px] bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  No contact persons recorded for this vendor.
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <div
                      key={contact.id || index}
                      className="p-4 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-[14px] flex items-center justify-center shrink-0">
                          {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-bold text-gray-900">{contact.name || 'Unnamed'}</p>
                            {contact.is_primary && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-gray-500">
                            {contact.designation || 'Representative'}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-start sm:items-end gap-1.5 text-[12px]">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            <Phone className="h-3 w-3 text-gray-400" />
                            {contact.phone}
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-gray-600 hover:text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            <Mail className="h-3 w-3 text-gray-400" />
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bank Accounts Card */}
            <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1e293b]">Bank & Settlement Accounts</h2>
                    <p className="text-[11px] text-gray-500">Corporate settlement and bank payment details</p>
                  </div>
                </div>
                <span className="text-[12px] font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                  {bankAccounts.length} {bankAccounts.length === 1 ? 'Account' : 'Accounts'}
                </span>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-[13px] bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  No bank accounts configured for this vendor.
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((bank, index) => (
                    <div
                      key={bank.id || index}
                      className="p-4 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-gray-900">{bank.bank_name}</span>
                          {bank.branch_name && (
                            <span className="text-[11px] text-gray-500">({bank.branch_name})</span>
                          )}
                        </div>
                        {bank.is_primary && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Primary
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                            Account Name
                          </span>
                          <span className="font-medium text-gray-800">{bank.account_name}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                            Account Number
                          </span>
                          <span className="font-mono font-bold text-gray-900">
                            {bank.account_no || bank.account_number || '—'}
                          </span>
                        </div>

                        {(bank.routing_no || bank.routing_number || bank.swift_code) && (
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                              Routing / SWIFT
                            </span>
                            <span className="font-mono text-gray-700">
                              {bank.routing_no || bank.routing_number || bank.swift_code}
                            </span>
                          </div>
                        )}

                        {bank.bank_address && (
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                              Branch Address
                            </span>
                            <span className="text-gray-600 truncate block">{bank.bank_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compliance Documents Card */}
            <div className="bg-white rounded-xl border border-primary/20 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1e293b]">Compliance Documents & KYC</h2>
                    <p className="text-[11px] text-gray-500">Digital certificates and verification status</p>
                  </div>
                </div>
                <span className="text-[12px] font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                  {documents.length} {documents.length === 1 ? 'File' : 'Files'}
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-[13px] bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  No compliance documents recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id || index}
                      className="p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-gray-900">
                            {doc.document_type?.name || doc.document_name || `Certificate #${index + 1}`}
                          </span>
                          {doc.document_type?.is_required ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Required
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                              Optional
                            </span>
                          )}
                          {doc.is_verified ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          {doc.expire_at || doc.expiry_date ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              Expires: {formatDate((doc.expire_at || doc.expiry_date)!)}
                            </span>
                          ) : (
                            <span>No Expiry Date</span>
                          )}
                        </div>
                      </div>

                      <div>
                        {doc.document_url || doc.file_path ? (
                          <a
                            href={doc.document_url || doc.file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary text-primary rounded-lg text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            <span>View Document</span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400">No file link</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blacklist / Disciplinary History (if any) */}
            {blacklists.length > 0 && (
              <div className="bg-white rounded-xl border border-rose-300 p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-medium text-rose-900">Blacklist & Disciplinary History</h2>
                    <p className="text-[11px] text-rose-600">Disciplinary actions and restriction records</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {blacklists.map((bl) => (
                    <div key={bl.id} className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 text-[12px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800">{bl.reason}</span>
                        {bl.created_at && (
                          <span className="text-rose-600 text-[11px]">{formatDate(bl.created_at)}</span>
                        )}
                      </div>
                      {bl.remarks && <p className="text-rose-700">{bl.remarks}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status / Approval Modal */}
      <VendorApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        vendor={vendor}
        initialStatus={vendor?.status}
      />
    </div>
  )
}
