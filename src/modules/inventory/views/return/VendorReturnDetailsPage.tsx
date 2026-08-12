import { useNavigate, useParams, Link } from '@tanstack/react-router'
import { 
  ArrowLeft, 
  Printer, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { useSupplierReturnDetails } from '../../hooks/useReturn'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { LoadingState } from '@/components/Loading/LoadingState'

export const VendorReturnDetailsPage = () => {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/_authenticated/inventory/return/vendor/details/$id' })
  const { currency, currencyPosition, companyInformation, webSetting } = useSettings()

  const { data: response, isLoading } = useSupplierReturnDetails(id || null)
  const returnItems = response?.data || []
  
  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <LoadingState message="Loading return details..." />
  }

  if (!returnItems || returnItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
           <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
              <FileText className="w-10 h-10" />
           </div>
           <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">Return Not Found</h2>
           <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">The requested return record could not be found or has been removed from the system.</p>
           <button 
             onClick={() => navigate({ to: '/inventory/return/vendor' })}
             className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
           >
             Return to List
           </button>
        </div>
      </div>
    )
  }

  // Use the first item to get common data (purchase, supplier, dates)
  const firstItem = returnItems[0]
  const purchase = firstItem.purchase
  const supplier = purchase?.supplier

  const totalReturnQty = returnItems.reduce((acc: number, item: any) => acc + parseFloat(item.ret_qty || 0), 0)
  const grandTotal = returnItems.reduce((acc: number, item: any) => acc + parseFloat(item.net_total_amount || 0), 0)
  const totalDeduction = returnItems.reduce((acc: number, item: any) => acc + parseFloat(item.total_deduct || 0), 0) / returnItems.length // Backend saves total deduct per row

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/return/vendor"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Vendor Return Details</h1>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Printer className="h-4 w-4" />
          <span>Print Invoice</span>
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:m-0 print:max-w-none mb-8">
        
        {/* Top Section: Logo & Meta */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 print:flex-row print:items-center print:p-4">
          <div>
            {webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url ? (
              <img src={(webSetting?.invoice_logo_url || webSetting?.logo_url || companyInformation?.logo_url) ?? undefined} alt="Logo" className="h-12 object-contain print:h-10" />
            ) : (
              <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight print:text-xl">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white print:w-8 print:h-8">
                  <Globe className="w-6 h-6 print:w-5 print:h-5" />
                </div>
                {webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH'}
              </div>
            )}
          </div>

          <div className="text-right">
            <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-1 print:text-[18px] print:mb-0">Return Invoice #{firstItem.purchase_id}</h2>
            <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2">Return ID: {firstItem.return_id || 'N/A'}</p>
            <div className="flex items-center justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-2">
              <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  {formatDate(firstItem.date_return)}
              </div>
              <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  {new Date(firstItem.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 px-8 pb-6 print:px-4 print:pb-4 print:gap-4">
          {/* Billing From (Company) */}
          <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#1e4ba1] text-[10px] font-bold uppercase tracking-wider rounded-full">Return From</span>
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e4ba1] print:bg-blue-50 print:p-1.5">
                  <User className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">{companyInformation?.company_name || 'Deshi Shad Inc'}</h3>
              
              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{companyInformation?.address || 'Company address not available'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Phone className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{companyInformation?.mobile || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Mail className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{companyInformation?.email || 'No email provided'}</span>
                </div>
              </div>
          </div>

          {/* Billing To (Vendor) */}
          <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Return To</span>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 print:bg-orange-50 print:p-1.5">
                  <Building2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>
              
              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">{supplier?.supplier_name || 'Vendor Name'}</h3>
              
              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{supplier?.address || 'Supplier address not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Phone className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{supplier?.mobile || 'No contact provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Mail className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{supplier?.email || 'No email provided'}</span>
                </div>
              </div>
          </div>
        </div>

        {/* Returned Products Section */}
        <div className="border-t border-gray-100 mx-8 py-4 print:mx-4 print:py-2">
            <div className="flex items-center justify-between mb-4 print:mb-2">
              <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">Returned Items</h3>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{returnItems.length} {returnItems.length === 1 ? 'Item' : 'Items'} Returned</span>
            </div>
            
            <div className="border border-gray-100 rounded-xl overflow-hidden print:border print:rounded-xl">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#dae8ff] text-[#003671] text-[12px] font-bold uppercase tracking-wider border-b border-gray-100 print:bg-gray-50 text-center">
                      <th className="px-4 py-3 border-b border-gray-200 w-[60px]">SL.</th>
                      <th className="px-4 py-3 border-b border-gray-200 text-left">Product Name</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Purchase Qty</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Return Qty</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Rate</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[100px]">Deduction(%)</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px]">Dis. Value</th>
                      <th className="px-4 py-3 border-b border-gray-200 w-[120px] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px] text-center">
                    {returnItems.map((item: any, index: number) => {
                       const deductionValue = parseFloat(item.total_ret_amount) - parseFloat(item.net_total_amount);
                       return (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors print:bg-white text-gray-500">
                        <td className="px-4 py-3 print:px-3 print:py-2">{index + 1}</td>
                        <td className="px-4 py-3 print:px-2 print:py-2 text-left">
                          <span className="font-semibold text-gray-700">{item.product?.product_name || 'Product Name'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">{item.byy_qty}</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.ret_qty}</td>
                        <td className="px-4 py-3 text-center">{formatValue(item.product_rate)}</td>
                        <td className="px-4 py-3 text-center text-rose-500 font-semibold">{parseFloat(item.deduction || 0)}%</td>
                        <td className="px-4 py-3 text-center text-[#1e4ba1] font-semibold">{formatValue(deductionValue)}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#1e4ba1]">{formatValue(item.net_total_amount)}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        {/* Bottom Section: Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-8 p-8 pt-2 print:gap-4 print:px-4 print:py-2 print:mt-2 items-start">
          
          {/* Left: Reason */}
          <div className="lg:col-span-8 print:col-span-7 flex flex-col gap-6">
            {(firstItem.primary_category || firstItem.detailed_description) && (
              <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm flex flex-col gap-4">
                <h2 className="text-[16px] font-bold text-[#1e293b] flex items-center gap-2 border-b border-gray-50 pb-3">
                  <div className="text-[#1e4ba1]"><FileText className="h-5 w-5" /></div>
                  Return Information
                </h2>
                
                {firstItem.primary_category && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Primary Category</span>
                    <p className="text-[13px] text-gray-700 font-semibold capitalize">{firstItem.primary_category.replace('_', ' ')}</p>
                  </div>
                )}

                {firstItem.detailed_description && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Detailed Description</span>
                    <div 
                      className="text-[13px] text-gray-600 leading-relaxed print:text-[11px] bg-gray-50/50 p-4 rounded-lg border border-gray-100"
                      dangerouslySetInnerHTML={{ __html: firstItem.detailed_description }}
                    />
                  </div>
                )}
              </div>
            )}

            {firstItem.reason && (
              <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm flex flex-col">
                <h2 className="text-[16px] font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                  <div className="text-[#1e4ba1]"><AlertTriangle className="h-5 w-5" /></div>
                  Other Remarks
                </h2>
                <div 
                  className="text-[13px] text-gray-600 leading-relaxed print:text-[11px]"
                  dangerouslySetInnerHTML={{ __html: firstItem.reason }}
                />
              </div>
            )}
          </div>

          {/* Right: Totals */}
          <div className="lg:col-span-4 print:col-span-5 flex flex-col print:break-inside-avoid">
              <div className="bg-[#f8fafc] border border-gray-200 rounded-t-xl flex-grow print:bg-[#f8fafc]">
                <h3 className="text-[16px] font-semibold text-[#1e4ba1] p-4 print:text-[14px] print:p-2">Return Summary</h3>
                
                <div className="space-y-3.5 bg-white text-[14px] p-4 print:text-[12px] print:p-2 print:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Items:</span>
                    <span className="text-gray-900 font-semibold">{returnItems.length} Products</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Return Quantity:</span>
                    <span className="text-gray-900 font-semibold">{totalReturnQty} Units</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 pb-3 border-t border-b border-gray-200 my-2 print:pt-1 print:pb-1 print:my-1">
                    <span className="text-gray-900 font-bold">Subtotal Refund:</span>
                    <span className="text-[16px] text-[#1e4ba1] font-bold print:text-[14px]">{formatCurrency(grandTotal + totalDeduction, currency, currencyPosition)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Restocking Fee:</span>
                    <span className="text-rose-600 font-semibold">-{formatCurrency(totalDeduction, currency, currencyPosition)}</span>
                  </div>
                </div>
              </div>

              {/* Net Balance Bottom Bar */}
              <div className="bg-[#0f2d5c] p-5 flex items-center justify-between text-white rounded-b-xl border border-[#0f2d5c] print:bg-[#0f2d5c] print:p-3">
                <span className="text-[13px] font-bold tracking-wider print:text-[11px]">NET REFUND</span>
                <span className="text-[20px] font-bold print:text-[16px]">{formatCurrency(grandTotal, currency, currencyPosition)}</span>
              </div>
          </div>
          
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:mt-6 { margin-top: 1.5rem !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          * { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
        }
      `}} />
    </div>
  )
}
