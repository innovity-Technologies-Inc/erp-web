import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
}

export const LoadingState = ({ message = 'Loading details...' }: LoadingStateProps) => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-[14px] font-medium text-[#64748b]">{message}</p>
    </div>
  )
}
