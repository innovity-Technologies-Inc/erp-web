import { apiClient } from '@/api/client'

export interface SubTypeListItem {
  id: number
  uuid: string
  sub_type_name: string
}

export interface DatatableResponse<T> {
  draw: number
  recordsTotal: number
  recordsFiltered: number
  data: T[]
}

export const subTypeApi = {
  getDatatable: async (params: any): Promise<DatatableResponse<SubTypeListItem>> => {
    const response = await apiClient.get<DatatableResponse<SubTypeListItem>>('/account/datatable/acc-sub-type', { params })
    return response.data
  }
}
