import { useParams } from '@tanstack/react-router'
import { ServiceInvoiceForm } from '../../components/ServiceInvoiceForm'
import { useServiceInvoice } from '../../hooks/useService'
import { LoadingState } from '@/components/Loading/LoadingState'

export const ServiceInvoiceEditPage = () => {
  const { id } = useParams({ from: '/_authenticated/inventory/service-invoice/edit/$id' })
  const { data: invoiceData, isLoading } = useServiceInvoice(id)

  if (isLoading) {
    return <LoadingState message="Loading service invoice details..." />
  }

  const initialData = invoiceData?.data ? {
    ...invoiceData.data,
    customer_id: invoiceData.data.customer_id?.toString(),
    employee_id: invoiceData.data.employee_id?.toString(),
    invoice_discount: Number(invoiceData.data.invoice_discount) || 0,
    shipping_cost: Number(invoiceData.data.shipping_cost) || 0,
    paid_amount: Number(invoiceData.data.paid_amount) || 0,
    previous: Number(invoiceData.data.previous) || 0,
    payment_type_id: invoiceData.data.payment_type_id?.toString(),
    items: invoiceData.data.service_invoice_details?.map((detail: any) => ({
      ...detail,
      service_id: detail.service_id?.toString(),
      qty: Number(detail.qty) || 0,
      charge: Number(detail.charge) || 0,
      discount: Number(detail.discount) || 0,
      discount_value: Number(detail.discount_amount) || Number(detail.discount_value) || 0,
      vat: Number(detail.vat) || 0,
      vat_amnt: Number(detail.vat_amnt) || 0,
      total: Number(detail.total) || 0
    })) || []
  } : null

  return <ServiceInvoiceForm initialData={initialData} isEdit={true} />
}
