import { createFileRoute } from '@tanstack/react-router'
import { EmployeeCreatePage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/employee/create')({
  component: EmployeeCreatePage,
})
