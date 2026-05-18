import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, ArrowLeft } from 'lucide-react'
import { Link, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../hooks/validation'
import { useResetPassword } from '../hooks/useResetPassword'
import { useSettings } from '@/hooks/useSettings'

export const ResetPasswordPage = () => {
  const { webSetting, companyInformation } = useSettings()
  const search = useSearch({ from: '/_auth/reset-password' }) as { token: string; email: string }
  
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { 
      token: search.token || '', 
      email: search.email || '',
      password: '',
      password_confirmation: ''
    },
  })

  const { mutate, isPending } = useResetPassword()

  const onSubmit = (data: ResetPasswordFormValues) => {
    mutate(data)
  }

  const logoUrl = webSetting?.logo_url || companyInformation?.logo_url
  const siteName = webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH'

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="mb-10">
        {logoUrl ? (
          <img src={logoUrl} alt={siteName} className="h-12 w-auto object-contain" />
        ) : (
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shrink-0">
            <div className="text-white font-black text-2xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                 <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-[20px] font-semibold leading-[28px] text-gray-900 mb-1">Reset Password</h1>
        <p className="text-gray-500 text-sm">Create a new secure password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Hidden fields for token and email if they are coming from URL */}
        <input type="hidden" {...register('token')} />
        <input type="hidden" {...register('email')} />

        <FormField 
          label="New Password" 
          error={errors.password?.message}
          labelClassName="text-[11px] font-normal text-gray-500 leading-[12px] tracking-[0.3px] mb-1.5"
        >
          <input {...register('password')}
            type="password"
            className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg outline-none placeholder:text-gray-400 text-sm hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="••••••••••••"
          />
        </FormField>

        <FormField 
          label="Confirm New Password" 
          error={errors.password_confirmation?.message}
          labelClassName="text-[11px] font-normal text-gray-500 leading-[12px] tracking-[0.3px] mb-1.5"
        >
          <input {...register('password_confirmation')}
            type="password"
            className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg outline-none placeholder:text-gray-400 text-sm hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="••••••••••••"
          />
        </FormField>

        <Button 
          type="submit" 
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm shadow-sm transition-all active:scale-[0.98]" 
          loading={isPending}
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/login" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </div>
  )
}
