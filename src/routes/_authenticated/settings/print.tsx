import { createFileRoute } from '@tanstack/react-router'
import { PrintPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/print')({
  component: PrintPage,
})
