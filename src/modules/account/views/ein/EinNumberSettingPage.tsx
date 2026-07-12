import { useState, useEffect } from 'react'
import { 
  Check, 
  Loader2, 
  FileText,
  Info
} from 'lucide-react'
import { 
  useGetTaxSetting, 
  useUpdateTaxSetting 
} from '../../hooks/useEin'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useUiStore } from '@/store/useUiStore'
import { Link } from '@tanstack/react-router'
import { Select2 } from '@/components/Select/Select2'

interface TaxRow {
  tax_name: string
  default_value: number
  reg_no: string
  is_show: boolean
}

export const EinNumberSettingPage = () => {
  // API calls
  const { data: taxData, isLoading: isTaxLoading } = useGetTaxSetting()
  const { mutate: updateTaxSetting, isPending: isSavingTax } = useUpdateTaxSetting()
  const { showNotificationModal } = useUiStore()

  // State for Dynamic Tax list
  const [numberOfTax, setNumberOfTax] = useState<number>(0)
  const [taxRows, setTaxRows] = useState<TaxRow[]>([])

  // Set default values when taxData is loaded
  useEffect(() => {
    if (taxData?.data) {
      const rows = taxData.data.map(item => ({
        tax_name: item.tax_name || '',
        default_value: item.default_value || 0,
        reg_no: item.reg_no || '',
        is_show: item.is_show === 1,
      }))
      setTaxRows(rows)
      setNumberOfTax(rows.length)
    }
  }, [taxData])

  const handleNumberOfTaxChange = (num: number) => {
    const nextNum = Math.max(0, num)
    setNumberOfTax(nextNum)
    setTaxRows(prev => {
      if (nextNum > prev.length) {
        const diff = nextNum - prev.length
        const extra = Array.from({ length: diff }, () => ({
          tax_name: '',
          default_value: 0,
          reg_no: '',
          is_show: false
        }))
        return [...prev, ...extra]
      } else {
        return prev.slice(0, nextNum)
      }
    })
  }

  const updateRowField = (index: number, field: keyof TaxRow, value: any) => {
    setTaxRows(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }

  const handleTaxSave = () => {
    if (taxRows.length === 0) return

    for (let i = 0; i < taxRows.length; i++) {
      const row = taxRows[i]
      if (!row.tax_name.trim()) {
        showNotificationModal('Warning!', `Tax Name ${i + 1} is required.`, 'warning')
        return
      }
      if (row.default_value < 0) {
        showNotificationModal('Warning!', `Default Value for Tax ${i + 1} cannot be negative.`, 'warning')
        return
      }
      if (!row.reg_no.trim()) {
        showNotificationModal('Warning!', `Registration No for Tax ${i + 1} is required.`, 'warning')
        return
      }
    }

    const payload = {
      nt: numberOfTax,
      taxfield: taxRows.map(r => r.tax_name),
      default_value: taxRows.map(r => r.default_value),
      reg_no: taxRows.map(r => r.reg_no),
      is_show: taxRows.map(r => r.is_show ? 1 : 0)
    }

    updateTaxSetting(payload)
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
      title="EIN Number Settings"
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
      isLoading={isTaxLoading}
      hideFilterRow={true}
      disableCard={true}
    >
      <div className="space-y-6 font-poppins">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Left Column: Input Form (from input_side.png) */}
          <div className="lg:col-span-9 border border-slate-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            
            {/* Number of EIN Input Section */}
            <div className="flex flex-col gap-1.5 max-w-[320px]">
              <label className="text-[13px] font-semibold text-slate-700">
                Number of EIN <span className="text-red-500">*</span>
              </label>
              <Select2
                options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
                value={numberOfTax}
                onChange={(val) => handleNumberOfTaxChange(Number(val))}
                placeholder="Select Number"
              />
              <span className="text-[11px] text-slate-400 font-medium">
                Define the number of unique EINs for your entities
              </span>
            </div>

            {/* Table Container */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white mt-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 bg-[#dce9ff] px-6 py-3 border-b border-slate-200 text-slate-700 text-[12px] font-bold uppercase tracking-wider">
                <div className="col-span-4">Tax Name <span className="text-red-500">*</span></div>
                <div className="col-span-3">Default Value <span className="text-red-500">*</span></div>
                <div className="col-span-3">Reg No</div>
                <div className="col-span-2 text-center">Visiblity</div>
              </div>

              {/* Table Rows */}
              {taxRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <FileText className="w-10 h-10 text-slate-300 animate-pulse" />
                  <span className="text-[13px] font-bold">No global tax records configured.</span>
                  <span className="text-[11px]">Select a number of EINs above to add records.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 p-6 space-y-4">
                  {taxRows.map((row, index) => (
                    <div key={`tax-row-${index}`} className="grid grid-cols-12 gap-4 items-center pt-4 first:pt-0">
                      {/* Tax name */}
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder={`Tax Name ${index + 1}`}
                          value={row.tax_name}
                          onChange={(e) => updateRowField(index, 'tax_name', e.target.value)}
                          className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569]"
                        />
                      </div>

                      {/* Default rate */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Default Value"
                          value={row.default_value || ''}
                          onChange={(e) => updateRowField(index, 'default_value', parseFloat(e.target.value) || 0)}
                          className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-bold text-slate-700"
                        />
                      </div>

                      {/* Registration No */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="Reg No"
                          value={row.reg_no}
                          onChange={(e) => updateRowField(index, 'reg_no', e.target.value)}
                          className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-[#475569]"
                        />
                      </div>

                      {/* Show Checkbox */}
                      <div className="col-span-2 flex items-center justify-center">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={row.is_show}
                            onChange={(e) => updateRowField(index, 'is_show', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary animate-none"
                          />
                          <span className="text-[11px] font-bold text-slate-500 uppercase">SHOW</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Configuration Help Card (from help_side.png) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col gap-6 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <h4 className="text-[16px] font-bold text-slate-800">
                  Configuration Help
                </h4>
              </div>

              <div className="flex flex-col gap-5">
                {/* Item 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[12px] font-bold text-blue-600 shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                    Ensure the EIN count matches your legal registered entities.
                  </p>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[12px] font-bold text-blue-600 shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                    Tax names should be unique for clear reporting and ledger mapping.
                  </p>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[12px] font-bold text-blue-600 shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                    Toggle Visibility to control which tax numbers appear on invoices and public documents.
                  </p>
                </div>
            </div>
          </div>

          {/* Bottom Action buttons */}
            <div className="flex items-center gap-4 justify-between mt-2">
              <Link
                to="/account/chart-of-accounts"
                className="flex-1 h-12 bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[16px] shadow-sm flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleTaxSave}
                disabled={isSavingTax || taxRows.length === 0}
                className="flex-1 h-12 bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50 text-[16px]"
              >
                {isSavingTax ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" strokeWidth={3} />
                )}
                {isSavingTax ? 'PROCESSING...' : 'Save'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </ListPageLayout>
  )
}

