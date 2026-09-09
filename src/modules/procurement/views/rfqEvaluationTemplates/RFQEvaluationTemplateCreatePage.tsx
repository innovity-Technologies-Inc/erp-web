import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Scale,
} from 'lucide-react'
import {
  rfqEvaluationTemplateSchema,
  type RFQEvaluationTemplateFormValues,
} from '../../hooks/validation'
import { useCreateRFQEvaluationTemplate } from '../../hooks/useRFQEvaluationTemplates'
import { Select2 } from '@/components/Select/Select2'
import { clsx } from 'clsx'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'

const categoryOptions = [
  { value: 'technical', label: 'Technical Criteria' },
  { value: 'commercial', label: 'Commercial Criteria' },
]

export const RFQEvaluationTemplateCreatePage = () => {
  const navigate = useNavigate()
  const { mutate: createTemplate, isPending } = useCreateRFQEvaluationTemplate()
  const { showNotificationModal } = useUiStore()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<RFQEvaluationTemplateFormValues>({
    resolver: zodResolver(rfqEvaluationTemplateSchema) as any,
    defaultValues: {
      name: '',
      technical_weightage: 50,
      commercial_weightage: 50,
      criteria: [
        { name: 'Technical Specification Compliance', category: 'technical', max_score: 50 },
        { name: 'Price Competitiveness & Payment Terms', category: 'commercial', max_score: 50 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  })

  const techWeight = Number(useWatch({ control, name: 'technical_weightage' })) || 0
  const commWeight = Number(useWatch({ control, name: 'commercial_weightage' })) || 0
  const criteriaList = useWatch({ control, name: 'criteria' }) || []
  const templateName = useWatch({ control, name: 'name' }) || ''

  const totalWeight = useMemo(() => Math.round((techWeight + commWeight) * 100) / 100, [techWeight, commWeight])
  const isWeightValid = totalWeight === 100

  // Category Summaries
  const categoryStats = useMemo(() => {
    let techCount = 0
    let techScore = 0
    let commCount = 0
    let commScore = 0

    criteriaList.forEach((c) => {
      const score = Number(c?.max_score) || 0
      if (c?.category === 'technical') {
        techCount++
        techScore += score
      } else if (c?.category === 'commercial') {
        commCount++
        commScore += score
      }
    })

    return {
      techCount,
      techScore,
      commCount,
      commScore,
      totalScore: techScore + commScore,
    }
  }, [criteriaList])

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

    createTemplate(payload, {
      onSuccess: () => {
        showNotificationModal(
          'Evaluation Template Created!',
          `Template "${payload.name}" has been created successfully.`,
          'success'
        )
        navigate({ to: '/procurement/rfq-templates' })
      },
      onError: (error: any) => {
        const backendErrors = error.response?.data?.errors
        if (backendErrors && typeof backendErrors === 'object') {
          Object.entries(backendErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
            setError(field as any, { type: 'server', message: msg })
          })
          const errorList = Object.entries(backendErrors)
            .map(([_, msgs]) => (Array.isArray(msgs) ? msgs.join(', ') : msgs))
            .join(' | ')
          showNotificationModal('Validation Failed', errorList || 'Please check the highlighted fields.', 'error')
        } else {
          const message = error.response?.data?.message || error.message || 'Failed to create template.'
          showNotificationModal('Creation Failed', message, 'error')
        }
      },
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/procurement/rfq-templates' })
    }
  }

  const weightageError = errors.commercial_weightage?.message || (errors as any)?.weightages?.message

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-16 font-poppins text-[#475569]">
      {/* Top Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-xs font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </button>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            Create RFQ Evaluation Template
          </h1>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-[1600px] mx-auto pb-12">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Details & Criteria (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Card 1: Master Details & Weightages */}
            <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Template Information & Weightages</h2>
                  <p className="text-xs text-gray-400">Set the template title and balance the evaluation weighting</p>
                </div>
              </div>

              {/* Template Name */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Standard Goods & Equipment Scorecard"
                  className={clsx(
                    'w-full h-[40px] px-3.5 bg-white border rounded-lg text-[13px] outline-none transition-all',
                    errors.name
                      ? 'border-rose-500 focus:ring-rose-500/10'
                      : 'border-gray-200 focus:ring-1 focus:ring-primary/30'
                  )}
                />
                {errors.name && (
                  <span className="text-rose-500 text-[11px] font-medium">{errors.name.message}</span>
                )}
              </div>

              {/* Weightage Distribution Section */}
              <div className="p-5 bg-gray-50/80 rounded-xl border border-gray-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Evaluation Weightage Split (Must Total 100%)
                    </span>
                  </div>
                  <div
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                      isWeightValid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    {isWeightValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Total: {totalWeight}% (Valid)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Total: {totalWeight}% (Must equal 100%)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-sky-500 transition-all duration-300"
                      style={{ width: `${Math.min(Math.max(techWeight, 0), 100)}%` }}
                    />
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(Math.max(commWeight, 0), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-gray-500 px-0.5">
                    <span className="text-sky-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                      Technical Weight: {techWeight}%
                    </span>
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Commercial Weight: {commWeight}%
                    </span>
                  </div>
                </div>

                {/* Inputs for Weightages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Technical Weightage (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        {...register('technical_weightage', {
                          valueAsNumber: true,
                          onChange: (e) => {
                            const val = Number(e.target.value) || 0
                            if (val >= 0 && val <= 100) {
                              setValue('commercial_weightage', 100 - val, { shouldValidate: true })
                            }
                          },
                        })}
                        placeholder="50"
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 pr-8 font-semibold"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                    </div>
                    {errors.technical_weightage && (
                      <span className="text-rose-500 text-[11px] font-medium block">
                        {errors.technical_weightage.message}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Commercial Weightage (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        {...register('commercial_weightage', {
                          valueAsNumber: true,
                          onChange: (e) => {
                            const val = Number(e.target.value) || 0
                            if (val >= 0 && val <= 100) {
                              setValue('technical_weightage', 100 - val, { shouldValidate: true })
                            }
                          },
                        })}
                        placeholder="50"
                        className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 pr-8 font-semibold"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                    </div>
                    {errors.commercial_weightage && (
                      <span className="text-rose-500 text-[11px] font-medium block">
                        {errors.commercial_weightage.message}
                      </span>
                    )}
                  </div>
                </div>

                {weightageError && (
                  <p className="text-rose-500 text-xs font-semibold pt-1">{weightageError}</p>
                )}
              </div>
            </div>

            {/* Card 2: Evaluation Criteria Breakdown */}
            <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1e293b]">Evaluation Criteria Breakdown</h2>
                    <p className="text-xs text-gray-400">
                      Define individual scoring parameters, assign categories, and set max points
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => append({ name: '', category: 'technical', max_score: 50 })}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Criterion
                </button>
              </div>

              {errors.criteria?.message && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-medium">
                  {errors.criteria.message}
                </div>
              )}

              {/* Criteria Repeater List */}
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const rowError = errors.criteria?.[index]
                  return (
                    <div
                      key={field.id}
                      className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-gray-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-700">Criterion #{index + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove Criterion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        {/* Criterion Name */}
                        <div className="md:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">
                            Criterion Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            {...register(`criteria.${index}.name`)}
                            type="text"
                            placeholder="e.g. Specification Compliance, Delivery Lead Time, Warranty"
                            className={clsx(
                              'w-full h-[38px] px-3 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30',
                              rowError?.name ? 'border-rose-500' : 'border-gray-200'
                            )}
                          />
                          {rowError?.name && (
                            <span className="text-rose-500 text-[10px] block font-medium">
                              {rowError.name.message}
                            </span>
                          )}
                        </div>

                        {/* Category */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">
                            Category <span className="text-rose-500">*</span>
                          </label>
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

                        {/* Max Score */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">
                            Max Score <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              {...register(`criteria.${index}.max_score`, { valueAsNumber: true })}
                              type="number"
                              min="1"
                              placeholder="50"
                              className={clsx(
                                'w-full h-[38px] px-3 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30 pr-10 font-semibold',
                                rowError?.max_score ? 'border-rose-500' : 'border-gray-200'
                              )}
                            />
                            <span className="absolute right-3 top-2.5 text-[11px] text-gray-400 font-bold">
                              Pts
                            </span>
                          </div>
                          {rowError?.max_score && (
                            <span className="text-rose-500 text-[10px] block font-medium">
                              {rowError.max_score.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Criteria Summary Pills */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-md font-semibold">
                    Technical: {categoryStats.techCount} items ({categoryStats.techScore} Max Pts)
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-semibold">
                    Commercial: {categoryStats.commCount} items ({categoryStats.commScore} Max Pts)
                  </span>
                </div>
                <div className="font-bold text-gray-700">
                  Total Evaluation Pool: <span className="text-primary font-extrabold">{categoryStats.totalScore} Pts</span> across {fields.length} criteria
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Guidance (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
            {/* Pre-flight Configuration Checklist Card */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-[#1e293b]">Template Checklist</h3>
              <div className="space-y-2 text-xs pt-1 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {templateName.trim() ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                  <span className={templateName.trim() ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                    Template title specified
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isWeightValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={isWeightValid ? 'text-gray-700 font-medium' : 'text-rose-500 font-medium'}>
                    Weightages sum to 100% ({totalWeight}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {fields.length > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                  <span className="text-gray-700 font-medium">
                    {fields.length} criteria defined
                  </span>
                </div>
              </div>
            </div>

            {/* Help & Guide Card */}
            <div className="bg-white rounded-xl border border-primary/10 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>How Evaluation Scoring Works</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                When vendors submit quotations against an RFQ, procurement evaluators score each criterion. The system then computes a weighted matrix:
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 border border-slate-200">
                Final Score = (Tech Score / Max Tech) × Tech Weight% + (Comm Score / Max Comm) × Comm Weight%
              </div>
              <ul className="text-xs text-gray-500 space-y-1.5 list-disc pl-4">
                <li><strong>Technical:</strong> Specifications, warranty, quality compliance, track record.</li>
                <li><strong>Commercial:</strong> Unit pricing, payment terms, discount structure, delivery time.</li>
              </ul>
            </div>

            {/* Action Buttons Below Guide Card */}
            <div className="flex gap-4 pt-1">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 h-[48px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-xl hover:bg-gray-50 transition-all text-[15px] shadow-sm cursor-pointer flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !isWeightValid}
                className="flex-1 h-[48px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[15px] cursor-pointer"
              >
                {isPending ? (
                  <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => {
          setIsDiscardModalOpen(false)
          navigate({ to: '/procurement/rfq-templates' })
        }}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this evaluation template. Are you sure you want to discard them?"
        confirmText="Yes, Discard"
        isLoading={false}
      />
    </div>
  )
}
