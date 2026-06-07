import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Send, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Undo2, 
  Paperclip, 
  History,
  Clock,
  Quote
} from 'lucide-react'
import { contactUsReplySchema } from '../../hooks/validation'
import type { ContactUsReplyValues } from '../../hooks/validation'
import { useContactUsDetails, useReplyContactUs } from '../../hooks/useContactUs'
import { useUiStore } from '@/store/useUiStore'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'

export const ContactUsReplyPage = () => {
  const { id } = useParams({ from: '/_authenticated/inventory/contact-us/reply/$id' })
  const navigate = useNavigate()
  const contactId = Number(id)
  
  const { data: detailsResponse, isLoading: isLoadingDetails } = useContactUsDetails(contactId)
  const { mutate: replyContactUs, isPending: isReplying } = useReplyContactUs()
  const { showNotificationModal } = useUiStore()
  
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const details = detailsResponse?.data

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactUsReplyValues>({
    resolver: zodResolver(contactUsReplySchema),
    defaultValues: {
      replay_message: '',
    },
  })

  useEffect(() => {
    if (details?.replay_message) {
      reset({ replay_message: details.replay_message })
    }
  }, [details, reset])

  const onSubmit = (data: ContactUsReplyValues) => {
    replyContactUs(
      { id: contactId, data },
      {
        onSuccess: () => {
          showNotificationModal(
            'Replied Successfully!',
            'Your reply has been sent successfully.',
            'success'
          )
          navigate({ to: '/inventory/sales/contact-us' })
        },
      }
    )
  }

  const handleDiscard = () => {
    setIsDiscardModalOpen(true)
  }

  const confirmDiscard = () => {
    navigate({ to: '/inventory/sales/contact-us' })
  }

  if (isLoadingDetails) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-primary/30 shadow-sm">
        <h2 className="text-xl font-semibold text-[#1e293b]">Contact message not found</h2>
        <Link to="/inventory/sales/contact-us" className="mt-4 text-primary hover:underline inline-block font-medium">
          Go back to list
        </Link>
      </div>
    )
  }

  const isReplied = details.status === 'Replied'

  // Format date: October 24, 2023 · 10:45 AM
  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }
    const formattedDate = date.toLocaleDateString('en-US', options)
    const formattedTime = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    })
    return `${formattedDate} · ${formattedTime}`
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/inventory/sales/contact-us"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-primary/30 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            Contact Us Replay
          </h1>
        </div>

        {/* Status Badge */}
        <div>
          {isReplied ? (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[11px] font-medium uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Responded
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100 text-[11px] font-medium uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              Not Yet Responded
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start bg-white p-4 rounded-xl shadow-sm">
        
        {/* Left Column: Client Info & Message */}
        <div className="space-y-6">
          
          {/* Client Info Card */}
          <div className="bg-white rounded-[10px] border border-primary/30 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1e293b]">{details.name}</h3>
                <p className="text-xs text-gray-500 font-medium">Client ID: #{String(details.id).padStart(6, '0')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Email Address</p>
                <div className="flex items-center gap-2 text-[14px] font-semibold text-[#334155]">
                  <Mail className="h-4 w-4 text-primary" />
                  {details.email}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Phone Number</p>
                <div className="flex items-center gap-2 text-[14px] font-semibold text-[#334155]">
                  <Phone className="h-4 w-4 text-primary" />
                  {details.phone || '---'}
                </div>
              </div>
            </div>
          </div>

          {/* Message Content Card */}
          <div className="bg-white rounded-xl border border-primary/30 p-8 shadow-sm relative overflow-hidden min-h-[250px] flex flex-col">
             <div className="flex items-center gap-3 mb-6">
               <span className="px-2.5 py-1 bg-[#dbeafe] text-primary text-[10px] font-medium uppercase rounded-md">Subject</span>
               <h4 className="text-[16px] font-medium text-[#1e293b]">{details.subject}</h4>
             </div>
             
             <div className="relative p-6 bg-[#f8fafc] rounded-lg flex-1 border-l-4 border-primary overflow-hidden">
               <Quote className="absolute -top-4 -right-1 h-20 w-20 text-gray-200/50 rotate-180" />
               <p className="text-[#334155] text-[14px] leading-relaxed relative z-10 font-normal">
                 "{details.message}"
               </p>
             </div>


             <div className="mt-6 text-right">
               <p className="text-[11px] font-medium text-gray-400">
                 Received: {formatFullDate(details.created_at)}
               </p>
             </div>
          </div>
        </div>

        {/* Right Column: Compose Reply */}
        <div className="bg-white rounded-xl border border-primary/30 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Compose Header */}
          <div className="p-8 pb-4 flex items-center gap-3">
            <Undo2 className="h-5 w-5 text-primary -scale-x-100" />
            <h3 className="text-[18px] font-medium text-[#1e293b]">Compose Reply</h3>
          </div>

          <div className="px-8 pb-8 flex-1 flex flex-col">
            {isReplied ? (
              <div className="space-y-4 flex-1 mt-4">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Your Previous Message</p>
                <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 flex-1">
                  <p className="text-[#334155] text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {details.replay_message}
                  </p>
                </div>
                <div className="flex justify-end pt-4">
                   <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                     Replied on: {formatFullDate(details.replay_at || '')}
                   </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 gap-6 mt-4">
                <div className="flex-1 flex flex-col gap-3">
                  <p className="text-[12px] font-medium text-gray-500">Your Message</p>
                  <textarea {...register('replay_message')}
                    className="flex-1 w-full border border-primary/30 rounded-lg p-6 text-[15px] outline-none resize-none bg-white placeholder:text-gray-300 hover:border-gray-300 focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="Enter your replay message here..."
                  />
                  {errors.replay_message && (
                    <span className="text-xs text-rose-500 font-medium">{errors.replay_message.message}</span>
                  )}
                </div>

                {/* Attachment & Templates Bar */}
                <div className="bg-[#f3f4f6] rounded-lg p-1.5 flex items-center h-12">
                  <button type="button" className="flex-1 flex items-center justify-center gap-2 text-[13px] font-medium text-[#4b5563] hover:text-primary transition-colors">
                    <Paperclip className="h-4 w-4" />
                    Attach
                  </button>
                  <div className="w-[1px] h-6 bg-gray-300" />
                  <button type="button" className="flex-1 flex items-center justify-center gap-2 text-[13px] font-medium text-[#4b5563] hover:text-primary transition-colors">
                    <History className="h-4 w-4" />
                    Templates
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button 
                    type="button" 
                    className="px-6 h-10 bg-white border border-gray-200 text-[#64748b] font-medium rounded-lg hover:bg-gray-50 transition-all text-[13px] shadow-sm"
                    onClick={handleDiscard}
                    disabled={isReplying}
                  >
                    Discard
                  </button>
                  <PermissionGuard permission="reply-contact-us">
                    <button 
                      type="submit"
                      disabled={isReplying}
                      className="px-10 h-10 bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-[13px]"
                    >
                      {isReplying ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Reply
                    </button>
                  </PermissionGuard>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={confirmDiscard}
        title="Discard Reply?"
        message="Are you sure you want to discard this reply? Any unsaved changes will be lost."
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
