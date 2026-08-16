import { createFileRoute } from '@tanstack/react-router'
import { SalaryApprovalPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/payroll-approval/$id')({
  component: SalaryApprovalPage,
})
