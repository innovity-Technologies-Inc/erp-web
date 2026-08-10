import { createFileRoute } from '@tanstack/react-router'
import { RoleCreatePage } from '@/modules/user-management'

export const Route = createFileRoute('/_authenticated/role/create')({
  component: RoleCreatePage,
})
