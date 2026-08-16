import { createFileRoute } from '@tanstack/react-router'
import { DebitVoucherEditPage } from '@/modules/account/views/debit-voucher/DebitVoucherEditPage'

export const Route = createFileRoute('/_authenticated/account/voucher/debit/edit/$uuid')({
  component: DebitVoucherEditPage,
})
