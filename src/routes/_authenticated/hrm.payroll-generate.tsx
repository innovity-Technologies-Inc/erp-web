import { createFileRoute } from '@tanstack/react-router'
import { SalaryGenerateListPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/payroll-generate')({
  component: SalaryGenerateListPage,
})
