import { useMemo, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Mail, Send, Settings, ShieldCheck, MailWarning } from 'lucide-react'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { FormField } from '@/components/Form/FormField'
import { Button } from '@/components/Button/Button'
import { Select2 } from '@/components/Select/Select2'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { getSettingsTabs } from '../tabs'
import { usePermissions } from '@/hooks/usePermissions'
import { emailConfigSchema, type EmailConfigFormValues } from '../hooks/validation'
import { useEmailConfig, useUpdateEmailConfig, useSendTestEmail } from '../hooks/useEmailConfig'

export const EmailPage = () => {
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

  if (!isSuperAdmin && !hasPermission('view_email_setting')) {
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

  const tabs = useMemo(() => getSettingsTabs('/settings/email', isSuperAdmin, hasPermission), [isSuperAdmin, hasPermission])

  const [testEmailVal, setTestEmailVal] = useState('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      protocol: '',
      smtp_host: '',
      smtp_port: '',
      smtp_user: '',
      smtp_pass: '',
      mailtype: 'html',
      isinvoice: false,
      isservice: false,
      isquotation: false,
    },
  })

  const mailTypeOptions = useMemo(
    () => [
      { value: 'html', label: 'HTML' },
      { value: 'text', label: 'TEXT' },
    ],
    []
  )

  // Fetch current mail settings
  const { data: configData, isLoading } = useEmailConfig()
  const { mutate: updateConfig, isPending: isUpdating } = useUpdateEmailConfig()
  const { mutate: testEmail, isPending: isTesting } = useSendTestEmail()

  // Reset form when settings data is loaded
  useEffect(() => {
    if (configData?.data) {
      const config = configData.data
      reset({
        protocol: config.protocol || '',
        smtp_host: config.smtp_host || '',
        smtp_port: String(config.smtp_port || ''),
        smtp_user: config.smtp_user || '',
        smtp_pass: config.smtp_pass || '',
        mailtype: config.mailtype || 'html',
        isinvoice: Boolean(Number(config.isinvoice)),
        isservice: Boolean(Number(config.isservice)),
        isquotation: Boolean(Number(config.isquotation)),
      })
    }
  }, [configData, reset])

  const onSubmit = (data: EmailConfigFormValues) => {
    const payload = {
      protocol: data.protocol,
      smtp_host: data.smtp_host,
      smtp_port: String(data.smtp_port),
      smtp_user: data.smtp_user,
      smtp_pass: data.smtp_pass,
      mailtype: data.mailtype,
      isinvoice: data.isinvoice ? 1 : 0,
      isservice: data.isservice ? 1 : 0,
      isquotation: data.isquotation ? 1 : 0,
    }

    updateConfig(payload, {
      onSuccess: (res) => {
        showNotificationModal(
          'Updated Successfully!',
          res.message || 'Mail settings have been updated successfully.',
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to update mail settings.'
        showNotificationModal('Update Failed', msg, 'error')
      },
    })
  }

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmailVal) {
      showNotificationModal('Invalid Input', 'Please enter a valid test email address.', 'error')
      return
    }

    testEmail(testEmailVal, {
      onSuccess: (res) => {
        showNotificationModal(
          'Test Email Sent!',
          res.message || `Test email sent successfully to ${testEmailVal}.`,
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to send test email.'
        showNotificationModal('Test Failed', msg, 'error')
      },
    })
  }

  return (
    <ListPageLayout
      title="Mail Config"
      backTo="/"
      tabs={tabs}
      disableCard={true}
      rowData={[]}
      columnDefs={[]}
      isLoading={isLoading}
    >
      <div className="space-y-6 max-w-[1200px] mx-auto">
        
        {/* Card 1: Mail Configuration Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/5 text-primary rounded-xl">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight">
                  Mail Server Configuration
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">Configure protocol and SMTP credentials for transactional emails.</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <FormField label="Protocol" error={errors.protocol?.message} required>
                  <input
                    {...register('protocol')}
                    type="text"
                    className="erp-input w-full"
                    placeholder="e.g. smtp"
                    autoComplete="off"
                  />
                </FormField>

                <FormField label="SMTP Host" error={errors.smtp_host?.message} required>
                  <input
                    {...register('smtp_host')}
                    type="text"
                    className="erp-input w-full"
                    placeholder="e.g. smtp.mailtrap.io"
                    autoComplete="off"
                  />
                </FormField>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <FormField label="SMTP Port" error={errors.smtp_port?.message} required>
                  <input
                    {...register('smtp_port')}
                    type="text"
                    className="erp-input w-full"
                    placeholder="e.g. 587 or 2525"
                    autoComplete="off"
                  />
                </FormField>

                <FormField label="Sender Mail" error={errors.smtp_user?.message} required>
                  <input
                    {...register('smtp_user')}
                    type="text"
                    className="erp-input w-full"
                    placeholder="e.g. user@smtp.mailtrap.io"
                    autoComplete="off"
                  />
                </FormField>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <FormField label="Password" error={errors.smtp_pass?.message} required>
                  <input
                    {...register('smtp_pass')}
                    type="password"
                    className="erp-input w-full"
                    placeholder="SMTP Password"
                    autoComplete="off"
                  />
                </FormField>

                <FormField label="Mail Type" required>
                  <Controller
                    name="mailtype"
                    control={control}
                    render={({ field }) => (
                      <Select2
                        options={mailTypeOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        className="w-full"
                        menuPortalTarget={document.body}
                      />
                    )}
                  />
                </FormField>

              </div>

              {/* Enable For Checkboxes */}
              <div className="border-t border-gray-100 pt-6">
                <label className="text-[13px] font-semibold text-slate-800 tracking-tight block mb-4">
                  Enable Mail Notifications For:
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <label className="flex items-center gap-3 p-4 border border-gray-100 hover:border-gray-200 bg-slate-50/50 rounded-xl cursor-pointer hover:bg-slate-50/80 transition-all select-none">
                    <input
                      {...register('isinvoice')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer accent-primary"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Sale Invoice</span>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Send mail on new sale creation</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-100 hover:border-gray-200 bg-slate-50/50 rounded-xl cursor-pointer hover:bg-slate-50/80 transition-all select-none">
                    <input
                      {...register('isservice')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer accent-primary"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Service Invoice</span>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Send mail on service transactions</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-100 hover:border-gray-200 bg-slate-50/50 rounded-xl cursor-pointer hover:bg-slate-50/80 transition-all select-none">
                    <input
                      {...register('isquotation')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer accent-primary"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Quotation</span>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Send mail on sending quotations</p>
                    </div>
                  </label>

                </div>
              </div>

              {/* Submit Row */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button type="submit" loading={isUpdating} className="px-6 rounded-xl">
                  <Save className="h-4 w-4" />
                  Update
                </Button>
              </div>

            </form>
          )}

        </div>

        {/* Card 2: Test Mail Panel */}
        {!isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-50 pb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-800 tracking-tight">
                  Verify Configuration
                </h3>
                <p className="text-[11px] text-gray-400 font-medium">Send a test email to verify that your mail server credentials are working properly.</p>
              </div>
            </div>

            <form onSubmit={handleTestEmail} className="flex flex-col md:flex-row gap-4 items-end pt-2">
              <div className="flex-1 w-full">
                <FormField label="Receiver Test Email">
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={testEmailVal}
                      onChange={(e) => setTestEmailVal(e.target.value)}
                      className="erp-input w-full pl-10"
                      placeholder="receiver@example.com"
                      autoComplete="off"
                    />
                    <Mail className="absolute left-3.5 h-4 w-4 text-gray-400" />
                  </div>
                </FormField>
              </div>
              <div className="w-full md:w-auto">
                <Button 
                  type="submit" 
                  loading={isTesting} 
                  disabled={!testEmailVal}
                  className="w-full md:w-auto h-[38px] bg-slate-800 hover:bg-slate-900 text-white border-transparent px-6 rounded-xl flex items-center justify-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Test
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </ListPageLayout>
  )
}
