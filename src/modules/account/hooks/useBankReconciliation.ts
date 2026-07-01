import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bankReconciliationApi } from '../api/bank-reconciliation.api'
import type { ReconciliationQueryParams } from '../api/bank-reconciliation.api'

export const useBankReconciliationData = (params: ReconciliationQueryParams) => {
  return useQuery({
    queryKey: ['bank-reconciliation-data', params],
    queryFn: () => bankReconciliationApi.getData(params),
  })
}

export const useSaveBankReconciliation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: { v_no: string }[]) => bankReconciliationApi.saveReconciliation(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation-data'] })
    }
  })
}

export const useBankAccountsSelect2 = () => {
  return useQuery({
    queryKey: ['select2', 'bank-accounts'],
    queryFn: () => bankReconciliationApi.getBanks(),
  })
}
