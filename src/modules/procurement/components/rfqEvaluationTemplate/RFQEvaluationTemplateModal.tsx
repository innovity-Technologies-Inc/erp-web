import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine, Plus, Trash2, CheckCircle2, AlertCircle, Award } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { rfqEvaluationTemplateSchema } from '../../hooks/validation'
import type { RFQEvaluationTemplateFormValues } from '../../hooks/validation'
import {
  useCreateRFQEvaluationTemplate,
  useUpdateRFQEvaluationTemplate,
} from '../../hooks/useRFQEvaluationTemplates'
import { useUiStore } from '@/store/useUiStore'
import type { RFQEvaluationTemplate } from '../../api/types'
import { clsx } from 'clsx'

interface RFQEvaluationTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templateToEdit?: RFQEvaluationTemplate | null
}

const categoryOptions = [
  { value: 'technical', label: 'Technical' },
  { value: 'commercial', label: 'Commercial' },
]

export const RFQEvaluationTemplateModal = ({
  isOpen,
  onClose,
  templateToEdit,
}: RFQEvaluationTemplateModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeTemplate, isPending: isStoring } = useCreateRFQEvaluationTemplate()
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateRFQEvaluationTemplate()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RFQEvaluationTemplateFormValues>({
    resolver: zodResolver(rfqEvaluationTemplateSchema) as any,
    defaultValues: {
      name: '',
      technical_weightage: 50,
      commercial_weightage: 50,
      criteria: [
        { name: 'Product Technical Specifications & Quality', category: 'technical', max_score: 50 },
        { name: 'Warranty & After-Sales Support Track Record', category: 'technical', max_score: 50 },
        { name: 'Total Price Competitiveness', category: 'commercial', max_score: 70 },
        { name: 'Payment Terms & Discount Flexibility', category: 'commercial', max_score: 30 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  })

  const techWeight = useWatch({ control, name: 'technical_weightage' }) ?? 50
  const commWeight = useWatch({ control, name: 'commercial_weightage' }) ?? 50

  const totalWeight = useMemo(() => {
    const t = parseFloat(String(techWeight)) || 0
    const c = parseFloat(String(commWeight)) || 0
    return t + c
  }, [techWeight, commWeight])

  const isWeightValid = Math.abs(totalWeight - 100) < 0.01

  useEffect(() => {
    if (isOpen) {
      if (templateToEdit) {
        reset({
          name: templateToEdit.name || '',
          technical_weightage: Number(templateToEdit.technical_weightage) || 50,
          commercial_weightage: Number(templateToEdit.commercial_weightage) || 50,
          criteria: Array.isArray(templateToEdit.criteria) && templateToEdit.criteria.length > 0
            ? templateToEdit.criteria.map((c) => ({
                name: c.name,
                category: c.category || 'technical',
                max_score: Number(c.max_score) || 50,
              }))
            : [
                { name: 'Technical Compliance', category: 'technical', max_score: 100 },
                { name: 'Commercial Competitiveness', category: 'commercial', max_score: 100 },
              ],
        })
      } else {
        reset({
          name: '',
          technical_weightage: 50,
          commercial_weightage: 50,
          criteria: [
            { name: 'Product Technical Specifications & Quality', category: 'technical', max_score: 50 },
            { name: 'Warranty & After-Sales Support Track Record', category: 'technical', max_score: 50 },
            { name: 'Total Price Competitiveness', category: 'commercial', max_score: 70 },
            { name: 'Payment Terms & Discount Flexibility', category: 'commercial', max_score: 30 },
          ],
        })
      }
    }
  }, [isOpen, templateToEdit, reset])

  const onSubmit = (data: RFQEvaluationTemplateFormValues) => {
    const payload = {
      name: data.name.trim(),
      technical_weightage: Number(data.technical_weightage),
      commercial_weightage: Number(data.commercial_weightage),
      criteria: data.criteria.map((c) => ({
        name: c.name.trim(),
        category: c.category,
        max_score: Number(c.max_score),
      })),
    }

    if (templateToEdit) {
      updateTemplate(
        { uuid: templateToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Template Updated!',
              `Evaluation template "${payload.name}" has been updated successfully.`,
              'success'
            )
          },
          onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update template.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeTemplate(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Template Created!',
            `Evaluation template "${payload.name}" has been created successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to create template.'
          showNotificationModal('Create Failed', message, 'error')
        },
      })
    }
  }

  const isPending = isStoring || isUpdating
  const weightageError = errors.commercial_weightage?.message || (errors as any)?.weightages?.message

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={templateToEdit ? 'Edit RFQ Evaluation Template' : 'Create RFQ Evaluation Template'}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending} disabled={!isWeightValid}>
            {templateToEdit ? (
              <>
                <PenLine className="h-4 w-4 mr-1.5" />
                Update Template
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save Template
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Template Master Info */}
        <div className="space-y-4">
          <FormField label="Template Name" error={errors.name?.message} required>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Standard Goods Evaluation Scorecard"
              className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30"
            />
          </FormField>

          {/* Weightages Grid */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Scoring Weightages (Must equal 100%)
              </span>
              <div
                className={clsx(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  isWeightValid
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                )}
              >
                {isWeightValid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total: {totalWeight}% (Valid)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Total: {totalWeight}% (Must be 100%)</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Technical Weightage (%)" error={errors.technical_weightage?.message} required>
                <div className="relative">
                  <input
                    {...register('technical_weightage')}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="50"
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                </div>
              </FormField>

              <FormField label="Commercial Weightage (%)" error={errors.commercial_weightage?.message} required>
                <div className="relative">
                  <input
                    {...register('commercial_weightage')}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="50"
                    className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                </div>
              </FormField>
            </div>

            {weightageError && (
              <p className="text-rose-500 text-xs font-medium">{weightageError}</p>
            )}
          </div>
        </div>

        {/* Dynamic Evaluation Criteria Builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-gray-800">Evaluation Criteria Breakdown</h3>
            </div>
            <button
              type="button"
              onClick={() => append({ name: '', category: 'technical', max_score: 50 })}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Criterion
            </button>
          </div>

          {errors.criteria?.message && (
            <p className="text-rose-500 text-xs font-medium">{errors.criteria.message}</p>
          )}

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {fields.map((field, index) => {
              const rowError = errors.criteria?.[index]
              return (
                <div
                  key={field.id}
                  className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-gray-300 transition-all flex flex-col md:flex-row items-start md:items-center gap-3"
                >
                  <span className="text-xs font-bold text-gray-400 w-6 shrink-0 text-center">
                    #{index + 1}
                  </span>

                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      {...register(`criteria.${index}.name`)}
                      type="text"
                      placeholder="Criterion Name (e.g. Specification Compliance, Delivery Speed)"
                      className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    {rowError?.name && (
                      <span className="text-rose-500 text-[10px] block">{rowError.name.message}</span>
                    )}
                  </div>

                  <div className="w-36 shrink-0 space-y-1">
                    <Controller
                      control={control}
                      name={`criteria.${index}.category`}
                      render={({ field: catField }) => (
                        <Select2
                          options={categoryOptions}
                          value={catField.value}
                          onChange={(val) => catField.onChange(val)}
                          placeholder="Category"
                        />
                      )}
                    />
                  </div>

                  <div className="w-28 shrink-0 space-y-1">
                    <div className="relative">
                      <input
                        {...register(`criteria.${index}.max_score`)}
                        type="number"
                        min="1"
                        placeholder="Max Score"
                        className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30 pr-8"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">Pts</span>
                    </div>
                    {rowError?.max_score && (
                      <span className="text-rose-500 text-[10px] block">{rowError.max_score.message}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    title="Remove Criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </form>
    </Modal>
  )
}
