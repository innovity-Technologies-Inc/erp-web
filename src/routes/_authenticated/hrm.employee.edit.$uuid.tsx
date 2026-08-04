import { createFileRoute } from '@tanstack/react-router'
import { EmployeeEditPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/employee/edit/$uuid')({
  component: EmployeeEditPage,
})
