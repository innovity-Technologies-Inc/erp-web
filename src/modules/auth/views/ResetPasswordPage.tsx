import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Link, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../hooks/validation'
import { useResetPassword } from '../hooks/useResetPassword'

export const ResetPasswordPage = () => {
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

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 w-full animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-500 text-sm">Create a new secure password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Hidden fields for token and email if they are coming from URL */}
        <input type="hidden" {...register('token')} />
        <input type="hidden" {...register('email')} />

        <FormField label="New Password" error={errors.password?.message} required>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register('password')}
              type="password"
              className={`erp-input pl-10 ${errors.password ? 'border-red-500 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder="••••••••••••"
            />
          </div>
        </FormField>

        <FormField label="Confirm New Password" error={errors.password_confirmation?.message} required>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register('password_confirmation')}
              type="password"
              className={`erp-input pl-10 ${errors.password_confirmation ? 'border-red-500 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder="••••••••••••"
            />
          </div>
        </FormField>

        <Button type="submit" className="w-full py-3 text-lg" loading={isPending}>
          Reset Password
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/login" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors flex items-center justify-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.2em]">
          Security Protocol: AES-256 Encrypted
        </p>
        <div className="flex gap-4 text-gray-300">
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
