import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWarehouseDatatable,
  getStockMovementDatatable,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseDetails,
  storeStockMovement,
  getEmployeeSelect2,
  getMovementTypeSelect2,
  getBatchSelect2,
  getBatchWiseProductSelect2,
  getBatchProductAvailableQty,
  getWarehouses,
  type WarehouseFormData,
  type StockMovementFormData
} from '../api/warehouse.api'
import { useUiStore } from '@/store/useUiStore'

export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses', 'list'],
    queryFn: () => getWarehouses(),
  })
}

export const useWarehouseDatatable = (params: any) => {
  return useQuery({
    queryKey: ['warehouse', 'datatable', params],
    queryFn: () => getWarehouseDatatable(params),
  })
}

export const useStockMovementDatatable = (params: any) => {
  return useQuery({
    queryKey: ['stock-movement', 'datatable', params],
    queryFn: () => getStockMovementDatatable(params),
  })
}

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: WarehouseFormData) => createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      showNotificationModal(
        'Warehouse Created!',
        'The warehouse has been created successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Creation Failed',
        error.response?.data?.message || 'Failed to create warehouse. Please try again.',
        'error'
      )
    }
  })
}

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: WarehouseFormData & { uuid: string }) => updateWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      showNotificationModal(
        'Warehouse Updated!',
        'The warehouse has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Update Failed',
        error.response?.data?.message || 'Failed to update warehouse. Please try again.',
        'error'
      )
    }
  })
}

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ uuid, id }: { uuid: string; id: number }) => deleteWarehouse(uuid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] })
      showNotificationModal(
        'Deleted Successfully!',
        'The warehouse has been deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Delete Failed',
        error.response?.data?.message || 'Failed to delete warehouse.',
        'error'
      )
    }
  })
}

export const useWarehouseDetails = (id: string | number | null) => {
  return useQuery({
    queryKey: ['warehouse', 'details', id],
    queryFn: () => getWarehouseDetails(id!),
    enabled: !!id,
  })
}

export const useStoreStockMovement = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: StockMovementFormData) => storeStockMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movement'] })
      showNotificationModal(
        'Success!',
        'Stock movement recorded successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      showNotificationModal(
        'Error',
        error.response?.data?.message || 'Failed to record stock movement.',
        'error'
      )
    }
  })
}

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees', 'select2'],
    queryFn: () => getEmployeeSelect2(),
  })
}

export const useMovementTypes = (category: string | null) => {
  return useQuery({
    queryKey: ['movement-types', 'select2', category],
    queryFn: () => getMovementTypeSelect2(category!),
    enabled: !!category,
  })
}

export const useBatches = (warehouseId: string | number | null) => {
  return useQuery({
    queryKey: ['batches', 'select2', warehouseId],
    queryFn: () => getBatchSelect2(warehouseId!),
    enabled: !!warehouseId,
  })
}

export const useBatchProducts = (batchId: string | number | null) => {
  return useQuery({
    queryKey: ['batch-products', 'select2', batchId],
    queryFn: () => getBatchWiseProductSelect2(batchId!),
    enabled: !!batchId,
  })
}

export const useBatchProductQty = (batchId: string | number | null, productId: string | number | null, warehouseId: string | number | null) => {
  return useQuery({
    queryKey: ['batch-product-qty', batchId, productId, warehouseId],
    queryFn: () => getBatchProductAvailableQty(batchId!, productId!, warehouseId!),
    enabled: !!batchId && !!productId && !!warehouseId,
  })
}
