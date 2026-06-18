import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/categories.api'
import { useUiStore } from '@/store/useUiStore'

export const useCategoriesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['categories-datatable', params],
    queryFn: () => api.getCategoriesDatatable(params),
  })
}

export const useCategoryList = () => {
  return useQuery({
    queryKey: ['category-list'],
    queryFn: api.getCategoryList,
  })
}

export const useCategorySelect2 = () => {
  return useQuery({
    queryKey: ['category-select2'],
    queryFn: api.getCategorySelect2,
  })
}

export const useMainCategorySelect2 = () => {
  return useQuery({
    queryKey: ['main-category-select2'],
    queryFn: api.getMainCategorySelect2,
  })
}

export const useSubCategorySelect2 = (parentId: number | string | null) => {
  return useQuery({
    queryKey: ['sub-category-select2', parentId],
    queryFn: () => api.getSubCategorySelect2(parentId!),
    enabled: !!parentId,
  })
}

export const useStoreCategory = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.storeCategory,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['category-list'] })
      showNotificationModal(
        'Category Created!',
        res.message || 'New category has been added successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to add category.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: api.updateCategory,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['category-list'] })
      showNotificationModal(
        'Category Updated!',
        res.message || 'Category details have been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update category.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useToggleCategoryStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { uuid: string; status: number }) => 
      api.updateCategory({ uuid: payload.uuid, status: payload.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['category-list'] })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['category-list'] })
    },
  })
}

export const useCategoryData = (id: number | string | null) => {
  return useQuery({
    queryKey: ['category-details', id],
    queryFn: () => api.getCategoryData(id!),
    enabled: !!id,
  })
}
