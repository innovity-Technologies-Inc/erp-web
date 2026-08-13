import { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Info, Columns, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { FormField } from '@/components/Form/FormField'
import { Button } from '@/components/Button/Button'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { getSettingsTabs } from '../tabs'
import { usePermissions } from '@/hooks/usePermissions'
import { printSettingSchema, type PrintSettingFormValues } from '../hooks/validation'
import { usePrintSetting, useUpdatePrintSetting } from '../hooks/usePrintSettings'

export const PrintPage = () => {
  const { showNotificationModal } = useUiStore()
  const loggedInUser = useAuthStore((state) => state.user)
  const { hasPermission } = usePermissions()

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  if (!isSuperAdmin && !hasPermission('view_print_setting')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
        <div className="bg-red-50 p-4 rounded-full text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 text-[13px] text-center max-w-[360px]">
          You do not have the required permissions to view this settings page. Please contact your system administrator.
        </p>
      </div>
    )
  }

  const tabs = useMemo(() => getSettingsTabs('/settings/print', isSuperAdmin, hasPermission), [isSuperAdmin, hasPermission])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PrintSettingFormValues>({
    resolver: zodResolver(printSettingSchema),
    defaultValues: {
      header: '',
      footer: '',
    },
  })

  // Watch header & footer values for live layout preview
  const headerValue = watch('header')
  const footerValue = watch('footer')

  // Scale height for preview container
  const previewHeaderHeight = useMemo(() => {
    const val = Number(headerValue)
    if (isNaN(val) || !val) return 40
    return Math.min(Math.max(val / 4, 15), 100)
  }, [headerValue])

  const previewFooterHeight = useMemo(() => {
    const val = Number(footerValue)
    if (isNaN(val) || !val) return 30
    return Math.min(Math.max(val / 4, 15), 100)
  }, [footerValue])

  const activePreset = useMemo(() => {
    if (headerValue === '200' && footerValue === '100') return 'standard'
    if (headerValue === '80' && footerValue === '40') return 'compact'
    if (headerValue === '250' && footerValue === '150') return 'report'
    return null
  }, [headerValue, footerValue])

  // Fetch current print settings
  const { data: printData, isLoading } = usePrintSetting()
  const { mutate: updatePrint, isPending: isUpdating } = useUpdatePrintSetting()

  // Reset form when settings data is loaded
  useEffect(() => {
    if (printData?.data) {
      reset({
        header: String(printData.data.header || ''),
        footer: String(printData.data.footer || ''),
      })
    }
  }, [printData, reset])

  const onSubmit = (data: PrintSettingFormValues) => {
    updatePrint(data, {
      onSuccess: (res) => {
        showNotificationModal(
          'Updated Successfully!',
          res.message || 'Print settings have been updated successfully.',
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to update print settings.'
        showNotificationModal('Update Failed', msg, 'error')
      },
    })
  }

  // Handle Preset Click
  const applyPreset = (h: string, f: string) => {
    setValue('header', h, { shouldValidate: true })
    setValue('footer', f, { shouldValidate: true })
  }

  return (
    <ListPageLayout
      title="Print Setting"
      backTo="/"
      tabs={tabs}
      disableCard={true}
      rowData={[]}
      columnDefs={[]}
      isLoading={isLoading}
    >
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            
            {/* Left Section: Dimension Configuration */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/5 text-primary rounded-xl">
                    <Columns className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                    Dimension Configuration
                  </h2>
                </div>
                <Info className="h-5 w-5 text-gray-400 cursor-help" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Header Height" error={errors.header?.message} required>
                  <div className="relative flex items-center">
                    <input
                      {...register('header')}
                      type="text"
                      className="erp-input w-full pr-10"
                      placeholder="e.g. 200"
                      autoComplete="off"
                    />
                    <span className="absolute right-3.5 text-slate-400 text-sm font-semibold">px</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 font-medium leading-normal">
                    Default standard height for enterprise document headers.
                  </p>
                </FormField>

                <FormField label="Footer Height" error={errors.footer?.message} required>
                  <div className="relative flex items-center">
                    <input
                      {...register('footer')}
                      type="text"
                      className="erp-input w-full pr-10"
                      placeholder="e.g. 100"
                      autoComplete="off"
                    />
                    <span className="absolute right-3.5 text-slate-400 text-sm font-semibold">px</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 font-medium leading-normal">
                    Allocated space for legal disclaimers and page numbering.
                  </p>
                </FormField>
              </div>

              {/* Live Layout Preview */}
              <div className="border border-dashed border-gray-200 rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-[200px] bg-white border border-gray-200 shadow-sm rounded-lg flex flex-col justify-between overflow-hidden aspect-[4/5] transition-all">
                  
                  {/* Dynamic Header */}
                  <div 
                    style={{ height: `${previewHeaderHeight}px` }} 
                    className="border-b border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-center text-[10px] font-bold text-slate-400 tracking-widest uppercase transition-all duration-300"
                  >
                    Header
                  </div>

                  {/* Body Content Placeholder */}
                  <div className="p-4 flex-1 flex flex-col gap-2 justify-center">
                    <div className="h-1.5 bg-slate-100 rounded w-4/5" />
                    <div className="h-1.5 bg-slate-100 rounded w-full" />
                    <div className="h-1.5 bg-slate-100 rounded w-11/12" />
                    <div className="h-1.5 bg-slate-100 rounded w-2/3" />
                  </div>

                  {/* Dynamic Footer */}
                  <div 
                    style={{ height: `${previewFooterHeight}px` }} 
                    className="border-t border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-center text-[10px] font-bold text-slate-400 tracking-widest uppercase transition-all duration-300"
                  >
                    Footer
                  </div>

                </div>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-4">
                  Live Layout Preview
                </span>
              </div>
            </div>

            {/* Right Section: Layout Presets & Tips */}
            <div className="space-y-6">
              
              {/* Layout Presets Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/5 text-primary rounded-xl">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                      Layout Presets
                    </h2>
                  </div>
                  <Info className="h-5 w-5 text-gray-400 cursor-help" />
                </div>

                <div className="space-y-3">
                  
                  {/* Preset 1 */}
                  <div 
                    onClick={() => applyPreset('200', '100')}
                    className={`border rounded-xl p-4 cursor-pointer transition-all text-left ${
                      activePreset === 'standard'
                        ? 'border-primary ring-1 ring-primary/30 bg-slate-50/50 shadow-sm'
                        : 'border-gray-100 hover:border-primary/30 hover:bg-slate-50/30'
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-slate-800 leading-none">
                      Standard Invoice
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      200px H / 100px F
                    </p>
                  </div>

                  {/* Preset 2 */}
                  <div 
                    onClick={() => applyPreset('80', '40')}
                    className={`border rounded-xl p-4 cursor-pointer transition-all text-left ${
                      activePreset === 'compact'
                        ? 'border-primary ring-1 ring-primary/30 bg-slate-50/50 shadow-sm'
                        : 'border-gray-100 hover:border-primary/30 hover:bg-slate-50/30'
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-slate-800 leading-none">
                      Compact Receipt
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      80px H / 40px F
                    </p>
                  </div>

                  {/* Preset 3 */}
                  <div 
                    onClick={() => applyPreset('250', '150')}
                    className={`border rounded-xl p-4 cursor-pointer transition-all text-left ${
                      activePreset === 'report'
                        ? 'border-primary ring-1 ring-primary/30 bg-slate-50/50 shadow-sm'
                        : 'border-gray-100 hover:border-primary/30 hover:bg-slate-50/30'
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-slate-800 leading-none">
                      Full Report
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      250px H / 150px F
                    </p>
                  </div>

                </div>
              </div>

              {/* Design Tips Card */}
              <div className="bg-[#1e40af] text-white rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <Info className="h-5 w-5 text-white/80" />
                  <span className="text-xs font-bold tracking-widest uppercase text-white/90">
                    Design Tips
                  </span>
                </div>
                
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3 text-xs leading-relaxed text-white/80 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-white/80 shrink-0 mt-0.5" />
                    <span>Use at least 150px for headers if including high-resolution company logos.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs leading-relaxed text-white/80 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-white/80 shrink-0 mt-0.5" />
                    <span>Footer heights below 80px may cause text clipping on older laser printers.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs leading-relaxed text-white/80 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-white/80 shrink-0 mt-0.5" />
                    <span>Standard A4 margins are automatically applied outside these heights.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (printData?.data) {
                  reset({
                    header: String(printData.data.header || ''),
                    footer: String(printData.data.footer || ''),
                  })
                }
              }} 
              disabled={isUpdating}
              className="px-6 rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isUpdating} 
              className="px-6 rounded-xl h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white border-transparent"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

        </form>
      )}
    </ListPageLayout>
  )
}
