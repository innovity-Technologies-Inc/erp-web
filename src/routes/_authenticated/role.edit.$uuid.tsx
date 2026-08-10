import { createFileRoute } from '@tanstack/react-router'
import { RoleEditPage } from '@/modules/user-management'

export const Route = createFileRoute('/_authenticated/role/edit/$uuid')({
  component: RoleEditPage,
})
