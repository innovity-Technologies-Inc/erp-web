import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine, LogOut } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { attendanceSchema } from '../hooks/validation'
import type { AttendanceFormValues } from '../hooks/validation'
import {
  useCreateAttendance,
  useUpdateAttendance,
  useEmployeeSelect2,
  useServerTime,
} from '../hooks/useAttendances'
import { useUiStore } from '@/store/useUiStore'

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  attendanceId: number | null
  mode: 'create' | 'edit' | 'sign_out'
  initialData?: any | null
}

const convertToDateTimeLocal = (dateTime: string | null | undefined) => {
  if (!dateTime) return ''
  return dateTime.replace(' ', 'T').substring(0, 16)
}

export const AttendanceModal = ({
  isOpen,
  onClose,
  attendanceId,
  mode,
  initialData,
}: AttendanceModalProps) => {
  const { mutate: createAttendance, isPending: isCreating } = useCreateAttendance()
  const { mutate: updateAttendance, isPending: isUpdating } = useUpdateAttendance()
  const { showNotificationModal } = useUiStore()

  // Select2 Employee options
  const { data: employeesData } = useEmployeeSelect2()
  const employeeOptions = useMemo(() => {
    return (employeesData || []).map((emp: any) => ({
      value: emp.id,
      label: emp.text || emp.name,
    }))
  }, [employeesData])

  // Server time for defaulting values
  const { refetch: refetchServerTime } = useServerTime()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema) as any,
    defaultValues: {
      employee_id: '',
      date: '',
      sign_in: '',
      sign_out: '',
    },
  })

  // Synchronize form on open
  useEffect(() => {
    if (isOpen) {
      refetchServerTime().then((res) => {
        const timeData = res.data
        const today = timeData?.current_date || new Date().toISOString().split('T')[0]
        const nowTime = timeData?.current_time ? convertToDateTimeLocal(timeData.current_time) : convertToDateTimeLocal(new Date().toISOString())

        if (mode === 'create') {
          reset({
            employee_id: '',
            date: today,
            sign_in: nowTime,
            sign_out: null,
          })
        } else if (mode === 'edit' && initialData) {
          reset({
            employee_id: initialData.employee_id || '',
            date: initialData.date || '',
            sign_in: convertToDateTimeLocal(initialData.sign_in),
            sign_out: convertToDateTimeLocal(initialData.sign_out) || null,
          })
        } else if (mode === 'sign_out' && initialData) {
          reset({
            employee_id: initialData.employee_id || '',
            date: initialData.date || '',
            sign_in: convertToDateTimeLocal(initialData.sign_in),
            sign_out: convertToDateTimeLocal(initialData.sign_out) || nowTime,
          })
        }
      })
    }
  }, [isOpen, mode, initialData, reset, refetchServerTime])

  const onSubmit = (data: AttendanceFormValues) => {
    const payload = {
      employee_id: data.employee_id,
      date: data.date,
      sign_in: data.sign_in,
      sign_out: data.sign_out || null,
    }

    if (mode === 'create') {
      createAttendance(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Saved Successfully!',
            'Attendance record has been added successfully.',
            'success'
          )
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || err.message || 'An error occurred.'
          showNotificationModal('Error', errMsg, 'error')
        },
      })
    } else {
      // update or sign_out mode
      if (attendanceId) {
        updateAttendance(
          { id: attendanceId, ...payload },
          {
            onSuccess: () => {
              onClose()
              showNotificationModal(
                'Updated Successfully!',
                mode === 'sign_out'
                  ? 'Employee signed out successfully.'
                  : 'Attendance details updated successfully.',
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
  }

  const isPending = isCreating || isUpdating

  // Header Title mapping
  const title = useMemo(() => {
    if (mode === 'create') return 'Add Attendance'
    if (mode === 'edit') return 'Edit Attendance'
    return 'Sign Out Attendance'
  }, [mode])

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
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {mode === 'create' ? (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            ) : mode === 'edit' ? (
              <>
                <PenLine className="h-4 w-4" />
                Update
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Sign Out
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hide Employee ID selection in Quick Sign Out mode */}
        {mode !== 'sign_out' ? (
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
        ) : null}

        {/* Hide Date in Quick Sign Out mode */}
        {mode !== 'sign_out' ? (
          <FormField label="Date" error={errors.date?.message} required>
            <input
              {...register('date')}
              type="date"
              className="erp-input w-full"
            />
          </FormField>
        ) : null}

        {/* Sign In is ReadOnly in Quick Sign Out mode */}
        <FormField label="Sign In" error={errors.sign_in?.message} required>
          <input
            {...register('sign_in')}
            type="datetime-local"
            className="erp-input w-full disabled:bg-gray-50 disabled:text-gray-400"
            disabled={mode === 'sign_out'}
          />
        </FormField>

        {/* Sign Out is hidden in create mode */}
        {mode !== 'create' ? (
          <FormField label="Sign Out" error={errors.sign_out?.message} required={mode === 'sign_out'}>
            <input
              {...register('sign_out')}
              type="datetime-local"
              className="erp-input w-full"
            />
          </FormField>
        ) : null}
      </form>
    </Modal>
  )
}
