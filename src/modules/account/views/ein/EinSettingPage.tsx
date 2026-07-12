import { useState, useEffect } from 'react'
import { 
  Check, 
  Loader2,
  Info,
  AlertTriangle,
  ExternalLink,
  Lightbulb
} from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from '@tanstack/react-router'
import { 
  useGetVatTaxSetting, 
  useSaveVatTaxSetting
} from '../../hooks/useEin'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import EiinBgImage from '@/assets/images/eiin_bg.jpg'

export const EinSettingPage = () => {
  // API calls
  const { data: vatData, isLoading: isVatLoading } = useGetVatTaxSetting()
  const { mutate: saveVatSetting, isPending: isSavingVat } = useSaveVatTaxSetting()

  // State for Fixed/Dynamic Setting
  const [isFixed, setIsFixed] = useState<number | null>(null)

  // Set default values when vatData is loaded
  useEffect(() => {
    if (vatData?.data) {
      setIsFixed(vatData.data.fixed_tax === 1 ? 1 : 0)
    }
  }, [vatData])

  const handleVatSave = () => {
    if (isFixed === null) return
    saveVatSetting(isFixed)
  }

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts' as any, active: false },
    { name: 'Report', to: '/account/reports' as any, active: false },
    { name: 'EIN', to: '/account/ein-setting' as any, active: true },
  ]

  const titleOptions = [
    { name: 'EIN Setting', to: '/account/ein-setting' as any },
    { name: 'EIN Number Settings', to: '/account/ein-number-settings' as any },
  ]

  return (
    <ListPageLayout<any>
      title="EIN Setting"
      titleOptions={titleOptions}
      backTo="/account/chart-of-accounts"
      tabs={tabs}
      showSearch={false}
      showStatusFilter={false}
      showColumnFilter={false}
      columns={[]}
      onColumnToggle={() => {}}
      rowData={[]}
      columnDefs={[]}
      isLoading={isVatLoading}
      hideFilterRow={true}
      disableCard={true}
    >
      <div className="space-y-6 font-poppins">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Left Column: Radio Selections */}
          <div className="lg:col-span-7 bg-white p-6 flex flex-col gap-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-2">
              <h3 className="text-[22px] font-bold text-primary tracking-tight">
                EIN Configuration
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Select the Employer Identification Number calculation logic for your transactions.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Fixed EIN Option */}
              <div 
                onClick={() => setIsFixed(1)}
                className={clsx(
                  "flex items-start gap-4 p-6 rounded-2xl border cursor-pointer transition-all select-none bg-white",
                  isFixed === 1 
                    ? "border-primary border-2 shadow-md" 
                    : "border-slate-200 border hover:border-slate-300"
                )}
              >
                <div className="mt-1">
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isFixed === 1 ? "border-primary" : "border-slate-300"
                  )}>
                    {isFixed === 1 && (
                      <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-slate-800">Fixed EIN</span>
                    <span className="bg-blue-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                      Recommended for Retail
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-500 mt-2 font-medium">
                    Individual Product & service EIN. Set EIN value manually from the product & service add screen.
                  </p>
                  
                  {/* Info Box */}
                  <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 mt-4 flex items-center gap-2.5 text-[12px] text-primary font-semibold">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Dynamic EIN logic will not apply to these items.</span>
                  </div>
                </div>
              </div>

              {/* Dynamic EIN Option */}
              <div 
                onClick={() => setIsFixed(0)}
                className={clsx(
                  "flex items-start gap-4 p-6 rounded-2xl border cursor-pointer transition-all select-none bg-white",
                  isFixed === 0 
                    ? "border-primary border-2 shadow-md" 
                    : "border-slate-200 border hover:border-slate-300"
                )}
              >
                <div className="mt-1">
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isFixed === 0 ? "border-primary" : "border-slate-300"
                  )}>
                    {isFixed === 0 && (
                      <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-slate-800">Dynamic EIN</span>
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                      Multi-Tax Support
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-500 mt-2 font-medium">
                    Global EIN applied automatically across all products & services. Requires configuration of multiple taxes from EIN setting.
                  </p>
                  
                  {/* Warning Box */}
                  <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 mt-4 flex items-center gap-2.5 text-[12px] text-amber-700 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Fixed EIN values on individual items will be ignored.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Explanations / Notes */}
          <div className="lg:col-span-5 p-6 bg-white flex flex-col gap-4 rounded-2xl border border-slate-200 shadow-sm">
            
            {/* Compliance Update Card */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white flex flex-col shadow-sm">
              <img 
                src={EiinBgImage} 
                alt="Compliance Hallway" 
                className="w-full h-[150px] object-cover"
              />
              <div className="p-6 flex flex-col gap-3">
                <h4 className="text-[16px] font-bold text-primary">
                  Compliance Update
                </h4>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                  Ensure your EIN settings align with the 2024 Corporate Transparency Act requirements. Changes here will affect all future invoices and purchase orders.
                </p>
                <a 
                  href="#" 
                  className="text-primary hover:underline font-bold text-[13px] inline-flex items-center gap-1.5 mt-2 cursor-pointer"
                >
                  Read documentation
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Choosing the Right Method Card */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-[#f8fafc] flex gap-4 items-start shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h5 className="text-[14px] font-bold text-slate-700">
                  Choosing the right method?
                </h5>
                <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                  Fixed EIN is best when your inventory has varied tax structures per item. Dynamic EIN is more efficient for organizations with uniform tax applications across their entire catalog.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Action bar */}
        <div className="flex justify-end items-center gap-4 border-t border-slate-100">
          <Link
            to="/account/chart-of-accounts"
            className="px-12 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm flex items-center justify-center"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleVatSave}
            disabled={isSavingVat || isFixed === null}
            className="px-16 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px]"
          >
            {isSavingVat ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" strokeWidth={3} />
            )}
            {isSavingVat ? 'PROCESSING...' : 'Save'}
          </button>
        </div>
      </div>
    </ListPageLayout>
  )
}
