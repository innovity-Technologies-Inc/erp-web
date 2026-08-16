import { createFileRoute } from '@tanstack/react-router'
import { ChartOfAccountPage } from '@/modules/account/views/coa/ChartOfAccountPage'

export const Route = createFileRoute('/_authenticated/account/chart-of-accounts')({
  component: ChartOfAccountPage,
})
