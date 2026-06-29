import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { openingBalanceApi } from '../api/opening-balance.api'
import { useUiStore } from '@/store/useUiStore'

export const useOpeningBalancesDatatable = (params: any) => {
  return useQuery({
    queryKey: ['opening-balances-datatable', params],
    queryFn: () => openingBalanceApi.getDatatable(params),
  })
}

export const useStoreOpeningBalance = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: openingBalanceApi.store,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['opening-balances-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Opening balance saved successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to save opening balance.'
      showNotificationModal('Submission Failed', message, 'error')
    }
  })
}

export const useUpdateOpeningBalance = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: openingBalanceApi.update,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['opening-balances-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['opening-balance-details'] })
      showNotificationModal(
        'Success!',
        res.message || 'Opening balance updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update opening balance.'
      showNotificationModal('Update Failed', message, 'error')
    }
  })
}

export const useDeleteOpeningBalance = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: openingBalanceApi.delete,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['opening-balances-datatable'] })
      showNotificationModal(
        'Success!',
        res.message || 'Opening balance has been deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete opening balance.'
      showNotificationModal('Deletion Failed', message, 'error')
    }
  })
}

export const useOpeningBalanceDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: ['opening-balance-details', uuid],
    queryFn: async () => {
      const res = await openingBalanceApi.show(uuid!)
      return res.data
    },
    enabled: !!uuid,
  })
}

export const useFinancialYearsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'financial-years-old'],
    queryFn: async () => {
      const raw = await openingBalanceApi.getFinancialYears()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
      }))
    },
  })
}

export const useAccountsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'asset-liabilities-accounts'],
    queryFn: async () => {
      const raw = await openingBalanceApi.getAccounts()
      return raw.map((item) => ({
        value: item.id,
        label: item.text,
      }))
    },
  })
}
