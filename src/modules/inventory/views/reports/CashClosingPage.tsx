import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Info, Check, MapPin, RefreshCw, Building2 } from 'lucide-react'
import { PageTitleDropdown } from '@/components/Dropdown/PageTitleDropdown'
import { cashReportOptions, reportCategoryTabs } from './constants'
import { useCashClosingData, useSaveCashClosing } from '../../hooks/useReports'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency } from '@/utils/formatters'
import { clsx } from 'clsx'
import { LoadingState } from '@/components/Loading/LoadingState'

const DENOMINATIONS = [2000, 1000, 500, 100, 50, 20, 10, 5, 2, 1]

// Icons
const WalletIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
const PiggyBankIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.5-1 2-1.5L20 12V5Z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>
const ZapIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const LandmarkIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
const ArrowRightLeftIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
const CreditCardIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>

const getMethodIcon = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('cash in hand')) return <div className="text-blue-600 bg-blue-100 p-1.5 rounded-md"><WalletIcon className="h-4 w-4" /></div>
  if (n.includes('petty')) return <div className="text-orange-600 bg-orange-100 p-1.5 rounded-md"><PiggyBankIcon className="h-4 w-4" /></div>
  if (n.includes('zelle')) return <div className="text-indigo-600 bg-indigo-100 p-1.5 rounded-md"><ZapIcon className="h-4 w-4" /></div>
  if (n.includes('bank')) return <div className="text-slate-600 bg-slate-100 p-1.5 rounded-md"><LandmarkIcon className="h-4 w-4" /></div>
  if (n.includes('ach')) return <div className="text-gray-600 bg-gray-100 p-1.5 rounded-md"><ArrowRightLeftIcon className="h-4 w-4" /></div>
  if (n.includes('credit')) return <div className="text-slate-600 bg-slate-100 p-1.5 rounded-md"><CreditCardIcon className="h-4 w-4" /></div>
  return <div className="text-blue-600 bg-blue-100 p-1.5 rounded-md"><WalletIcon className="h-4 w-4" /></div>
}

