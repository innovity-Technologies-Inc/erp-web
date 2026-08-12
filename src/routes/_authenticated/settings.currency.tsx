import { createFileRoute } from '@tanstack/react-router'
import { CurrencyPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/currency')({
  component: CurrencyPage,
})
