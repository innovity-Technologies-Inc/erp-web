import { createFileRoute } from '@tanstack/react-router'
import { UserCreatePage } from '@/modules/user-management'

export const Route = createFileRoute('/_authenticated/user/create')({
  component: UserCreatePage,
})
