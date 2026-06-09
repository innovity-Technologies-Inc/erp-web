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
  FileText,
  Clock,
  Calendar,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { useQuotationDetails } from '../../hooks/useQuotation'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { clsx } from 'clsx'
import { LoadingState } from '@/components/Loading/LoadingState'

export const QuotationDetailsPage = () => {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/_authenticated/inventory/quotation/view/$id' })
  const { currency, currencyPosition, companyInformation, webSetting } = useSettings()

  const { data: quotationResponse, isLoading } = useQuotationDetails(id)

  const formatValue = (val: number | string) => formatCurrency(val, currency, currencyPosition)

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <LoadingState message="Loading quotation details..." />
  }

  const quotation = (quotationResponse as any)?.data

  if (!quotation) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full">
           <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-fit mx-auto mb-6">
              <FileText className="w-10 h-10" />
           </div>
           <h2 className="text-[20px] font-bold text-gray-900 mb-3 tracking-tight">Quotation Not Found</h2>
           <p className="text-[#64748b] text-[14px] leading-relaxed mb-8">The requested quotation could not be found or has been removed from the system.</p>
           <button 
             onClick={() => navigate({ to: '/inventory/quotation' })}
             className="w-full py-3 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
           >
             Return to Quotation List
           </button>
        </div>
      </div>
    )
  }

  const productItems = quotation.quot_products_used || []
  const serviceItems = quotation.quotation_service_used || []

  // Status mapping
  const status = quotation.status === 2 ? 'Added To Invoice' : 'Pending';
  const isExpired = new Date(quotation.expire_date) < new Date();

  return (
    <div className="min-h-screen font-poppins print:bg-white print:pb-0">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/quotation"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">Quotation Details</h1>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Printer className="h-4 w-4" />
          <span>Print Quotation</span>
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
            <h2 className="text-[20px] font-semibold text-gray-900 tracking-tight mb-2 print:text-[18px] print:mb-1">Quotation #{quotation.quot_no}</h2>
            <div className="flex items-center justify-end gap-4 text-[#64748b] text-[11px] font-medium print:gap-2">
              <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary print:w-3.5 print:h-3.5" />
                  Quoted: {formatDate(quotation.quotdate)}
              </div>
              <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-500 print:w-3.5 print:h-3.5" />
                  Expires: {formatDate(quotation.expire_date)}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 px-8 pb-6 print:px-4 print:pb-4 print:gap-4">
          {/* Billing From */}
          <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#1e4ba1] text-[10px] font-bold uppercase tracking-wider rounded-full">Quoted By</span>
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e4ba1] print:bg-blue-50 print:p-1.5">
                  <Building2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>
              
              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">{companyInformation?.company_name}</h3>
              
              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{companyInformation?.address}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Phone className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{companyInformation?.mobile}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Mail className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{companyInformation?.email}</span>
                </div>
              </div>
          </div>

          {/* Billing To */}
          <div className="relative p-4 bg-white rounded-xl border border-gray-200 print:break-inside-avoid print:p-3">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Quoted To</span>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 print:bg-orange-50 print:p-1.5">
                  <User className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
              </div>

              <h3 className="text-[18px] font-semibold text-gray-900 mb-4 print:text-[16px] print:mb-2">{quotation.customer?.customer_name}</h3>
              
              <div className="space-y-3 print:space-y-1.5">
                <div className="flex items-start gap-3 text-[13px] text-gray-500 font-medium leading-relaxed print:text-[11px]">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{quotation.customer?.customer_address || 'Address not available'}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Phone className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{quotation.customer?.customer_mobile}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500 font-medium print:text-[11px]">
                  <Mail className="w-4 h-4 shrink-0 print:w-3.5 print:h-3.5" />
                  <span>{quotation.customer?.customer_email || 'No email provided'}</span>
                </div>
              </div>
          </div>
        </div>

        {/* Product Quotation Section */}
        {productItems.length > 0 && (
          <div className="border-t border-gray-100 mx-8 py-4 print:mx-4 print:py-2">
              <div className="flex items-center justify-between mb-4 print:mb-2">
                <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">Product Quotation</h3>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{productItems.length} {productItems.length === 1 ? 'Item' : 'Items'}</span>
              </div>
              
              <div className="border border-gray-100 rounded-xl overflow-hidden print:border print:rounded-xl">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 print:bg-gray-50">
                        <th className="px-6 py-4 w-16 print:px-3 print:py-2">SL.</th>
                        <th className="px-4 py-4 min-w-[250px] print:min-w-0 print:px-2 print:py-2">Product Name</th>
                        <th className="px-4 py-4 print:px-2 print:py-2">Warehouse</th>
                        <th className="px-4 py-4 print:px-2 print:py-2 text-center">Unit</th>
                        <th className="px-4 py-4 text-center print:px-2 print:py-2">Qty</th>
                        <th className="px-4 py-4 text-right print:px-2 print:py-2">Rate</th>
                        <th className="px-4 py-4 text-center print:px-2 print:py-2">Discount%</th>
                        <th className="px-6 py-4 text-right print:px-3 print:py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px]">
                      {productItems.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors print:bg-white">
                          <td className="px-6 py-4 text-gray-500 print:px-3 print:py-2">{index + 1}</td>
                          <td className="px-4 py-4 print:px-2 print:py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-[#1e4ba1] text-[14px] print:text-[12px]">{item.product?.product_name || 'N/A'}</span>
                              <span className="text-[11px] text-gray-400 font-medium print:text-[9px]">SKU: {item.product?.sku || 'BP-' + item.product_id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-700 font-medium print:px-2 print:py-2">{item.warehouse?.warehouse_name || item.warehouse?.name || 'Main Warehouse'}</td>
                          <td className="px-4 py-4 text-center print:px-2 print:py-2">
                             <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md print:bg-gray-100 print:text-[9px] print:px-1.5 print:py-0.5">{item.product?.unit?.unit_name || 'Unit'}</span>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-gray-900 print:px-2 print:py-2">{parseFloat(item.used_qty).toFixed(2)}</td>
                          <td className="px-4 py-4 text-right text-gray-700 print:px-2 print:py-2">{formatValue(item.rate)}</td>
                          <td className="px-4 py-4 text-center text-rose-500 font-semibold print:px-2 print:py-2">{parseFloat(item.discount_per || 0)}%</td>
                          <td className="px-6 py-4 text-right font-bold text-[#1e4ba1] text-[14px] print:text-[12px] print:px-3 print:py-2">{formatValue(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        )}

        {/* Service Quotation Section */}
        {serviceItems.length > 0 && (
          <div className="border-t border-gray-100 mx-8 py-4 print:mx-4 print:py-2">
              <div className="flex items-center justify-between mb-4 print:mb-2">
                <h3 className="text-[16px] font-semibold text-gray-900 print:text-[14px]">Service Quotation</h3>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{serviceItems.length} {serviceItems.length === 1 ? 'Service' : 'Services'}</span>
              </div>
              
              <div className="border border-gray-100 rounded-xl overflow-hidden print:border print:rounded-xl">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 print:bg-gray-50">
                        <th className="px-6 py-4 w-16 print:px-3 print:py-2">SL.</th>
                        <th className="px-4 py-4 min-w-[250px] print:min-w-0 print:px-2 print:py-2">Service Name</th>
                        <th className="px-4 py-4 text-center print:px-2 print:py-2">Qty</th>
                        <th className="px-4 py-4 text-right print:px-2 print:py-2">Charge</th>
                        <th className="px-4 py-4 text-center print:px-2 print:py-2">Discount%</th>
                        <th className="px-6 py-4 text-right print:px-3 print:py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[13px] print:text-[11px]">
                      {serviceItems.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors print:bg-white">
                          <td className="px-6 py-4 text-gray-500 print:px-3 print:py-2">{index + 1}</td>
                          <td className="px-4 py-4 print:px-2 print:py-2">
                            <span className="font-semibold text-[#0d7a50] text-[14px] print:text-[12px]">{item.service?.service_name || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-gray-900 print:px-2 print:py-2">{parseFloat(item.qty).toFixed(2)}</td>
                          <td className="px-4 py-4 text-right text-gray-700 print:px-2 print:py-2">{formatValue(item.charge)}</td>
                          <td className="px-4 py-4 text-center text-rose-500 font-semibold print:px-2 print:py-2">{parseFloat(item.discount || 0)}%</td>
                          <td className="px-6 py-4 text-right font-bold text-[#1e4ba1] text-[14px] print:text-[12px] print:px-3 print:py-2">{formatValue(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        )}

        {/* Bottom Section: Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-8 p-8 pt-2 print:gap-4 print:px-4 print:py-2 print:mt-2">
          
          {/* Left: Message & Status */}
          <div className="lg:col-span-8 print:col-span-7 space-y-6 print:space-y-3">
              {quotation.quot_description && (
                <div className="p-5 bg-[#f8fafc] rounded-xl border border-gray-200 print:bg-[#f8fafc] print:p-3">
                    <div 
                      className="text-[13px] text-gray-600 leading-relaxed print:text-[11px]"
                      dangerouslySetInnerHTML={{ __html: quotation.quot_description }}
                    />
                </div>
              )}

              {/* Status Badges Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-2">
                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 print:bg-blue-50 print:p-1.5">
                    <ShieldCheck className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Quotation Status</span>
                    <span className="text-[14px] font-bold text-gray-900 print:text-[12px]">{status}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-4 print:break-inside-avoid print:p-2 print:gap-2">
                  <div className={clsx("p-2.5 rounded-lg shrink-0 print:p-1.5", isExpired ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                    <Zap className="w-5 h-5 print:w-4 print:h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-0.5 print:text-[9px]">Expiry Check</span>
                    <span className={clsx("text-[14px] font-bold print:text-[12px]", isExpired ? "text-rose-600" : "text-emerald-600")}>{isExpired ? 'Expired' : 'Valid'}</span>
                  </div>
                </div>
              </div>
          </div>

          {/* Right: Quotation Summary Column */}
          <div className="lg:col-span-4 print:col-span-5 flex flex-col print:break-inside-avoid">
              <div className="bg-[#f8fafc] border border-gray-200 rounded-t-xl flex-grow print:bg-[#f8fafc]">
                <h3 className="text-[16px] font-semibold text-[#1e4ba1] p-4 print:text-[14px] print:p-2">Quotation Summary</h3>
                
                <div className="space-y-3.5 bg-white text-[14px] p-4 print:text-[12px] print:p-2 print:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Item Total Gross:</span>
                    <span className="text-gray-900 font-semibold">{formatValue(productItems.reduce((acc: number, item: any) => acc + (parseFloat(item.used_qty) * parseFloat(item.rate)), 0))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Item Discount:</span>
                    <span className="text-rose-600 font-semibold">-{formatValue(quotation.item_total_discount)}</span>
                  </div>
                  
                  {serviceItems.length > 0 && (
                    <>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-gray-500">Service Gross:</span>
                        <span className="text-gray-900 font-semibold">{formatValue(serviceItems.reduce((acc: number, item: any) => acc + (parseFloat(item.qty) * parseFloat(item.charge)), 0))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Service Discount:</span>
                        <span className="text-rose-600 font-semibold">-{formatValue(quotation.service_total_discount)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-3 pb-3 border-t border-gray-200 my-2 print:pt-1 print:pb-1 print:my-1">
                    <span className="text-gray-900 font-bold">Total Net Amount:</span>
                    <span className="text-[16px] text-[#1e4ba1] font-bold print:text-[14px]">
                      {formatValue(parseFloat(quotation.item_total_amount) + parseFloat(quotation.service_total_amount || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dark Bar Bottom */}
              <div className="bg-[#0f2d5c] p-5 flex items-center justify-between text-white rounded-b-xl border border-[#0f2d5c] print:bg-[#0f2d5c] print:p-3">
                <span className="text-[13px] font-bold tracking-wider print:text-[11px]">NET BALANCE</span>
                <span className="text-[20px] font-bold print:text-[16px]">
                  {formatValue(parseFloat(quotation.item_total_amount) + parseFloat(quotation.service_total_amount || 0))}
                </span>
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
