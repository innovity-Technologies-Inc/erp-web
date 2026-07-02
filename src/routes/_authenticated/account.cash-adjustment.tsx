import { createFileRoute } from '@tanstack/react-router'
import { CashAdjustmentPage } from '@/modules/account/views/cash-adjustment/CashAdjustmentPage'

export const Route = createFileRoute('/_authenticated/account/cash-adjustment')({
  component: CashAdjustmentPage,
})
