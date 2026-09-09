import { useEffect, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine, Plus, X } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { termsLibrarySchema } from '../../hooks/validation'
import type { TermsLibraryFormValues } from '../../hooks/validation'
import {
  useCreateTermsLibrary,
  useUpdateTermsLibrary,
} from '../../hooks/useTermsLibrary'
import { useUiStore } from '@/store/useUiStore'
import type { TermsLibrary } from '../../api/types'

interface TermsLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  termToEdit?: TermsLibrary | null
}

const typeOptions = [
  { value: 'commercial', label: 'Commercial Terms' },
  { value: 'technical', label: 'Technical Specifications' },
  { value: 'payment', label: 'Payment Terms' },
  { value: 'delivery', label: 'Delivery Terms' },
  { value: 'legal', label: 'Legal & Compliance' },
  { value: 'general', label: 'General Clause' },
]

const responseTypeOptions = [
  { value: 'boolean', label: 'Yes / No (Boolean Acceptance)' },
  { value: 'text', label: 'Text Input (Custom Description)' },
  { value: 'number', label: 'Numeric Value (Days, Quantity, Years)' },
  { value: 'select', label: 'Dropdown Options (Multiple Choices)' },
]

const statusOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export const TermsLibraryModal = ({
  isOpen,
  onClose,
  termToEdit,
}: TermsLibraryModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeTerm, isPending: isStoring } = useCreateTermsLibrary()
  const { mutate: updateTerm, isPending: isUpdating } = useUpdateTermsLibrary()

  const [optionInput, setOptionInput] = useState('')
  const [optionsList, setOptionsList] = useState<string[]>([])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TermsLibraryFormValues>({
    resolver: zodResolver(termsLibrarySchema) as any,
    defaultValues: {
      code: '',
      title: '',
      description: '',
      type: 'general',
      response_type: 'boolean',
      options: [],
      is_active: true,
    },
  })

  const selectedResponseType = useWatch({ control, name: 'response_type' })

  useEffect(() => {
    if (isOpen) {
      if (termToEdit) {
        const opts = Array.isArray(termToEdit.options) ? termToEdit.options : []
        setOptionsList(opts)
        reset({
          code: termToEdit.code || '',
          title: termToEdit.title || '',
          description: termToEdit.description || '',
          type: (termToEdit.type as any) || 'general',
          response_type: termToEdit.response_type || 'boolean',
          options: opts,
          is_active: termToEdit.is_active ?? true,
        })
      } else {
        setOptionsList([])
        setOptionInput('')
        reset({
          code: '',
          title: '',
          description: '',
          type: 'general',
          response_type: 'boolean',
          options: [],
          is_active: true,
        })
      }
    }
  }, [isOpen, termToEdit, reset])

  const handleAddOption = () => {
    const trimmed = optionInput.trim()
    if (!trimmed) return
    if (!optionsList.includes(trimmed)) {
      const updated = [...optionsList, trimmed]
      setOptionsList(updated)
      setValue('options', updated)
    }
    setOptionInput('')
  }

  const handleRemoveOption = (index: number) => {
    const updated = optionsList.filter((_, i) => i !== index)
    setOptionsList(updated)
    setValue('options', updated)
  }

  const onSubmit = (data: TermsLibraryFormValues) => {
    const payload = {
      code: data.code.trim().toUpperCase(),
      title: data.title.trim(),
      description: data.description?.trim() || null,
      type: data.type,
      response_type: data.response_type,
      options: data.response_type === 'select' ? optionsList : null,
      is_active: Boolean(data.is_active),
    }

    if (termToEdit) {
      updateTerm(
        { uuid: termToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Term Updated!',
              `Clause "${payload.title}" (${payload.code}) has been updated successfully.`,
              'success'
            )
          },
          onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update term.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeTerm(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Term Created!',
            `Clause "${payload.title}" (${payload.code}) has been added successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to create term.'
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
      title={termToEdit ? 'Edit Terms & Conditions Clause' : 'Add Terms & Conditions Clause'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {termToEdit ? (
              <>
                <PenLine className="h-4 w-4 mr-1.5" />
                Update Clause
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save Clause
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Clause Code" error={errors.code?.message} required>
            <input
              {...register('code')}
              type="text"
              placeholder="e.g. TL-DELIVERY-01"
              className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] uppercase outline-none focus:ring-1 focus:ring-primary/30"
            />
          </FormField>

          <FormField label="Clause Title" error={errors.title?.message} required>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Delivery Lead Time"
              className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
            />
          </FormField>

          <FormField label="Category Type" error={errors.type?.message} required>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select2
                  options={typeOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Select Category"
                />
              )}
            />
          </FormField>

          <FormField label="Expected Response Type" error={errors.response_type?.message} required>
            <Controller
              control={control}
              name="response_type"
              render={({ field }) => (
                <Select2
                  options={responseTypeOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Select Response Type"
                />
              )}
            />
          </FormField>

          {/* Dynamic Choices Options if select is chosen */}
          {selectedResponseType === 'select' && (
            <div className="md:col-span-2 space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 block">
                Allowed Choices / Dropdown Options
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                  placeholder="Type an option and press Add (e.g. Net 15, Net 30, Net 60)"
                  className="flex-1 h-[36px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="h-[36px] px-3 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              {optionsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {optionsList.map((opt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 shadow-2xs"
                    >
                      <span>{opt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-gray-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <FormField label="Status" error={errors.is_active?.message}>
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Select2
                    options={statusOptions}
                    value={String(field.value)}
                    onChange={(val) => field.onChange(val === 'true')}
                    placeholder="Select Status"
                  />
                )}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Clause Description & Details" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Enter complete contractual clause description or instructions for bidding vendors..."
                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              />
            </FormField>
          </div>
        </div>
      </form>
    </Modal>
  )
}
