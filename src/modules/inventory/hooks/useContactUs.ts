import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getContactUsDatatable, 
  getContactUsDetails, 
  replyContactUs 
} from '../api/contactUs.api'
import type { ContactUsReplyData } from '../api/contactUs.api'
import { useUiStore } from '@/store/useUiStore'

export const useContactUsDatatable = (params: any) => {
  return useQuery({
    queryKey: [
      'contact-us', 
      'datatable', 
      params.start, 
      params.length, 
      params.search?.value, 
      params.start_date, 
      params.end_date
    ],
    queryFn: () => getContactUsDatatable(params),
  })
}

export const useContactUsDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['contact-us', id],
    queryFn: () => getContactUsDetails(id!),
    enabled: !!id,
  })
}

export const useReplyContactUs = () => {
  const queryClient = useQueryClient()
  const { notify } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUsReplyData }) => replyContactUs(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-us'] })
    },
    onError: (error: any) => {
      notify(error.response?.data?.message || 'Failed to send reply', 'error')
    }
  })
}
