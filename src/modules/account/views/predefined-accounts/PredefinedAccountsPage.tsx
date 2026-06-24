import { useEffect, useMemo } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { 
  Landmark, 
  Package, 
  FileText, 
  Network, 
  Wallet, 
  Info, 
  Check,
  Settings2,
  ArrowLeft
} from 'lucide-react'
import { LoadingState } from '@/components/Loading/LoadingState'
import { Select2 } from '@/components/Select/Select2'
import { PageTitleDropdown } from '@/components/Dropdown/PageTitleDropdown'
import { 
  useGetPredefinedAccounts, 
  useSavePredefinedAccounts 
} from '../../hooks/usePredefinedAccounts'
import { clsx } from 'clsx'

// Exact label mapping to match the database fields and design specifications
const LABEL_MAP: Record<string, string> = {
  cash_code: 'Cash code',
  bank_code: 'Bank code',
  fixed_asset: 'Fixed Asset',
  advance: 'Advance',
  purchase_code: 'Purchase code',
  sales_code: 'Sales code',
  inventory_code: 'Inventory Code',
  costs_of_good_solds: 'Costs of goods solds',
  vat: 'Vat',
  tax: 'Tax',
  prov_state_tax: 'Prov state tax',
  state_tax: 'State tax',
  customer_code: 'Customer code',
  supplier_code: 'Supplier code',
  service_code: 'Service code',
  CPL_code: 'CPL code',
  LPL_Code: 'LPL code',
  salary_code: 'Salary code',
  emp_npf_contribution: 'Emp NPF contribution',
  empr_npf_contribution: 'Empr NPF contribution',
  emp_icf_contribution: 'Emp ICF contribution',
  empr_icf_contribution: 'Empr ICF contribution',
  prov_npf_code: 'Prov NPF code',
}

