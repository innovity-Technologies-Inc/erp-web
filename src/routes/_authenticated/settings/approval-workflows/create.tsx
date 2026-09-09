import { createFileRoute } from '@tanstack/react-router'
import { ApprovalWorkflowCreatePage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/approval-workflows/create')({
  component: ApprovalWorkflowCreatePage,
})
