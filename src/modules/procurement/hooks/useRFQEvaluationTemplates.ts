import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRFQEvaluationTemplates,
  getRFQEvaluationTemplate,
  createRFQEvaluationTemplate,
  updateRFQEvaluationTemplate,
  deleteRFQEvaluationTemplate,
} from '../api/rfqEvaluationTemplate.api'
import { rfqEvaluationTemplateKeys } from '../api/vendor.keys'
import type {
  RFQEvaluationTemplateFilters,
  CreateRFQEvaluationTemplateDto,
  UpdateRFQEvaluationTemplateDto,
} from '../api/types'

export const useRFQEvaluationTemplates = (filters?: RFQEvaluationTemplateFilters) => {
  return useQuery({
    queryKey: rfqEvaluationTemplateKeys.list(filters),
    queryFn: () => getRFQEvaluationTemplates(filters),
    staleTime: 30_000,
  })
}

export const useRFQEvaluationTemplateDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: rfqEvaluationTemplateKeys.detail(uuid),
    queryFn: () => getRFQEvaluationTemplate(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateRFQEvaluationTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRFQEvaluationTemplateDto) => createRFQEvaluationTemplate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqEvaluationTemplateKeys.all() })
    },
  })
}

export const useUpdateRFQEvaluationTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateRFQEvaluationTemplateDto) => updateRFQEvaluationTemplate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqEvaluationTemplateKeys.all() })
    },
  })
}

export const useDeleteRFQEvaluationTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteRFQEvaluationTemplate(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqEvaluationTemplateKeys.all() })
    },
  })
}
