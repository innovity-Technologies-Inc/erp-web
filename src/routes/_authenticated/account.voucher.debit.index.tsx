import { createFileRoute } from '@tanstack/react-router'
import { DebitVoucherListPage } from '@/modules/account/views/debit-voucher/DebitVoucherListPage'

export const Route = createFileRoute('/_authenticated/account/voucher/debit/')({
  component: DebitVoucherListPage,
})
