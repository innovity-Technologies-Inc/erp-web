import { useNavigate } from '@tanstack/react-router'
import { QuotationForm } from './components/QuotationForm'
import { useCreateQuotation } from '../../hooks/useQuotation'
import type { QuotationFormValues } from './components/schema'

export const CreateQuotationPage = () => {
  const navigate = useNavigate()
  const { mutate: createQuotation, isPending } = useCreateQuotation()

  const handleSubmit = (data: QuotationFormValues) => {
    // Format data to match backend expectation
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
      })) : []
    }
    
    createQuotation(payload, {
      onSuccess: () => {
        navigate({ to: '/inventory/quotation' })
      }
    })
  }

  return (
    <QuotationForm onSubmit={handleSubmit} isSubmitting={isPending} mode="create" />
  )
}
