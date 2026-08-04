import { createFileRoute } from '@tanstack/react-router'
import { EmployeeShowPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/employee/show/$uuid')({
  component: EmployeeShowPage,
})
