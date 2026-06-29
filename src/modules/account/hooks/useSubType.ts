import { useQuery } from '@tanstack/react-query'
import { subTypeApi } from '../api/sub-type.api'

export const useSubTypeDatatable = (params: any) => {
  return useQuery({
    queryKey: ['subTypes', 'datatable', params],
    queryFn: () => subTypeApi.getDatatable(params),
    placeholderData: (prev) => prev
  })
}
