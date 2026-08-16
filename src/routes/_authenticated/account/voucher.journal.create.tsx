import { createFileRoute } from '@tanstack/react-router'
import { JournalVoucherCreatePage } from '@/modules/account/views/journal-voucher/JournalVoucherCreatePage'

export const Route = createFileRoute('/_authenticated/account/voucher/journal/create')({
  component: JournalVoucherCreatePage,
})
