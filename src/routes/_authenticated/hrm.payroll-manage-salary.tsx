import { createFileRoute } from '@tanstack/react-router'
import { SalaryManageListPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/payroll-manage-salary')({
  component: SalaryManageListPage,
})
