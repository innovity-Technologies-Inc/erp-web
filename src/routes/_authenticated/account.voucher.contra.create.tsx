import { createFileRoute } from '@tanstack/react-router'
import { ContraVoucherCreatePage } from '@/modules/account/views/contra-voucher/ContraVoucherCreatePage'

export const Route = createFileRoute('/_authenticated/account/voucher/contra/create')({
  component: ContraVoucherCreatePage,
})
