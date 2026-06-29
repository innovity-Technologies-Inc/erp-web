import { createFileRoute } from '@tanstack/react-router'
import { OpeningBalanceCreatePage } from '@/modules/account/views/opening-balance/OpeningBalanceCreatePage'

export const Route = createFileRoute('/_authenticated/account/opening-balance/create')({
  component: OpeningBalanceCreatePage,
})
