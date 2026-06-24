import { createFileRoute } from '@tanstack/react-router'
import { PredefinedAccountsPage } from '@/modules/account/views/predefined-accounts/PredefinedAccountsPage'

export const Route = createFileRoute('/_authenticated/account/predefined-accounts')({
  component: PredefinedAccountsPage,
})
