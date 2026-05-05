import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../hooks/validation'
import { useForgotPassword } from '../hooks/useForgotPassword'

export const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const { mutate, isPending, isSuccess } = useForgotPassword()

  const onSubmit = (data: ForgotPasswordFormValues) => {
    mutate(data)
  }

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full animate-in fade-in zoom-in duration-300 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h1>
        <p className="text-gray-500 mb-8">
          We've sent a password reset link to your email address. Please follow the instructions to reset your password.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full py-3 flex gap-2 justify-center items-center">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 w-full animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
        <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Email Address" error={errors.email?.message} required>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register('email')}
              type="email"
              className={`erp-input pl-10 ${errors.email ? 'border-red-500 ring-red-500/10 focus:border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder="e.g. alex.smith@nexus.corp"
            />
          </div>
        </FormField>

        <Button type="submit" className="w-full py-3 text-lg" loading={isPending}>
          Send Reset Link
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
