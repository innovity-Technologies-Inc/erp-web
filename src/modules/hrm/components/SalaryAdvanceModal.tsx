import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { salaryAdvanceSchema } from '../hooks/validation'
import type { SalaryAdvanceFormValues } from '../hooks/validation'
import { useEmployeeSelect2 } from '../hooks/useAttendances'
import {
  useSalaryAdvance,
  useCreateSalaryAdvance,
  useUpdateSalaryAdvance,
} from '../hooks/useSalaryAdvances'
import type { SalaryAdvance } from '../api/types'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { useUiStore } from '@/store/useUiStore'

interface SalaryAdvanceModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  salaryAdvanceId?: number | null
  initialData?: SalaryAdvance | null
}

const monthsList = [
  { value: 'January', label: 'January' },
  { value: 'February', label: 'February' },
  { value: 'March', label: 'March' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'June', label: 'June' },
  { value: 'July', label: 'July' },
  { value: 'August', label: 'August' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'October' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' },
]

const currentYear = new Date().getFullYear()
const yearsList = Array.from({ length: 10 }, (_, i) => {
  const yr = String(currentYear + i)
  return { value: yr, label: yr }
})

interface InternalFormValues extends SalaryAdvanceFormValues {
  salary_month_name: string
  salary_month_year: string
}

export const SalaryAdvanceModal = ({
  isOpen,
  onClose,
  mode,
  salaryAdvanceId,
  initialData,
}: SalaryAdvanceModalProps) => {
  const { showNotificationModal } = useUiStore()

  // Get Employee options for Select2
  const { data: employeesData } = useEmployeeSelect2()
  const employeeOptions = useMemo(() => {
    return (employeesData || []).map((emp: any) => ({
      value: String(emp.id),
      label: emp.text || emp.name,
    }))
  }, [employeesData])

  // Queries & Mutations
  const { data: detailData, isLoading: isDetailLoading } = useSalaryAdvance(
    salaryAdvanceId || 0,
    isOpen && mode === 'edit' && !!salaryAdvanceId
  )

  const { mutate: createSalaryAdvance, isPending: isCreating } = useCreateSalaryAdvance()
  const { mutate: updateSalaryAdvance, isPending: isUpdating } = useUpdateSalaryAdvance()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InternalFormValues>({
    resolver: zodResolver(salaryAdvanceSchema) as any,
    defaultValues: {
      employee_id: '',
      amount: '',
      salary_month: '',
      salary_month_name: '',
      salary_month_year: '',
    } as any,
  })

  const watchMonth = watch('salary_month_name')
  const watchYear = watch('salary_month_year')

  // Synchronize form values on open or data change
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        const defaultMonthName = monthsList[new Date().getMonth()].value
        const defaultYearStr = String(new Date().getFullYear())
        reset({
          employee_id: '',
          amount: '',
          salary_month: `${defaultMonthName} ${defaultYearStr}`,
          salary_month_name: defaultMonthName,
          salary_month_year: defaultYearStr,
        } as any)
      } else if (mode === 'edit' && detailData?.data && detailData.data.id === salaryAdvanceId) {
        const advance = detailData.data
        const [mName, yName] = (advance.salary_month || '').split(' ')
        reset({
          employee_id: String(advance.employee_id),
          amount: String(advance.amount),
          salary_month: advance.salary_month,
          salary_month_name: mName || '',
          salary_month_year: yName || '',
        } as any)
      }
    }
  }, [isOpen, mode, detailData, salaryAdvanceId, reset])

  // Reset form to empty on close to prevent cached stale values showing on next open
  useEffect(() => {
    if (!isOpen) {
      reset({
        employee_id: '',
        amount: '',
        salary_month: '',
        salary_month_name: '',
        salary_month_year: '',
      } as any)
    }
  }, [isOpen, reset])

  const onSubmit = (data: InternalFormValues) => {
    const payload = {
      employee_id: data.employee_id,
      amount: data.amount,
      salary_month: `${data.salary_month_name} ${data.salary_month_year}`,
    }

    if (mode === 'create') {
      createSalaryAdvance(payload, {
        onSuccess: (res: any) => {
          onClose()
          showNotificationModal(
            'Saved Successfully!',
            res?.message || 'Salary advance has been recorded successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || err.message || 'An error occurred.'
          showNotificationModal('Error', errMsg, 'error')
        },
      })
    } else if (mode === 'edit' && salaryAdvanceId) {
      updateSalaryAdvance(
        { id: salaryAdvanceId, ...payload },
        {
          onSuccess: (res: any) => {
            onClose()
            showNotificationModal(
              'Updated Successfully!',
              res?.message || 'Salary advance details updated successfully.',
              'success'
            )
          },
          onError: (err: any) => {
            const errMsg = err.response?.data?.message || err.message || 'An error occurred.'
            showNotificationModal('Error', errMsg, 'error')
          },
        }
      )
    }
  }

  const isPending = isCreating || isUpdating || (mode === 'edit' && isDetailLoading)
  const title = mode === 'create' ? 'Add Salary Advance' : 'Edit Salary Advance'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit as any)} loading={isPending}>
            {mode === 'create' ? (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            ) : (
              <>
                <PenLine className="h-4 w-4" />
                Update
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <FormField label="Employee Name" error={errors.employee_id?.message} required>
          <Controller
            name="employee_id"
            control={control}
            render={({ field }) => (
              <Select2
                options={employeeOptions}
                value={field.value as any}
                onChange={(val) => field.onChange(val)}
                className="w-full"
                placeholder="Select Employee"
                menuPortalTarget={document.body}
              />
            )}
          />
        </FormField>

        <FormField label="Amount" error={errors.amount?.message} required>
          <input
            {...register('amount')}
            type="number"
            placeholder="Amount"
            className="erp-input w-full font-poppins"
          />
        </FormField>

        <FormField label="Salary Month" error={errors.salary_month?.message} required>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="salary_month_name"
              control={control}
              render={({ field }) => (
                <Select2
                  options={monthsList}
                  value={field.value as any}
                  onChange={(val) => {
                    field.onChange(val)
                    setValue('salary_month', `${val} ${watchYear}`)
                  }}
                  placeholder="Select Month"
                  menuPortalTarget={document.body}
                />
              )}
            />

            <Controller
              name="salary_month_year"
              control={control}
              render={({ field }) => (
                <Select2
                  options={yearsList}
                  value={field.value as any}
                  onChange={(val) => {
                    field.onChange(val)
                    setValue('salary_month', `${watchMonth} ${val}`)
                  }}
                  placeholder="Select Year"
                  menuPortalTarget={document.body}
                />
              )}
            />
          </div>
          <input type="hidden" {...register('salary_month')} />
        </FormField>
      </form>
    </Modal>
  )
}
