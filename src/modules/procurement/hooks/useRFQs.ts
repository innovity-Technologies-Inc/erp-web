import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRFQs,
  getRFQ,
  createRFQ,
  updateRFQ,
  deleteRFQ,
  dispatchRFQ,
  getComparativeStatement,
  evaluateQuotation,
  awardRFQ,
} from '../api/rfq.api'
import { rfqKeys } from '../api/vendor.keys'
import type { RFQFilters, CreateRFQDto, UpdateRFQDto } from '../api/types'

export const useRFQs = (params?: RFQFilters) => {
  return useQuery({
    queryKey: rfqKeys.list(params),
    queryFn: () => getRFQs(params),
  })
}

export const useRFQDetails = (uuid: string | null | undefined) => {
  return useQuery({
    queryKey: rfqKeys.detail(uuid || null),
    queryFn: () => getRFQ(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateRFQ = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRFQDto) => createRFQ(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
    },
  })
}

export const useUpdateRFQ = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateRFQDto) => updateRFQ(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(variables.uuid) })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
    },
  })
}

export const useDeleteRFQ = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => deleteRFQ(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
    },
  })
}

export const useDispatchRFQ = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuid: string) => dispatchRFQ(uuid),
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(uuid) })
    },
  })
}

export const useComparativeStatement = (uuid: string | null | undefined) => {
  return useQuery({
    queryKey: rfqKeys.comparativeStatement(uuid || null),
    queryFn: () => getComparativeStatement(uuid!),
    enabled: !!uuid,
  })
}

export const useEvaluateQuotation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string
      data: {
        vendor_quotation_id: number
        technical_score: number
        commercial_score: number
        technical_weightage?: number
        commercial_weightage?: number
        scores?: any
      }
    }) => evaluateQuotation(uuid, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(variables.uuid) })
      queryClient.invalidateQueries({ queryKey: rfqKeys.comparativeStatement(variables.uuid) })
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
    },
  })
}

export const useAwardRFQ = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuid, vendorId }: { uuid: string; vendorId: number }) => awardRFQ(uuid, vendorId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rfqKeys.detail(variables.uuid) })
      queryClient.invalidateQueries({ queryKey: rfqKeys.comparativeStatement(variables.uuid) })
    },
  })
}
