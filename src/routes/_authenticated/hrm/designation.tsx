import { createFileRoute } from '@tanstack/react-router'
import { DesignationListPage } from '@/modules/hrm'

export const Route = createFileRoute('/_authenticated/hrm/designation')({
  component: DesignationListPage,
})
