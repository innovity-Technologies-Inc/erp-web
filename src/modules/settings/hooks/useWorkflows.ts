import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkflows,
  getWorkflowDetails,
  storeWorkflow,
  deleteWorkflow,
  type WorkflowDTO,
} from '../api/workflow.api'

export const useWorkflowsList = () => {
  return useQuery({
    queryKey: ['approval-workflows-list'],
    queryFn: getWorkflows,
  })
}

export const useWorkflowDetails = (id: number | null) => {
  return useQuery({
    queryKey: ['approval-workflow-details', id],
    queryFn: () => (id ? getWorkflowDetails(id) : null),
    enabled: !!id,
  })
}

export const useStoreWorkflow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: WorkflowDTO) => storeWorkflow(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows-list'] })
    },
  })
}

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows-list'] })
    },
  })
}
