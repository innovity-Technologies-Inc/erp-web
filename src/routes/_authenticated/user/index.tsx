import { createFileRoute } from '@tanstack/react-router'
import { UserListPage } from '@/modules/user-management'

export const Route = createFileRoute('/_authenticated/user/')({
  component: UserListPage,
})
