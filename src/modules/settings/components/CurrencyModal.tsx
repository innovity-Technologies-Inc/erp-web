import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { currencySchema, type CurrencyFormValues } from '../hooks/validation'
import { useCurrencyDetails, useStoreCurrency } from '../hooks/useCurrencies'
import { useUiStore } from '@/store/useUiStore'

interface CurrencyModalProps {
  isOpen: boolean
  onClose: () => void
  currencyId: number | null
}

export const CurrencyModal = ({ isOpen, onClose, currencyId }: CurrencyModalProps) => {
  const { mutate: storeCurrency, isPending: isSaving } = useStoreCurrency()
  const { showNotificationModal } = useUiStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      currency_name: '',
      icon: '',
    },
  })

  // Fetch details if ID is provided
  const { data: detailsData, isLoading: isLoadingDetails } = useCurrencyDetails(currencyId)

  // Prepopulate form when details are fetched
  useEffect(() => {
    if (isOpen) {
      if (currencyId && detailsData?.data) {
        const cur = detailsData.data
        reset({
          currency_name: cur.currency_name || '',
          icon: cur.icon || '',
        })
      } else {
        reset({
          currency_name: '',
          icon: '',
        })
      }
    }
  }, [isOpen, currencyId, detailsData, reset])

  const onSubmit = (data: CurrencyFormValues) => {
    const payload = {
      id: currencyId || undefined,
      currency_name: data.currency_name,
      icon: data.icon,
    }

    storeCurrency(payload, {
      onSuccess: (res: any) => {
        onClose()
        showNotificationModal(
          'Saved Successfully!',
          res.message || 'Currency details have been saved successfully.',
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to save currency.'
        showNotificationModal('Save Failed', msg, 'error')
      },
    })
  }

  const isPending = isSaving
  const isFetching = !!currencyId && isLoadingDetails

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currencyId ? 'Edit Currency' : 'Add New Currency'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending || isFetching}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending} disabled={isFetching}>
            {currencyId ? (
              <>
                <PenLine className="h-4 w-4" />
                Update
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      }
    >
      {isFetching ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Currency Name" error={errors.currency_name?.message} required>
            <input
              {...register('currency_name')}
              type="text"
              className="erp-input w-full"
              placeholder="e.g. US Dollar"
              autoComplete="off"
            />
          </FormField>

          <FormField label="Currency Symbol" error={errors.icon?.message} required>
            <input
              {...register('icon')}
              type="text"
              className="erp-input w-full"
              placeholder="e.g. $"
              autoComplete="off"
            />
          </FormField>
        </form>
      )}
    </Modal>
  )
}
