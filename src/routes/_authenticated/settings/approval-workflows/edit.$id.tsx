import { createFileRoute } from '@tanstack/react-router'
import { ApprovalWorkflowEditPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/approval-workflows/edit/$id')({
  component: ApprovalWorkflowEditPage,
})
