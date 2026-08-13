import { useMemo, useEffect, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Settings, Globe, Palette, ShieldCheck, Upload, Image as ImageIcon, Sparkles } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { FormField } from '@/components/Form/FormField'
import { Button } from '@/components/Button/Button'
import { Select2 } from '@/components/Select/Select2'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { getSettingsTabs } from '../tabs'
import { usePermissions } from '@/hooks/usePermissions'
import { webSettingSchema, type WebSettingFormValues } from '../hooks/validation'
import { useWebSetting, useUpdateWebSetting } from '../hooks/useWebSetting'

export const GeneralSettingPage = () => {
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

  if (!isSuperAdmin && !hasPermission('view_general_setting')) {
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

  const tabs = useMemo(() => getSettingsTabs('/settings/setting', isSuperAdmin, hasPermission), [isSuperAdmin, hasPermission])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebSettingFormValues>({
    resolver: zodResolver(webSettingSchema),
    defaultValues: {
      site_name: '',
      currency: '',
      timezone: '',
      currency_position: '0',
      footer_text: '',
      language: 'english',
      rtr: '0',
      discount_type: '1',
      color_primary: '#0d6efd',
      color_info: '#0dcaf0',
      color_success: '#198754',
      color_warning: '#ffc107',
      color_danger: '#dc3545',
      navbar_color: '#0d6efd',
      sidebar_color: '#343a40',
      is_qr: true,
      is_autoapprove_v: true,
    },
  })

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [invoiceLogoFile, setInvoiceLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [sidebarFile, setSidebarFile] = useState<File | null>(null)

  // Previews
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [invoiceLogoPreview, setInvoiceLogoPreview] = useState<string>('')
  const [faviconPreview, setFaviconPreview] = useState<string>('')
  const [sidebarPreview, setSidebarPreview] = useState<string>('')

  // Refs for hidden inputs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const invoiceLogoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const sidebarInputRef = useRef<HTMLInputElement>(null)

  // Fetch current general settings
  const { data: settingData, isLoading } = useWebSetting()
  const { mutate: updateSetting, isPending: isUpdating } = useUpdateWebSetting()

  // Pre-populate dropdown lists from API response
  const languages = settingData?.data?.languages || []
  const timezones = settingData?.data?.timezones || []
  const currencies = settingData?.data?.currencies || []

  const currencyPositionOptions = useMemo(
    () => [
      { value: '0', label: 'Left ($100)' },
      { value: '1', label: 'Right (100$)' },
    ],
    []
  )

  const directionOptions = useMemo(
    () => [
      { value: '0', label: 'LTR (Left to Right)' },
      { value: '1', label: 'RTL (Right to Left)' },
    ],
    []
  )

  const discountTypeOptions = useMemo(
    () => [
      { value: '1', label: 'Discount %' },
      { value: '2', label: 'Discount Per Pcs' },
      { value: '3', label: 'Fixed Discount' },
    ],
    []
  )

  // Reset form when settings data is loaded
  useEffect(() => {
    if (settingData?.data?.setting) {
      const s = settingData.data.setting
      reset({
        site_name: s.site_name || '',
        currency: s.currency || '',
        timezone: s.timezone || '',
        currency_position: s.currency_position !== undefined && s.currency_position !== null ? String(s.currency_position) : '0',
        footer_text: s.footer_text || '',
        language: s.language || 'english',
        rtr: s.rtr !== undefined && s.rtr !== null ? String(s.rtr) : '0',
        discount_type: s.discount_type !== undefined && s.discount_type !== null ? String(s.discount_type) : '1',
        color_primary: s.color_primary || '#0d6efd',
        color_info: s.color_info || '#0dcaf0',
        color_success: s.color_success || '#198754',
        color_warning: s.color_warning || '#ffc107',
        color_danger: s.color_danger || '#dc3545',
        navbar_color: s.navbar_color || '#0d6efd',
        sidebar_color: s.sidebar_color || '#343a40',
        is_qr: Boolean(Number(s.is_qr)),
        is_autoapprove_v: Boolean(Number(s.is_autoapprove_v)),
      })

      if (s.logo_url) setLogoPreview(s.logo_url)
      if (s.invoice_logo_url) setInvoiceLogoPreview(s.invoice_logo_url)
      if (s.favicon_url) setFaviconPreview(s.favicon_url)
      if (s.login_sidebar_image_url) setSidebarPreview(s.login_sidebar_image_url)
    }
  }, [settingData, reset])

  const onSubmit = (data: WebSettingFormValues) => {
    const formData = new FormData()
    formData.append('site_name', data.site_name)
    formData.append('currency', data.currency)
    formData.append('timezone', data.timezone)
    formData.append('currency_position', String(data.currency_position))
    formData.append('footer_text', data.footer_text)
    formData.append('language', data.language)
    formData.append('rtr', String(data.rtr))
    formData.append('discount_type', String(data.discount_type))
    formData.append('color_primary', data.color_primary || '#0d6efd')
    formData.append('color_info', data.color_info || '#0dcaf0')
    formData.append('color_success', data.color_success || '#198754')
    formData.append('color_warning', data.color_warning || '#ffc107')
    formData.append('color_danger', data.color_danger || '#dc3545')
    formData.append('navbar_color', data.navbar_color || '#0d6efd')
    formData.append('sidebar_color', data.sidebar_color || '#343a40')
    formData.append('is_qr', data.is_qr ? '1' : '0')
    formData.append('is_autoapprove_v', data.is_autoapprove_v ? '1' : '0')

    if (logoFile) formData.append('logo', logoFile)
    if (invoiceLogoFile) formData.append('invoice_logo', invoiceLogoFile)
    if (faviconFile) formData.append('favicon', faviconFile)
    if (sidebarFile) formData.append('login_sidebar_image', sidebarFile)

    updateSetting(formData, {
      onSuccess: (res) => {
        showNotificationModal(
          'Updated Successfully!',
          res.message || 'General settings have been updated successfully.',
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to update system settings.'
        showNotificationModal('Update Failed', msg, 'error')
      },
    })
  }

  // Handle file select & preview
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    const file = e.target.files?.[0] || null
    setFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <ListPageLayout
      title="System Settings"
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-[1600px] mx-auto ">
          
          {/* Row 1: Brand Identity & Theme Customization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* Card 1: Brand Identity & Media Assets */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 border-b border-gray-50 pb-4">
                  <div className="p-2 bg-primary/5 text-primary rounded-xl">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                      Brand Identity
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium">Manage company display name and logo resources.</p>
                  </div>
                </div>

                <FormField label="Site Name" error={errors.site_name?.message} required>
                  <input
                    {...register('site_name')}
                    type="text"
                    className="erp-input w-full"
                    placeholder="e.g. Enterprise ERP"
                    autoComplete="off"
                  />
                </FormField>

                {/* Grid of File Assets */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Logo Upload */}
                  <div className="border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[160px] bg-slate-50/50">
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="max-h-16 object-contain rounded" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                      <span className="text-[11px] font-semibold text-slate-700">App Logo</span>
                    </div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full text-xs h-8 mt-2 flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </Button>
                  </div>

                  {/* Sale Logo Upload */}
                  <div className="border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[160px] bg-slate-50/50">
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      {invoiceLogoPreview ? (
                        <img src={invoiceLogoPreview} alt="Invoice Logo" className="max-h-16 object-contain rounded" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                      <span className="text-[11px] font-semibold text-slate-700">Sale Logo</span>
                    </div>
                    <input
                      type="file"
                      ref={invoiceLogoInputRef}
                      onChange={(e) => handleFileChange(e, setInvoiceLogoFile, setInvoiceLogoPreview)}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => invoiceLogoInputRef.current?.click()}
                      className="w-full text-xs h-8 mt-2 flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </Button>
                  </div>

                  {/* Favicon Upload */}
                  <div className="border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[160px] bg-slate-50/50">
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      {faviconPreview ? (
                        <img src={faviconPreview} alt="Favicon" className="h-10 w-10 object-contain rounded" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                      <span className="text-[11px] font-semibold text-slate-700">Favicon</span>
                    </div>
                    <input
                      type="file"
                      ref={faviconInputRef}
                      onChange={(e) => handleFileChange(e, setFaviconFile, setFaviconPreview)}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => faviconInputRef.current?.click()}
                      className="w-full text-xs h-8 mt-2 flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </Button>
                  </div>

                  {/* Sidebar Image Upload */}
                  <div className="border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[160px] bg-slate-50/50">
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      {sidebarPreview ? (
                        <img src={sidebarPreview} alt="Login Sidebar" className="max-h-16 object-contain rounded" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                      <span className="text-[11px] font-semibold text-slate-700">Login Sidebar</span>
                    </div>
                    <input
                      type="file"
                      ref={sidebarInputRef}
                      onChange={(e) => handleFileChange(e, setSidebarFile, setSidebarPreview)}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => sidebarInputRef.current?.click()}
                      className="w-full text-xs h-8 mt-2 flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </Button>
                  </div>

                </div>
              </div>

              <FormField label="Footer Text" error={errors.footer_text?.message} required>
                <input
                  {...register('footer_text')}
                  type="text"
                  className="erp-input w-full"
                  placeholder="e.g. Copyright © 2026 Enterprise ERP"
                  autoComplete="off"
                />
              </FormField>
            </div>

            {/* Card 2: Theme Customization (Colors) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 border-b border-gray-50 pb-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                      Theme Customization
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium">Select primary themes and component colors for styling UI states.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <FormField label="Primary Theme Color">
                    <div className="flex items-center gap-3">
                      <input
                        {...register('color_primary')}
                        type="color"
                        className="h-10 w-16 p-0 border border-gray-200 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX: {errors.color_primary ? '#0d6efd' : 'Default'}</span>
                    </div>
                  </FormField>

                  <FormField label="Info Color">
                    <div className="flex items-center gap-3">
                      <input
                        {...register('color_info')}
                        type="color"
                        className="h-10 w-16 p-0 border border-gray-200 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX: {errors.color_info ? '#0dcaf0' : 'Default'}</span>
                    </div>
                  </FormField>

                  <FormField label="Success Color">
                    <div className="flex items-center gap-3">
                      <input
                        {...register('color_success')}
                        type="color"
                        className="h-10 w-16 p-0 border border-gray-200 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX: {errors.color_success ? '#198754' : 'Default'}</span>
                    </div>
                  </FormField>

                  <FormField label="Warning Color">
                    <div className="flex items-center gap-3">
                      <input
                        {...register('color_warning')}
                        type="color"
                        className="h-10 w-16 p-0 border border-gray-200 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX: {errors.color_warning ? '#ffc107' : 'Default'}</span>
                    </div>
                  </FormField>

                  <FormField label="Danger Color">
                    <div className="flex items-center gap-3">
                      <input
                        {...register('color_danger')}
                        type="color"
                        className="h-10 w-16 p-0 border border-gray-200 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX: {errors.color_danger ? '#dc3545' : 'Default'}</span>
                    </div>
                  </FormField>

                  <FormField label="Navbar Theme Color">
                    <div className="flex items-center gap-3">
                      <input
                        {...register('navbar_color')}
                        type="color"
                        className="h-10 w-16 p-0 border border-gray-200 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX: {errors.navbar_color ? '#0d6efd' : 'Default'}</span>
                    </div>
                  </FormField>

                  <FormField label="Sidebar Theme Color">
                    <div className="flex items-center gap-3">
                      <input
                        {...register('sidebar_color')}
                        type="color"
                        className="h-10 w-16 p-0 border border-gray-200 rounded-lg cursor-pointer bg-transparent"
                      />
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX: {errors.sidebar_color ? '#343a40' : 'Default'}</span>
                    </div>
                  </FormField>

                </div>

                {/* Theme Customization guidelines block */}
                <div className="border border-indigo-50/50 bg-indigo-50/15 rounded-2xl p-4.5 mt-5.5 space-y-2.5">
                  <h4 className="text-[12px] font-bold text-indigo-950 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Color Selection Guidelines
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    These configuration colors determine the visual system styling (buttons, tabs, sidebars, header alerts, and badges) throughout the ERP dashboard interfaces.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-[10.5px] font-medium text-slate-500 pt-1 border-t border-indigo-50/30">
                    <div className="space-y-1">
                      <span className="text-indigo-900 font-bold block">Primary & Accent</span>
                      <p className="leading-tight">Drives primary buttons, pagination highlights, and active tab lines.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-indigo-900 font-bold block">App Frame Theme</span>
                      <p className="leading-tight">Sets colors for main sidebar links and top navigation bar styles.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Row 2: Operations & Localization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* Card 3: Operations & Functional Rules */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 border-b border-gray-50 pb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                      Operations & Features
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium">Manage default discounts and system voucher validation behavior.</p>
                  </div>
                </div>

                <FormField label="Discount Type" required>
                  <Controller
                    name="discount_type"
                    control={control}
                    render={({ field }) => (
                      <Select2
                        options={discountTypeOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        className="w-full"
                        menuPortalTarget={document.body}
                      />
                    )}
                  />
                </FormField>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <label className="text-[13px] font-semibold text-slate-800 tracking-tight block">
                    Feature Settings
                  </label>

                  <div className="grid grid-cols-1 gap-4">
                    
                    <label className="flex items-center gap-3.5 p-4 border border-gray-100 hover:border-gray-200 bg-slate-50/50 rounded-xl cursor-pointer hover:bg-slate-50/80 transition-all select-none">
                      <input
                        {...register('is_qr')}
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer accent-primary"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800">Print QR-Code on Invoice</span>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Embed standard verification QR codes on invoice pdf outputs.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3.5 p-4 border border-gray-100 hover:border-gray-200 bg-slate-50/50 rounded-xl cursor-pointer hover:bg-slate-50/80 transition-all select-none">
                      <input
                        {...register('is_autoapprove_v')}
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer accent-primary"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-800">Auto Approve Invoice Voucher</span>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Approve new invoice accounting entries automatically without audit verification.</p>
                      </div>
                    </label>

                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Localization & Regional Formatting */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 border-b border-gray-50 pb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                      Localization & Formatting
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium">Configure date formatting, currency signs, and timezone regions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <FormField label="Default Currency" required>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <Select2
                          options={currencies}
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          className="w-full"
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                  </FormField>

                  <FormField label="Time Zone" required>
                    <Controller
                      name="timezone"
                      control={control}
                      render={({ field }) => (
                        <Select2
                          options={timezones}
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          className="w-full"
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                  </FormField>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <FormField label="Currency Position" required>
                    <Controller
                      name="currency_position"
                      control={control}
                      render={({ field }) => (
                        <Select2
                          options={currencyPositionOptions}
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          className="w-full"
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                  </FormField>

                  <FormField label="System Language" required>
                    <Controller
                      name="language"
                      control={control}
                      render={({ field }) => (
                        <Select2
                          options={languages}
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          className="w-full"
                          menuPortalTarget={document.body}
                        />
                      )}
                    />
                  </FormField>

                </div>

                <FormField label="Layout Direction" required>
                  <Controller
                    name="rtr"
                    control={control}
                    render={({ field }) => (
                      <Select2
                        options={directionOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        className="w-full"
                        menuPortalTarget={document.body}
                      />
                    )}
                  />
                </FormField>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (settingData?.data?.setting) {
                  const s = settingData.data.setting
                  reset({
                    site_name: s.site_name || '',
                    currency: s.currency || '',
                    timezone: s.timezone || '',
                    currency_position: s.currency_position !== undefined && s.currency_position !== null ? String(s.currency_position) : '0',
                    footer_text: s.footer_text || '',
                    language: s.language || 'english',
                    rtr: s.rtr !== undefined && s.rtr !== null ? String(s.rtr) : '0',
                    discount_type: s.discount_type !== undefined && s.discount_type !== null ? String(s.discount_type) : '1',
                    color_primary: s.color_primary || '#0d6efd',
                    color_info: s.color_info || '#0dcaf0',
                    color_success: s.color_success || '#198754',
                    color_warning: s.color_warning || '#ffc107',
                    color_danger: s.color_danger || '#dc3545',
                    navbar_color: s.navbar_color || '#0d6efd',
                    sidebar_color: s.sidebar_color || '#343a40',
                    is_qr: Boolean(Number(s.is_qr)),
                    is_autoapprove_v: Boolean(Number(s.is_autoapprove_v)),
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
              className="px-6 rounded-xl h-11"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>

        </form>
      )}
    </ListPageLayout>
  )
}
