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
  Truck,
  FileText,
  Clock,
  Calendar,
  Receipt
} from 'lucide-react'
import { useSaleDetails } from '../../hooks/useSales'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

export const SaleViewPage = () => {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false })
  const saleId = id ? parseInt(id as string, 10) : null
  const { currency, currencyPosition, companyInformation } = useSettings()

  const { data: saleDetails, isLoading } = useSaleDetails(saleId)

  // Helper for consistent formatting
  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-[#64748b] font-bold text-[13px]">Loading Invoice Details...</p>
        </div>
      </div>
    )
  }

  if (!saleDetails) {
    return (
      <div className="min-h-screen bg-[#f1f0f5] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
           <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
              <FileText className="w-10 h-10" />
           </div>
           <h2 className="text-[20px] font-black text-gray-900 mb-3 tracking-tight">Invoice Not Found</h2>
           <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">The requested invoice could not be found or has been removed from the system.</p>
           <button 
             onClick={() => navigate({ to: '/inventory/sales' })}
             className="w-full py-3 bg-primary text-white rounded-xl font-black text-[14px] hover:bg-[#153a80] transition-all shadow-md active:scale-[0.98]"
           >
             Return to Sales List
           </button>
        </div>
      </div>
    )
  }

  const items = Array.isArray(saleDetails.InvoiceDetails) ? saleDetails.InvoiceDetails : 
                Array.isArray(saleDetails.invoice_details) ? saleDetails.invoice_details : [];

  const paymentStatus = parseFloat(saleDetails.due_amount) <= 0 ? 'Paid' : 
                       parseFloat(saleDetails.paid_amount) > 0 ? 'Partial' : 'Unpaid';

  const deliveryStatusMap: Record<string, string> = {
    '0': 'Pending',
    '1': 'Confirmed',
    '2': 'Picked Up',
    '3': 'On The Way',
    '4': 'Delivered',
    '5': 'Cancelled'
  };
  const deliveryStatus = deliveryStatusMap[saleDetails.delivery_status?.toString()] || 'Pending';

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-20 font-poppins print:bg-white print:pb-0">
      {/* Page Header */}
      <div className="pb-6 print:hidden">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/inventory/sales"
              className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={3} />
              <span>Back</span>
            </Link>
            <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Invoice Details</h1>
          </div>
          
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto mt-2 space-y-6 print:mt-0 print:px-0">
        
        {/* Main Invoice Sheet */}
        <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
          
          {/* Header Section: Logo & Meta */}
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-white to-gray-50/50">
            <div className="space-y-4">
              {companyInformation?.logo_url ? (
                <img src={companyInformation.logo_url} alt="Logo" className="h-10 object-contain" />
              ) : (
                <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Globe className="w-6 h-6" />
                  </div>
                  {companyInformation?.company_name || 'GEN-ITECH'}
                </div>
              )}
            </div>

            <div className="text-right space-y-1.5">
              <h2 className="text-[28px] font-black text-gray-900 tracking-tight leading-none mb-2">Invoice #{saleDetails.invoice_id}</h2>
              <div className="flex flex-col gap-1 items-end">
                <div className="flex items-center gap-2 text-[#64748b] text-[13px] font-bold">
                   <Calendar className="w-3.5 h-3.5" />
                   {formatDate(saleDetails.date)}
                </div>
                <div className="flex items-center gap-2 text-[#64748b] text-[12px] font-medium opacity-60">
                   <Clock className="w-3.5 h-3.5" />
                   {new Date(saleDetails.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 border-b border-gray-100 bg-[#fcfcfd]/30">
            {/* Billing From */}
            <div className="relative p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
               <div className="absolute top-4 right-4 p-2 bg-blue-50 rounded-lg text-primary">
                  <Building2 className="w-4 h-4" />
               </div>
               <span className="inline-block px-2.5 py-1 bg-blue-50 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md mb-4">Billing From</span>
               <h3 className="text-[18px] font-black text-gray-900 mb-4">{companyInformation?.company_name || 'Deshi Shad Inc'}</h3>
               <div className="space-y-3">
                  <div className="flex items-start gap-3 text-[13px] text-[#475569] leading-relaxed font-bold">
                    <MapPin className="w-4 h-4 mt-0.5 text-[#94a3b8]" />
                    <span>{companyInformation?.address || 'Street address not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#475569] font-bold">
                    <Phone className="w-4 h-4 text-[#94a3b8]" />
                    <span>{companyInformation?.mobile || 'No contact provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#475569] font-bold">
                    <Mail className="w-4 h-4 text-[#94a3b8]" />
                    <span>{companyInformation?.email || 'No email provided'}</span>
                  </div>
                  {companyInformation?.website && (
                    <div className="flex items-center gap-3 text-[13px] text-[#475569] font-bold">
                      <Globe className="w-4 h-4 text-[#94a3b8]" />
                      <span>{companyInformation.website}</span>
                    </div>
                  )}
               </div>
            </div>

            {/* Billing To */}
            <div className="relative p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
               <div className="absolute top-4 right-4 p-2 bg-orange-50 rounded-lg text-orange-600">
                  <User className="w-4 h-4" />
               </div>
               <span className="inline-block px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-md mb-4">Billing To</span>
               <h3 className="text-[18px] font-black text-gray-900 mb-4">{saleDetails.customer?.customer_name || 'Merchant Name'}</h3>
               <div className="space-y-3">
                  <div className="flex items-start gap-3 text-[13px] text-[#475569] leading-relaxed font-bold">
                    <MapPin className="w-4 h-4 mt-0.5 text-[#94a3b8]" />
                    <span>{saleDetails.customer?.customer_address || 'Customer address not available'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#475569] font-bold">
                    <Phone className="w-4 h-4 text-[#94a3b8]" />
                    <span>{saleDetails.customer?.customer_mobile || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#475569] font-bold">
                    <Mail className="w-4 h-4 text-[#94a3b8]" />
                    <span>{saleDetails.customer?.customer_email || 'No email provided'}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Ordered Products Section */}
          <div className="p-0">
             <div className="px-8 py-5 flex items-center justify-between bg-white border-b border-gray-50">
               <h3 className="text-[16px] font-black text-gray-900 tracking-tight">Ordered Products</h3>
               <span className="text-[11px] font-black text-primary bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wide">{items.length} {items.length === 1 ? 'Item' : 'Items'} Invoiced</span>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#475569] text-[11px] font-black uppercase tracking-wider border-b border-gray-100">
                      <th className="px-8 py-4 w-16">SL.</th>
                      <th className="px-4 py-4 min-w-[300px]">Product Name & SKU</th>
                      <th className="px-4 py-4 text-center">Warehouse</th>
                      <th className="px-4 py-4 text-center">Unit</th>
                      <th className="px-4 py-4 text-center">Qty</th>
                      <th className="px-4 py-4 text-right">Rate</th>
                      <th className="px-4 py-4 text-right">Per Pcs Rate</th>
                      <th className="px-4 py-4 text-center">Discount%</th>
                      <th className="px-8 py-4 text-right w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-[13px]">
                    {items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5 text-gray-400 font-bold">{index + 1}</td>
                        <td className="px-4 py-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-primary text-[14px] leading-snug">{item.product?.product_name || 'Product Name'}</span>
                            <span className="text-[11px] text-[#94a3b8] uppercase tracking-wide font-bold">SKU: {item.product?.sku || 'BP-' + item.product_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center text-[#475569] font-bold">{item.warehouse?.warehouse_name || 'MD/VA'}</td>
                        <td className="px-4 py-5 text-center">
                          <span className="px-2 py-1 bg-gray-100 text-[#64748b] text-[10px] font-black rounded-md uppercase tracking-tight">{item.product?.unit?.unit_name || 'Pack'}</span>
                        </td>
                        <td className="px-4 py-5 text-center font-black text-[#1e293b]">{parseFloat(item.quantity).toFixed(2)}</td>
                        <td className="px-4 py-5 text-right font-bold text-[#475569]">{formatValue(item.rate)}</td>
                        <td className="px-4 py-5 text-right font-bold text-[#475569]">{formatValue(parseFloat(item.rate) / (parseFloat(item.batchMaster?.no_of_qty) || 1))}</td>
                        <td className="px-4 py-5 text-center text-rose-500 font-black">{parseFloat(item.discount_per || 0)}%</td>
                        <td className="px-8 py-5 text-right font-black text-primary text-[15px]">{formatValue(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Bottom Section: Details & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-gray-100">
            {/* Left: Message & Status */}
            <div className="lg:col-span-7 p-8 space-y-8 bg-gray-50/20">
               {/* Thank you message with Integrated Invoice Details */}
               <div className="p-8 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex flex-col gap-6">
                  <div className="flex gap-5">
                    <div className="shrink-0 p-3 bg-white rounded-xl shadow-sm h-fit text-primary">
                      <div className="w-6 h-6 flex items-center justify-center font-bold text-xl">☺</div>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[16px] font-black text-gray-900 leading-tight">Thank you for shopping with us</h4>
                      <p className="text-[13px] text-[#64748b] leading-relaxed font-bold">We appreciate your business. If you have any questions regarding this invoice, please contact our support division.</p>
                    </div>
                  </div>

                  {saleDetails.invoice_details_text && (
                    <div className="pt-6 border-t border-blue-200/30">
                       <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-primary">Special Instructions</span>
                       </div>
                       <div 
                         className="text-[14px] text-[#475569] leading-relaxed prose prose-sm max-w-none prose-p:my-1 font-bold"
                         dangerouslySetInnerHTML={{ __html: saleDetails.invoice_details_text }}
                       />
                    </div>
                  )}
               </div>

               {/* Badges Row */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className={clsx(
                      "p-2.5 rounded-lg shrink-0 shadow-sm border",
                      paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      paymentStatus === 'Partial' ? "bg-blue-50 text-blue-600 border-blue-100" : 
                      "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Payment Status</span>
                      <span className={clsx(
                        "text-[15px] font-black tracking-tight",
                        paymentStatus === 'Paid' ? "text-emerald-600" : 
                        paymentStatus === 'Partial' ? "text-blue-600" : 
                        "text-rose-600"
                      )}>{paymentStatus}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className={clsx(
                      "p-2.5 rounded-lg shrink-0 shadow-sm border",
                      deliveryStatus === 'Delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      deliveryStatus === 'Cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" : 
                      "bg-orange-50 text-orange-600 border-orange-100"
                    )}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1.5">Delivery Status</span>
                      <span className={clsx(
                        "text-[15px] font-black tracking-tight",
                        deliveryStatus === 'Delivered' ? "text-emerald-600" : 
                        deliveryStatus === 'Cancelled' ? "text-rose-600" : 
                        "text-orange-600"
                      )}>{deliveryStatus}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Right: Payment Summary Card */}
            <div className="lg:col-span-5 p-0 bg-white border-l border-gray-100 flex flex-col justify-between">
               <div className="p-8 space-y-6 flex-grow">
                 <h3 className="text-[16px] font-black text-gray-900 tracking-tight mb-8">Payment Summary</h3>
                 
                 <div className="space-y-4 font-bold text-[14px]">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-[#64748b]">Total Gross Amount</span>
                      <span className="text-gray-900">{formatValue(items.reduce((acc: number, item: any) => acc + (parseFloat(item.quantity) * parseFloat(item.rate)), 0))}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-[#64748b]">Discount Value</span>
                      <span className="text-rose-600">- {formatValue(parseFloat(saleDetails.total_discount) || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 pb-2 border-t border-dashed border-gray-200">
                      <span className="text-gray-900 font-black">Total Net Amount</span>
                      <span className="text-[20px] text-primary font-black tracking-tighter">{formatValue(saleDetails.total_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-[#64748b]">Previous Balance Due</span>
                      <span className="text-gray-400">{formatValue(saleDetails.prevous_due || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-[#64748b]">Paid Amount</span>
                      <span className="text-emerald-600">{formatValue(saleDetails.paid_amount)}</span>
                    </div>
                 </div>

                 {/* Remaining Due Box */}
                 <div className="mt-8 p-6 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-[0.05] translate-x-4 translate-y-4">
                       <ShieldCheck className="w-16 h-16 text-rose-600" />
                    </div>
                    <span className="text-[13px] font-black text-rose-600 uppercase tracking-wide">Remaining Due</span>
                    <span className="text-[28px] font-black text-rose-600 leading-none tracking-tighter relative z-10">{formatValue(saleDetails.due_amount)}</span>
                 </div>
               </div>

               {/* Net Balance Bottom Bar */}
               <div className="bg-[#0a2540] p-8 flex items-center justify-between text-white rounded-b-[24px] lg:rounded-bl-none">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-300 opacity-60 mb-1">Net Statement Balance</span>
                    <span className="text-[12px] text-blue-100/80 font-bold tracking-tight">Invoice Due + Previous Dues</span>
                  </div>
                  <span className="text-[28px] font-black tracking-tighter leading-none">{formatValue(parseFloat(saleDetails.due_amount) + (parseFloat(saleDetails.prevous_due) || 0))}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:mt-0 { margin-top: 0 !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .rounded-[24px], .rounded-2xl, .rounded-xl { border-radius: 0 !important; }
          .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
        }
      `}} />
    </div>
  )
}
