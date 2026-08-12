import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPrintSetting, updatePrintSetting } from '../api/settings.api'

export const usePrintSetting = () => {
  return useQuery({
    queryKey: ['print-setting'],
    queryFn: getPrintSetting,
  })
}

export const useUpdatePrintSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePrintSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-setting'] })
    },
  })
}
