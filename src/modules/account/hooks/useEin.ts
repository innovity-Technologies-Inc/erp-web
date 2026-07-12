import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { einApi } from '../api/ein.api'
import { useUiStore } from '@/store/useUiStore'

export const useGetVatTaxSetting = () => {
  return useQuery({
    queryKey: ['vat-tax-setting'],
    queryFn: einApi.getVatTaxSetting,
  })
}

export const useSaveVatTaxSetting = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (is_fixed: number) => einApi.saveVatTaxSetting(is_fixed),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['vat-tax-setting'] })
      showNotificationModal('Success!', data.message || 'EIN Settings updated successfully.', 'success')
    },
    onError: (error: any) => {
      console.error('Failed to save EIN settings:', error)
      showNotificationModal('Error!', 'Failed to save EIN settings.', 'error')
    }
  })
}

export const useGetTaxSetting = () => {
  return useQuery({
    queryKey: ['tax-setting'],
    queryFn: einApi.getTaxSetting,
  })
}

export const useUpdateTaxSetting = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: einApi.updateTaxSetting,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['tax-setting'] })
      showNotificationModal('Success!', data.message || 'EIN Number Settings updated successfully.', 'success')
    },
    onError: (error: any) => {
      console.error('Failed to update EIN number settings:', error)
      showNotificationModal('Error!', 'Failed to update EIN number settings.', 'error')
    }
  })
}
