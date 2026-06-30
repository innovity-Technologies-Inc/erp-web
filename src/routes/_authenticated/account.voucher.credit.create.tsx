import { createFileRoute } from '@tanstack/react-router'
import { CreditVoucherCreatePage } from '@/modules/account/views/credit-voucher/CreditVoucherCreatePage'

export const Route = createFileRoute('/_authenticated/account/voucher/credit/create')({
  component: CreditVoucherCreatePage,
})
