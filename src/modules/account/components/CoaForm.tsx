import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { Loader2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { coaSchema } from '../hooks/validation'
import type { CoaFormData } from '../hooks/validation'
import { Select2 } from '@/components/Select/Select2'
import { useGetSubTypes, useSaveCoa, useDeleteCoa } from '../hooks/useCoa'
import { clsx } from 'clsx'

interface CoaFormProps {
  initialData: any
  mode: 'edit' | 'new'
  isLoading?: boolean
  onNew: (parentId: string) => void
  onUndo: () => void
  onClose?: () => void
}

export const CoaForm = ({ initialData, mode, isLoading, onNew, onUndo, onClose }: CoaFormProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { data: subTypesResponse } = useGetSubTypes()
  const { mutate: saveCoa, isPending: isSaving } = useSaveCoa()
  const { mutate: deleteCoa, isPending: isDeleting } = useDeleteCoa()

  const subTypeOptions = (subTypesResponse as any)?.map((s: any) => ({
    value: s.id.toString(),
    label: s.sub_type_name
  })) || []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CoaFormData>({
    resolver: zodResolver(coaSchema) as any,
    defaultValues: {
      txtHeadCode: '',
      txtHeadName: '',
      txtPHead: '',
      txtPHeadCode: '',
      txtHeadLevel: 1,
      txtHeadType: 'A',
      IsActive: 1,
      isFixedAssetSch: 0,
      isStock: 0,
      isCashNature: 0,
      isBankNature: 0,
      isSubType: 0,
      subtype: '1',
      assetCode: '',
      depCode: '',
      DepreciationRate: 0,
      noteNo: '',
    }
  })

  useEffect(() => {
    if (initialData) {
      if (mode === 'edit') {
        reset({
          txtHeadCode: initialData.head_code?.toString() ?? '',
          txtHeadName: initialData.head_name ?? '',
          txtPHead: initialData.p_head_name ?? '',
          txtPHeadCode: initialData.p_head_code?.toString() ?? '',
          txtHeadLevel: initialData.head_level ?? 1,
          txtHeadType: initialData.head_type ?? 'A',
          IsActive: initialData.is_active ?? 1,
          isFixedAssetSch: initialData.is_fixed_asset_sch ?? 0,
          isStock: initialData.is_stock ?? 0,
          isCashNature: initialData.is_cash_nature ?? 0,
          isBankNature: initialData.is_bank_nature ?? 0,
          isSubType: initialData.is_sub_type ?? 0,
          subtype: initialData.sub_type?.toString() ?? '1',
          assetCode: initialData.asset_code ?? '',
          depCode: initialData.dep_code ?? '',
          DepreciationRate: initialData.depreciation_rate ?? 0,
          noteNo: initialData.note_no ?? '',
        })
      } else {
        // New child mode
        reset({
          txtHeadCode: initialData.head_code?.toString() ?? '',
          txtHeadName: '',
          txtPHead: initialData.row_data?.head_name ?? '',
          txtPHeadCode: initialData.row_data?.head_code?.toString() ?? '',
          txtHeadLevel: initialData.head_label ?? 1,
          txtHeadType: initialData.row_data?.head_type ?? 'A',
          IsActive: 1,
          isFixedAssetSch: 0,
          isStock: 0,
          isCashNature: 0,
          isBankNature: 0,
          isSubType: 0,
          subtype: '1',
          assetCode: '',
          depCode: '',
          DepreciationRate: 0,
          noteNo: '',
        })
      }
    }
  }, [initialData, mode, reset])

  const headLevel = watch('txtHeadLevel')
  const headType = watch('txtHeadType')
  const isFixedAssetSch = watch('isFixedAssetSch')
  const isSubType = watch('isSubType')
  const isActive = watch('IsActive')

  const onSubmit = (data: CoaFormData) => {
    saveCoa(data, {
      onSuccess: () => {
        onClose?.()
      }
    })
  }

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    setIsDeleteModalOpen(false)
    deleteCoa(initialData.head_code, {
      onSuccess: (data) => {
        if (data.status === 'success') {
          onClose?.()
        }
      }
    })
  }

  return (
    <div className="bg-white h-fit flex flex-col font-poppins relative">
      {/* Header section with value details */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-[16px] font-semibold text-slate-800">
            Value Details
          </h2>
        </div>
        
        {/* Close Button */}
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 inline-flex items-center justify-center transition-colors"
            title="Close Details"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
          {/* Head Code */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-[13px] font-medium text-slate-600">Head Code</label>
            <div className="col-span-8">
              <input
                {...register('txtHeadCode')}
                readOnly
                className="w-full h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Head Name */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-[13px] font-medium text-slate-600">
              Head Name <span className="text-rose-500">*</span>
            </label>
            <div className="col-span-8">
              <input
                {...register('txtHeadName')}
                autoComplete="off"
                className={clsx(
                  "w-full h-[38px] px-3 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium text-slate-700 hover:border-slate-300 focus:ring-1 focus:ring-primary/30 focus:border-primary",
                  errors.txtHeadName ? "border-rose-500 focus:ring-rose-500/10" : "border-slate-200"
                )}
              />
              {errors.txtHeadName && <p className="text-rose-500 text-[11px] mt-1">{errors.txtHeadName.message}</p>}
            </div>
          </div>

          {/* Parent Head */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-[13px] font-medium text-slate-600">Parent Head</label>
            <div className="col-span-8">
              <input
                {...register('txtPHead')}
                readOnly
                className="w-full h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Note No */}
          {headLevel > 3 && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-4 text-[13px] font-medium text-slate-600">Note No</label>
              <div className="col-span-8">
                <input
                  {...register('noteNo')}
                  placeholder="Enter Note No"
                  autoComplete="off"
                  className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-[13px] outline-none transition-all font-medium text-slate-700 hover:border-slate-300 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Status (Toggle Switch style in rounded box) */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-4 text-[13px] font-medium text-slate-600">Status</label>
            <div className="col-span-8">
              <div 
                onClick={() => setValue('IsActive', isActive === 1 ? 0 : 1)}
                className="flex items-center justify-between w-full h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100/50 transition-colors"
              >
                <span>{isActive === 1 ? 'Active' : 'Inactive'}</span>
                <div className={clsx(
                  "w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0",
                  isActive === 1 ? "bg-primary" : "bg-slate-300"
                )}>
                  <div className={clsx(
                    "w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out",
                    isActive === 1 ? "translate-x-4" : "translate-x-0"
                  )} />
                </div>
              </div>
            </div>
          </div>

          {/* Sub Type */}
          {headLevel > 3 && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSubType"
                  checked={isSubType === 1}
                  onChange={(e) => {
                    setValue('isSubType', e.target.checked ? 1 : 0)
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                />
                <label htmlFor="isSubType" className="text-[13px] font-medium text-slate-600 cursor-pointer select-none">
                  Sub Type
                </label>
              </div>
              <div className="col-span-8">
                <Select2
                  options={subTypeOptions}
                  value={watch('subtype')}
                  onChange={(val) => setValue('subtype', val as string)}
                  placeholder="Select Sub Type"
                  isDisabled={isSubType !== 1}
                />
              </div>
            </div>
          )}

          {/* Is Cash Nature / Is Bank Nature (Horizontal Radios) */}
          {headLevel > 3 && headType === 'A' && (
            <div className="grid grid-cols-12 gap-4 items-center py-1">
              <div className="col-span-4 text-[13px] font-medium text-slate-600">Account Nature</div>
              <div className="col-span-8 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="accountNature"
                    checked={watch('isCashNature') === 1}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('isCashNature', 1)
                        setValue('isBankNature', 0)
                        setValue('isStock', 0)
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary/30"
                  />
                  <span className="text-[13px] font-medium text-slate-700">Is Cash Nature</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="accountNature"
                    checked={watch('isBankNature') === 1}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('isBankNature', 1)
                        setValue('isCashNature', 0)
                        setValue('isStock', 0)
                      }
                    }}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary/30"
                  />
                  <span className="text-[13px] font-medium text-slate-700">Is Bank Nature</span>
                </label>
              </div>
            </div>
          )}

          {/* Is Stock (Checkbox) */}
          {headLevel > 3 && headType === 'A' && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isStock"
                  checked={watch('isStock') === 1}
                  onChange={(e) => setValue('isStock', e.target.checked ? 1 : 0)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                />
                <label htmlFor="isStock" className="text-[13px] font-medium text-slate-600 cursor-pointer select-none">
                  Is Stock
                </label>
              </div>
            </div>
          )}

          {/* Is Fixed Asset */}
          {headLevel > 3 && (headType === 'A' || headType === 'L') && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFixedAssetSch"
                  checked={isFixedAssetSch === 1}
                  onChange={(e) => {
                    setValue('isFixedAssetSch', e.target.checked ? 1 : 0)
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                />
                <label htmlFor="isFixedAssetSch" className="text-[13px] font-medium text-slate-600 cursor-pointer select-none">
                  Is Fixed Asset
                </label>
              </div>
            </div>
          )}

          {/* Fixed Asset Conditional Fields */}
          {isFixedAssetSch === 1 && headLevel > 3 && (
            <>
              {headType === 'A' ? (
                <>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[13px] font-medium text-slate-600">Fixed Asset Code</label>
                    <div className="col-span-8">
                      <input
                        {...register('assetCode')}
                        autoComplete="off"
                        className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-[13px] outline-none font-medium text-slate-700 hover:border-slate-300 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 text-[13px] font-medium text-slate-600">Depreciation Rate %</label>
                    <div className="col-span-8">
                      <input
                        type="number"
                        step="0.01"
                        {...register('DepreciationRate')}
                        autoComplete="off"
                        className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-[13px] outline-none font-medium text-slate-700 hover:border-slate-300 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-4 text-[13px] font-medium text-slate-600">Depreciation Code</label>
                  <div className="col-span-8">
                    <input
                      {...register('depCode')}
                      autoComplete="off"
                      className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-[13px] outline-none font-medium text-slate-700 hover:border-slate-300 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <hr className="border-t border-dashed border-slate-200 my-5" />

          {/* Action Row */}
          <div className="flex items-center gap-3">
            {mode === 'edit' ? (
              <>
                {headLevel < 4 && (
                  <button
                    type="button"
                    onClick={() => onNew(initialData.head_code)}
                    className="px-6 h-[38px] bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-sm transition-all text-[13px] active:scale-95 shrink-0"
                  >
                    New
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 h-[38px] bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg shadow-sm transition-all text-[13px] active:scale-95 shrink-0 disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update'}
                </button>

                {initialData.head_level > 1 && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-6 h-[38px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded-lg transition-all text-[13px] active:scale-95 shrink-0 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 h-[38px] bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg shadow-sm transition-all text-[13px] active:scale-95 shrink-0 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                
                <button
                  type="button"
                  onClick={onUndo}
                  className="px-6 h-[38px] bg-white border border-gray-200 text-[#64748b] hover:bg-gray-50 font-medium rounded-lg shadow-sm transition-all text-[13px] active:scale-95 shrink-0"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Account?"
        message={`Are you sure you want to delete "${initialData?.head_name ?? ''}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />

      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-[13px] font-medium text-slate-500">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
