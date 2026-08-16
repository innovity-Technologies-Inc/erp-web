import { createFileRoute } from '@tanstack/react-router'
import { SubTypeListPage } from '@/modules/account/views/sub-type/SubTypeListPage'

export const Route = createFileRoute('/_authenticated/account/sub-type')({
  component: SubTypeListPage,
})
