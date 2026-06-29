import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Select2 } from '@/components/Select/Select2'
import { FormField } from '@/components/Form/FormField'
import { 
  useStoreFinancialYear, 
  useUpdateFinancialYear, 
  useFinancialYearData 
} from '../hooks/useFinancialYear'
import { clsx } from 'clsx'

const financialYearSchema = z.object({
  year: z.string().min(1, 'Financial Year is required'),
  start_date: z.string().min(1, 'Start Date is required'),
  end_date: z.string().min(1, 'End Date is required'),
  status: z.coerce.number()
}).refine(data => {
  if (!data.start_date || !data.end_date) return true
  return data.start_date < data.end_date
}, {
  message: 'End date must be greater than Start date',
  path: ['end_date']
})

type FinancialYearFormValues = z.infer<typeof financialYearSchema>

interface FinancialYearModalProps {
  isOpen: boolean
  onClose: () => void
  editId: number | null
}

export const FinancialYearModal = ({ isOpen, onClose, editId }: FinancialYearModalProps) => {
  const { mutate: storeYear, isPending: isStoring } = useStoreFinancialYear()
  const { mutate: updateYear, isPending: isUpdating } = useUpdateFinancialYear()
  
  // Fetch details only if we are in Edit mode
  const { data: detailsResponse, isLoading: isFetching } = useFinancialYearData(editId)
  const initialData = detailsResponse?.data

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FinancialYearFormValues>({
    resolver: zodResolver(financialYearSchema) as any,
    defaultValues: {
      year: '',
      start_date: '',
      end_date: '',
      status: 1
    }
  })

  // Dynamic list of year options (5 years back to 5 years forward)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const options = []
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      options.push({ value: String(i), label: String(i) })
    }
    return options
  }, [])

  const statusOptions = useMemo(() => [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ], [])

  // Reset form when modal opens/closes or initialData is fetched
  useEffect(() => {
    if (isOpen) {
      if (editId && initialData) {
        reset({
          year: String(initialData.year || ''),
          start_date: initialData.start_date || '',
          end_date: initialData.end_date || '',
          status: initialData.status !== undefined ? Number(initialData.status) : 1
        })
      } else if (!editId) {
        reset({
          year: '',
          start_date: '',
          end_date: '',
          status: 1
        })
      }
    }
  }, [isOpen, editId, initialData, reset])

  const onSubmit = (data: FinancialYearFormValues) => {
    const payload = {
      ...data,
      status: Number(data.status)
    }

    if (editId) {
      updateYear(
        { id: editId, data: payload },
        {
          onSuccess: () => {
            onClose()
          }
        }
      )
    } else {
      storeYear(payload, {
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
      title={editId ? 'Edit Financial Year' : 'Add Financial Year'}
      showCloseButton={true}
      size="md"
      // We render the footer buttons directly inside the form on a white background to match the mockup exactly
    >
      {isLoadingDetails ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading year details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-poppins text-[#475569]">
          
          {/* Financial Year Field */}
          <FormField label="Financial Year" error={errors.year?.message} required>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <Select2
                  options={yearOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Select Financial Year"
                  className="w-full"
                />
              )}
            />
          </FormField>

          {/* Start Date Field */}
          <FormField label="Start Date" error={errors.start_date?.message} required>
            <div className="relative">
              <input
                {...register('start_date')}
                type="date"
                className={clsx(
                  "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium text-[#475569] focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300",
                  errors.start_date ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200"
                )}
                placeholder="Enter Financial Year Start Date"
              />
            </div>
          </FormField>

          {/* End Date Field */}
          <FormField label="End Date" error={errors.end_date?.message} required>
            <div className="relative">
              <input
                {...register('end_date')}
                type="date"
                className={clsx(
                  "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium text-[#475569] focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300",
                  errors.end_date ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200"
                )}
                placeholder="Enter Financial Year End Date"
              />
            </div>
          </FormField>

          {/* Status Field */}
          <FormField label="Status">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select2
                  options={statusOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Select Status"
                  className="w-full"
                />
              )}
            />
          </FormField>

          {/* Form Actions - Rendered inside form body for seamless white background */}
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
              className="px-8 h-10 text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-[13px]"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              <span>{isPending ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
