import { createFileRoute } from '@tanstack/react-router'
import { JournalVoucherEditPage } from '@/modules/account/views/journal-voucher/JournalVoucherEditPage'

export const Route = createFileRoute('/_authenticated/account/voucher/journal/edit/$uuid')({
  component: JournalVoucherEditPage,
})
