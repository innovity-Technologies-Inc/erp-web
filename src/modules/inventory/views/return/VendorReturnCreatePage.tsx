import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Search, Save, Info, Package, AlertCircle, FileText, Check, AlertTriangle } from 'lucide-react'
import { Select2 } from '@/components/Select/Select2'
import { RichEditor } from '@/components/RichEditor/RichEditor'
import { useStoreSupplierReturn } from '../../hooks/useReturn'
import { usePurchaseSelect2, usePurchaseData, usePaymentMethodsSelect2 } from '../../hooks/usePurchases'
import { LoadingState } from '@/components/Loading/LoadingState'
import { useUiStore } from '@/store/useUiStore'
import { formatCurrency } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'
import { clsx } from 'clsx'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'

interface ReturnItem {
  purchase_detail_id: number
  item_id: number
  item_name: string
  purchase_quantity: number
  available_quantity: number
  batch_no: string
  rate: number
  return_quantity: number | ''
  deduction_percent: number | ''
  deduction_value: number
  total: number
  selected: boolean
}

export const VendorReturnCreatePage = () => {
  const navigate = useNavigate()
  const { currency, currencyPosition } = useSettings()
  const { showNotificationModal } = useUiStore()
  
  const [purchaseId, setPurchaseId] = useState<number | string>('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const { data: purchaseOptions = [] } = usePurchaseSelect2(searchTerm)
  const { data: paymentMethods = [] } = usePaymentMethodsSelect2()
  
  const { data: purchaseDataResponse, isLoading: isFetchingPurchase, isError } = usePurchaseData(selectedPurchaseId)
  const { mutate: storeReturn, isPending: isSaving } = useStoreSupplierReturn()

  const [paymentTypeId, setPaymentTypeId] = useState<number | string>('')
  const [items, setItems] = useState<ReturnItem[]>([])
  
  const [primaryCategory, setPrimaryCategory] = useState<string>('')
  const [detailedDescription, setDetailedDescription] = useState<string>('')
  
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  useEffect(() => {
    if (purchaseId) {
      setSelectedPurchaseId(purchaseId)
    } else {
      setSelectedPurchaseId(null)
      setItems([])
    }
  }, [purchaseId])
  
  useEffect(() => {

    if (purchaseDataResponse) {
      const purchase = purchaseDataResponse
      if (!purchase.id) {
        setItems([])
        showNotificationModal('Error', 'Data not found!', 'error')
        return
      }
      
      const newItems = (purchase.product_purchase_details || []).map((detail: any) => ({
        purchase_detail_id: detail.id,
        item_id: detail.product_id,
        item_name: detail.product?.product_name || '',
        purchase_quantity: Number(detail.quantity) || 0,
        available_quantity: Number(detail.batch_product?.available_quantity) || 0,
        batch_no: detail.batch_master?.batch_no || '',
        rate: Number(detail.rate) || 0,
        return_quantity: '',
        deduction_percent: 0,
        deduction_value: 0,
        total: 0,
        selected: false
      }))
      
      setItems(newItems)
    }
  }, [purchaseDataResponse])
  
  const calculateRow = (item: ReturnItem, returnQty: number, dedPercent: number) => {
    const subtotal = returnQty * item.rate
    const dedValue = subtotal * (dedPercent / 100)
    return {
      deduction_value: dedValue,
      total: subtotal - dedValue
    }
  }

  const handleItemChange = (index: number, field: keyof ReturnItem, value: any) => {
    const newItems = [...items]
    const item = newItems[index]
    
    if (field === 'selected') {
      item.selected = value
      if (!value) {
        item.return_quantity = ''
        const calcs = calculateRow(item, 0, Number(item.deduction_percent) || 0)
        item.deduction_value = calcs.deduction_value
        item.total = calcs.total
      }
    } else {
      (item as any)[field] = value
      
      if (field === 'return_quantity' || field === 'deduction_percent') {
        const retQty = field === 'return_quantity' ? Number(value) : Number(item.return_quantity)
        const dedPer = field === 'deduction_percent' ? Number(value) : Number(item.deduction_percent)
        
        if (retQty > item.available_quantity) {
          showNotificationModal('Error', 'Return quantity cannot exceed available quantity!', 'error')
          item.return_quantity = ''
          const calcs = calculateRow(item, 0, dedPer)
          item.deduction_value = calcs.deduction_value
          item.total = calcs.total
        } else {
          const calcs = calculateRow(item, retQty || 0, dedPer || 0)
          item.deduction_value = calcs.deduction_value
          item.total = calcs.total
        }
      }
    }
    
    setItems(newItems)
  }

  const totalDeduction = useMemo(() => {
    return items.filter(i => i.selected).reduce((sum, item) => sum + item.deduction_value, 0)
  }, [items])

  const grandTotal = useMemo(() => {
    return items.filter(i => i.selected).reduce((sum, item) => sum + item.total, 0)
  }, [items])

  const handleSave = () => {
    if (!paymentTypeId) {
      showNotificationModal('Error', 'Please select a payment type', 'error')
      return
    }
    
    const selectedItems = items.filter(i => i.selected)
    if (selectedItems.length === 0) {
      showNotificationModal('Error', 'Please select at least one item to return', 'error')
      return
    }
    
    let hasError = false
    selectedItems.forEach((item, index) => {
      const retQty = Number(item.return_quantity) || 0
      if (retQty <= 0) {
        showNotificationModal('Error', `Row ${index + 1}: Return quantity must be greater than 0`, 'error')
        hasError = true
      }
    })
    
    if (hasError) return

    const payload = {
      purchase_id: selectedPurchaseId,
      payment_type_id: paymentTypeId,
      total_deduction: totalDeduction,
      grand_total: grandTotal,
      items: selectedItems.map(item => ({
        purchase_detail_id: item.purchase_detail_id,
        quantity: item.purchase_quantity,
        rate: item.rate,
        batch_no: item.batch_no,
        return_quantity: Number(item.return_quantity),
        deduction_percent: Number(item.deduction_percent),
        deduction_value: item.deduction_value,
        total: item.total
      }))
    }

    storeReturn(payload)
  }

  const handleDiscard = () => {
    if (items.some(i => i.selected)) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/return/vendor' })
    }
  }

  const purchase = purchaseDataResponse

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/return/vendor"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Return To Vendor</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Return Header */}
        <div className="bg-white rounded-xl border border-primary/10 p-4 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
             <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><FileText className="h-4 w-4" /></div>
             Return Header
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">
                Invoice No <span className="text-rose-500">*</span>
              </label>
              <Select2
                options={purchaseOptions.map((opt: any) => ({ value: opt.id, label: opt.text }))}
                value={purchaseId}
                onChange={setPurchaseId}
                onInputChange={setSearchTerm}
                placeholder="Enter invoice number"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Vendor</label>
              <input 
                type="text" 
                value={purchase?.supplier?.supplier_name || ''} 
                disabled 
                className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-gray-500 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Purchase Date</label>
              <input 
                type="text" 
                value={purchase?.purchase_date || ''} 
                disabled 
                className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-gray-500 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">Chalan No</label>
              <input 
                type="text" 
                value={purchase?.chalan_no || ''} 
                disabled 
                className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none font-medium text-gray-500 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#475569]">
                Payment Type <span className="text-rose-500">*</span>
              </label>
              <Select2 
                options={paymentMethods.map((opt: any) => ({ value: opt.id, label: opt.text }))} 
                value={paymentTypeId} 
                onChange={setPaymentTypeId} 
                placeholder="Select Payment Type" 
              />
            </div>
          </div>
        </div>

        {isFetchingPurchase ? (
          <LoadingState message="Fetching invoice details..." />
        ) : isError ? (
          <div className="bg-white rounded-xl border border-primary/10 p-10 shadow-sm text-center flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <h2 className="text-[18px] font-medium text-rose-500">Error loading data.</h2>
          </div>
        ) : !purchase ? (
          <div className="bg-white rounded-xl border border-primary/10 p-10 shadow-sm text-center flex flex-col items-center">
            <FileText className="w-10 h-10 text-gray-300 mb-2" />
            <h2 className="text-[18px] font-medium text-gray-400">Please Enter Invoice Number and Return Qty to Vendor!</h2>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-primary/10 p-2 shadow-sm">
              <div className="flex items-center justify-between mb-4 px-2 pt-2">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Package className="h-4 w-4" /></div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Return Items</h2>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#dae8ff] text-[12px] font-bold text-[#003671] uppercase tracking-wider text-center">
                      <th className="px-4 py-3 border-b border-gray-200 w-[60px]">Return</th>
                      <th className="px-4 py-3 border-b border-gray-200 text-left">Product Name<span className="text-rose-500">*</span></th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Purchase Qty</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Available Qty</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Batch No</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Return Qty<span className="text-rose-500">*</span></th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Unit Price</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[100px]">Deduction(%)</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Dis. Value</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-medium text-[#475569] bg-white text-center">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No items available</td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-center align-middle">
                            <input
                              type="checkbox"
                              className="w-[20px] h-[20px] text-[#059669] rounded border-gray-300 focus:ring-[#059669] cursor-pointer mx-auto block accent-[#059669]"
                              checked={item.selected}
                              onChange={(e) => handleItemChange(idx, 'selected', e.target.checked)}
                            />
                          </td>
                          <td className="px-4 py-3 text-left">
                            <span className="text-gray-500">{item.item_name}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {item.purchase_quantity}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {item.available_quantity}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {item.batch_no}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={item.return_quantity}
                              onChange={(e) => handleItemChange(idx, 'return_quantity', e.target.value)}
                              disabled={!item.selected}
                              className="w-full h-[34px] px-2 bg-white border border-gray-200 rounded-lg text-center outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {formatCurrency(item.rate, currency, currencyPosition)}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.deduction_percent}
                              onChange={(e) => handleItemChange(idx, 'deduction_percent', e.target.value)}
                              disabled={!item.selected}
                              className="w-full h-[34px] px-2 bg-white border border-gray-200 rounded-lg text-center outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3 text-center text-[#1e4ba1] font-semibold">
                            {formatCurrency(item.deduction_value, currency, currencyPosition)}
                          </td>
                          <td className="px-4 py-3 text-right pr-4 text-[#1e4ba1] font-semibold">
                            {formatCurrency(item.total, currency, currencyPosition)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-start">
              <div className="lg:col-span-8 flex flex-col h-full">
                <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm h-full flex flex-col">
                  <h2 className="text-[16px] font-bold text-[#1e293b] mb-6 flex items-center gap-2">
                    <div className="text-[#1e4ba1]"><AlertTriangle className="h-5 w-5" /></div>
                    Reason for Return
                  </h2>
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#475569]">Primary Category</label>
                      <Select2 
                        options={[
                          {value: 'defective', label: 'Defective Product'}, 
                          {value: 'wrong_item', label: 'Wrong Item Shipped'}, 
                          {value: 'other', label: 'Other'}
                        ]}
                        value={primaryCategory}
                        onChange={setPrimaryCategory}
                        placeholder="Select primary category"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 flex flex-col">
                      <label className="text-[13px] font-semibold text-[#475569]">Detailed Description</label>
                      <div className="flex-1 min-h-[200px]">
                        <RichEditor 
                          value={detailedDescription}
                          onChange={setDetailedDescription}
                          placeholder="Enter special instructions or purchase terms here..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-[#1e4ba1] rounded-xl p-6 shadow-lg text-white">
                  <h3 className="text-[18px] font-medium mb-6 opacity-90 border-b border-white/10 pb-4">Return Summary</h3>
                  <div className="space-y-4 mb-6 text-[14px]">
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Total Items</span>
                      <span className="font-semibold">{items.filter(i => i.selected).length} Products</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Return Quantity</span>
                      <span className="font-semibold">{items.filter(i => i.selected).reduce((sum, item) => sum + (Number(item.return_quantity) || 0), 0)} Units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Subtotal Refund</span>
                      <span className="font-semibold">{formatCurrency(grandTotal + totalDeduction, currency, currencyPosition)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Restocking Fee</span>
                      <span className="font-bold text-rose-300">-{formatCurrency(totalDeduction, currency, currencyPosition)}</span>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-white/20 flex justify-between items-center">
                    <p className="text-[14px] font-bold uppercase tracking-wider opacity-80">Net Vendor Refund</p>
                    <p className="text-[20px] font-bold">{formatCurrency(grandTotal, currency, currencyPosition)}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                   <button 
                     type="button" 
                     onClick={handleDiscard} 
                     className="flex-1 h-[48px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[15px] shadow-sm"
                   >
                     Cancel
                   </button>
                   <button 
                     type="button" 
                     onClick={handleSave} 
                     disabled={isSaving || !purchase} 
                     className="flex-1 h-[48px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[15px]"
                   >
                     {isSaving ? (
                       <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <><Check className="h-5 w-5" strokeWidth={3} /> Return</>
                     )}
                   </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/return/vendor' })}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard this return?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