export const CashClosingPage = () => {
  const { currency, currencyPosition, companyInformation, webSetting } = useSettings()
  const { data: closingData, isLoading } = useCashClosingData()
  const { mutate: saveClosing, isPending: isSaving } = useSaveCashClosing()

  // Extract data with fallbacks
  const rawData = (closingData as any)?.data || closingData
  const companyInfo = rawData?.company_info || {}
  const payMethods = rawData?.pay_methods || []
  const allTotalIn = rawData?.all_total_in || {}
  const allTotalOut = rawData?.all_total_out || {}

  // State for closing accounts (opening balances)
  const [openingBalances, setOpeningBalances] = useState<Record<number, string>>({})
  
  // State for cash calculator (pieces per denomination)
  const [cashPcs, setCashPcs] = useState<Record<number, string>>({})

  // Format Helper
  const formatVal = (val: number | string) => formatCurrency(val, currency, currencyPosition).replace(currency, '').trim()

  const handleOpeningBalanceChange = (methodId: number, value: string) => {
    // Basic number validation
    if (!/^\d*\.?\d*$/.test(value) && value !== '') return;
    setOpeningBalances(prev => ({ ...prev, [methodId]: value }))
  }

  const handleSaveClosing = (methodId: number, headCode: string) => {
    const opening_bal = openingBalances[methodId] || '0'
    const total_received = allTotalIn[methodId] || 0
    const total_paid = allTotalOut[methodId] || 0
    const closing = (parseFloat(opening_bal) || 0) + parseFloat(total_received) - parseFloat(total_paid)

    saveClosing({
      opening_bal: parseFloat(opening_bal),
      total_received,
      total_paid,
      closing,
      head_code: headCode
    })
  }

  // Cash Calculator total
  const cashCalculatorTotal = useMemo(() => {
    return DENOMINATIONS.reduce((sum, denom) => {
      const pcs = parseFloat(cashPcs[denom] || '0') || 0
      return sum + (pcs * denom)
    }, 0)
  }, [cashPcs])

  const tabs = reportCategoryTabs.map(t => ({ ...t, active: t.name === 'Cash' }))

  return (
    <div className="space-y-6 pb-12 font-poppins">
      {/* ── 1. Page Header (Standardized) ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          
          <PageTitleDropdown title="Closing Account" options={cashReportOptions} />
        </div>

        <div className="flex items-center gap-3">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.to as any}
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

      {isLoading ? (
        <div className="py-20">
          <LoadingState message="Loading cash closing data..." />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* ── 2. Company Info Header ────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div className="flex flex-col gap-3">
              <div className="text-[#1e4ba1]">
                {webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url ? (
                  <img src={webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url || undefined} alt="Logo" className="h-12 object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                      <Building2 className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-[12px] font-medium ml-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{companyInformation?.address || companyInfo.address || 'Company Address'}</span>
              </div>
            </div>
            
            <div className="text-right border-l border-gray-100 pl-8">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-500 text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">CASH CLOSING</span>
              <div className="text-[22px] font-black text-[#1e293b] tracking-tight">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}
              </div>
            </div>
          </div>

          {/* ── 3. Payment Methods Grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payMethods.map((pm: any) => {
              const methodId = pm.id;
              const totalIn = parseFloat(allTotalIn[methodId] || 0);
              const totalOut = parseFloat(allTotalOut[methodId] || 0);
              const opening = parseFloat(openingBalances[methodId] || '0') || 0;
              const closing = opening + totalIn - totalOut;

              return (
                <div key={methodId} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMethodIcon(pm.head_name)}
                      <h3 className="text-[16px] font-bold text-[#1e293b]">{pm.head_name}</h3>
                    </div>
                    <Info className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>
                  
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#475569]">Opening Balance</span>
                      <input 
                        type="text" 
                        value={openingBalances[methodId] || ''}
                        onChange={(e) => handleOpeningBalanceChange(methodId, e.target.value)}
                        className="w-[120px] h-[34px] px-3 bg-white border border-gray-200 rounded-md text-right outline-none focus:border-primary transition-all font-medium text-[#1e293b] text-[13px]"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#475569]">Dis. Amount</span>
                      <div className="w-[120px] h-[34px] px-3 bg-gray-100 rounded-md flex items-center justify-end font-medium text-gray-600 text-[13px]">
                        {formatVal(totalIn)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#475569]">Total Paid</span>
                      <div className="w-[120px] h-[34px] px-3 bg-gray-100 rounded-md flex items-center justify-end font-medium text-gray-600 text-[13px]">
                        {formatVal(totalOut)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[13px] font-semibold text-[#475569]">Closing Balance</span>
                      <div className="w-[120px] h-[34px] px-3 bg-gray-100 rounded-md flex items-center justify-end font-bold text-[#1e293b] text-[13px]">
                        {formatVal(closing)}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button 
                      onClick={() => handleSaveClosing(methodId, pm.head_code)}
                      disabled={isSaving}
                      className="w-full bg-[#187A4F] hover:bg-[#146642] text-white h-[42px] rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-[14px]"
                    >
                      <Check className="h-5 w-5" />
                      Save Section
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── 4. Denomination Detail Table ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#1e4ba1] rounded-lg">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h2 className="text-[18px] font-bold text-[#1e293b]">Denomination Detail (Cash In Hand)</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">CASH GRAND TOTAL</span>
                <span className="text-[22px] font-black text-[#1e4ba1] tracking-tight">{currency}{formatVal(cashCalculatorTotal)}</span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="border border-gray-100 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#1e4ba1] text-[13px] font-bold border-b border-gray-100">
                      <th className="px-4 py-4 border-r border-gray-100 text-gray-600">Note Name</th>
                      {DENOMINATIONS.map(denom => (
                        <th key={denom} className="px-2 py-4 text-center border-r border-gray-100 last:border-r-0">{denom}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[13px]">
                    <tr className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 border-r border-gray-100 text-gray-600 font-semibold">Pieces (Qty)</td>
                      {DENOMINATIONS.map(denom => (
                        <td key={denom} className="px-2 py-3 border-r border-gray-100 last:border-r-0">
                          <input 
                            type="number"
                            min="0"
                            value={cashPcs[denom] || ''}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setCashPcs(prev => ({ ...prev, [denom]: val ? String(val) : '' }))
                            }}
                            className="w-full h-[36px] bg-white border border-gray-200 rounded-md text-center outline-none focus:border-primary transition-all font-medium text-gray-600"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-[#f8fafc]/50">
                      <td className="px-4 py-4 border-r border-gray-100 text-gray-600 font-semibold">Amount ($)</td>
                      {DENOMINATIONS.map(denom => {
                        const pcs = parseFloat(cashPcs[denom] || '0') || 0;
                        const amount = pcs * denom;
                        return (
                          <td key={denom} className="px-2 py-4 border-r border-gray-100 last:border-r-0 text-center">
                            <div className="w-full h-[36px] bg-gray-100 rounded-md flex items-center justify-center font-medium text-gray-600">
                              {formatVal(amount)}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
