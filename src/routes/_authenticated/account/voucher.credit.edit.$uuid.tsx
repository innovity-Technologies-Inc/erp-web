import { createFileRoute } from '@tanstack/react-router'
import { CreditVoucherEditPage } from '@/modules/account/views/credit-voucher/CreditVoucherEditPage'

export const Route = createFileRoute('/_authenticated/account/voucher/credit/edit/$uuid')({
  component: CreditVoucherEditPage,
})
