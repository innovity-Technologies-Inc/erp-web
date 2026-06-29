import { createFileRoute } from '@tanstack/react-router'
import { DebitVoucherCreatePage } from '@/modules/account/views/debit-voucher/DebitVoucherCreatePage'

export const Route = createFileRoute('/_authenticated/account/voucher/debit/create')({
  component: DebitVoucherCreatePage,
})
