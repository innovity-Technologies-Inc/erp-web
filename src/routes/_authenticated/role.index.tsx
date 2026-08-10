import { createFileRoute } from '@tanstack/react-router'
import { RoleListPage } from '@/modules/user-management'

export const Route = createFileRoute('/_authenticated/role/')({
  component: RoleListPage,
})
