import { apiClient } from '@/api/client'

export interface WarehouseTransferItemDetail {
  id: number
  transfer_id: number
  product_id: number
  batch_master_id?: number | null
  rack_bin_id?: number | null
  to_rack_bin_id?: number | null
  quantity: string | number
  received_quantity: string | number
  product?: {
    id: number
    product_name: string
    product_model?: string
    price?: number
  }
  batch_master?: {
    id: number
    batch_no: string
  }
  rack_bin?: {
    id: number
    aisle?: string
    rack?: string
    shelf?: string
    bin?: string
    barcode_value?: string
    zone?: {
      id: number
      zone_name: string
      zone_code: string
    }
  }
  to_rack_bin?: {
    id: number
    aisle?: string
    rack?: string
    shelf?: string
    bin?: string
    barcode_value?: string
    zone?: {
      id: number
      zone_name: string
      zone_code: string
    }
  }
}

export interface WarehouseTransferListItem {
  id: number
  uuid: string
  transfer_no: string
  transfer_date: string
  from_warehouse_name: string
  to_warehouse_name: string
  items_count: number
  total_quantity: string
  total_received_quantity: string
  status: 'pending' | 'dispatched' | 'received' | 'cancelled'
  remarks?: string | null
  creator_name?: string
  pick_no?: string | null
  pick_status?: string | null
}

export interface WarehousePickListItemDetail {
  id: number
  pick_list_id: number
  product_id: number
  rack_bin_id?: number | null
  batch_master_id?: number | null
  quantity_requested: string | number
  quantity_picked: string | number
  is_scanned: boolean | number
  product?: {
    id: number
    product_name: string
    product_model?: string
  }
  batch_master?: {
    id: number
    batch_no: string
    expiry_date?: string
  }
  rack_bin?: {
    id: number
    aisle?: string
    rack?: string
    shelf?: string
    bin?: string
    zone?: {
      id: number
      zone_name: string
      zone_code: string
    }
  }
}

export interface WarehousePackingSlipDetail {
  id: number
  uuid: string
  packing_no: string
  pick_list_id: number
  gross_weight?: number | string | null
  box_dimensions?: string | null
  created_at?: string
  dispatches?: any[]
}

export interface WarehousePickListDetail {
  id: number
  uuid: string
  pick_no: string
  warehouse_id: number
  warehouse_transfer_id?: number | null
  invoice_id?: number | null
  status: string
  created_at: string
  items: WarehousePickListItemDetail[]
  packing_slips?: WarehousePackingSlipDetail[]
}

export interface UserBasicInfo {
  id: number
  first_name?: string
  last_name?: string
  name?: string
  email?: string
}

export interface WarehouseTransferDetail {
  id: number
  uuid: string
  transfer_no: string
  transfer_date: string
  from_warehouse_id: number
  to_warehouse_id: number
  status: 'pending' | 'dispatched' | 'received' | 'cancelled'
  remarks?: string | null
  created_at?: string
  updated_at?: string
  creator_name?: string
  creator?: UserBasicInfo | null
  receiver?: UserBasicInfo | null
  from_warehouse?: {
    id: number
    name: string
    warehouse_code: string
  }
  to_warehouse?: {
    id: number
    name: string
    warehouse_code: string
  }
  items: WarehouseTransferItemDetail[]
  pick_lists?: WarehousePickListDetail[]
}

export interface DatatableResponse<T> {
  draw: number
  recordsTotal: number
  recordsFiltered: number
  data: T[]
}

export const fetchWarehouseTransferDatatable = async (params: any): Promise<DatatableResponse<WarehouseTransferListItem>> => {
  const { data } = await apiClient.get('/inventory/warehouse-management/transfers/datatable', { params })
  return data
}

export const fetchWarehouseTransferById = async (id: number | string): Promise<WarehouseTransferDetail> => {
  const { data } = await apiClient.get(`/inventory/warehouse-management/transfers/${id}`)
  return data?.response || data?.data || data
}

export const createWarehouseTransfer = async (payload: any) => {
  const { data } = await apiClient.post('/inventory/warehouse-management/transfers', payload)
  return data
}

export const createPickListForTransfer = async (
  warehouseTransferId: number,
  payload?: {
    items?: {
      product_id: number
      batch_master_id?: number | null
      rack_bin_id?: number | null
      quantity_requested: number
    }[]
  }
) => {
  const { data } = await apiClient.post('/inventory/warehouse-management/pick-lists', {
    warehouse_transfer_id: warehouseTransferId,
    ...(payload || {}),
  })
  return data
}

export const dispatchWarehouseTransfer = async (id: number | string) => {
  const { data } = await apiClient.post(`/inventory/warehouse-management/transfers/${id}/dispatch`)
  return data
}

export const receiveWarehouseTransfer = async (id: number | string, payload: { items: { product_id: number; received_quantity: number; to_rack_bin_id?: number | null }[] }) => {
  const { data } = await apiClient.post(`/inventory/warehouse-management/transfers/${id}/receive`, payload)
  return data
}

export const cancelWarehouseTransfer = async (id: number | string) => {
  const { data } = await apiClient.post(`/inventory/warehouse-management/transfers/${id}/cancel`)
  return data
}

export const createPackingSlip = async (payload: {
  pick_list_id: number
  gross_weight?: number | string | null
  box_dimensions?: string | null
  items?: { product_id: number; quantity_picked: number; is_scanned?: boolean }[]
}) => {
  const { data } = await apiClient.post('/inventory/warehouse-management/packing-slips', payload)
  return data
}



