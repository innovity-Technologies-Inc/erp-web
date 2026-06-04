import { useParams, useNavigate } from '@tanstack/react-router'
import { QuotationForm } from './components/QuotationForm'
import { useQuotationDetails, useAddToInvoice } from '../../hooks/useQuotation'
import { LoadingState } from '@/components/Loading/LoadingState'
import type { QuotationFormValues } from './components/schema'

export const AddQuotationToInvoicePage = () => {
  const { id } = useParams({ from: '/_authenticated/inventory/quotation/add-to-invoice/$id' })
  const navigate = useNavigate()
  const { data: quotationResponse, isLoading } = useQuotationDetails(id)
  const { mutate: addToInvoice, isPending } = useAddToInvoice()

  if (isLoading) return <LoadingState />

  const quotation = quotationResponse?.data
  
  if (!quotation) return <div>Quotation not found</div>
  const initialData: Partial<QuotationFormValues> = {
    warehouse_id: quotation.quot_products_used?.[0]?.warehouse_id || '',
    customer_id: quotation.customer_id,
    quotdate: quotation.quotdate,
    expire_date: quotation.expire_date,
    quot_description: quotation.quot_description || '',
    item_total_amount: quotation.item_total_amount,
    item_total_discount: quotation.item_total_discount,
    item_total_vat: quotation.item_total_vat,
    quot_dis_item: quotation.quot_dis_item,
    sale_items: quotation.quot_products_used?.map((item: any) => ({
      product_id: item.product_id,
      _product_fallback: item.product?.product_name,
      batch_master_id: item.batch_master_id || '',
      _batch_fallback: item.batch?.batch_no,
      description: item.description || '',
      quantity: Number(item.used_qty) || Number(item.qty) || 1,
      rate: Number(item.rate) || 0,
      discount_per: Number(item.discount_per) || 0,
      discount: Number(item.discount) || 0,
      vat_per: Number(item.vat_per) || 0,
      vat_amnt: Number(item.vat_amnt) || 0,
      total_price: Number(item.total_price) || 0,
      available_qty: 0, 
      unit: item.product?.unit || ''
    })) || [],
    selectService: quotation.quotation_service_used && quotation.quotation_service_used.length > 0,
    service_items: quotation.quotation_service_used?.map((item: any) => ({
      service_id: item.service_id,
      _service_fallback: item.service?.service_name || item.service_name,
      qty: Number(item.qty) || 1,
      charge: Number(item.charge) || 0,
      discount: Number(item.discount) || 0,
      discount_value: Number(item.discount_amount) || 0,
      vat: Number(item.vat_per) || 0,
      vat_amnt: Number(item.vat_amnt) || 0,
      total: Number(item.total) || 0
    })) || [],
    service_total_amount: quotation.service_total_amount,
    service_total_discount: quotation.service_total_discount,
    service_total_vat: quotation.service_total_vat,
    quot_dis_service: quotation.quot_dis_service,
    sale_payment_amount: quotation.item_total_amount,
    sale_payment_type_id: '',
    service_payment_amount: quotation.service_total_amount,
    service_payment_type_id: '',
  }

  const handleSubmit = (data: QuotationFormValues) => {
    const payload = {
      ...data,
      sale_items: data.sale_items.map(item => ({
        ...item,
        quantity: item.quantity,
        rate: item.rate
      })),
      service_items: data.selectService ? data.service_items?.map(item => ({
        ...item,
        qty: item.qty,
        charge: item.charge
      })) : [],
      // Ensure specific keys are passed exactly as the backend expects to prevent PHP errors
      sale_payment_type_id: String(data.sale_payment_type_id),
      sale_payment_amount: data.sale_payment_amount,
      // Wrap in array to prevent "Trying to access array offset on int" in ServiceInvoiceService Line 84
      service_payment_type_id: data.selectService ? [String(data.service_payment_type_id || data.sale_payment_type_id)] : undefined,
      service_payment_amount: data.selectService ? data.service_payment_amount : undefined,
    }
    
    addToInvoice({ id: id, data: payload }, {
      onSuccess: () => {
        navigate({ to: '/inventory/quotation' })
      }
    })
  }

  return (
    <QuotationForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={isPending} mode="invoice" />
  )
}
