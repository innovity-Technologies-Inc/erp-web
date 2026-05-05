import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { loginSchema, type LoginFormValues } from '../hooks/validation'
import { useLogin } from '../hooks/useLogin'

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
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

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 w-full animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
        <p className="text-gray-500 text-sm">Access your secure enterprise workspace</p>
      </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Email or Username" error={errors.email?.message} required>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register('email')}
              type="text"
              className={`erp-input pl-10 ${errors.email ? 'border-red-500 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder="e.g. alex.smith@nexus.corp"
            />
          </div>
        </FormField>

        <FormField label="Password" error={errors.password?.message} required>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className={`erp-input pl-10 pr-10 ${errors.password ? 'border-red-500 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              {...register('rememberMe')}
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
          </label>
          <Link to="/forgot-password" title="Forgot Password?" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" className="w-full py-3 text-lg" loading={isPending}>
          Sign In
        </Button>
      </form>

      <div className="mt-8">
        <div className="relative flex items-center justify-center py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Or securely via
          </span>
        </div>

        <Button variant="outline" className="w-full py-3 gap-3">
          <ShieldCheck className="h-5 w-5 text-gray-400" />
          SSO Login
        </Button>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.2em]">
          Security Protocol: AES-256 Encrypted
        </p>
        <div className="flex gap-4 text-gray-300">
          <ShieldCheck className="h-4 w-4" />
          <Lock className="h-4 w-4" />
          <Mail className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
