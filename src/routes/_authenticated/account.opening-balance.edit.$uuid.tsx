import { createFileRoute } from '@tanstack/react-router'
import { OpeningBalanceEditPage } from '@/modules/account/views/opening-balance/OpeningBalanceEditPage'

export const Route = createFileRoute('/_authenticated/account/opening-balance/edit/$uuid')({
  component: OpeningBalanceEditPage,
})
