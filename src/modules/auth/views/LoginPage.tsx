import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { loginSchema, type LoginFormValues } from '../hooks/validation'
import { useLogin } from '../hooks/useLogin'
import { useSettings } from '@/hooks/useSettings'

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { webSetting, companyInformation } = useSettings()
  
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const { mutate, isPending } = useLogin()

  const onSubmit = (data: LoginFormValues) => {
    setAuthError(null)
    mutate(data, {
      onError: (error: any) => {
        const response = error.response?.data
        if (response?.errors) {
          Object.keys(response.errors).forEach((key) => {
            setError(key as keyof LoginFormValues, {
              type: 'server',
              message: response.errors[key][0],
            })
          })
        } else {
          setAuthError(response?.message || 'Invalid credentials or server error')
        }
      }
    })
  }

  const logoUrl = webSetting?.logo_url || companyInformation?.logo_url
  const siteName = webSetting?.site_name || companyInformation?.company_name || 'GEN-ITECH'

  return (
    <div className="w-full">
      {/* Logo & Site Name */}
      <div className="flex items-center gap-3 mb-5 shrink-0 select-none">
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
        <span 
          className="text-[20px] font-bold font-poppins tracking-tight text-slate-800"
          dangerouslySetInnerHTML={{ __html: siteName }}
        />
      </div>

      <div className="mb-8">
        <h1 className="text-[20px] font-semibold leading-[28px] text-gray-900 mb-1">Nice to see you again</h1>
      </div>

      {authError && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField 
          label="Email" 
          error={errors.email?.message}
          labelClassName="text-[11px] font-normal text-gray-500 leading-[12px] tracking-[0.3px] mb-1.5"
        >
          <input {...register('email')}
            type="text"
            className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg outline-none placeholder:text-gray-400 text-sm hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="Enter email"
          />
        </FormField>

        <FormField 
          label="Password" 
          error={errors.password?.message}
          labelClassName="text-[11px] font-normal text-gray-500 leading-[12px] tracking-[0.3px] mb-1.5"
        >
          <div className="relative">
            <input {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg outline-none placeholder:text-gray-400 text-sm hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative inline-flex items-center cursor-pointer">
              <input {...register('rememberMe')}
                type="checkbox"
                className="sr-only peer hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary/30 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
          </label>
          <Link to="/forgot-password" title="Forgot Password?" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button 
          type="submit" 
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm shadow-sm transition-all active:scale-[0.98]" 
          loading={isPending}
        >
          Sign in
        </Button>
      </form>
    </div>
  )
}