const formatLabel = (field: string) => {
  if (field === 'CPL_code') return 'CPL code'
  if (field === 'LPL_Code') return 'LPL code'
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

// Visual groups as defined in the high-fidelity mockup
const GROUPS = [
  {
    id: 'core',
    title: 'Core Accounts',
    subtitle: 'Primary liquidity and asset codes',
    icon: Landmark,
    iconColor: 'text-[#1e4ba1]',
    iconBgColor: 'bg-blue-50',
    fields: ['cash_code', 'bank_code', 'fixed_asset', 'advance']
  },
  {
    id: 'inventory_sales',
    title: 'Inventory & Sales',
    subtitle: 'Operations and logistics mappings',
    icon: Package,
    iconColor: 'text-[#e28743]',
    iconBgColor: 'bg-orange-50',
    fields: ['purchase_code', 'sales_code', 'inventory_code', 'costs_of_good_solds']
  },
  {
    id: 'tax_statutory',
    title: 'Tax & Statutory',
    subtitle: 'Regulatory compliance codes',
    icon: FileText,
    iconColor: 'text-[#ef4444]',
    iconBgColor: 'bg-rose-50',
    fields: ['vat', 'tax', 'prov_state_tax', 'state_tax']
  },
  {
    id: 'relationship',
    title: 'Relationship Ledgers',
    subtitle: 'Default AR/AP and specialized service codes',
    icon: Network,
    iconColor: 'text-[#4f46e5]',
    iconBgColor: 'bg-indigo-50',
    fields: ['customer_code', 'supplier_code', 'service_code', 'CPL_code', 'LPL_Code']
  },
  {
    id: 'payroll_benefits',
    title: 'Payroll & Benefits',
    subtitle: 'Employee-related ledger lines',
    icon: Wallet,
    iconColor: 'text-[#10b981]',
    iconBgColor: 'bg-emerald-50',
    fields: [
      'salary_code', 
      'emp_npf_contribution', 
      'empr_npf_contribution', 
      'emp_icf_contribution', 
      'empr_icf_contribution', 
      'prov_npf_code'
    ],
    isTwoColumn: true
  }
]

export const PredefinedAccountsPage = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useGetPredefinedAccounts()
  const { mutate: savePredefined, isPending: isSaving } = useSavePredefinedAccounts()

  const { handleSubmit, control, reset } = useForm<Record<string, string>>()

  // Reset form when backend values are fetched successfully
  useEffect(() => {
    if (data?.fieldValues) {
      reset(data.fieldValues)
    }
  }, [data, reset])

  // Extract all heads from backend into options suitable for Select2
  const selectOptions = useMemo(() => {
    if (!data?.allHeads) return []
    return Object.entries(data.allHeads).map(([code, name]) => ({
      value: code,
      label: name
    }))
  }, [data])

  // Filter out any fields that are not in the predefined hardcoded groups to render them in "Other Accounts"
  const otherFields = useMemo(() => {
    if (!data?.fieldNames) return []
    const groupedFields = new Set(GROUPS.flatMap(g => g.fields))
    return data.fieldNames.filter(name => 
      !groupedFields.has(name) && 
      !['id', 'uuid', 'organization_id', 'company_id', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(name)
    )
  }, [data])

  const onSubmit = (formData: Record<string, string>) => {
    if (!data?.fieldNames) return

    // Build the payload by only including valid columns
    const payload: Record<string, string> = {}
    data.fieldNames.forEach(field => {
      if (!['id', 'uuid', 'organization_id', 'company_id', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(field)) {
        payload[field] = formData[field] || ''
      }
    })

    savePredefined(payload)
  }

  const handleCancel = () => {
    navigate({ to: '/account/chart-of-accounts' })
  }

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts', active: true },
    { name: 'Report', to: '/account/reports', active: false },
    { name: 'EIN', to: '/account/ein', active: false },
  ]

  const navOptions = [
    { name: 'Chart of Accounts', to: '/account/chart-of-accounts' },
    { name: 'Account Sub Type', to: '/account/sub-type' },
    { name: 'Sub Account Manage', to: '/account/sub-account' },
    { name: 'Predefined Accounts', to: '/account/predefined-accounts' },
    { name: 'Financial Year Manage', to: '/account/financial-year' },
    { name: 'Opening Balance', to: '/account/opening-balance' },
    { name: 'Debit Voucher', to: '/account/voucher/debit' },
    { name: 'Credit Voucher', to: '/account/voucher/credit' },
    { name: 'Contra Voucher', to: '/account/voucher/contra' },
    { name: 'Journal Voucher', to: '/account/voucher/journal' },
    { name: 'Bank Reconciliation', to: '/account/bank-reconciliation' },
    { name: 'Payment Method', to: '/account/payment-method' },
    { name: 'Vendor Payment', to: '/account/vendor-payment' },
    { name: 'Merchant Receive', to: '/account/merchant-receive' },
    { name: 'Service Payment', to: '/account/service-payment' },
    { name: 'Cash Adjustment', to: '/account/cash-adjustment' },
    { name: 'Voucher Approval', to: '/account/voucher-approval' },
  ]

  return (
    <div className="space-y-6 pb-12 font-poppins">
      {/* ── 1. Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/account/chart-of-accounts"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          
          <PageTitleDropdown title="Predefined Accounts" options={navOptions} />
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-3">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.to}
              className={clsx(
                'px-2 py-2 text-[10px] font-medium rounded-lg transition-all duration-200',
                tab.active
                  ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white text-gray-500 border border-gray-50 hover:bg-gray-50 shadow-sm'
              )}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ── 2. Content Form ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="min-h-[500px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6">
          <LoadingState message="Loading Predefined Accounts..." />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-poppins">
          {/* Main 5-Card Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Render the 5 core groups */}
            {GROUPS.map(group => {
              const Icon = group.icon
              
              // Check if any fields in the group actually exist in the database's schema
              const activeGroupFields = group.fields.filter(f => data?.fieldNames.includes(f))
              if (activeGroupFields.length === 0) return null

              const isPayroll = group.id === 'payroll_benefits'
              return (
                <div 
                  key={group.id} 
                  className={clsx(
                    "bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 flex flex-col transition-all duration-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]",
                    isPayroll ? "lg:col-span-8 self-start w-full" : "h-full",
                    group.isTwoColumn ? "lg:col-span-8" : "lg:col-span-4"
                  )}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-all", group.iconBgColor)}>
                        <Icon className={clsx("h-5 w-5", group.iconColor)} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-[#1e293b] font-poppins tracking-tight">
                          {group.title}
                        </h3>
                        <p className="text-[11px] text-[#94a3b8] font-poppins font-medium">
                          {group.subtitle}
                        </p>
                      </div>
                    </div>
                    <Info className="h-4 w-4 text-gray-300 cursor-pointer hover:text-gray-400 transition-colors" />
                  </div>

                  {/* Group Fields */}
                  <div className={clsx(
                    "flex-1",
                    group.isTwoColumn 
                      ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" 
                      : "space-y-4"
                  )}>
                    {activeGroupFields.map(field => (
                      <div key={field} className="flex flex-col">
                        <label className="text-[13px] font-medium text-[#475569] mb-1.5 block font-poppins">
                          {LABEL_MAP[field] || formatLabel(field)} <span className="text-rose-500">*</span>
                        </label>
                        <Controller
                          name={field}
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Select2
                              options={selectOptions}
                              value={value || ''}
                              onChange={(val) => onChange(val)}
                              placeholder={LABEL_MAP[field] || 'Select Account'}
                            />
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Dynamic General/Other Accounts Card for unexpected fields */}
            {otherFields.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 flex flex-col h-full lg:col-span-12">
                {/* Group Header */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Settings2 className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#1e293b] font-poppins tracking-tight">
                        Other Accounts
                      </h3>
                      <p className="text-[11px] text-[#94a3b8] font-poppins font-medium">
                        Additional system account mappings
                      </p>
                    </div>
                  </div>
                  <Info className="h-4 w-4 text-gray-300 cursor-pointer hover:text-gray-400 transition-colors" />
                </div>

                {/* Group Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {otherFields.map(field => (
                    <div key={field} className="flex flex-col">
                      <label className="text-[13px] font-medium text-[#475569] mb-1.5 block font-poppins">
                        {formatLabel(field)} <span className="text-rose-500">*</span>
                      </label>
                      <Controller
                        name={field}
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <Select2
                            options={selectOptions}
                            value={value || ''}
                            onChange={(val) => onChange(val)}
                            placeholder="Select Account"
                          />
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Standardized Bottom Action Buttons Row */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 h-10 rounded-lg hover:bg-gray-50 transition-all shadow-sm bg-white text-[#64748b] border border-gray-200 text-[13px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 h-10 text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-[13px]"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
