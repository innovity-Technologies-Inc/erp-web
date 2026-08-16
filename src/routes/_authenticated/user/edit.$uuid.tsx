import { createFileRoute } from '@tanstack/react-router'
import { UserEditPage } from '@/modules/user-management'

export const Route = createFileRoute('/_authenticated/user/edit/$uuid')({
  component: UserEditPage,
})
