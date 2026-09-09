import { apiClient } from '@/api/client'

export interface WorkflowStepDTO {
  id?: number
  name: string
  step_order: number
  type: 'user-type' | 'role-user' | 'specific-user'
  required_user_type?: string | null
  role_id?: number | null
  user_id?: number | null
  role?: { id: number; name: string } | null
  user?: { id: number; name: string; email: string } | null
}

export interface WorkflowItem {
  id: number
  name: string
  module: string
  type: 'sequential' | 'random'
  total_steps: number
  required_approvals?: number | null
  is_active: boolean
  includer_user_types?: string[] | null
  includer_role_ids?: number[] | null
  includer_user_ids?: number[] | null
  exclude_user_types?: string[] | null
  exclude_role_ids?: number[] | null
  exclude_user_ids?: number[] | null
  steps: WorkflowStepDTO[]
  created_at?: string
  updated_at?: string
}

export interface WorkflowDTO {
  id?: number
  name: string
  module: string
  type: 'sequential' | 'random'
  total_steps: number
  required_approvals?: number | null
  is_active: boolean
  includer_user_types?: string[] | null
  includer_role_ids?: number[] | null
  includer_user_ids?: number[] | null
  exclude_user_types?: string[] | null
  exclude_role_ids?: number[] | null
  exclude_user_ids?: number[] | null
  steps: Array<{
    id?: number
    name: string
    step_order: number
    type: 'user-type' | 'role-user' | 'specific-user'
    required_user_type?: string | null
    role_id?: number | null
    user_id?: number | null
  }>
}

export const getWorkflows = async (): Promise<{ status: string; data: WorkflowItem[] }> => {
  const response = await apiClient.get('/procurement/approval-engine/workflows')
  return response.data
}

export const getWorkflowDetails = async (id: number): Promise<{ status: string; data: WorkflowItem }> => {
  const response = await apiClient.get(`/procurement/approval-engine/workflows/${id}`)
  return response.data
}

export const storeWorkflow = async (dto: WorkflowDTO): Promise<any> => {
  if (dto.id) {
    const response = await apiClient.put(`/procurement/approval-engine/workflows/${dto.id}`, dto)
    return response.data
  }
  const response = await apiClient.post('/procurement/approval-engine/workflows', dto)
  return response.data
}

export const deleteWorkflow = async (id: number): Promise<any> => {
  const response = await apiClient.delete(`/procurement/approval-engine/workflows/${id}`)
  return response.data
}
