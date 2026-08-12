import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../hooks/validation'
import { useForgotPassword } from '../hooks/useForgotPassword'
import { useSettings } from '@/hooks/useSettings'

export const ForgotPasswordPage = () => {
  const { webSetting, companyInformation } = useSettings()
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { mutate, isPending, isSuccess } = useForgotPassword()

  const onSubmit = (data: ForgotPasswordFormValues) => {
    mutate(data)
  }

  const logoUrl = webSetting?.logo_url || companyInformation?.logo_url
  const siteName = webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH'

  if (isSuccess) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 mb-3">Check your email</h1>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed">
          We've sent a password reset link to your email address. Please follow the instructions to reset your password.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full py-3 border-primary/30 text-primary hover:bg-primary/10 flex gap-2 justify-center items-center rounded-lg font-semibold text-sm transition-all">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Logo & Site Name */}
      <div className="flex items-center gap-3 mb-10 shrink-0 select-none">
        {logoUrl ? (
          <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain" />
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
        <span className="text-[20px] font-bold font-poppins tracking-tight text-slate-800">
          {siteName}
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-[20px] font-semibold leading-[28px] text-gray-900 mb-1">Forgot Password?</h1>
        <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField 
          label="Email Address" 
          error={errors.email?.message}
          labelClassName="text-[11px] font-normal text-gray-500 leading-[12px] tracking-[0.3px] mb-1.5"
        >
          <input {...register('email')}
            type="email"
            className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg outline-none placeholder:text-gray-400 text-sm hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="Enter your email address"
          />
        </FormField>

        <Button 
          type="submit" 
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm shadow-sm transition-all active:scale-[0.98]" 
          loading={isPending}
        >
          Send Reset Link
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
