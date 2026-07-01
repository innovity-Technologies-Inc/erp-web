import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PenLine, Save } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { FormField } from '@/components/Form/FormField'
import { clsx } from 'clsx'
import { 
  useStorePaymentMethod, 
  useUpdatePaymentMethod, 
  usePaymentMethodData 
} from '../hooks/usePaymentMethod'

const paymentMethodSchema = z.object({
  head_name: z.string().min(1, 'Payment Method Name is required'),
})

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  editId: number | null
}

export const PaymentMethodModal = ({ isOpen, onClose, editId }: PaymentMethodModalProps) => {
  const { mutate: storeMethod, isPending: isStoring } = useStorePaymentMethod()
  const { mutate: updateMethod, isPending: isUpdating } = useUpdatePaymentMethod()
  
  // Fetch details only if we are in Edit mode
  const { data: detailsResponse, isLoading: isFetching } = usePaymentMethodData(editId)
  const initialData = detailsResponse?.data

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema) as any,
    defaultValues: {
      head_name: '',
    }
  })

  // Reset form when modal opens/closes or initialData is fetched
  useEffect(() => {
    if (isOpen) {
      if (editId && initialData) {
        reset({
          head_name: initialData.head_name || '',
        })
      } else if (!editId) {
        reset({
          head_name: '',
        })
      }
    }
  }, [isOpen, editId, initialData, reset])

  const onSubmit = (data: PaymentMethodFormValues) => {
    if (editId) {
      updateMethod(
        { id: editId, data },
        {
          onSuccess: () => {
            onClose()
          }
        }
      )
    } else {
      storeMethod(data, {
        onSuccess: () => {
          onClose()
        }
      })
    }
  }

  const isPending = isStoring || isUpdating
  const isLoadingDetails = !!editId && isFetching

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Edit Payment Method' : 'Add Payment Method'}
      showCloseButton={true}
      size="md"
    >
      {isLoadingDetails ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-poppins text-[#475569]">
          
          {/* Payment Method Name Field */}
          <FormField label="Payment Method Name" error={errors.head_name?.message} required>
            <div className="relative">
              <input
                {...register('head_name')}
                type="text"
                className={clsx(
                  "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium text-[#475569] focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300",
                  errors.head_name ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200"
                )}
                placeholder="Enter Payment Method Name"
              />
            </div>
          </FormField>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 h-10 rounded-lg hover:bg-gray-200 bg-[#f1f3f7] text-[#475569] border border-transparent text-[13px] font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 h-10 text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 bg-[#0d7a50] hover:bg-[#0a6642] disabled:opacity-50 text-[13px]"
            >
              {editId ? (
                <>
                  <PenLine className="h-4 w-4" strokeWidth={2.5} />
                  <span>{isPending ? 'Updating...' : 'Update'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" strokeWidth={2.5} />
                  <span>{isPending ? 'Saving...' : 'Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
