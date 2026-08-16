import { createFileRoute } from '@tanstack/react-router'
import { ContraVoucherEditPage } from '@/modules/account/views/contra-voucher/ContraVoucherEditPage'

export const Route = createFileRoute('/_authenticated/account/voucher/contra/edit/$uuid')({
  component: ContraVoucherEditPage,
})
