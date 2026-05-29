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
    items: invoiceData.data.service_invoice_details?.map((detail: any) => ({
      ...detail,
      service_id: detail.service_id?.toString()
    })) || []
  } : null

  return <ServiceInvoiceForm initialData={initialData} isEdit={true} />
}
