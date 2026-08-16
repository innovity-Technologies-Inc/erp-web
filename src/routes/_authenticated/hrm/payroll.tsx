import { createFileRoute } from '@tanstack/react-router'
import { SalaryAdvanceListPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/payroll')({
  component: SalaryAdvanceListPage,
})
