import { createFileRoute } from '@tanstack/react-router'
import { SalaryChartPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/payroll-chart/$id')({
  component: SalaryChartPage,
})
