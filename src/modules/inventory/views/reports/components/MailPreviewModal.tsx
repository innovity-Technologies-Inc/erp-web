import { Loader2, Send } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'

interface MailPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  previewUrl: string
  isLoading?: boolean
  isSending?: boolean
}

export const MailPreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  previewUrl,
  isLoading = false,
  isSending = false,
}: MailPreviewModalProps) => {
  return (
    <Modal
      title="Report Preview"
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <div className="flex flex-col h-[75vh] -m-6">
        {/* Preview Area with Dark Background */}
        <div className="flex-1 bg-[#2d2d2d] relative overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-white opacity-50" />
              <p className="text-[14px] font-medium text-white opacity-50">Loading preview...</p>
            </div>
          ) : (
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-none"
              title="Report PDF Preview"
            />
          )}
        </div>

        {/* Custom High-Fidelity Footer */}
        <div className="h-[80px] bg-white border-t border-gray-100 flex items-center justify-between px-6 shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="rounded-lg px-10 h-11 bg-[#f1f5f9] border-none text-[#475569] font-bold hover:bg-gray-200 transition-all shadow-sm"
            disabled={isSending}
          >
            Cancel
          </Button>
          
          <Button 
            variant="primary" 
            onClick={onConfirm} 
            className="rounded-lg px-8 h-11 bg-[#059669] hover:bg-[#047857] shadow-lg shadow-emerald-500/20 font-bold flex items-center gap-2"
            loading={isSending}
          >
            {!isSending && <Send className="h-4 w-4" strokeWidth={2.5} />}
            {isSending ? 'SENDING...' : 'Send to Merchant Email'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
