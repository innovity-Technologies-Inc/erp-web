import { useState, useEffect, useMemo } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useUiStore } from '@/store/useUiStore'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { Select2 } from '@/components/Select/Select2'
import { DateRangePicker } from '@/components/DateRangePicker/DateRangePicker'
import { useBankReconciliationData, useSaveBankReconciliation, useBankAccountsSelect2 } from '../../hooks/useBankReconciliation'

export const BankReconciliationPage = () => {
  const { currency, currencyPosition } = useSettings()
  const notify = useUiStore((state) => state.notify)

  // Local-safe date generators
  const getFirstDayOfMonth = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}-01`
  }
  const getToday = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Filter & Search States
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth())
  const [toDate, setToDate] = useState(getToday())
  const [bankCode, setBankCode] = useState('')

  // Query parameters state
  const [queryParams, setQueryParams] = useState({
    fromDate: getFirstDayOfMonth(),
    toDate: getToday(),
    bankCode: '',
    status: 0
  })

  // Checked item v_no list state
  const [selectedVoucherNos, setSelectedVoucherNos] = useState<string[]>([])

  // Fetch data
  const { data: rawResponse, isLoading } = useBankReconciliationData(queryParams)
  const { mutate: saveReconciliation, isPending: isSaving } = useSaveBankReconciliation()
  const { data: bankOptions = [] } = useBankAccountsSelect2()

  const vouchers = rawResponse?.data?.vouchers || []

  // Initialize selected checklist when query succeeds
  useEffect(() => {
    if (vouchers.length > 0) {
      const honoured = vouchers.filter(v => v.is_honour === 1).map(v => v.v_no)
      setSelectedVoucherNos(honoured)
    } else {
      setSelectedVoucherNos([])
    }
  }, [vouchers])

  // Sync date range query params on change
  const handleDateRangeChange = (start: string, end: string) => {
    setFromDate(start || '')
    setToDate(end || '')
    setQueryParams(prev => ({
      ...prev,
      fromDate: start || getFirstDayOfMonth(),
      toDate: end || getToday()
    }))
  }

  // Sync bank selection on change
  const handleBankChange = (val: string) => {
    setBankCode(val)
    setQueryParams(prev => ({
      ...prev,
      bankCode: val
    }))
  }

  // Client-side search filter
  const filteredVouchers = useMemo(() => {
    if (!vouchers) return []
    const term = search.toLowerCase().trim()
    if (!term) return vouchers

    return vouchers.filter(v => 
      v.v_no.toLowerCase().includes(term) ||
      (v.v_type && v.v_type.toLowerCase().includes(term)) ||
      (v.account_name && v.account_name.toLowerCase().includes(term)) ||
      (v.cheque_no && v.cheque_no.toLowerCase().includes(term)) ||
      (v.narration && v.narration.toLowerCase().includes(term))
    )
  }, [vouchers, search])

  const handleToggleItem = (v_no: string) => {
    setSelectedVoucherNos(prev => 
      prev.includes(v_no) ? prev.filter(no => no !== v_no) : [...prev, v_no]
    )
  }

  const handleToggleAll = () => {
    if (selectedVoucherNos.length === filteredVouchers.length) {
      setSelectedVoucherNos([])
    } else {
      setSelectedVoucherNos(filteredVouchers.map(v => v.v_no))
    }
  }

  const handleSave = () => {
    if (selectedVoucherNos.length === 0) {
      notify('Please select at least one voucher to reconcile.', 'error')
      return
    }
    const items = selectedVoucherNos.map(v_no => ({ v_no }))
    saveReconciliation(items, {
      onSuccess: () => {
        notify('Reconciliation Completed!', 'success')
      },
      onError: (err: any) => {
        notify(err?.message || 'Failed to complete reconciliation.', 'error')
      }
    })
  }

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

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts', active: true },
    { name: 'Report', to: '/account/reports', active: false },
    { name: 'EIN', to: '/account/ein', active: false },
  ]

  // Render Select2 as the left toolbar extra component
  const toolbarExtraComponent = (
    <div className="relative shrink-0 min-w-[220px] z-50">
      <Select2
        options={[
          { value: '', label: 'All Bank Accounts' },
          ...bankOptions.map(bank => ({ value: bank.id, label: bank.text }))
        ]}
        value={bankCode}
        onChange={handleBankChange}
        placeholder="Select Bank Account"
        rounded="full"
        variant="solid"
      />
    </div>
  )

  return (
    <ListPageLayout<any>
      title="Bank Reconciliation"
      titleOptions={navOptions}
      tabs={tabs}
      backTo="/account/chart-of-accounts"
      showSearch={true}
      searchValue={search}
      onSearchChange={setSearch}
      showColumnFilter={false}
      toolbarExtra={toolbarExtraComponent}
      toolbarRightExtra={
        <DateRangePicker 
          from={fromDate}
          to={toDate}
          onChange={handleDateRangeChange}
        />
      }
      rowData={[]}
      columnDefs={[]}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-gray-500">Loading vouchers...</span>
        </div>
      ) : filteredVouchers.length > 0 ? (
        <div className="space-y-6">
          <div className="overflow-x-auto border border-primary/20 rounded-xl shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-gray-600">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-100">
                  <th className="px-4 py-3 text-center text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider w-[50px] font-poppins">SL</th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider font-poppins">Voucher No</th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider font-poppins">Voucher Type</th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider font-poppins">Particulars</th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider font-poppins">Check No</th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider font-poppins">Date</th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider font-poppins">Remark</th>
                  <th className="px-4 py-3 text-right text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider font-poppins">Amount</th>
                  <th className="px-4 py-3 text-left text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider min-w-[120px] font-poppins">
                    <div className="flex items-center justify-start pl-6 gap-2">
                      <input 
                        type="checkbox"
                        checked={selectedVoucherNos.length === filteredVouchers.length && filteredVouchers.length > 0}
                        onChange={handleToggleAll}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                      />
                      <span>Mark All</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((item, index) => {
                  const amountVal = parseFloat(item.debit) || parseFloat(item.credit) || 0
                  const formattedAmount = currencyPosition === 'left'
                    ? `${currency} ${amountVal.toFixed(2)}`
                    : `${amountVal.toFixed(2)} ${currency}`

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-center text-gray-400 font-semibold">{index + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">{item.v_no}</td>
                      <td className="px-4 py-3.5 font-medium">{item.v_type}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{item.account_name}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-500">{item.cheque_no || '-'}</td>
                      <td className="px-4 py-3.5 text-gray-500">{item.cheque_date || '-'}</td>
                      <td className="px-4 py-3.5 text-gray-500 italic max-w-[200px] truncate">
                        {item.narration ? `"${item.narration}"` : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-gray-900">{formattedAmount}</td>
                      <td className="px-4 py-3.5 text-left">
                        <div className="flex items-center justify-start pl-6 gap-2">
                          <input 
                            type="checkbox"
                            checked={selectedVoucherNos.includes(item.v_no)}
                            onChange={() => handleToggleItem(item.v_no)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                          />
                          <span className="text-[12px] font-semibold text-gray-500">Mark</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-[#0d7a50] hover:bg-[#0a6642] text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-md shadow-emerald-900/10 disabled:opacity-50 h-[38px] cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reconciling...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Reconciliation</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <span className="text-sm font-medium">No Data Found</span>
        </div>
      )}
    </ListPageLayout>
  )
}
