import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWebSetting, updateWebSetting } from '../api/settings.api'

export const useWebSetting = () => {
  return useQuery({
    queryKey: ['web-setting'],
    queryFn: getWebSetting,
  })
}

export const useUpdateWebSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => updateWebSetting(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-setting'] })
    },
  })
}
