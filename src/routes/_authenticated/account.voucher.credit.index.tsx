import { createFileRoute } from '@tanstack/react-router'
import { CreditVoucherListPage } from '@/modules/account/views/credit-voucher/CreditVoucherListPage'

export const Route = createFileRoute('/_authenticated/account/voucher/credit/')({
  component: CreditVoucherListPage,
})
