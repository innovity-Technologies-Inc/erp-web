import { createFileRoute } from '@tanstack/react-router'
import { EmployeeListPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/employee/')({
  component: EmployeeListPage,
})
