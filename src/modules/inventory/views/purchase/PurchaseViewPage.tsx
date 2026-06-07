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
  ShieldCheck,
  FileText,
  Clock,
  Calendar,
  Hash
} from 'lucide-react'
import { usePurchaseData } from '../../hooks/usePurchases'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { LoadingState } from '@/components/Loading/LoadingState'

export const PurchaseViewPage = () => {
  const navigate = useNavigate()
  // Use explicit from path to ensure ID is captured correctly
  const { id } = useParams({ from: '/_authenticated/inventory/purchase/view/$id' })
  const { currency, currencyPosition, companyInformation, webSetting } = useSettings()

  const purchaseId = id ? parseInt(id as string, 10) : null
  const { data: purchaseResponse, isLoading } = usePurchaseData(purchaseId)
  
  const purchase = (purchaseResponse as any) || null
  
  // Helper for consistent formatting
  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <LoadingState message="Loading purchase details..." />
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
           <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
              <FileText className="w-10 h-10" />
           </div>
           <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">Purchase Not Found</h2>
           <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">The requested purchase record could not be found or has been removed from the system.</p>
           <button 
             onClick={() => navigate({ to: '/inventory/purchase' })}
             className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
           >
             Return to Purchase List
           </button>
        </div>
      </div>
    )
  }

  const items = Array.isArray(purchase.product_purchase_details) ? purchase.product_purchase_details : [];

  const paymentStatus = parseFloat(purchase.due_amount) <= 0 ? 'Paid' : 
                       parseFloat(purchase.paid_amount) > 0 ? 'Partial' : 'Unpaid';

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0">
      {/* Page Header - Standardized to match other pages */}
      <div className="flex items-center justify-between pb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/purchase"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Purchase Details</h1>
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
            {webSetting?.logo_url || companyInformation?.logo_url ? (
              <img src={webSetting?.logo_url || companyInformation?.logo_url || undefined} alt="Logo" className="h-12 object-contain print:h-10" />
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
            <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2 print:text-[18px] print:mb-1">Invoice #{purchase.purchase_id || purchase.id}</h2>
            <div className="flex items-center justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-2">
              <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  {formatDate(purchase.purchase_date)}
              </div>
              <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  {new Date(purchase.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 px-8 pb-6 print:px-4 print:pb-4 print:gap-4">
          {/* Billing From (Vendor) */}
          <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Supplier Details</span>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 print:bg-orange-50 print:p-1.5">
                  <Building2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>
              
              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">{purchase.supplier?.supplier_name || 'Vendor Name'}</h3>
              
              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{purchase.supplier?.address || 'Supplier address not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Phone className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{purchase.supplier?.mobile || 'No contact provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Mail className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{purchase.supplier?.email || 'No email provided'}</span>
                </div>
              </div>
          </div>

          {/* Billing To (Company) */}
          <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#1e4ba1] text-[10px] font-bold uppercase tracking-wider rounded-full">Purchased By</span>
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
        </div>

        {/* Ordered Products Section */}
        <div className="border-t border-gray-100 mx-8 py-4 print:mx-4 print:py-2">
            <div className="flex items-center justify-between mb-4 print:mb-2">
              <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">Purchased Items</h3>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{items.length} {items.length === 1 ? 'Item' : 'Items'} Invoiced</span>
            </div>
            
            <div className="border border-gray-100 rounded-xl overflow-hidden print:border print:rounded-xl">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 print:bg-gray-50">
                      <th className="px-6 py-4 w-16 print:px-3 print:py-2">SL.</th>
                      <th className="px-4 py-4 min-w-[250px] print:min-w-0 print:px-2 print:py-2">Product Name</th>
                      <th className="px-4 py-4 print:px-2 print:py-2">Warehouse</th>
                      <th className="px-4 py-4 print:px-2 print:py-2">Exp Date</th>
                      <th className="px-4 py-4 text-center print:px-2 print:py-2">Qty</th>
                      <th className="px-4 py-4 text-right print:px-2 print:py-2">Rate</th>
                      <th className="px-4 py-4 text-center print:px-2 print:py-2">Discount%</th>
                      <th className="px-6 py-4 text-right print:px-3 print:py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px]">
                    {items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors print:bg-white">
                        <td className="px-6 py-4 text-gray-500 print:px-3 print:py-2">{index + 1}</td>
                        <td className="px-4 py-4 print:px-2 print:py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[#1e4ba1] text-[14px] print:text-[12px]">{item.product?.product_name || 'Product Name'}</span>
                            <span className="text-[11px] text-gray-400 font-medium print:text-[9px]">SKU: {item.product?.sku || 'PROD-' + item.product_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">{item.batch_product?.warehouse?.name || 'Main'}</td>
                        <td className="px-4 py-4 print:px-2 print:py-2">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md print:bg-gray-100 print:text-[9px] print:px-1.5 print:py-0.5">{item.expiry_date ? formatDate(item.expiry_date) : 'N/A'}</span>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-gray-900 print:px-2 print:py-2">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-700 print:px-2 print:py-2">{formatValue(item.rate)}</td>
                        <td className="px-4 py-4 text-center text-rose-500 font-semibold print:px-2 print:py-2">{parseFloat(item.discount || 0)}%</td>
                        <td className="px-6 py-4 text-right font-bold text-[#1e4ba1] text-[14px] print:text-[12px] print:px-3 print:py-2">{formatValue(item.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        {/* Bottom Section: Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-8 p-8 pt-2 print:gap-4 print:px-4 print:py-2 print:mt-2">
          
          {/* Left: Message & Status */}
          <div className="lg:col-span-8 print:col-span-7 space-y-6 print:space-y-3">
              {/* Thank you message */}

              {purchase.purchase_details && (
                <div className="p-5 bg-[#f8fafc] rounded-xl border border-gray-200 print:bg-[#f8fafc] print:p-3">
                    <div 
                      className="text-[13px] text-gray-600 leading-relaxed print:text-[11px]"
                      dangerouslySetInnerHTML={{ __html: purchase.purchase_details }}
                    />
                </div>
              )}

              {/* Status Badges Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 print:gap-2">
                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 print:bg-blue-50 print:p-1.5">
                    <ShieldCheck className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Payment Status</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px]">{paymentStatus}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 print:bg-indigo-50 print:p-1.5">
                    <FileText className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Chalan No</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px]">{purchase.chalan_no || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg shrink-0 print:bg-orange-50 print:p-1.5">
                    <Hash className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Batch No</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px]">{purchase.product_purchase_details?.[0]?.batch_master?.batch_no || 'N/A'}</span>
                  </div>
                </div>
              </div>
          </div>

          {/* Right: Payment Summary */}
          <div className="lg:col-span-4 print:col-span-5 flex flex-col print:break-inside-avoid">
              <div className="bg-[#f8fafc] border border-gray-200 rounded-t-xl flex-grow print:bg-[#f8fafc]">
                <h3 className="text-[16px] font-semibold text-[#1e4ba1] p-4 print:text-[14px] print:p-2">Payment Summary</h3>
                
                <div className="space-y-3.5 bg-white text-[14px] p-4 print:text-[12px] print:p-2 print:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Gross:</span>
                    <span className="text-gray-900 font-semibold">{formatValue(purchase.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Discount:</span>
                    <span className="text-rose-600 font-semibold">- {formatValue(purchase.total_discount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 pb-3 border-t border-b border-gray-200 my-2 print:pt-1 print:pb-1 print:my-1">
                    <span className="text-gray-900 font-bold">Total Net Amount:</span>
                    <span className="text-[16px] text-[#1e4ba1] font-bold print:text-[14px]">{formatValue(purchase.grand_total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Paid Amount:</span>
                    <span className="text-[#1e4ba1] font-semibold">{formatValue(purchase.paid_amount)}</span>
                  </div>
                  
                  <div className="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-100 flex items-center justify-between print:bg-rose-50 print:p-2 print:mt-1">
                    <span className="text-[14px] font-semibold text-rose-600 print:text-[12px]">Remaining Due:</span>
                    <span className="text-[16px] font-bold text-rose-600 print:text-[14px]">{formatValue(purchase.due_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Net Balance Bottom Bar */}
              <div className="bg-[#0f2d5c] p-5 flex items-center justify-between text-white rounded-b-xl border border-[#0f2d5c] print:bg-[#0f2d5c] print:p-3">
                <span className="text-[13px] font-bold tracking-wider print:text-[11px]">NET BALANCE</span>
                <span className="text-[20px] font-bold print:text-[16px]">{formatValue(purchase.due_amount)}</span>
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
