import { createFileRoute } from '@tanstack/react-router'
import { EmailPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/email')({
  component: EmailPage,
})
