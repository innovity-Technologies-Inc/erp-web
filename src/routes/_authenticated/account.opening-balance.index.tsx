import { createFileRoute } from '@tanstack/react-router'
import { OpeningBalanceListPage } from '@/modules/account/views/opening-balance/OpeningBalanceListPage'

export const Route = createFileRoute('/_authenticated/account/opening-balance/')({
  component: OpeningBalanceListPage,
})
