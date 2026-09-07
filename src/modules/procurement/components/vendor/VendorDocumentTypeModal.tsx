import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { vendorDocumentTypeSchema } from '../../hooks/validation'
import type { VendorDocumentTypeFormValues } from '../../hooks/validation'
import {
  useCreateVendorDocumentType,
  useUpdateVendorDocumentType,
} from '../../hooks/useVendorDocumentTypes'
import { useUiStore } from '@/store/useUiStore'
import type { VendorDocumentType } from '../../api/types'

interface VendorDocumentTypeModalProps {
  isOpen: boolean
  onClose: () => void
  documentTypeToEdit?: VendorDocumentType | null
}

const requirementOptions = [
  { value: 'true', label: 'Mandatory' },
  { value: 'false', label: 'Optional' },
]

export const VendorDocumentTypeModal = ({
  isOpen,
  onClose,
  documentTypeToEdit,
}: VendorDocumentTypeModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeDocType, isPending: isStoring } = useCreateVendorDocumentType()
  const { mutate: updateDocType, isPending: isUpdating } = useUpdateVendorDocumentType()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VendorDocumentTypeFormValues>({
    resolver: zodResolver(vendorDocumentTypeSchema) as any,
    defaultValues: {
      name: '',
      code: '',
      is_required: true,
    },
  })

  const watchedCode = watch('code')

  useEffect(() => {
    if (isOpen) {
      if (documentTypeToEdit) {
        reset({
          name: documentTypeToEdit.name || '',
          code: documentTypeToEdit.code || '',
          is_required: documentTypeToEdit.is_required ?? true,
        })
      } else {
        reset({
          name: '',
          code: '',
          is_required: true,
        })
      }
    }
  }, [isOpen, documentTypeToEdit, reset])

  // Helper to auto-generate code from name on blur if code is empty
  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!watchedCode && e.target.value) {
      const generatedCode = e.target.value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      setValue('code', generatedCode, { shouldValidate: true })
    }
  }

  const onSubmit = (data: VendorDocumentTypeFormValues) => {
    const payload = {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      is_required: Boolean(data.is_required),
    }

    if (documentTypeToEdit) {
      updateDocType(
        { uuid: documentTypeToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Document Type Updated!',
              `Document type "${payload.name}" updated successfully.`,
              'success'
            )
          },
          onError: (error: any) => {
            const message =
              error.response?.data?.message || error.message || 'Failed to update document type.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeDocType(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Document Type Created!',
            `Document type "${payload.name}" added successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message =
            error.response?.data?.message || error.message || 'Failed to create document type.'
          showNotificationModal('Create Failed', message, 'error')
        },
      })
    }
  }

  const isPending = isStoring || isUpdating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentTypeToEdit ? 'Edit Document Type' : 'Add Document Type'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {documentTypeToEdit ? (
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Document Name */}
        <FormField label="Document Name" error={errors.name?.message} required>
          <input
            {...register('name')}
            onBlur={handleNameBlur}
            type="text"
            className="erp-input w-full"
            placeholder="Enter document name"
            autoComplete="off"
            autoFocus
          />
        </FormField>

        {/* Document Code */}
        <FormField
          label="Document Code"
          error={errors.code?.message}
          required
        >
          <input
            {...register('code')}
            type="text"
            className="erp-input w-full uppercase font-mono text-sm"
            placeholder="Enter document code"
            autoComplete="off"
          />
        </FormField>

        {/* Compliance Requirement */}
        <FormField label="Compliance Requirement" error={errors.is_required?.message} required>
          <Controller
            name="is_required"
            control={control}
            render={({ field }) => (
              <Select2
                options={requirementOptions}
                value={String(field.value)}
                onChange={(val) => field.onChange(val === 'true')}
                placeholder="Select requirement"
              />
            )}
          />
        </FormField>
      </form>
    </Modal>
  )
}
