import { createFileRoute } from '@tanstack/react-router'
import { ApprovalWorkflowPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/approval-workflows/')({
  component: ApprovalWorkflowPage,
})
