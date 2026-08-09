import { createFileRoute } from '@tanstack/react-router'
import { SalaryPaySlipPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/payroll-payslip/$uuid')({
  component: SalaryPaySlipPage,
})

// Trigger HMR update
