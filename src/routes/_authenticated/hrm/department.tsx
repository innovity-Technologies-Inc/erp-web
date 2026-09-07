import { createFileRoute } from '@tanstack/react-router'
import { DepartmentListPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/department')({
  component: DepartmentListPage,
})
